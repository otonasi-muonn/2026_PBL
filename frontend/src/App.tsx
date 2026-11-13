import { useState } from 'react'
import './App.css'
import type { Page } from './types'
import Sidebar from './components/Sidebar'
import TaskAddPage from './pages/TaskAddPage'
import TodayPage from './pages/TodayPage'
import WeekPage from './pages/WeekPage'
import CalendarPage from './pages/CalendarPage'
import MyPage from './pages/MyPage'
import RsesFormPage from './pages/RsesFormPage'

export default function App() {
  const [currentPage, setCurrentPage] = useState<Page>('today')

  const renderPage = () => {
    switch (currentPage) {
      case 'add':
        return <TaskAddPage />
      case 'today':
        return <TodayPage />
      case 'week':
        return <WeekPage />
      case 'calendar':
        return <CalendarPage />
      case 'me':
        return <MyPage />
      case 'rses':
        return <RsesFormPage />
    }
  }

  return (
    <div className="app">
      <Sidebar currentPage={currentPage} onNavigate={setCurrentPage} />
      <div className="app-main">{renderPage()}</div>
    </div>
  )
}
