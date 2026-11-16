// 正式に採用する尺度・設問文・回答方式は未決定のため、画面確認用の仮の枠だけを置く。
// RSES の設問文を作ったり、阿部・今野（2007）の状態自尊感情尺度
// （9項目、RSESとは別の尺度）を転用したりしないこと。

import { useState } from 'react'
import './pages.css'

const QUESTION_COUNT = 10
// ワイヤーの「4段階」に合わせた仮置き。正式な回答方式は未決定。
const ANSWER_OPTIONS = ['選択肢1', '選択肢2', '選択肢3', '選択肢4']

export default function RsesFormPage() {
  const [answers, setAnswers] = useState<Record<number, string>>({})
  const [status, setStatus] = useState<'answering' | 'completed' | 'skipped'>(
    'answering',
  )
  const answeredCount = Object.keys(answers).length

  return (
    <main className="page rses-page">
      <h1>アンケート（任意）</h1>
      <p className="ui-note">
        モック画面です。設問は画面確認用の仮の枠で、回答は保存・送信されず、採点や診断も行いません。
      </p>
      <p>
        利用を始める前と、しばらく使った後の気持ちの変化をふり返るための任意アンケートを想定しています。回答しなくてもアプリは利用できます。
      </p>
      <p>
        設問の数（10件）は、フロー図で構想しているRSES（10項目）に合わせた仮の枠です。ここに表示している設問はRSESの設問ではありません。正式に採用する尺度・設問文・回答方式（選択肢の数や文言）はまだ決まっていません。
      </p>
      {status === 'answering' ? (
        <form
          onSubmit={(event) => {
            event.preventDefault()
            if (answeredCount === QUESTION_COUNT) setStatus('completed')
          }}
        >
          {Array.from({ length: QUESTION_COUNT }, (_, index) => {
            const questionNumber = index + 1

            return (
              <fieldset key={questionNumber} className="ui-box rses-question">
                <legend className="rses-legend">
                  設問{questionNumber}（設問文は未決定）
                </legend>
                <div className="rses-options">
                  {ANSWER_OPTIONS.map((option) => (
                    <label key={option} className="ui-pill rses-option">
                      <input
                        type="radio"
                        className="rses-radio"
                        name={`rses-question-${questionNumber}`}
                        value={option}
                        checked={answers[questionNumber] === option}
                        onChange={() =>
                          setAnswers((current) => ({
                            ...current,
                            [questionNumber]: option,
                          }))
                        }
                      />
                      {option}
                    </label>
                  ))}
                </div>
              </fieldset>
            )
          })}
          <p className="rses-progress" aria-live="polite">
            回答済み {answeredCount} / {QUESTION_COUNT}
          </p>
          <div className="rses-actions">
            <button
              type="submit"
              className="ui-button ui-button-strong"
              disabled={answeredCount !== QUESTION_COUNT}
            >
              回答を完了する
            </button>
            <button
              type="button"
              className="ui-button"
              onClick={() => setStatus('skipped')}
            >
              スキップする
            </button>
          </div>
          <p className="rses-help">
            すべての設問を選ぶと「回答を完了する」を押せます。
          </p>
        </form>
      ) : (
        <section
          className="ui-box rses-result"
          aria-labelledby="rses-result-heading"
        >
          <h2 id="rses-result-heading" className="rses-result-heading">
            {status === 'completed'
              ? '回答ありがとうございました'
              : 'アンケートをスキップしました'}
          </h2>
          <p>
            {status === 'completed'
              ? '（モック）回答内容は保存・送信されず、採点も行っていません。'
              : '回答しなくてもアプリは利用できます。'}
          </p>
          <p>
            本来はこのあとタスク追加画面へ進む想定です。この画面からは移動しないため、サイドバーから各画面を開いてください。
          </p>
          <button
            type="button"
            className="ui-button"
            onClick={() => {
              if (status === 'completed') setAnswers({})
              setStatus('answering')
            }}
          >
            {status === 'completed' ? '最初からやり直す' : 'アンケートに戻る'}
          </button>
        </section>
      )}
    </main>
  )
}
