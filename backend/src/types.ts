export type Bindings = {
  LLM_API_KEY: string // secret
  LLM_BASE_URL: string
  SPLIT_MODEL: string // vars: ミドルモデル
  PRAISE_MODEL: string // vars: ライトモデル
  ALLOWED_ORIGIN: string // vars
  // TODO: Rate Limiting binding を wrangler.jsonc に追加したら有効化する
  // RATE_LIMITER: RateLimit
}

export type Env = { Bindings: Bindings }

// services の env 引数 (必要な値だけ)
export type LlmEnv = Pick<Bindings, 'LLM_API_KEY' | 'LLM_BASE_URL'>
export type SplitEnv = LlmEnv & Pick<Bindings, 'SPLIT_MODEL'>
export type PraiseEnv = LlmEnv & Pick<Bindings, 'PRAISE_MODEL'>
