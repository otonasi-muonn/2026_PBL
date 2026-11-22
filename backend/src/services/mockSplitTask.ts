import { LlmError } from '../errors'
import {
  splitOutputSchema,
  type SplitInput,
  type SplitOutput,
} from '../schemas'

export async function mockSplitTask(input: SplitInput): Promise<SplitOutput> {
  if (input.title === 'MOCK_LLM_ERROR') {
    throw new LlmError('LLM_ERROR', 'mock error')
  }
  if (input.title === 'MOCK_LLM_TIMEOUT') {
    throw new LlmError('LLM_TIMEOUT', 'mock timeout')
  }

  const result = {
    subtasks: [
      {
        title: '必要な情報を集める',
        description: `「${input.title}」を進めるために必要な情報や資料を集める。`,
      },
      {
        title: '構成と手順を整理する',
        description: `「${input.title}」の作業手順と成果物の構成をまとめる。`,
      },
      {
        title: '作成して見直す',
        description: `「${input.title}」の内容を作成し、抜け漏れや誤りを確認する。`,
      },
    ],
  }

  return splitOutputSchema.parse(result)
}
