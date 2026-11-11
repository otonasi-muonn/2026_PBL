import { Hono } from 'hono'
import { createFactory } from 'hono/factory'
import type { Env } from '../types'

const tasks = new Hono<Env>()
const factory = createFactory<Env>()

// POST /api/tasks/split
const splitTask = factory.createHandlers(async (c) => {
  // TODO: zValidator で入力検証 -> services/splitTask() を呼び出す
  return c.json({
    subtasks: [
      { title: 'サブタスク1 (仮)', description: '' },
      { title: 'サブタスク2 (仮)', description: '' },
    ],
  })
})

tasks.post('/split', ...splitTask)

export default tasks
