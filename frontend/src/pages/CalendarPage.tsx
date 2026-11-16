import { useState } from 'react'
import './pages.css'

const WEEKDAYS = ['月', '火', '水', '木', '金', '土', '日']

// 表示月にかかわらず、同じ日に表示する仮の予定
const SAMPLE_PLANS: Partial<Record<number, string[]>> = {
  3: ['英単語を10個覚える'],
  8: ['机の上を片付ける'],
  12: ['レポートの構成を考える', 'メールを1通返す'],
  18: ['英単語を10個覚える'],
  21: ['1週間の取り組みを振り返る'],
  26: ['レポートを1段落書く'],
}

function formatDay(date: Date) {
  return `${date.getMonth() + 1}月${date.getDate()}日（${'日月火水木金土'[date.getDay()]}）`
}

export default function CalendarPage() {
  const [today] = useState(() => new Date())
  const [displayMonth, setDisplayMonth] = useState(
    () => new Date(today.getFullYear(), today.getMonth(), 1),
  )
  const [selectedDay, setSelectedDay] = useState<number | null>(today.getDate())
  const year = displayMonth.getFullYear()
  const month = displayMonth.getMonth()
  // 1日の前に入れる空きマスの数（月曜始まり。getDay() は日曜=0）
  const firstDayOffset = (displayMonth.getDay() + 6) % 7
  // 翌月の「0日」は今月の末日になる
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const selectedDate =
    selectedDay === null ? null : new Date(year, month, selectedDay)
  const selectedPlans =
    selectedDay === null ? [] : (SAMPLE_PLANS[selectedDay] ?? [])

  function changeMonth(offset: number) {
    setDisplayMonth(
      (current) =>
        new Date(current.getFullYear(), current.getMonth() + offset, 1),
    )
    setSelectedDay(null)
  }

  return (
    <main className="page calendar-page">
      <h1>カレンダー</h1>
      <p className="ui-note">
        モック画面です。表示している予定はダミーデータで、どの月も同じ日に同じサンプルを表示します。
      </p>
      <div className="calendar-toolbar">
        <button
          type="button"
          className="ui-button"
          onClick={() => changeMonth(-1)}
        >
          前の月
        </button>
        <h2 className="calendar-month" aria-live="polite">
          {year}年{month + 1}月
        </h2>
        <button
          type="button"
          className="ui-button"
          onClick={() => changeMonth(1)}
        >
          次の月
        </button>
      </div>
      <div className="calendar-grid">
        {WEEKDAYS.map((weekday) => (
          <div key={weekday} className="calendar-weekday">
            {weekday}
          </div>
        ))}
        {Array.from({ length: firstDayOffset }, (_, index) => (
          <span key={`empty-${index}`} aria-hidden="true" />
        ))}
        {Array.from({ length: daysInMonth }, (_, index) => {
          const day = index + 1
          const date = new Date(year, month, day)
          const plans = SAMPLE_PLANS[day] ?? []
          const isToday = date.toDateString() === today.toDateString()

          return (
            <button
              key={day}
              type="button"
              className="ui-button calendar-day"
              aria-label={`${formatDay(date)} ${plans.length > 0 ? `予定${plans.length}件` : '予定なし'}`}
              aria-pressed={selectedDay === day}
              aria-current={isToday ? 'date' : undefined}
              onClick={() => setSelectedDay(day)}
            >
              <span>{day}</span>
              {plans.length > 0 && (
                <span className="calendar-dot" aria-hidden="true" />
              )}
            </button>
          )
        })}
      </div>
      <section
        className="ui-box calendar-details"
        aria-labelledby="calendar-selected-heading"
        aria-live="polite"
      >
        <h2 id="calendar-selected-heading" className="calendar-details-heading">
          {selectedDate
            ? `${formatDay(selectedDate)}の予定（サンプル）`
            : '選択日の予定'}
        </h2>
        {selectedDate === null ? (
          <p className="calendar-message">
            日付を選ぶと、その日のサンプルの予定を表示します。
          </p>
        ) : selectedPlans.length === 0 ? (
          <p className="calendar-message">予定はありません。</p>
        ) : (
          <ul className="calendar-plans">
            {selectedPlans.map((title) => (
              <li key={title}>{title}</li>
            ))}
          </ul>
        )}
      </section>
    </main>
  )
}
