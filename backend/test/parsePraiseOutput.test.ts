import { describe, expect, test } from 'bun:test'
import { LlmError } from '../src/errors'
import { parsePraiseOutput } from '../src/services/generatePraise'

function expectLlmError(input: string) {
  try {
    parsePraiseOutput(input)
  } catch (e) {
    expect(e).toBeInstanceOf(LlmError)
    expect((e as LlmError).code).toBe('LLM_ERROR')
    return
  }
  throw new Error('LlmError が投げられませんでした')
}

describe('parsePraiseOutput', () => {
  describe('正常系', () => {
    test('そのままの文はそのまま返す', () => {
      expect(parsePraiseOutput('レポートを書き上げましたね。')).toEqual({
        message: 'レポートを書き上げましたね。',
      })
    })

    test('前後の空白・改行を除去する', () => {
      expect(parsePraiseOutput('  \n よく頑張りました。 \n ').message).toBe(
        'よく頑張りました。',
      )
    })

    describe('引用符', () => {
      test.each([
        ['ダブルクォート', '"すごい"'],
        ['シングルクォート', "'すごい'"],
        ['全角ダブルクォート', '“すごい”'],
        ['かぎ括弧', '「すごい」'],
        ['二重かぎ括弧', '『すごい』'],
        ['入れ子', '「『すごい』」'],
        ['同じ引用符の重複', '""すごい""'],
        ['開きと閉じの種類が違う', '"すごい」'],
      ])('%s を外す', (_label, input) => {
        expect(parsePraiseOutput(input).message).toBe('すごい')
      })

      test('引用符の外側の空白を除去する', () => {
        expect(parsePraiseOutput('  "すごい"  ').message).toBe('すごい')
      })

      test('引用符の内側の空白も除去する', () => {
        expect(parsePraiseOutput('「 すごい 」').message).toBe('すごい')
      })

      test('前後の改行と引用符をまとめて除去する', () => {
        expect(parsePraiseOutput('\n「すごい」\n').message).toBe('すごい')
      })

      test('文中の引用符は残す', () => {
        expect(parsePraiseOutput('まさに"一歩前進"ですね').message).toBe(
          'まさに"一歩前進"ですね',
        )
      })
    })

    describe('複数行', () => {
      test('LF 改行を削除して1行にする', () => {
        expect(
          parsePraiseOutput('計画を立てましたね。\n着実な一歩です。').message,
        ).toBe('計画を立てましたね。着実な一歩です。')
      })

      test('CRLF 改行を削除して1行にする', () => {
        expect(
          parsePraiseOutput('計画を立てましたね。\r\n着実な一歩です。').message,
        ).toBe('計画を立てましたね。着実な一歩です。')
      })

      test('連続した改行もすべて削除する', () => {
        expect(parsePraiseOutput('A\n\n\nB').message).toBe('AB')
      })

      test('複数行全体を囲む引用符を外す', () => {
        expect(parsePraiseOutput('「1行目。\n2行目。」').message).toBe(
          '1行目。2行目。',
        )
      })
    })

    describe('文字数', () => {
      test('ちょうど 200 文字は通す', () => {
        const text = 'あ'.repeat(200)
        expect(parsePraiseOutput(text).message).toBe(text)
      })

      test('1 文字は通す', () => {
        expect(parsePraiseOutput('良').message).toBe('良')
      })

      test('引用符は文字数に含めない (200 + 引用符 2)', () => {
        const text = 'あ'.repeat(200)
        expect(parsePraiseOutput(`「${text}」`).message).toBe(text)
      })

      test('前後の空白は文字数に含めない', () => {
        const text = 'あ'.repeat(200)
        expect(parsePraiseOutput(`  ${text}  `).message).toBe(text)
      })

      test('削除された改行は文字数に含めない (100 + 改行 + 100)', () => {
        const half = 'あ'.repeat(100)
        expect(parsePraiseOutput(`${half}\n${half}`).message).toBe(half + half)
      })
    })
  })

  describe('異常系', () => {
    test.each([
      ['空文字列', ''],
      ['空白のみ', '   '],
      ['改行のみ', '\n\r\n\n'],
      ['ダブルクォートのみ', '""'],
      ['かぎ括弧のみ', '「」'],
      ['空白を囲む引用符', '「   」'],
      ['空行を囲む引用符', '"\n\n"'],
    ])('%s なら LLM_ERROR', (_label, input) => {
      expectLlmError(input)
    })

    test.each([
      ['201 文字', 'あ'.repeat(201)],
      ['引用符を外しても 201 文字', `「${'あ'.repeat(201)}」`],
      ['改行を消しても 201 文字', `${'あ'.repeat(100)}\n${'あ'.repeat(101)}`],
      ['サロゲートペアで UTF-16 長 202', '😀'.repeat(101)],
    ])('%s なら LLM_ERROR', (_label, input) => {
      expectLlmError(input)
    })
  })

  // 現状の実装では先頭・末尾の引用符を対応関係を見ずに削除するため失敗する
  describe('既知の問題', () => {
    test.todo('先頭が文中のかぎ括弧で始まる文を壊さない', () => {
      expect(parsePraiseOutput('「計画」を立てられましたね').message).toBe(
        '「計画」を立てられましたね',
      )
    })

    test.todo('末尾が文中のかぎ括弧で終わる文を壊さない', () => {
      expect(parsePraiseOutput('まさに「一歩前進」').message).toBe(
        'まさに「一歩前進」',
      )
    })
  })
})
