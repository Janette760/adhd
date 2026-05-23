import { useState } from 'react'
import { BottomNav } from './components/BottomNav'
import { LaunchPage } from './pages/LaunchPage'
import { VinePage } from './pages/VinePage'
import { AchievementPage } from './pages/AchievementPage'
import { SettingsPage } from './pages/SettingsPage'

export type Tab = 'launch' | 'vine' | 'achievement' | 'settings'

export interface QuickTask {
  content: string
  estimatedMinutes: number
  sessionId?: number
  taskIndex?: number
}

export default function App() {
  const [tab, setTab]         = useState<Tab>('launch')
  const [quickTask, setQuickTask] = useState<QuickTask | null>(null)
  const [vineKey, setVineKey] = useState(0)

  function handleTabChange(t: Tab) {
    if (t === 'vine') setVineKey(k => k + 1)
    setTab(t)
  }

  function handleQuickStart(task: QuickTask) {
    setQuickTask(task)
    setTab('launch')
  }

  function handleOrganized() {
    setVineKey(k => k + 1)
    setTab('vine')
  }

  function handleFocusDone() {
    setVineKey(k => k + 1)
    setTab('vine')
  }

  return (
    <div className="app">
      <div className="page-content">
        {tab === 'launch' && (
          <LaunchPage
            quickTask={quickTask}
            onQuickTaskConsumed={() => setQuickTask(null)}
            onOrganized={handleOrganized}
            onFocusDone={handleFocusDone}
          />
        )}
        {tab === 'vine' && <VinePage key={vineKey} onQuickStart={handleQuickStart} />}
        {tab === 'achievement' && <AchievementPage />}
        {tab === 'settings' && <SettingsPage />}
      </div>
      <BottomNav active={tab} onChange={handleTabChange} />
    </div>
  )
}
