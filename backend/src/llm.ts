import { LlmError } from './errors'
import { LlmEnv } from './types'

/**
 * ## LLM関連パラメーター
 *
 * - `model`: モデル名 (例: **gemini-3.8-flash**)
 * - `fallbackModel`: `model` でのリクエストが `MAX_TIMEOUTS_BEFORE_FALLBACK` 回タイムアウトしたときのフォールバックモデル
 * - `system`: システムプロンプト
 * - `user`: ユーザーメッセージ
 * - `timeoutMs`: リクエスト全体のタイムアウト (ms)
 */
export type ChatParams = {
  model: string
  system: string
  user: string
  timeoutMs: number
}

/**
 * ## フォールバック有りの場合のLLM関連パラメーター
 *
 * - `fallbackModel`: `model` でのリクエストが `MAX_TIMEOUTS_BEFORE_FALLBACK` 回タイムアウトしたときのフォールバックモデル
 */
export type FallbackChatParams = ChatParams & {
  fallbackModel: string
}

/**
 * ## LLMからのレスポンス型
 */
type ChatCompletionResponse = {
  choices?: { message?: { content?: string | null } }[]
}

/**
 * ## LLMに非同期リクエストを送り，レスポンス文を返す
 *
 * @param env
 * @param params
 * @returns 最初の候補のアシスタント応答テキスト(加工なし)．空文字は返さない
 * @throws {LlmError} `LLM_TIMEOUT`: タイムアウトした場合
 * @throws {LlmError} `LLM_ERROR`: HTTP エラー，応答が空，通信失敗などその他の場合
 */
export async function call(env: LlmEnv, params: ChatParams): Promise<string> {
  try {
    // Web標準APIで実装 (どの環境でも動くように)
    const res = await fetch(`${env.LLM_BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${env.LLM_API_KEY}`, // ベアラー認証
      },
      body: JSON.stringify({
        model: params.model,
        messages: [
          { role: 'system', content: params.system },
          { role: 'user', content: params.user },
        ],
      }),
      signal: AbortSignal.timeout(params.timeoutMs),
    })
    if (!res.ok) {
      throw new LlmError(
        'LLM_ERROR',
        `LLM API returned ${res.status}: ${await res.text()}`,
        { status: res.status },
      )
    }
    const data = (await res.json()) as ChatCompletionResponse
    const content = data.choices?.[0]?.message?.content
    if (!content) {
      throw new LlmError('LLM_ERROR', 'LLM returned empty content')
    }
    return content
  } catch (e) {
    if (e instanceof LlmError) throw e
    // タイムアウト
    if (e instanceof Error && e.name === 'TimeoutError') {
      throw new LlmError('LLM_TIMEOUT', 'LLM request timed out', { cause: e })
    }
    throw new LlmError('LLM_ERROR', 'LLM request failed', { cause: e })
  }
}

/**
 * ## フォールバックを発火させるまでのタイムアウト回数
 *
 * - 1モデルあたりの最大試行回数
 */
const MAX_TIMEOUTS_BEFORE_FALLBACK = 1

/**
 * ## LLM に非同期リクエストを送り，レスポンス文を返す
 *
 * - LLMモデルの混雑回避用のフォールバック有り
 * - `params.timeoutMs` は **全モデル・全試行の合計** の予算．超えることはない
 *   - 各試行には「残り時間 ÷ 残り試行回数」を割り当てる (早く失敗した試行の余りは後続に回る)
 * - タイムアウト: 同じモデルで `MAX_TIMEOUTS_BEFORE_FALLBACK` 回まで試し，使い切ると `params.fallbackModel` へ切り替える
 * - 混雑・レート制限 (429, 503): 同じモデルでは再試行せず，すぐ `params.fallbackModel` へ切り替える
 * - それ以外のエラー (400, 401, 空応答など) はリトライせず即座に投げる
 *
 * @throws {LlmError} `LLM_TIMEOUT`: 最後の試行がタイムアウトした場合
 * @throws {LlmError} `LLM_ERROR`: HTTP エラー，応答が空，通信失敗などその他の場合
 */
export async function callWithFallback(
  env: LlmEnv,
  params: FallbackChatParams,
): Promise<string> {
  const { fallbackModel, ...base } = params
  // 同じモデルが指定されている場合，2重試行を防ぐ
  const models = [...new Set([base.model, fallbackModel])]
  const deadline = Date.now() + base.timeoutMs
  let lastError: unknown

  for (const [i, model] of models.entries()) {
    const laterAttempts = (models.length - 1 - i) * MAX_TIMEOUTS_BEFORE_FALLBACK

    for (let attempt = 1; attempt <= MAX_TIMEOUTS_BEFORE_FALLBACK; attempt++) {
      const remainingMs = deadline - Date.now()
      const remainingAttempts =
        MAX_TIMEOUTS_BEFORE_FALLBACK - attempt + 1 + laterAttempts
      const timeoutMs = Math.floor(remainingMs / remainingAttempts)
      // 予算切れ
      if (timeoutMs <= 0) {
        throw lastError ?? new LlmError('LLM_TIMEOUT', 'LLM request timed out')
      }

      try {
        return await call(env, { ...base, model, timeoutMs })
      } catch (e) {
        lastError = e
        if (!(e instanceof LlmError)) throw e
        // 混雑・レート制限なら，同じモデルを諦めて次のモデル
        if (e.isOverloaded) break
        // タイムアウト以外 (400, 401, 空応答など) は再試行せず終了
        if (e.code !== 'LLM_TIMEOUT') throw e
        // タイムアウトなら次の試行 (回数を使い切ると外側ループが次のモデルへ切り替わる)
      }
    }
  }
  throw lastError
}
