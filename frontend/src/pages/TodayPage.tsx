import { useEffect, useState } from 'react'
import type { Task } from '../types'
import PraiseModal from '../components/PraiseModal'
import './TodayPage.css'

// 今日の予定画面。写真のモック通りの行レイアウト（☑ ▼ タイトル ~ピル …）を、
// PR #26 で入った共通部品（.ui-box / .ui-pill）と配色（--ui-*）で実装する。
// タスクはダミーデータ（実データ接続はチーム確認待ち）。完了状態は
// localStorage に保存し、節目（20%ごと・5件ごと）で褒めモーダルを出す。

const PARENT_TITLE = '卒業研究の中間発表スライドを作る'
const STORAGE_KEY = 'pbl.todayTasks.v1'
const PRAISE_TIMEOUT_MS = 8000
const FALLBACK_PRAISE = [
  '一歩ずつ着実に進んでいますね。その調子です！',
  'よく頑張りました！今日の積み重ねが確実に力になっています。',
  'タスクを完了できましたね。小さな達成の積み重ねが大事です。',
  'お疲れさまです。ここまで進められたのは立派な成果です。',
]

const WEEKDAYS = ['日', '月', '火', '水', '木', '金', '土']

function toDateKey(date: Date): string {
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${date.getFullYear()}-${month}-${day}`
}

// 30 -> '~30m' / 60 -> '~1h' / 90 -> '~1h30m'（モックの ~m(h) 表記）
function formatEstimated(minutes: number): string {
  if (minutes < 60) return `~${minutes}m`
  const hours = Math.floor(minutes / 60)
  const rest = minutes % 60
  return rest === 0 ? `~${hours}h` : `~${hours}h${rest}m`
}

// '2026-11-17' -> '11/17(火)'（モックの xx/yy(z) 表記）
function formatDeadline(deadline: string): string {
  const date = new Date(`${deadline}T00:00:00`)
  if (Number.isNaN(date.getTime())) return deadline
  return `${date.getMonth() + 1}/${date.getDate()}(${WEEKDAYS[date.getDay()]})`
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

type StoredTasks = { date: string; tasks: Task[] }

function loadInitialTasks(todayKey: string): Task[] {
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
  task: Task
  onToggle: (id: string) => void
  onEdit: (id: string) => void
  onDelete: (id: string) => void
}

function TaskRow({ task, onToggle, onEdit, onDelete }: TaskRowProps) {
  const [expanded, setExpanded] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)

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
        <span
          className={task.completed ? 'today-title completed' : 'today-title'}
        >
          {task.title}
        </span>
        {task.estimatedMinutes !== null && (
          <span className="ui-pill today-pill">
            {formatEstimated(task.estimatedMinutes)}
          </span>
        )}
        <div className="today-menu-wrap">
          <button
            type="button"
            className="today-menu-button"
            aria-haspopup="menu"
            aria-expanded={menuOpen}
            aria-label={`「${task.title}」のメニュー`}
            onClick={() => setMenuOpen((prev) => !prev)}
          >
            …
          </button>
          {menuOpen && (
            <div className="today-menu" role="menu">
              <button
                type="button"
                role="menuitem"
                className="today-menu-item"
                onClick={() => {
                  setMenuOpen(false)
                  onEdit(task.id)
                }}
              >
                編集
              </button>
              <button
                type="button"
                role="menuitem"
                className="today-menu-item"
                onClick={() => {
                  setMenuOpen(false)
                  onDelete(task.id)
                }}
              >
                削除
              </button>
            </div>
          )}
        </div>
      </div>

      {expanded && (
        <div className="today-detail">
          {task.deadline !== '' && (
            <span>締切: {formatDeadline(task.deadline)}</span>
          )}
          {task.estimatedMinutes !== null && (
            <span>目安: {task.estimatedMinutes}分</span>
          )}
          <span>{task.completed ? '完了済み' : '未完了'}</span>
        </div>
      )}
    </li>
  )
}

export default function TodayPage() {
  const todayKey = toDateKey(new Date())
  const [tasks, setTasks] = useState<Task[]>(() => loadInitialTasks(todayKey))
  const [praiseMessage, setPraiseMessage] = useState<string | null>(null)

  useEffect(() => {
    try {
      const stored: StoredTasks = { date: todayKey, tasks }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(stored))
    } catch {
      // 保存に失敗しても画面の動作は続ける
    }
  }, [tasks, todayKey])

  const todayTasks = tasks.filter((task) => task.deadline === todayKey)
  const completedCount = todayTasks.filter((task) => task.completed).length
  const progress =
    todayTasks.length === 0
      ? 0
      : Math.round((completedCount / todayTasks.length) * 100)
  const remainingMinutes = todayTasks
    .filter((task) => !task.completed)
    .reduce((sum, task) => sum + (task.estimatedMinutes ?? 0), 0)

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

  const handleEdit = (id: string) => {
    const target = todayTasks.find((task) => task.id === id)
    if (!target) return
    // TODO: 正式な編集画面が決まるまでの暫定実装
    const title = window.prompt('タスク名を編集', target.title)
    if (title === null || title.trim() === '') return
    setTasks((prev) =>
      prev.map((task) =>
        task.id === id ? { ...task, title: title.trim() } : task,
      ),
    )
  }

  const handleDelete = (id: string) => {
    setTasks((prev) => prev.filter((task) => task.id !== id))
  }

  return (
    <main className="page">
      <h1>今日の予定</h1>

      <div className="today-progress">
        <p className="today-progress-text">
          進捗: {completedCount} / {todayTasks.length} 件完了（{progress}%）
          {remainingMinutes > 0 && (
            <> ・ 残りの目安 {formatEstimated(remainingMinutes)}</>
          )}
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
        <p>今日の予定はありません</p>
      ) : (
        <ul className="today-list">
          {todayTasks.map((task) => (
            <TaskRow
              key={task.id}
              task={task}
              onToggle={handleToggle}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          ))}
        </ul>
      )}

      <PraiseModal
        open={praiseMessage !== null}
        onClose={() => setPraiseMessage(null)}
      >
        <p>{praiseMessage}</p>
      </PraiseModal>
    </main>
  )
}
