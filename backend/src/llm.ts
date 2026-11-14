import { LlmError } from './errors'
import { LlmEnv } from './types'

/**
 * ## LLMに渡すパラメーター
 *
 * - `model`: モデル名 (例: **gemini-3.8-flash**)
 * - `system`: システムプロンプト
 * - `user`: ユーザーメッセージ
 * - `timeoutMs`: 接続タイムアウトまでの猶予 (ms)
 */
export type ChatParams = {
  model: string
  system: string
  user: string
  timeoutMs: number
}

/**
 * ## LLM からのレスポンス型
 */
type ChatCompletionResponse = {
  choices?: { message?: { content?: string | null } }[]
}

/**
 * ## LLM に非同期リクエストを送り，レスポンス文を返す
 *
 * @param env
 * @param params
 * @returns 最初の候補のアシスタント応答テキスト(加工なし)．空文字は返さない
 * @throws {LlmError} `LLM_TIMEOUT`: タイムアウトした場合
 * @throws {LlmError} `LLM_ERROR`: HTTP エラー，応答が空，通信失敗などその他の場合
 */
export async function chat(env: LlmEnv, params: ChatParams): Promise<string> {
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
