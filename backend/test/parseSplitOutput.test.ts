import { describe, expect, test } from 'bun:test'
import { LlmError } from '../src/errors'
import { parseSplitOutput } from '../src/services/splitTask'

const lines = (...xs: string[]) => xs.join('\n')

function expectLlmError(input: string) {
  try {
    parseSplitOutput(input)
  } catch (e) {
    expect(e).toBeInstanceOf(LlmError)
    expect((e as LlmError).code).toBe('LLM_ERROR')
    return
  }
  throw new Error('LlmError が投げられませんでした')
}

describe('parseSplitOutput', () => {
  describe('正常系', () => {
    test('正しい形式で3件', () => {
      const text = lines(
        'TITLE: A',
        'DESC: a',
        '',
        'TITLE: B',
        'DESC: b',
        '',
        'TITLE: C',
        'DESC: c',
      )
      expect(parseSplitOutput(text)).toEqual({
        subtasks: [
          { title: 'A', description: 'a' },
          { title: 'B', description: 'b' },
          { title: 'C', description: 'c' },
        ],
      })
    })

    test('前置きと後書きは無視する', () => {
      const text = lines(
        '以下が分割結果です．',
        'TITLE: A',
        'DESC: a',
        'TITLE: B',
        'DESC: b',
        '頑張って！',
      )
      expect(parseSplitOutput(text)).toEqual({
        subtasks: [
          { title: 'A', description: 'a' },
          { title: 'B', description: 'b' },
        ],
      })
    })

    test('行頭のMarkdown記号と ** を除去する', () => {
      const text = lines(
        '1. **TITLE:** A',
        '- DESC: a',
        '2) **TITLE**: B',
        '> * DESC: b',
      )
      expect(parseSplitOutput(text)).toEqual({
        subtasks: [
          { title: 'A', description: 'a' },
          { title: 'B', description: 'b' },
        ],
      })
    })

    test('行頭の記号が重なっていても取りこぼさない', () => {
      const text = lines(
        '### 1. TITLE: A',
        '- 1. DESC: a',
        '## **2.** TITLE: B',
      )
      expect(parseSplitOutput(text)).toEqual({
        subtasks: [
          { title: 'A', description: 'a' },
          { title: 'B', description: '' },
        ],
      })
    })

    test('全角コロンを受け付ける', () => {
      const text = lines('TITLE：A', 'DESC：a', 'TITLE：B')
      expect(parseSplitOutput(text)).toEqual({
        subtasks: [
          { title: 'A', description: 'a' },
          { title: 'B', description: '' },
        ],
      })
    })

    test('DESC が無い TITLE は description を空文字にする', () => {
      const text = lines('TITLE: A', 'DESC: a', 'TITLE: B')
      expect(parseSplitOutput(text).subtasks[1]).toEqual({
        title: 'B',
        description: '',
      })
    })

    test('最初の TITLE より前の DESC は無視する', () => {
      const text = lines('DESC: x', 'TITLE: A', 'TITLE: B')
      expect(parseSplitOutput(text).subtasks[0]).toEqual({
        title: 'A',
        description: '',
      })
    })

    test('6件なら先頭5件にする', () => {
      const text = lines(
        ...['A', 'B', 'C', 'D', 'E', 'F'].map((t) => `TITLE: ${t}`),
      )
      const { subtasks } = parseSplitOutput(text)
      expect(subtasks.map((s) => s.title)).toEqual(['A', 'B', 'C', 'D', 'E'])
    })

    test('空タイトルを捨ててから先頭5件にする', () => {
      const text = lines(
        'TITLE: A',
        'TITLE:',
        ...['B', 'C', 'D', 'E', 'F'].map((t) => `TITLE: ${t}`),
      )
      const { subtasks } = parseSplitOutput(text)
      expect(subtasks.map((s) => s.title)).toEqual(['A', 'B', 'C', 'D', 'E'])
    })

    test('タイトル120文字は100文字に切り詰める', () => {
      const text = lines(`TITLE: ${'あ'.repeat(120)}`, 'TITLE: B')
      expect(parseSplitOutput(text).subtasks[0].title).toBe('あ'.repeat(100))
    })

    test('説明600文字は500文字に切り詰める', () => {
      const text = lines('TITLE: A', `DESC: ${'あ'.repeat(600)}`, 'TITLE: B')
      expect(parseSplitOutput(text).subtasks[0].description).toBe(
        'あ'.repeat(500),
      )
    })

    test('切り詰めでサロゲートペアの途中では切らない', () => {
      // 99 文字 + 😀 (UTF-16 で 2) = 101 → 😀 を丸ごと落として 99
      const text = lines(`TITLE: ${'a'.repeat(99)}😀`, 'TITLE: B')
      expect(parseSplitOutput(text).subtasks[0].title).toBe('a'.repeat(99))
    })

    test('切り詰めで結合絵文字 (ZWJ) の途中では切らない', () => {
      const family = '👨‍👩‍👧' // UTF-16 で 8
      const text = lines(`TITLE: ${'a'.repeat(95)}${family}`, 'TITLE: B')
      expect(parseSplitOutput(text).subtasks[0].title).toBe('a'.repeat(95))
    })

    test('収まる絵文字はそのまま残す', () => {
      const text = lines(`TITLE: ${'a'.repeat(98)}😀`, 'TITLE: B')
      expect(parseSplitOutput(text).subtasks[0].title).toBe(
        `${'a'.repeat(98)}😀`,
      )
    })

    test('同じサブタスクに DESC が2回あれば後勝ち', () => {
      const text = lines('TITLE: A', 'DESC: first', 'DESC: second', 'TITLE: B')
      expect(parseSplitOutput(text).subtasks[0].description).toBe('second')
    })

    test('大文字小文字を区別せず，コロン前後の空白を許す', () => {
      const text = lines('title : A', 'Desc:a', 'Title  :  B')
      expect(parseSplitOutput(text)).toEqual({
        subtasks: [
          { title: 'A', description: 'a' },
          { title: 'B', description: '' },
        ],
      })
    })

    test('CRLF改行でも末尾に \\r が残らない', () => {
      const text = 'TITLE: A\r\nDESC: a\r\nTITLE: B\r\n'
      expect(parseSplitOutput(text)).toEqual({
        subtasks: [
          { title: 'A', description: 'a' },
          { title: 'B', description: '' },
        ],
      })
    })

    test('DESC の続きの行は無視する', () => {
      const text = lines('TITLE: A', 'DESC: 1 行目', '2 行目', 'TITLE: B')
      expect(parseSplitOutput(text).subtasks[0].description).toBe('1 行目')
    })

    test('DESCRIPTION: や SUBTITLE: は拾わない', () => {
      const text = lines(
        'TITLE: A',
        'DESCRIPTION: x',
        'SUBTITLE: y',
        'TITLE: B',
      )
      expect(parseSplitOutput(text)).toEqual({
        subtasks: [
          { title: 'A', description: '' },
          { title: 'B', description: '' },
        ],
      })
    })

    test('本文中の ** も除去される (仕様として許容)', () => {
      const text = lines('TITLE: 2**3', 'TITLE: B')
      expect(parseSplitOutput(text).subtasks[0].title).toBe('23')
    })
  })

  describe('異常系', () => {
    test.each([
      ['#10 空文字列', ''],
      ['#10 TITLE が 0 件', 'ただの文章です'],
      ['有効なサブタスクが 1 件', 'TITLE: A'],
      ['#9 3 件中 2 件が空タイトル', lines('TITLE: A', 'TITLE:', 'TITLE:   ')],
      ['DESC のみ', lines('DESC: a', 'DESC: b')],
    ])('%s なら LLM_ERROR', (_label, input) => {
      expectLlmError(input)
    })
  })
})
