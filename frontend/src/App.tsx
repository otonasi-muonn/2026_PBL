import { useState } from 'react'
import Sidebar, { type Page } from './components/Sidebar'
import TaskAddPage from './pages/TaskAddPage'
import TodayPage from './pages/TodayPage'

export default function App() {
  const [currentPage, setCurrentPage] = useState<Page>('today')

  const renderPage = () => {
    switch (currentPage) {
      case 'add':
        return <TaskAddPage />
      case 'today':
        return <TodayPage />
    }
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <Sidebar currentPage={currentPage} onNavigate={setCurrentPage} />

      <div style={{ flex: 1, minWidth: 0 }}>{renderPage()}</div>
    </div>
  )
}
