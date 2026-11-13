import type { Task } from '../types'

type TaskItemProps = {
  task: Task
  onToggle?: (id: string) => void
}

export default function TaskItem({ task, onToggle }: TaskItemProps) {
  return (
    <div className={task.completed ? 'task-item completed' : 'task-item'}>
      <input
        type="checkbox"
        className="task-item-checkbox"
        checked={task.completed}
        disabled={!onToggle}
        onChange={() => onToggle?.(task.id)}
      />
      <span
        className={
          task.completed ? 'task-item-title completed' : 'task-item-title'
        }
      >
        {task.title}
      </span>
      {task.estimatedMinutes !== null && (
        <span className="task-item-meta">{task.estimatedMinutes}分</span>
      )}
      {task.deadline !== '' && (
        <span className="task-item-meta">締切: {task.deadline}</span>
      )}
    </div>
  )
}
