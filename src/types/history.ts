import type { HistoryEntry } from "./fix"

const HISTORY_KEY = "fixelo_history"
const MAX_HISTORY_ENTRIES = 10

export function getHistory(): HistoryEntry[] {
  try {
    const raw = localStorage.getItem(HISTORY_KEY)
    if (!raw) return []
    return JSON.parse(raw) as HistoryEntry[]
  } catch {
    return []
  }
}

export function addHistoryEntry(entry: HistoryEntry): HistoryEntry[] {
  const history = getHistory()
  history.unshift(entry)
  const trimmed = history.slice(0, MAX_HISTORY_ENTRIES)
  localStorage.setItem(HISTORY_KEY, JSON.stringify(trimmed))
  return trimmed
}

export function updateHistoryStatus(id: string, status: HistoryEntry["status"]): void {
  const history = getHistory()
  const idx = history.findIndex((e) => e.id === id)
  if (idx >= 0) {
    history[idx] = { ...history[idx], status }
    localStorage.setItem(HISTORY_KEY, JSON.stringify(history))
  }
}

export function clearHistory(): void {
  localStorage.removeItem(HISTORY_KEY)
}

export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8)
}