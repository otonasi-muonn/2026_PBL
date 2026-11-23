import { LlmError } from '../errors'
import { SplitOutput, splitOutputSchema } from '../schemas'

const TITLE_RE = /^TITLE\s*:\s*(.*)$/i
const DESC_RE = /^DESC\s*:\s*(.*)$/i

// 最大サブタスク数
const MAX_SUBTASK = 5
// 最大 title 長
const MAX_TITLE = 100
// 最大 description 長
const MAX_DESC = 500

// 行頭の Markdown 記号 (-, *, +, #, >, 1., 1) など)．`### 1. ` のような記号の重なりも消す
const LEADING_MARKERS_RE = /^(?:(?:[-*+>#]+|\d+[.)])\s*)+/

function normalizeLine(line: string): string {
  return line
    .trim()
    .replaceAll('**', '') // 強調記号を削除 (本文中の `**` も消えるがこれは許容する．例: `2**3` → `23`)
    .replaceAll('：', ':')
    .replace(LEADING_MARKERS_RE, '') // 行頭のmarkdown記号を削除
    .trim()
}

/**
 * ## LLMのテキストをパースし，構造化されたデータに変換する
 *
 * @param text
 * @returns パースされた構造化データ
 */
export function parseSplitOutput(text: string): SplitOutput {
  const subtasks: { title: string; description: string }[] = []

  for (const raw of text.split(/\r?\n/)) {
    const line = normalizeLine(raw) // 行ごとに正規化
    const t = line.match(TITLE_RE)
    if (t) {
      subtasks.push({ title: t[1].trim(), description: '' }) // DESC 無しは ''
      continue
    }
    const d = line.match(DESC_RE)
    const last = subtasks.at(-1)
    if (d && last) last.description = d[1].trim() // 最初の TITLE より前の DESC は無視
    // それ以外の行は無視
  }

  const valid = subtasks.filter((s) => s.title !== '') // 空タイトルを捨ててから件数を数える

  // 有効なサブタスクが2件未満
  if (valid.length < 2) {
    throw new LlmError('LLM_ERROR', 'Not enough valid subtasks')
  }

  // 件数・文字数の超過は切り詰めずに `LlmError` (分割が崩れている・途中で切れた文は不自然なため，フォールバックさせる)
  if (valid.length > MAX_SUBTASK) {
    throw new LlmError('LLM_ERROR', `Subtasks exceed ${MAX_SUBTASK} items`)
  }

  // 長さはzodの `.max()` と同じくUTF-16の長さ (`String.length`) で数える
  if (valid.some((s) => s.title.length > MAX_TITLE)) {
    throw new LlmError(
      'LLM_ERROR',
      `Subtask title exceeds ${MAX_TITLE} characters`,
    )
  }
  if (valid.some((s) => s.description.length > MAX_DESC)) {
    throw new LlmError(
      'LLM_ERROR',
      `Subtask description exceeds ${MAX_DESC} characters`,
    )
  }

  const result = splitOutputSchema.safeParse({ subtasks: valid })
  if (!result.success) {
    throw new LlmError('LLM_ERROR', 'Invalid split output', {
      cause: result.error,
    })
  }

  return result.data
}
