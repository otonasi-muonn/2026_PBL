import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { logger } from 'hono/logger'
import praise from './routes/praise'
import tasks from './routes/tasks'
import type { Env } from './types'
import { errorHandler } from './errors'
import { z } from 'zod'

// メッセージ日本語化
z.config(z.locales.ja())

const app = new Hono<Env>()
app.use('*', logger())

app.onError(errorHandler)
// Honoでは404は onError で処理されないため，別で定義
app.notFound((c) =>
  c.json(
    {
      error: {
        code: 'NOT_FOUND',
        message: 'リクエストされたリソースが存在しません',
      },
    },
    404,
  ),
)

app.use('/api/*', cors({ origin: 'http://localhost:5173' }))

const api = new Hono<Env>()

api.get('/health', (c) => {
  return c.json({ status: 'ok' })
})

api.route('/tasks', tasks)
api.route('/praise', praise)

app.route('/api', api)

export default app
