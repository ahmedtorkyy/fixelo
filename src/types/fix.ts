export interface FixResult {
  problemSummary: string
  whatItDoes: string
  whatItDoesNotTouch: string
  fixScript: string
  undoScript: string
  scriptSafetyNotes: string
}

export interface DiagnosisResult {
  status: "resolved" | "needs-fix"
  retryStrategy: string
  whatSucceeded: string
  whatFailed: string
  whyItFailed: string
  whatNextFixDoesDifferently: string
  nextFixScript: string
  nextUndoScript: string
  nextScriptSafetyNotes: string
}

export interface HealthCard {
  category: string
  status: "green" | "yellow" | "red"
  title: string
  description: string
  recommendation: string
  fixAvailable: boolean
  fixPrompt: string
}

export interface DiagnosisReport {
  summary: string
  cards: HealthCard[]
}

export interface HistoryEntry {
  id: string
  timestamp: number
  problemDescription: string
  fixResult: FixResult
  status: "success" | "failed" | "unknown"
}

export type FixFlowStep =
  | "input"
  | "loading"
  | "result"
  | "suggestion"
  | "failure-input"
  | "diagnosis-loading"
  | "diagnosis-result"

export interface VerifyResult {
  verified: boolean
  summary: string
  details: string
}
