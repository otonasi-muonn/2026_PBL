import { useEffect, useRef, useState } from 'react'
import type { Task } from '../types'
import PraiseModal from '../components/PraiseModal'
import './TodayPage.css'

// 今日の予定画面。写真のモック通りの行レイアウト（☑ ▼ タイトル ~ピル …）を、
// PR #26 で入った共通部品（.ui-box / .ui-pill）と配色（--ui-*）で実装する。
// タスクはダミーデータ（実データ接続はチーム確認待ち）。完了状態は
// localStorage に保存し、節目（20%ごと・5件ごと）で褒めモーダルを出す。

const PARENT_TITLE = '卒業研究の中間発表スライドを作る'
// AI分割（デモ）のサンプル小タスク。TaskAddPage と同じ内容・同じ並び。
const DEMO_SUBTASKS = [
  '取りかかる準備をする',
  '15分だけ進めてみる',
  '進んだところを確かめる',
]
const STORAGE_KEY = 'pbl.todayTasks.v1'
const PRAISE_TIMEOUT_MS = 15000
const FALLBACK_PRAISE = [
  '一歩ずつ着実に進んでいますね。その調子です！',
  'よく頑張りました！今日の積み重ねが確実に力になっています。',
  'タスクを完了できましたね。小さな達成の積み重ねが大事です。',
  'お疲れさまです。ここまで進められたのは立派な成果です。',
]

