import { LlmError } from '../errors'
import {
  praiseOutputSchema,
  type PraiseInput,
  type PraiseOutput,
  type Tone,
} from '../schemas'

const PRAISE_TEMPLATES: Record<Tone, (taskTitle: string) => string> = {
  gentle: (t) => `「${t}」お疲れさまでした．一歩ずつ進めていてえらいです．`,
  energetic: (t) => `「${t}」達成！その調子でどんどんいこう！`,
  polite: (t) => `「${t}」の完了，お見事です．着実に前進されていますね．`,
}

export async function mockGeneratePraise(
  input: PraiseInput,
): Promise<PraiseOutput> {
  if (input.taskTitle === 'MOCK_LLM_ERROR') {
    throw new LlmError('LLM_ERROR', 'mock error')
  }
  if (input.taskTitle === 'MOCK_LLM_TIMEOUT') {
    throw new LlmError('LLM_TIMEOUT', 'mock timeout')
  }

  const message = PRAISE_TEMPLATES[input.tone](input.taskTitle)
  return praiseOutputSchema.parse({ message })
}
