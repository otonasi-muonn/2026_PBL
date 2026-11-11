
import { useState } from 'react'

type Task = {
  id: string
  title: string
  deadline: string
  estimatedMinutes: number | null
  completed: boolean
}

export default function TaskAddPage() {
  const [title, setTitle] = useState('')
  const [deadline, setDeadline] = useState('')
  const [estimatedMinutes, setEstimatedMinutes] = useState('')
  const [tasks, setTasks] = useState<Task[]>([])

  // タスクを追加する
  const addTasks = (titles: string[]) => {
    const newTasks = titles.map((name) => ({
      id: crypto.randomUUID(),
      title: name,
      deadline,
      estimatedMinutes: estimatedMinutes
        ? Number(estimatedMinutes)
        : null,
      completed: false,
    }))

    setTasks((prev) => [...prev, ...newTasks])
    setTitle('')
  }

  // そのまま登録
  const handleAdd = () => {
    if (!title.trim()) return
    addTasks([title.trim()])
  }

  // AIによるタスク分割（現在はダミー）
  const handleSplit = () => {
    if (!title.trim()) return

    addTasks([
      `${title}：必要な作業を整理する`,
      `${title}：作業を進める`,
      `${title}：完成内容を確認する`,
    ])
  }

  // タスクの完了状態を切り替える
  const toggleTask = (id: string) => {
    setTasks((prev) =>
      prev.map((task) =>
        task.id === id
          ? { ...task, completed: !task.completed }
          : task,
      ),
    )
  }

  return (
    <main style={{ padding: '24px', maxWidth: '800px' }}>
      <h1>タスク追加</h1>

      <section>
        <h2>新しいタスク</h2>

        <input
          type="text"
          placeholder="やりたいことを入力"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          style={{ width: '100%', padding: '8px' }}
        />

        <div style={{ marginTop: '16px' }}>
          <label>
            締め切り：
            <input
              type="date"
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
            />
          </label>
        </div>

        <div style={{ marginTop: '12px' }}>
          <label>
            推定時間（分）：
            <input
              type="number"
              min="1"
              value={estimatedMinutes}
              onChange={(e) => setEstimatedMinutes(e.target.value)}
            />
          </label>
        </div>

        <div style={{ display: 'flex', gap: '12px', marginTop: '20px' }}>
          <button type="button" onClick={handleAdd}>
            そのまま登録
          </button>
          <button type="button" onClick={handleSplit}>
            AIで分割（仮）
          </button>
        </div>
      </section>

      <hr style={{ margin: '24px 0' }} />

      <section>
        <h2>タスク一覧</h2>

        {tasks.length === 0 ? (
          <p>タスクはまだありません。</p>
        ) : (
          <ul style={{ listStyle: 'none', padding: 0 }}>
            {tasks.map((task) => (
              <li key={task.id} style={{ marginBottom: '12px' }}>
                <label>
                  <input
                    type="checkbox"
                    checked={task.completed}
                    onChange={() => toggleTask(task.id)}
                  />
                  <span
                    style={{
                      marginLeft: '8px',
                      textDecoration: task.completed
                        ? 'line-through'
                        : 'none',
                    }}
                  >
                    {task.title}
                  </span>
                </label>

                <small style={{ display: 'block', marginLeft: '24px' }}>
                  {task.deadline && `期限：${task.deadline}　`}
                  {task.estimatedMinutes !== null &&
                    `推定：${task.estimatedMinutes}分`}
                </small>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  )
}
