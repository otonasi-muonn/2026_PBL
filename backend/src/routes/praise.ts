import { Hono } from 'hono'
import { createFactory } from 'hono/factory'
import type { Env } from '../types'
import { jsonValidator } from '../validator'
import { praiseInputSchema } from '../schemas'
import { mockGeneratePraise } from '../services/mockGeneratePraise'

const praise = new Hono<Env>()
const factory = createFactory<Env>()

// POST /api/praise
const praiseHandlers = factory.createHandlers(
  jsonValidator(praiseInputSchema),
  async (c) => {
    const input = c.req.valid('json')
    const result = await mockGeneratePraise(input)
    return c.json(result)
  },
)

praise.post('/', ...praiseHandlers)

export default praise
