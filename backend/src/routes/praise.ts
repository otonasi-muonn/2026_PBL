import { Hono } from 'hono'
import { createFactory } from 'hono/factory'
import type { Env } from '../types'
import { jsonValidator } from '../validator'
import { praiseInputSchema } from '../schemas'

const praise = new Hono<Env>()
const factory = createFactory<Env>()

// POST /api/praise
const generatePraise = factory.createHandlers(
  jsonValidator(praiseInputSchema),
  async (c) => {
    const input = c.req.valid('json')
    // オウム返しでダミーの返却値を返す（テスト用）
    return c.json({ message: input.taskTitle })
  },
)

praise.post('/', ...generatePraise)

export default praise
