import { useState } from 'react'
import './WeekPage.css'

// 月曜〜日曜のダミータスク（画面確認用。どの週も同じ内容を表示する）
const WEEK_TASKS = [
  ['英単語を10個覚える', '机の上を片付ける'],
  ['レポートの構成を考える'],
  ['英単語を10個覚える', 'メールを1通返す'],
  ['レポートを1段落書く'],
  ['1週間の取り組みを振り返る'],
  [],
  ['来週の予定を考える'],
]

export default function WeekPage() {
  const [today] = useState(() => new Date())
  const monday = new Date(
    today.getFullYear(),
    today.getMonth(),
    // getDay() は日曜=0。月曜=0 になるよう変換して、今週の月曜を求める
    today.getDate() - ((today.getDay() + 6) % 7),
  )

  return (
    <main className="page week-page">
      <h1>今週の予定</h1>
      <p className="ui-note">
        モック画面です。表示しているタスクはダミーデータで、タスク追加画面で追加した内容は反映されません。
      </p>
      <ul className="week-grid" role="list">
        {WEEK_TASKS.map((tasks, index) => {
          const date = new Date(
            monday.getFullYear(),
            monday.getMonth(),
            monday.getDate() + index,
          )
          const isToday = date.toDateString() === today.toDateString()

          return (
            <li
              key={index}
              className="ui-box week-column"
              aria-current={isToday ? 'date' : undefined}
            >
              <h2 className="week-day-heading">
                {`${date.getMonth() + 1}/${date.getDate()}(${'日月火水木金土'[date.getDay()]})`}
                {isToday && <span className="ui-pill">今日</span>}
              </h2>
              {tasks.length === 0 ? (
                <p className="week-empty">予定なし</p>
              ) : (
                <ul className="week-tasks" role="list">
                  {tasks.map((title) => (
                    <li key={title} className="ui-box week-card">
                      {title}
                    </li>
                  ))}
                </ul>
              )}
            </li>
          )
        })}
      </ul>
    </main>
  )
}
