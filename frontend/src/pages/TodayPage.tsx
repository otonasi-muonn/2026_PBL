import { useState } from 'react'

type Task = {
  id: string
  title: string
  estimatedMinutes: number
  completed: boolean
}

const sampleTasks: Task[] = [
  {
    id: '1',
    title: 'Reactの基本を勉強する',
    estimatedMinutes: 30,
    completed: false,
  },
  {
    id: '2',
    title: 'レポートの資料を集める',
    estimatedMinutes: 45,
    completed: false,
  },
  {
    id: '3',
    title: 'GitHubの変更を確認する',
    estimatedMinutes: 15,
    completed: true,
  },
]

export default function TodayPage() {
  const [tasks, setTasks] = useState<Task[]>(sampleTasks)

  const completedCount = tasks.filter((task) => task.completed).length
  const progress =
    tasks.length > 0 ? Math.round((completedCount / tasks.length) * 100) : 0

  const toggleTask = (id: string) => {
    setTasks((prev) =>
      prev.map((task) =>
        task.id === id ? { ...task, completed: !task.completed } : task,
      ),
    )
  }

  return (
    <main style={{ padding: '24px', maxWidth: '800px' }}>
      <h1>今日の予定</h1>

      <section style={{ marginBottom: '24px' }}>
        <p>
          完了したタスク：{completedCount} / {tasks.length}
        </p>

        <progress
          value={completedCount}
          max={tasks.length || 1}
          style={{ width: '100%', height: '20px' }}
        />

        <p>進捗率：{progress}%</p>
      </section>

      <section>
        <h2>タスク一覧</h2>

        {tasks.length === 0 ? (
          <p>今日のタスクはありません。</p>
        ) : (
          <ul style={{ listStyle: 'none', padding: 0 }}>
            {tasks.map((task) => (
              <li
                key={task.id}
                style={{
                  border: '1px solid #ccc',
                  borderRadius: '8px',
                  padding: '12px',
                  marginBottom: '12px',
                }}
              >
                <label
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                  }}
                >
                  <input
                    type="checkbox"
                    checked={task.completed}
                    onChange={() => toggleTask(task.id)}
                  />

                  <span
                    style={{
                      flex: 1,
                      textDecoration: task.completed ? 'line-through' : 'none',
                    }}
                  >
                    {task.title}
                  </span>

                  <span>{task.estimatedMinutes}分</span>
                </label>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  )
}
