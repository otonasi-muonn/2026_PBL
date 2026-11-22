import { zValidator } from '@hono/zod-validator'
import type { ZodType } from 'zod'
import { InvalidInputError } from './errors'

// JSONボディをzodスキーマで検証し，失敗時は InvalidInputError を投げる．
// splitとpraiseで共通
export const jsonValidator = <T extends ZodType>(schema: T) =>
  zValidator('json', schema, (result) => {
    if (!result.success) {
      throw new InvalidInputError(
        result.error.issues[0]?.message ?? '入力が不正です',
      )
    }
  })
