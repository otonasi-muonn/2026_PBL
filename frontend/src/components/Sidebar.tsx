import type { Page } from '../types'

type SidebarProps = {
  currentPage: Page
  onNavigate: (page: Page) => void
}

const MAIN_MENU_ITEMS: { page: Page; label: string }[] = [
  { page: 'add', label: 'タスク追加' },
  { page: 'today', label: '今日の予定' },
  { page: 'week', label: '今週の予定' },
  { page: 'calendar', label: 'カレンダー' },
]

export default function Sidebar({ currentPage, onNavigate }: SidebarProps) {
  return (
    <aside className="sidebar">
      <nav className="sidebar-nav">
        {MAIN_MENU_ITEMS.map((item) => {
          const isActive = currentPage === item.page
          return (
            <button
              key={item.page}
              type="button"
              className={isActive ? 'sidebar-button active' : 'sidebar-button'}
              aria-current={isActive ? 'page' : undefined}
              onClick={() => onNavigate(item.page)}
            >
              {item.label}
            </button>
          )
        })}
      </nav>

      <hr className="sidebar-divider" />

      {
        // TODO: マイページとアンケートへの正式な導線は未決定。開発中に開けるようにするための暫定配置
      }
      <div className="sidebar-sub">
        <button
          type="button"
          className={
            currentPage === 'me' ? 'sidebar-button active' : 'sidebar-button'
          }
          aria-current={currentPage === 'me' ? 'page' : undefined}
          onClick={() => onNavigate('me')}
        >
          マイページ
        </button>
        <button
          type="button"
          className={
            currentPage === 'rses' ? 'sidebar-link active' : 'sidebar-link'
          }
          aria-current={currentPage === 'rses' ? 'page' : undefined}
          onClick={() => onNavigate('rses')}
        >
          アンケート（開発用）
        </button>
      </div>
    </aside>
  )
}
