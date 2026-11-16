import { useRef, useState } from 'react'
import './TaskAddPage.css'

// この画面だけで使う仮のデータ（保存しない）
type DraftTask = {
  id: number
  parentId: number | null // null なら親タスク
  title: string
  deadline: string // 'YYYY-MM-DD'、'' は未設定
  estimatedMinutes: number | null
  isDemo: boolean // AI分割（デモ）で作った親タスク
}

const DEMO_SUBTASKS = [
  { title: '取りかかる準備をする', estimatedMinutes: 10 },
  { title: '15分だけ進めてみる', estimatedMinutes: 15 },
  { title: '進んだところを確かめる', estimatedMinutes: 5 },
]

function formatDeadline(deadline: string) {
  const [year, month, day] = deadline.split('-').map(Number)
  const date = new Date(year, month - 1, day)
  return `${month}/${day}(${'日月火水木金土'[date.getDay()]})`
}

export default function TaskAddPage() {
  const [tasks, setTasks] = useState<DraftTask[]>([])
  const [title, setTitle] = useState('')
  const [deadline, setDeadline] = useState('')
  const [estimatedMinutes, setEstimatedMinutes] = useState('')
  const [minutesError, setMinutesError] = useState(false)
  const minutesInputRef = useRef<HTMLInputElement>(null)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [editingTitle, setEditingTitle] = useState('')
  // 画面に表示しない連番なので、state ではなく ref で持つ
  const nextId = useRef(1)

  function addTask(isDemo: boolean) {
    const trimmedTitle = title.trim()
    if (!trimmedTitle) return

    // 推定時間は任意。入力するなら1以上の数だけ受け付け、小数は四捨五入する。
    // 数として読めない入力は value が '' になるため、badInput で空欄と区別する。
    const isMinutesEmpty =
      estimatedMinutes === '' && !minutesInputRef.current?.validity.badInput
    const minutes = Number(estimatedMinutes)
    const isMinutesValid =
      isMinutesEmpty || (Number.isFinite(minutes) && minutes >= 1)
    setMinutesError(!isMinutesValid)
    if (!isMinutesValid) return

    const parent: DraftTask = {
      id: nextId.current++,
      parentId: null,
      title: trimmedTitle,
      deadline,
      estimatedMinutes: isMinutesEmpty ? null : Math.round(minutes),
      isDemo,
    }
    const children: DraftTask[] = isDemo
      ? DEMO_SUBTASKS.map((task) => ({
          ...task,
          id: nextId.current++,
          parentId: parent.id,
          deadline,
          isDemo: false,
        }))
      : []

    setTasks((current) => [...current, parent, ...children])
    setTitle('')
    setDeadline('')
    setEstimatedMinutes('')
  }

  function cancelEdit() {
    setEditingId(null)
    setEditingTitle('')
  }

  function saveEdit() {
    const trimmedTitle = editingTitle.trim()
    if (!trimmedTitle) return

    setTasks((current) =>
      current.map((task) =>
        task.id === editingId ? { ...task, title: trimmedTitle } : task,
      ),
    )
    cancelEdit()
  }

  function deleteTask(id: number) {
    setTasks((current) =>
      current.filter((task) => task.id !== id && task.parentId !== id),
    )
    const editingTask = tasks.find((task) => task.id === editingId)
    if (editingId === id || editingTask?.parentId === id) cancelEdit()
  }

  function renderTask(task: DraftTask) {
    return (
      <div className="task-add-row">
        {editingId === task.id ? (
          <form
            className="task-add-edit-form"
            onSubmit={(event) => {
              event.preventDefault()
              saveEdit()
            }}
          >
            <input
              className="ui-input task-add-edit-input"
              aria-label="タスク名を編集"
              value={editingTitle}
              onChange={(event) => setEditingTitle(event.target.value)}
              autoFocus
            />
            <div className="task-add-actions">
              <button
                type="submit"
                className="ui-button task-add-small-button"
                aria-label={`「${task.title}」の変更を決定`}
                disabled={!editingTitle.trim()}
              >
                決定
              </button>
              <button
                type="button"
                className="ui-button task-add-small-button"
                aria-label={`「${task.title}」の編集をキャンセル`}
                onClick={cancelEdit}
              >
                キャンセル
              </button>
            </div>
          </form>
        ) : (
          <span className="task-add-title">{task.title}</span>
        )}
        {task.isDemo && <span className="ui-pill">AI分割デモ</span>}
        {task.estimatedMinutes !== null && (
          <span className="ui-pill">~{task.estimatedMinutes}分</span>
        )}
        {task.deadline && (
          <span className="ui-pill">{formatDeadline(task.deadline)}</span>
        )}
        <div className="task-add-actions">
          {editingId !== task.id && (
            <button
              type="button"
              className="ui-button task-add-small-button"
              aria-label={`「${task.title}」を編集`}
              onClick={() => {
                setEditingId(task.id)
                setEditingTitle(task.title)
              }}
            >
              編集
            </button>
          )}
          <button
            type="button"
            className="ui-button task-add-small-button"
            aria-label={`「${task.title}」を削除`}
            onClick={() => deleteTask(task.id)}
          >
            削除
          </button>
        </div>
      </div>
    )
  }

  return (
    <main className="page task-add-page">
      <form
        noValidate
        onSubmit={(event) => {
          event.preventDefault()
          addTask(false)
        }}
      >
        <div className="task-add-header">
          <h1>タスク追加</h1>
          <div className="task-add-fields">
            <label className="task-add-field">
              <span className="task-add-field-label">締め切り</span>
              <input
                type="date"
                className="ui-input task-add-meta-input"
                value={deadline}
                onChange={(event) => setDeadline(event.target.value)}
              />
            </label>
            <label className="task-add-field">
              <span className="task-add-field-label">推定時間（分）</span>
              <input
                ref={minutesInputRef}
                type="number"
                min="1"
                step="any"
                placeholder="例: 30"
                className="ui-input task-add-meta-input"
                value={estimatedMinutes}
                aria-invalid={minutesError}
                aria-describedby={
                  minutesError
                    ? 'task-add-minutes-hint task-add-minutes-error'
                    : 'task-add-minutes-hint'
                }
                onChange={(event) => setEstimatedMinutes(event.target.value)}
                // 数として読めない入力では onChange が呼ばれないことがあるため、onInput でエラーを消す
                onInput={() => setMinutesError(false)}
              />
            </label>
            <span id="task-add-minutes-hint" className="task-add-field-label">
              1以上の数（小数は四捨五入）
            </span>
            {minutesError && (
              <strong
                id="task-add-minutes-error"
                className="task-add-field-label"
                role="alert"
              >
                推定時間は1以上の数で入力してください
              </strong>
            )}
          </div>
        </div>
        <p className="ui-note">
          モック画面です。追加したタスクはこの画面の中だけで表示され、保存はされません。今日・今週・カレンダーの画面にも反映されません。
        </p>
        <div className="task-add-row">
          <input
            className="ui-input task-add-entry-input"
            aria-label="タスク・目標"
            placeholder="タスク・目標を入力（例: 英語の小テストに備える）"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
          />
          <button type="submit" className="ui-button" disabled={!title.trim()}>
            手動で追加
          </button>
          <button
            type="button"
            className="ui-button ui-button-strong"
            disabled={!title.trim()}
            onClick={() => addTask(true)}
          >
            AI分割（デモ）
          </button>
        </div>
        <p className="task-add-help">
          AI分割（デモ）は実際のAIには接続していません。入力内容にかかわらず、同じサンプルの小さなタスクを表示します。
        </p>
      </form>
      <section aria-labelledby="task-add-list-heading">
        <h2 id="task-add-list-heading" className="task-add-section-title">
          登録したタスク
        </h2>
        {tasks.length === 0 ? (
          <p className="task-add-empty">
            まだタスクはありません。上の入力欄から追加できます。
          </p>
        ) : (
          <ul className="task-add-list" role="list">
            {tasks
              .filter((task) => task.parentId === null)
              .map((parent) => {
                const children = tasks.filter(
                  (task) => task.parentId === parent.id,
                )
                return (
                  <li key={parent.id} className="task-add-group">
                    {renderTask(parent)}
                    {children.length > 0 && (
                      <ul className="task-add-subtasks" role="list">
                        {children.map((child) => (
                          <li key={child.id}>{renderTask(child)}</li>
                        ))}
                      </ul>
                    )}
                  </li>
                )
              })}
          </ul>
        )}
      </section>
    </main>
  )
}
