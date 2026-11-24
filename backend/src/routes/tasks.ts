import { Hono } from 'hono'
import { createFactory } from 'hono/factory'
import type { Env } from '../types'
import { jsonValidator } from '../validator'
import { splitInputSchema } from '../schemas'
import { mockSplitTask } from '../services/mockSplitTask'
import { splitTask } from '../services/splitTask'

const tasks = new Hono<Env>()
const factory = createFactory<Env>()

// POST /api/tasks/split
const splitHandlers = factory.createHandlers(
  jsonValidator(splitInputSchema),
  async (c) => {
    const input = c.req.valid('json')
    const result =
      c.env.USE_MOCK === 'true'
        ? await mockSplitTask(input)
        : await splitTask(input, c.env)
    return c.json(result)
  },
)

tasks.post('/split', ...splitHandlers)

export default tasks
