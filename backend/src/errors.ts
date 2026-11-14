import type { ErrorHandler } from 'hono'
import { HTTPException } from 'hono/http-exception'
import type { Env } from './types'

// LLM関連のエラーコード
export type LlmErrorCode = 'LLM_ERROR' | 'LLM_TIMEOUT'

// LLMが混雑・レート制限のときに返す HTTP ステータス (別モデルなら通る可能性あり)
const OVERLOADED_STATUSES: readonly number[] = [429, 503]

export class LlmError extends Error {
  readonly code: LlmErrorCode
  // LLMが返したHTTPステータス (HTTPエラー以外ではundefined)
  readonly status?: number

  constructor(
    code: LlmErrorCode,
    message: string,
    options?: ErrorOptions & { status?: number },
  ) {
    super(message, options)
    this.name = 'LlmError'
    this.code = code
    this.status = options?.status
  }

  // LLM側の混雑・レート制限による失敗か
  get isOverloaded(): boolean {
    return (
      this.status !== undefined && OVERLOADED_STATUSES.includes(this.status)
    )
  }
}

export const errorHandler: ErrorHandler<Env> = (err, c) => {
  // LLM 関連のエラーハンドリング
  if (err instanceof LlmError) {
    console.error(err)

    switch (err.code) {
      case 'LLM_ERROR':
        return c.json(
          {
            error: {
              code: 'LLM_ERROR',
              message: 'AIの応答を処理できませんでした',
            },
          },
          502,
        )
      case 'LLM_TIMEOUT':
        return c.json(
          {
            error: {
              code: 'LLM_TIMEOUT',
              message: 'AIの応答がタイムアウトしました',
            },
          },
          504,
        )
    }
  }

  // HTTP サーバー側のエラーハンドリング
  if (err instanceof HTTPException) {
    switch (err.status) {
      case 400:
        return c.json(
          { error: { code: 'INVALID_INPUT', message: err.message } },
          400,
        )
      case 413:
        return c.json(
          {
            error: { code: 'TOO_LARGE', message: 'リクエストが大きすぎます' },
          },
          413,
        )
      case 429:
        return c.json(
          {
            error: {
              code: 'RATE_LIMITED',
              message: 'リクエストが多すぎます。しばらく待ってください',
            },
          },
          429,
        )
      case 404:
        return c.json(
          {
            error: {
              code: 'NOT_FOUND',
              message: 'リクエストされたリソースが存在しません',
            },
          },
          404,
        )
    }
  }

  // 例外は全て秘匿し，500に落とす (詳細はログにだけ出す)
  console.error(err)
  return c.json(
    {
      error: {
        code: 'INTERNAL',
        message: 'サーバー内部でエラーが発生しました',
      },
    },
    500,
  )
}
