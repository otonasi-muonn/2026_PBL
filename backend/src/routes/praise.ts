import { Hono } from 'hono'
import { createFactory } from 'hono/factory'
import type { Env } from '../types'

const praise = new Hono<Env>()
const factory = createFactory<Env>()

// POST /api/praise
const generatePraise = factory.createHandlers(async (c) => {
  // TODO: zValidator で入力検証 -> services/generatePraise() を呼び出す
  return c.json({ message: 'よく頑張りました！ (仮)' })
})

praise.post('/', ...generatePraise)

export default praise
