export type Page = 'add' | 'today' | 'week' | 'calendar' | 'me' | 'rses'

// 注意: Task は API 仕様確定前の UI 開発用暫定型です（完成版のデータ構造としては扱わない）
export type Task = {
  id: string
  title: string
  deadline: string // '' = 未設定
  estimatedMinutes: number | null
  completed: boolean
}
