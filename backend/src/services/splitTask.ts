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

const segmenter = new Intl.Segmenter('ja', { granularity: 'grapheme' })

/**
 * ## 文字の途中で切らずに `max` 以内へ切り詰める
 *
 * - 長さは zod の `.max()` と同じく UTF-16 の長さ (`String.length`) で数える
 * - 書記素 (絵文字・結合文字など見た目の1文字) の途中では切らない．収まらない書記素は丸ごと落とす
 */
function truncate(s: string, max: number): string {
  if (s.length <= max) return s
  let out = ''
  for (const { segment } of segmenter.segment(s)) {
    if (out.length + segment.length > max) break
    out += segment
  }
  return out
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

  const valid = subtasks
    .filter((s) => s.title !== '') // 空タイトルを先に捨てる
    .slice(0, MAX_SUBTASK) // その後で先頭5件にする
    .map((s) => ({
      title: truncate(s.title, MAX_TITLE),
      description: truncate(s.description, MAX_DESC),
    }))

  // 有効なサブタスクが2件未満
  if (valid.length < 2) {
    throw new LlmError('LLM_ERROR', 'Not enough valid subtasks')
  }

  const result = splitOutputSchema.safeParse({ subtasks: valid })
  if (!result.success) {
    throw new LlmError('LLM_ERROR', 'Invalid split output', {
      cause: result.error,
    })
  }

  return result.data
}
