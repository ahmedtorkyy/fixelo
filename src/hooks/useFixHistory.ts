import { useState, useCallback } from "react"
import { getHistory, clearHistory as clearHistoryFn } from "@/types/history"
import type { HistoryEntry } from "@/types/fix"

export function useFixHistory() {
  const [history, setHistory] = useState<HistoryEntry[]>(() => getHistory())

  const refresh = useCallback(() => {
    setHistory(getHistory())
  }, [])

  const clearAll = useCallback(() => {
    clearHistoryFn()
    setHistory([])
  }, [])

  return { history, refresh, clearAll }
}