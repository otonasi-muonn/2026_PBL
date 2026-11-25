import { useEffect, useState } from 'react'
import './WeekPage.css'

// 曜日ごとのダミータスク（画面確認用。月曜=0〜日曜=6 の並びで、
// 表示する日付の曜日に合わせて割り当てる）
const WEEK_TASKS = [
  ['英単語を10個覚える', '机の上を片付ける'],
  ['レポートの構成を考える'],
  ['英単語を10個覚える', 'メールを1通返す'],
  ['レポートを1段落書く'],
  ['1週間の取り組みを振り返る'],
  [],
  ['来週の予定を考える'],
]

function dateKey(date: Date): string {
  return `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`
}

export default function WeekPage() {
  const [today] = useState(() => new Date())
  // 表示範囲は「昨日・今日・未来5日間」の7日間（週の区切りは使わない）
  const days = Array.from(
    { length: 7 },
    (_, index) =>
      new Date(
        today.getFullYear(),
        today.getMonth(),
        today.getDate() - 1 + index,
      ),
  )
  const [tasksByDate, setTasksByDate] = useState<Record<string, string[]>>(
    () => {
      const initial: Record<string, string[]> = {}
      for (const date of days) {
        // getDay() は日曜=0。月曜=0 になるよう変換して、その曜日のダミーを割り当てる
        initial[dateKey(date)] = [...WEEK_TASKS[(date.getDay() + 6) % 7]]
      }
      return initial
    },
  )
  const [addingKey, setAddingKey] = useState<string | null>(null)
  const [newTitle, setNewTitle] = useState('')
  // 右クリックされた予定カード（その場に編集・削除ボタンを出す）
  const [menuTarget, setMenuTarget] = useState<{
    key: string
    index: number
  } | null>(null)
  const [editing, setEditing] = useState<{ key: string; index: number } | null>(
    null,
  )
  const [editTitle, setEditTitle] = useState('')

  // Esc やカードの外のクリックで、編集・削除ボタンを閉じて元に戻す
  useEffect(() => {
    if (!menuTarget) return
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMenuTarget(null)
    }
    const onMouseDown = (e: MouseEvent) => {
      if (!(e.target as HTMLElement).closest('[data-menu-open="true"]')) {
        setMenuTarget(null)
      }
    }
    window.addEventListener('keydown', onKeyDown)
    window.addEventListener('mousedown', onMouseDown)
    return () => {
      window.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('mousedown', onMouseDown)
    }
  }, [menuTarget])

  const startEdit = () => {
    if (!menuTarget) return
    setEditing({ key: menuTarget.key, index: menuTarget.index })
    setEditTitle(tasksByDate[menuTarget.key]?.[menuTarget.index] ?? '')
    setMenuTarget(null)
  }

  const saveEdit = () => {
    if (!editing) return
    const title = editTitle.trim()
    if (!title) return
    setTasksByDate((prev) => ({
      ...prev,
      [editing.key]: (prev[editing.key] ?? []).map((t, i) =>
        i === editing.index ? title : t,
      ),
    }))
    setEditing(null)
    setEditTitle('')
  }

  const deleteTask = () => {
    if (!menuTarget) return
    setTasksByDate((prev) => ({
      ...prev,
      [menuTarget.key]: (prev[menuTarget.key] ?? []).filter(
        (_, i) => i !== menuTarget.index,
      ),
    }))
    setMenuTarget(null)
  }

  const openAddForm = (key: string) => {
    setAddingKey(key)
    setNewTitle('')
  }

  const closeAddForm = () => {
    setAddingKey(null)
    setNewTitle('')
  }

  const addTask = (key: string) => {
    const title = newTitle.trim()
    if (!title) return
    setTasksByDate((prev) => ({
      ...prev,
      [key]: [...(prev[key] ?? []), title],
    }))
    closeAddForm()
  }

  return (
    <main className="page week-page">
      <h1>今週の予定</h1>
      <p className="ui-note">
        モック画面です。表示しているタスクはダミーデータで、タスク追加画面で追加した内容は反映されません。列の空いているところを右クリックすると予定を追加でき、予定を右クリックすると編集・削除できます（変更は保存されません）。
      </p>
      <ul className="week-grid" role="list">
        {days.map((date) => {
          const key = dateKey(date)
          const tasks = tasksByDate[key] ?? []
          const isToday = date.toDateString() === today.toDateString()
          const isAdding = addingKey === key

          return (
            <li
              key={key}
              className="ui-box week-column"
              aria-current={isToday ? 'date' : undefined}
              onContextMenu={(e) => {
                // 予定カードの上はカード側のメニュー、入力フォームの上は
                // ブラウザ標準の右クリックメニューを使う
                if (
                  (e.target as HTMLElement).closest(
                    '.week-card, .week-add-form',
                  )
                ) {
                  return
                }
                e.preventDefault()
                setMenuTarget(null)
                openAddForm(key)
              }}
            >
              <h2 className="week-day-heading">
                {`${date.getMonth() + 1}/${date.getDate()}(${'日月火水木金土'[date.getDay()]})`}
                {isToday && <span className="ui-pill">今日</span>}
              </h2>
              {tasks.length > 0 && (
                <ul className="week-tasks" role="list">
                  {tasks.map((title, taskIndex) => {
                    const isEditingThis =
                      editing?.key === key && editing.index === taskIndex
                    const isMenuOpen =
                      menuTarget?.key === key && menuTarget.index === taskIndex
                    return (
                      <li
                        key={`${taskIndex}-${title}`}
                        className="ui-box week-card"
                        data-menu-open={isMenuOpen ? 'true' : undefined}
                        onContextMenu={(e) => {
                          if (isEditingThis) return
                          e.preventDefault()
                          e.stopPropagation()
                          setEditing(null)
                          setMenuTarget({ key, index: taskIndex })
                        }}
                      >
                        {isMenuOpen ? (
                          <>
                            {title}
                            <div className="week-card-actions">
                              <button
                                type="button"
                                className="ui-button ui-button-strong"
                                onClick={startEdit}
                              >
                                編集
                              </button>
                              <button
                                type="button"
                                className="ui-button"
                                onClick={deleteTask}
                              >
                                削除
                              </button>
                            </div>
                          </>
                        ) : isEditingThis ? (
                          <form
                            className="week-add-form week-edit-form"
                            onSubmit={(e) => {
                              e.preventDefault()
                              saveEdit()
                            }}
                          >
                            <input
                              className="ui-input week-add-input"
                              type="text"
                              value={editTitle}
                              onChange={(e) => setEditTitle(e.target.value)}
                              aria-label="予定を編集"
                              autoFocus
                            />
                            <div className="week-add-actions">
                              <button
                                type="submit"
                                className="ui-button ui-button-strong"
                                disabled={!editTitle.trim()}
                              >
                                決定
                              </button>
                              <button
                                type="button"
                                className="ui-button"
                                onClick={() => {
                                  setEditing(null)
                                  setEditTitle('')
                                }}
                              >
                                キャンセル
                              </button>
                            </div>
                          </form>
                        ) : (
                          title
                        )}
                      </li>
                    )
                  })}
                </ul>
              )}
              {tasks.length === 0 && !isAdding && (
                <p className="week-empty">予定なし</p>
              )}
              {isAdding && (
                <form
                  className="week-add-form"
                  onSubmit={(e) => {
                    e.preventDefault()
                    addTask(key)
                  }}
                >
                  <input
                    className="ui-input week-add-input"
                    type="text"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    placeholder="予定を入力"
                    aria-label="追加する予定"
                    autoFocus
                  />
                  <div className="week-add-actions">
                    <button
                      type="submit"
                      className="ui-button ui-button-strong"
                      disabled={!newTitle.trim()}
                    >
                      追加
                    </button>
                    <button
                      type="button"
                      className="ui-button"
                      onClick={closeAddForm}
                    >
                      キャンセル
                    </button>
                  </div>
                </form>
              )}
            </li>
          )
        })}
      </ul>
    </main>
  )
}
