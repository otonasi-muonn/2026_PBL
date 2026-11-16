import { useState } from 'react'
import './pages.css'

// 褒め言葉の内容に対する評価（利用者自身の能力や達成度の評価ではない）
const RATINGS = ['悪い', '普通', '良い']

// 実際の完了記録とはつながっていないサンプル
const COMPLETED_TASKS = [
  { title: 'レポートの構成を考える', dateLabel: '昨日' },
  { title: '英単語を10個覚える', dateLabel: '2日前' },
  { title: '机の上を片付ける', dateLabel: '3日前' },
]

export default function MyPage() {
  const [rating, setRating] = useState<string | null>(null)
  const [memo, setMemo] = useState('')

  return (
    <main className="page my-page">
      <h1>マイページ</h1>
      <p className="ui-note">
        モック画面です。ユーザー情報・完了したタスク・褒め言葉はすべてダミーデータで、評価や振り返りの入力は保存されません。
      </p>
      <div className="my-page-profile">
        <span className="my-page-avatar" aria-hidden="true">
          サ
        </span>
        <span className="ui-box my-page-name">サンプルユーザー</span>
        <span className="my-page-caption">（仮のユーザー情報）</span>
      </div>
      <section
        className="ui-box my-page-section my-page-praise"
        aria-labelledby="my-page-praise-heading"
      >
        <h2 id="my-page-praise-heading" className="my-page-heading">
          褒め言葉（サンプル）
        </h2>
        <p className="my-page-praise-text">
          「レポートの構成を考える」に取り組みましたね。書き始める前の準備を自分で進められたことは、着実な一歩です。
        </p>
        <p id="my-page-rating-prompt">この褒め言葉はどうでしたか？</p>
        <div
          className="my-page-rating-group"
          role="group"
          aria-labelledby="my-page-rating-prompt"
        >
          {RATINGS.map((option) => (
            <button
              key={option}
              type="button"
              className="ui-button my-page-rating-button"
              aria-pressed={rating === option}
              onClick={() => setRating(option)}
            >
              {option}
            </button>
          ))}
        </div>
        <p className="my-page-caption">
          あなた自身ではなく、この褒め言葉の内容についての評価です。
        </p>
        <p className="my-page-caption" aria-live="polite">
          {rating === null
            ? ''
            : `「${rating}」を選びました（モックのため保存されません）。`}
        </p>
      </section>
      <section
        className="ui-box my-page-section"
        aria-labelledby="my-page-history-heading"
      >
        <h2 id="my-page-history-heading" className="my-page-heading">
          今までこなせたタスク（サンプル）
        </h2>
        <div className="ui-box">
          <ul className="my-page-history" role="list">
            {COMPLETED_TASKS.map((task) => (
              <li key={task.title} className="my-page-history-row">
                <span className="my-page-task-title">{task.title}</span>
                <span className="ui-pill">{task.dateLabel}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>
      <section className="my-page-section">
        <h2 id="my-page-memo-heading" className="my-page-heading">
          振り返りメモ（任意）
        </h2>
        <textarea
          className="ui-input my-page-memo"
          rows={4}
          aria-labelledby="my-page-memo-heading"
          placeholder="今日取り組めたことや、気づいたことを自由に書けます。"
          value={memo}
          onChange={(event) => setMemo(event.target.value)}
        />
        <p className="my-page-caption">
          入力した内容は保存されません（モック）。
        </p>
      </section>
    </main>
  )
}