function toDateKey(date: Date): string {
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${date.getFullYear()}-${month}-${day}`
}

function createInitialTasks(todayKey: string): Task[] {
  const titles: { title: string; estimatedMinutes: number }[] = [
    { title: '発表の構成を箇条書きで書き出す', estimatedMinutes: 30 },
    { title: '研究背景のスライドを3枚作る', estimatedMinutes: 60 },
    { title: '本論のスライドを作る', estimatedMinutes: 90 },
    { title: '図表を用意してスライドに貼る', estimatedMinutes: 45 },
    { title: '質疑応答の想定質問を3つ用意する', estimatedMinutes: 30 },
    { title: '通しで練習して時間を測る', estimatedMinutes: 30 },
  ]
  return titles.map((item, index) => ({
    id: String(index + 1),
    title: item.title,
    deadline: todayKey,
    estimatedMinutes: item.estimatedMinutes,
    completed: false,
  }))
}

// TodayPage の中だけで使う形: AI分割した小タスクを ▼ の詳細にぶら下げる
type TodayTask = Task & { subtasks?: Task[] }

type StoredTasks = { date: string; tasks: TodayTask[] }

function loadInitialTasks(todayKey: string): TodayTask[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const stored = JSON.parse(raw) as StoredTasks
      if (stored.date === todayKey && Array.isArray(stored.tasks)) {
        return stored.tasks
      }
    }
  } catch {
    // 保存データが壊れている場合は初期データで続行する
  }
  return createInitialTasks(todayKey)
}

async function fetchPraise(taskTitle: string): Promise<string> {
  try {
    const response = await fetch('/api/praise', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        taskTitle,
        parentTitle: PARENT_TITLE,
        tone: 'gentle',
      }),
      signal: AbortSignal.timeout(PRAISE_TIMEOUT_MS),
    })
    if (!response.ok) throw new Error(`status ${response.status}`)
    const data = (await response.json()) as { message?: unknown }
    if (typeof data.message === 'string' && data.message !== '') {
      return data.message
    }
    throw new Error('empty message')
  } catch {
    const index = Math.floor(Math.random() * FALLBACK_PRAISE.length)
    return FALLBACK_PRAISE[index]
  }
}

type TaskRowProps = {
  task: TodayTask
  isEditing: boolean
  editingTitle: string
  onToggle: (id: string) => void
  onEditStart: (id: string) => void
  onEditChange: (title: string) => void
  onEditSave: () => void
  onEditCancel: () => void
  onDelete: (id: string) => void
  onDeadlineChange: (id: string, deadline: string) => void
  onSplit: (id: string) => void
  onSubtaskToggle: (parentId: string, subtaskId: string) => void
  onSubtaskRename: (parentId: string, subtaskId: string, title: string) => void
  onSubtaskDelete: (parentId: string, subtaskId: string) => void
  onSubtaskAdd: (parentId: string, title: string) => void
}

function TaskRow({
  task,
  isEditing,
  editingTitle,
  onToggle,
  onEditStart,
  onEditChange,
  onEditSave,
  onEditCancel,
  onDelete,
  onDeadlineChange,
  onSplit,
  onSubtaskToggle,
  onSubtaskRename,
  onSubtaskDelete,
  onSubtaskAdd,
}: TaskRowProps) {
  const [expanded, setExpanded] = useState(false)
  // 小タスクのインライン編集は行の中で完結させる
  const [editingSubtaskId, setEditingSubtaskId] = useState<string | null>(null)
  const [editingSubtaskTitle, setEditingSubtaskTitle] = useState('')
  // 「手動で追加」の入力欄も行の中で完結させる
  const [isAddingSubtask, setIsAddingSubtask] = useState(false)
  const [newSubtaskTitle, setNewSubtaskTitle] = useState('')

  const submitSubtaskAdd = () => {
    const title = newSubtaskTitle.trim()
    if (title === '') return
    onSubtaskAdd(task.id, title)
    setNewSubtaskTitle('')
    setIsAddingSubtask(false)
  }

  // 親タスクの一覧と同じく、完了した小タスクは下に下げる
  const displaySubtasks = [...(task.subtasks ?? [])].sort(
    (a, b) => Number(a.completed) - Number(b.completed),
  )

  // 分割で小タスクが増えたら、結果が見えるよう自動で詳細を開く
  const subtaskCount = task.subtasks?.length ?? 0
  const prevSubtaskCount = useRef(subtaskCount)
  useEffect(() => {
    if (subtaskCount > prevSubtaskCount.current) setExpanded(true)
    prevSubtaskCount.current = subtaskCount
  }, [subtaskCount])

  // 締切は入力の途中では反映しない。日付の入力欄は、年の途中で打っただけでも
  // 途中経過の値を返してくる（例: 2026 の「2」→ 0002-11-24）ため、そのまま
  // 反映するとタスクが今日の一覧から消えてしまう。フォーカスが外れるか
  // Enter を押した時点で、完全な日付になっている場合だけ反映する。
  const [deadlineDraft, setDeadlineDraft] = useState<string | null>(null)

  const commitDeadline = () => {
    if (deadlineDraft === null) return
    setDeadlineDraft(null)
    if (
      /^\d{4}-\d{2}-\d{2}$/.test(deadlineDraft) &&
      deadlineDraft !== task.deadline
    ) {
      onDeadlineChange(task.id, deadlineDraft)
    }
  }

  const startSubtaskEdit = (subtask: Task) => {
    setEditingSubtaskId(subtask.id)
    setEditingSubtaskTitle(subtask.title)
  }

  const saveSubtaskEdit = () => {
    const title = editingSubtaskTitle.trim()
    if (editingSubtaskId === null || title === '') return
    onSubtaskRename(task.id, editingSubtaskId, title)
    setEditingSubtaskId(null)
  }

  return (
    <li className="ui-box today-row">
      <div className="today-row-main">
        <label className="today-checkbox-hit">
          <input
            type="checkbox"
            className="today-checkbox"
            checked={task.completed}
            onChange={() => onToggle(task.id)}
            aria-label={`「${task.title}」の完了状態を切り替える`}
          />
        </label>
        <button
          type="button"
          className="today-expand"
          aria-expanded={expanded}
          aria-label={`「${task.title}」の詳細を${expanded ? '閉じる' : '開く'}`}
          onClick={() => setExpanded((prev) => !prev)}
        >
          {expanded ? '▲' : '▼'}
        </button>
        {isEditing ? (
          <form
            className="today-edit-form"
            onSubmit={(event) => {
              event.preventDefault()
              onEditSave()
            }}
          >
            <input
              className="ui-input today-edit-input"
              aria-label="タスク名を編集"
              value={editingTitle}
              onChange={(event) => onEditChange(event.target.value)}
              autoFocus
            />
            <div className="today-actions">
              <button
                type="submit"
                className="ui-button today-small-button"
                aria-label={`「${task.title}」の変更を決定`}
                disabled={!editingTitle.trim()}
              >
                決定
              </button>
              <button
                type="button"
                className="ui-button today-small-button"
                aria-label={`「${task.title}」の編集をキャンセル`}
                onClick={onEditCancel}
              >
                キャンセル
              </button>
            </div>
          </form>
        ) : (
          <>
            <span
              className={
                task.completed ? 'today-title completed' : 'today-title'
              }
            >
              {task.title}
            </span>

            <div className="today-actions today-row-actions">
              <button
                type="button"
                className="ui-button ui-button-strong today-small-button"
                aria-label={`「${task.title}」をAI分割（デモ）`}
                onClick={() => onSplit(task.id)}
              >
                AI分割（デモ）
              </button>
              <button
                type="button"
                className="ui-button today-small-button"
                aria-label={`「${task.title}」を編集`}
                onClick={() => onEditStart(task.id)}
              >
                編集
              </button>
              <button
                type="button"
                className="ui-button today-small-button"
                aria-label={`「${task.title}」を削除`}
                onClick={() => onDelete(task.id)}
              >
                削除
              </button>
            </div>
          </>
        )}
      </div>

      {expanded && (
        <div className="today-detail">
          <label className="today-deadline">
            締切:
            <input
              type="date"
              className="ui-input today-deadline-input"
              value={deadlineDraft ?? task.deadline}
              aria-label={`「${task.title}」の締め切り`}
              onChange={(event) => setDeadlineDraft(event.target.value)}
              onBlur={commitDeadline}
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  commitDeadline()
                  event.currentTarget.blur()
                }
              }}
            />
          </label>

          <span>親タスク</span>

          <button
            type="button"
            className="ui-button today-small-button today-manual-add"
            aria-label={`「${task.title}」に小タスクを手動で追加`}
            onClick={() => setIsAddingSubtask(true)}
          >
            手動で追加
          </button>

          {isAddingSubtask && (
            <form
              className="today-edit-form today-add-form"
              onSubmit={(e) => {
                e.preventDefault()
                submitSubtaskAdd()
              }}
            >
              <input
                className="ui-input today-edit-input"
                value={newSubtaskTitle}
                onChange={(e) => setNewSubtaskTitle(e.target.value)}
                placeholder="小タスクを入力"
                aria-label="追加する小タスクのタイトル"
                autoFocus
              />
              <div className="today-actions">
                <button
                  type="submit"
                  className="ui-button today-small-button"
                  disabled={newSubtaskTitle.trim() === ''}
                >
                  追加
                </button>
                <button
                  type="button"
                  className="ui-button today-small-button"
                  onClick={() => {
                    setIsAddingSubtask(false)
                    setNewSubtaskTitle('')
                  }}
                >
                  キャンセル
                </button>
              </div>
            </form>
          )}

          {task.subtasks && task.subtasks.length > 0 && (
            <ul className="today-subtasks">
              {displaySubtasks.map((subtask) => (
                <li key={subtask.id} className="today-subtask">
                  <label className="today-checkbox-hit">
                    <input
                      type="checkbox"
                      className="today-checkbox"
                      checked={subtask.completed}
                      onChange={() => onSubtaskToggle(task.id, subtask.id)}
                      aria-label={`「${subtask.title}」の完了状態を切り替える`}
                    />
                  </label>

                  {editingSubtaskId === subtask.id ? (
                    <form
                      className="today-edit-form"
                      onSubmit={(e) => {
                        e.preventDefault()
                        saveSubtaskEdit()
                      }}
                    >
                      <input
                        className="ui-input today-edit-input"
                        value={editingSubtaskTitle}
                        onChange={(e) => setEditingSubtaskTitle(e.target.value)}
                        aria-label="小タスクのタイトル"
                        autoFocus
                      />
                      <div className="today-actions">
                        <button
                          type="submit"
                          className="ui-button today-small-button"
                          disabled={editingSubtaskTitle.trim() === ''}
                        >
                          決定
                        </button>
                        <button
                          type="button"
                          className="ui-button today-small-button"
                          onClick={() => setEditingSubtaskId(null)}
                        >
                          キャンセル
                        </button>
                      </div>
                    </form>
                  ) : (
                    <>
                      <span
                        className={
                          subtask.completed
                            ? 'today-title completed'
                            : 'today-title'
                        }
                      >
                        {subtask.title}
                      </span>
                      <div className="today-actions today-subtask-actions">
                        <button
                          type="button"
                          className="ui-button today-small-button"
                          aria-label={`「${subtask.title}」を編集`}
                          onClick={() => startSubtaskEdit(subtask)}
                        >
                          編集
                        </button>
                        <button
                          type="button"
                          className="ui-button today-small-button"
                          aria-label={`「${subtask.title}」を削除`}
                          onClick={() => onSubtaskDelete(task.id, subtask.id)}
                        >
                          削除
                        </button>
                      </div>
                    </>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </li>
  )
}

export default function TodayPage() {
  const todayKey = toDateKey(new Date())
  const [tasks, setTasks] = useState<TodayTask[]>(() =>
    loadInitialTasks(todayKey),
  )
  const [praiseMessage, setPraiseMessage] = useState<string | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingTitle, setEditingTitle] = useState('')
  const [confirmingReset, setConfirmingReset] = useState(false)

  useEffect(() => {
    try {
      const stored: StoredTasks = { date: todayKey, tasks }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(stored))
    } catch {
      // 保存に失敗しても画面の動作は続ける
    }
  }, [tasks, todayKey])

  const todayTasks = tasks.filter((task) => task.deadline === todayKey)
  // 完了したタスクは下に下げる（同じ状態どうしの並びは元の順序を保つ）
  const displayTasks = [...todayTasks].sort(
    (a, b) => Number(a.completed) - Number(b.completed),
  )
  const completedCount = todayTasks.filter((task) => task.completed).length
  const progress =
    todayTasks.length === 0
      ? 0
      : Math.round((completedCount / todayTasks.length) * 100)

  const handleToggle = (id: string) => {
    const target = todayTasks.find((task) => task.id === id)
    if (!target) return

    const nextCompleted = !target.completed
    setTasks((prev) =>
      prev.map((task) =>
        task.id === id ? { ...task, completed: nextCompleted } : task,
      ),
    )

    if (!nextCompleted || todayTasks.length === 0) return
    const prevCount = completedCount
    const nextCount = completedCount + 1
    const prevPercent = (prevCount / todayTasks.length) * 100
    const nextPercent = (nextCount / todayTasks.length) * 100
    const crossedPercent =
      Math.floor(prevPercent / 20) !== Math.floor(nextPercent / 20)
    const crossedCount = Math.floor(prevCount / 5) !== Math.floor(nextCount / 5)
    if (crossedPercent || crossedCount) {
      void fetchPraise(target.title).then(setPraiseMessage)
    }
  }

  // 編集の流れは TaskAddPage と同じ: 編集 → 入力欄＋決定/キャンセル
  const startEdit = (id: string) => {
    const target = todayTasks.find((task) => task.id === id)
    if (!target) return
    setEditingId(id)
    setEditingTitle(target.title)
  }

  const cancelEdit = () => {
    setEditingId(null)
    setEditingTitle('')
  }

  const saveEdit = () => {
    const trimmedTitle = editingTitle.trim()
    if (!trimmedTitle || editingId === null) return
    setTasks((prev) =>
      prev.map((task) =>
        task.id === editingId ? { ...task, title: trimmedTitle } : task,
      ),
    )
    cancelEdit()
  }

  const handleDelete = (id: string) => {
    setTasks((prev) => prev.filter((task) => task.id !== id))
    if (editingId === id) cancelEdit()
  }

  const handleDeadlineChange = (id: string, deadline: string) => {
    setTasks((prev) =>
      prev.map((task) => (task.id === id ? { ...task, deadline } : task)),
    )
  }

  // AI分割（デモ）: TaskAddPage と同じサンプル小タスクを、そのタスクの
  // ▼ 詳細の中にぶら下げる（行としては増やさない）
  const handleSplit = (id: string) => {
    setTasks((prev) =>
      prev.map((task) => {
        if (task.id !== id) return task
        const stamp = Date.now()
        const newSubtasks: Task[] = DEMO_SUBTASKS.map((title, i) => ({
          id: `${task.id}-demo-${stamp}-${i}`,
          title,
          deadline: task.deadline,
          estimatedMinutes: null,
          completed: false,
        }))
        return {
          ...task,
          subtasks: [...(task.subtasks ?? []), ...newSubtasks],
        }
      }),
    )
  }

  const handleSubtaskRename = (
    parentId: string,
    subtaskId: string,
    title: string,
  ) => {
    setTasks((prev) =>
      prev.map((task) => {
        if (task.id !== parentId || !task.subtasks) return task
        return {
          ...task,
          subtasks: task.subtasks.map((subtask) =>
            subtask.id === subtaskId ? { ...subtask, title } : subtask,
          ),
        }
      }),
    )
  }

  const handleSubtaskDelete = (parentId: string, subtaskId: string) => {
    setTasks((prev) =>
      prev.map((task) => {
        if (task.id !== parentId || !task.subtasks) return task
        return {
          ...task,
          subtasks: task.subtasks.filter((subtask) => subtask.id !== subtaskId),
        }
      }),
    )
  }

  // 手動で追加: 分割した小タスクと同じ場所（そのタスクの詳細の中）に入れる
  const handleSubtaskAdd = (parentId: string, title: string) => {
    setTasks((prev) =>
      prev.map((task) => {
        if (task.id !== parentId) return task
        const newSubtask: Task = {
          id: `${task.id}-manual-${Date.now()}`,
          title,
          deadline: task.deadline,
          estimatedMinutes: null,
          completed: false,
        }
        return {
          ...task,
          subtasks: [...(task.subtasks ?? []), newSubtask],
        }
      }),
    )
  }

  const handleSubtaskToggle = (parentId: string, subtaskId: string) => {
    setTasks((prev) =>
      prev.map((task) => {
        if (task.id !== parentId || !task.subtasks) return task
        return {
          ...task,
          subtasks: task.subtasks.map((subtask) =>
            subtask.id === subtaskId
              ? { ...subtask, completed: !subtask.completed }
              : subtask,
          ),
        }
      }),
    )
  }

  // 初期状態に戻す: コンソールを使わずにダミー6件へ戻す。編集・分割・
  // 完了の内容は消える（localStorage を消してリロードしたのと同じ結果）
  const handleReset = () => {
    setTasks(createInitialTasks(todayKey))
    setEditingId(null)
    setEditingTitle('')
    setConfirmingReset(false)
  }

  return (
    <main className="page">
      <h1>今日のタスク</h1>

      <div className="today-progress">
        <p className="today-progress-text">
          進捗: {completedCount} / {todayTasks.length} 件完了（{progress}%）
        </p>
        <div
          className="today-progress-track"
          role="progressbar"
          aria-valuenow={progress}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label="今日のタスクの進捗"
        >
          <div
            className="today-progress-fill"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {todayTasks.length === 0 ? (
        <p>今日のタスクはありません</p>
      ) : (
        <ul className="today-list">
          {displayTasks.map((task) => (
            <TaskRow
              key={task.id}
              task={task}
              isEditing={editingId === task.id}
              editingTitle={editingId === task.id ? editingTitle : ''}
              onToggle={handleToggle}
              onEditStart={startEdit}
              onEditChange={setEditingTitle}
              onEditSave={saveEdit}
              onEditCancel={cancelEdit}
              onDelete={handleDelete}
              onDeadlineChange={handleDeadlineChange}
              onSplit={handleSplit}
              onSubtaskToggle={handleSubtaskToggle}
              onSubtaskRename={handleSubtaskRename}
              onSubtaskDelete={handleSubtaskDelete}
              onSubtaskAdd={handleSubtaskAdd}
            />
          ))}
        </ul>
      )}

      <div className="today-reset-area">
        {confirmingReset ? (
          <p className="today-reset-confirm">
            初期の6件に戻しますか？ 編集・分割・完了の内容は消えます。
            <span className="today-actions">
              <button
                type="button"
                className="ui-button today-small-button"
                aria-label="初期の6件に戻す"
                onClick={handleReset}
              >
                戻す
              </button>
              <button
                type="button"
                className="ui-button today-small-button"
                onClick={() => setConfirmingReset(false)}
              >
                キャンセル
              </button>
            </span>
          </p>
        ) : (
          <button
            type="button"
            className="ui-button today-small-button"
            aria-label="タスクを初期状態に戻す"
            onClick={() => setConfirmingReset(true)}
          >
            初期状態に戻す
          </button>
        )}
      </div>

      <PraiseModal
        open={praiseMessage !== null}
        onClose={() => setPraiseMessage(null)}
      >
        <p>{praiseMessage}</p>
      </PraiseModal>
    </main>
  )
}
