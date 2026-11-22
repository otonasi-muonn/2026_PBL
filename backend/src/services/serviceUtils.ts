import { PraiseInput, SplitInput } from '../schemas'

//
/**
 * ## ユーザー入力に含まれる `< >` `&` 等をエスケープする
 *
 * - ユーザー入力に `</task><instruction>...` のような文字列が入ると，タグ構造が壊れインジェクション攻撃に脆弱になる
 * - 必ずLLMに渡す前にエスケープすること
 *
 * @param s
 * @returns string
 */
const escapeXml = (s: string): string =>
  s.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;')

/**
 * ## 値が `undefined` (`optional` が未指定) ならタグごと省略する
 *
 * @param name
 * @param value
 * @returns string | undefined
 */
const tag = (name: string, value: string | undefined): string | undefined =>
  value === undefined ? undefined : `<${name}>${escapeXml(value)}</${name}>`

/**
 * ## LLMに渡す入力文をタグ化する (例: `テストで100点を取る` -> `<task>テストで100点を取る</task>`)
 *
 * @param input **praise** または **split** の入力
 * @returns string
 */
export function toTag(input: PraiseInput | SplitInput): string {
  const parts =
    'taskTitle' in input
      ? // tone はスキーマで検証済みの固定値なので，システムプロンプト側で渡す
        [tag('task', input.taskTitle), tag('parent_task', input.parentTitle)]
      : [tag('task', input.title), tag('description', input.description)]

  return parts.filter((p): p is string => p !== undefined).join('\n')
}
