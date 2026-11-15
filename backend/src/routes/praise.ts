import { Hono } from 'hono'
import { createFactory } from 'hono/factory'
import type { Env } from '../types'
import { zValidator } from '@hono/zod-validator'
import { HTTPException } from 'hono/http-exception'
import { praiseInputSchema } from '../schemas'

const praise = new Hono<Env>()
const factory = createFactory<Env>()

// POST /api/praise
const generatePraise = factory.createHandlers(
  zValidator('json', praiseInputSchema, (result) => {
    if (!result.success) {
      throw new HTTPException(400, {
        message: result.error.issues[0]?.message ?? '入力が不正です',
      })
    }
  }),
  async (c) => {
    const input = c.req.valid('json')
    console.log('get:', input)
    // ダミーの返却値を返す（テスト用）
    return c.json({ message: 'よく頑張りました！ (仮)' })
  },
)

praise.post('/', ...generatePraise)

export default praise
