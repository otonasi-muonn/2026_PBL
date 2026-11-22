import { Hono } from 'hono'
import { createFactory } from 'hono/factory'
import type { Env } from '../types'
import { jsonValidator } from '../validator'
import { splitInputSchema } from '../schemas'

const tasks = new Hono<Env>()
const factory = createFactory<Env>()

// POST /api/tasks/split
const splitTask = factory.createHandlers(
  jsonValidator(splitInputSchema),
  async (c) => {
    const input = c.req.valid('json')

    // TODO: zValidator で入力検証 -> services/splitTask() を呼び出す
    return c.json({
      subtasks: [
        { title: input.title + ' 1', description: '1' },
        { title: input.title + ' 2', description: '2' },
        { title: input.title + ' 3', description: '3' },
      ],
    })
  },
)

tasks.post('/split', ...splitTask)

export default tasks
