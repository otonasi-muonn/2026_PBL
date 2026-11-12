import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { logger } from 'hono/logger'
import praise from './routes/praise'
import tasks from './routes/tasks'
import type { Env } from './types'
import { errorHandler } from './errors'

const app = new Hono<Env>()

app.use('*', logger())
app.onError(errorHandler)

app.use('/api/*', cors({ origin: 'http://localhost:5173' }))

const api = new Hono<Env>()

api.get('/health', (c) => {
  return c.json({ status: 'ok' })
})

api.route('/tasks', tasks)
api.route('/praise', praise)

app.route('/api', api)

export default app
