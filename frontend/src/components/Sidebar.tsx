
export type Page = 'add' | 'today'

type SidebarProps = {
  currentPage: Page
  onNavigate: (page: Page) => void
}

export default function Sidebar({
  currentPage,
  onNavigate,
}: SidebarProps) {
  const menu: { id: Page; label: string }[] = [
    { id: 'add', label: 'タスク追加' },
    { id: 'today', label: '今日の予定' },
  ]

  return (
    <aside
      style={{
        width: '220px',
        minHeight: '100vh',
        padding: '20px',
        borderRight: '1px solid #ddd',
        boxSizing: 'border-box',
      }}
    >
      <h2>タスク管理</h2>

      <nav style={{ display: 'grid', gap: '8px' }}>
        {menu.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => onNavigate(item.id)}
            aria-current={
              currentPage === item.id ? 'page' : undefined
            }
            style={{
              padding: '12px',
              textAlign: 'left',
              cursor: 'pointer',
              background:
                currentPage === item.id ? '#e0ecff' : 'transparent',
              color: '#222',
              border: 'none',
              borderRadius: '8px',
            }}
          >
            {item.label}
          </button>
        ))}
      </nav>
    </aside>
  )
}
