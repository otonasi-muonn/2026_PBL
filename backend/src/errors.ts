import type { ErrorHandler } from 'hono'
import { HTTPException } from 'hono/http-exception'
import type { Env } from './types'

// LLM関連のエラーコード
export type LlmErrorCode = 'LLM_ERROR' | 'LLM_TIMEOUT'

export class LlmError extends Error {
  readonly code: LlmErrorCode

  constructor(code: LlmErrorCode, message: string, options?: ErrorOptions) {
    super(message, options)
    this.name = 'LlmError'
    this.code = code
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
