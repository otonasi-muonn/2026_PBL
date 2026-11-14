export type Bindings = {
  LLM_API_KEY: string // .dev.vars
  LLM_BASE_URL: string // vars: 末尾の / は不必要
  SPLIT_MODEL: string // vars: ミドルモデル
  PRAISE_MODEL: string // vars: ライトモデル
  SPLIT_FALLBACK_MODEL: string
  PRAISE_FALLBACK_MODEL: string
  ALLOWED_ORIGIN: string // vars
  USE_MOCK: string // デフォルトは true だが，明示する場合は .dev.vars から
  // TODO: Rate Limiting binding を wrangler.jsonc に追加したら有効化
  // RATE_LIMITER: RateLimit
}

export type Env = { Bindings: Bindings }

// servicesのenv引数 (必要な値だけ)
export type LlmEnv = Pick<Bindings, 'LLM_API_KEY' | 'LLM_BASE_URL'>
export type SplitEnv = LlmEnv &
  Pick<Bindings, 'SPLIT_MODEL' | 'SPLIT_FALLBACK_MODEL'>
export type PraiseEnv = LlmEnv &
  Pick<Bindings, 'PRAISE_MODEL' | 'PRAISE_FALLBACK_MODEL'>
