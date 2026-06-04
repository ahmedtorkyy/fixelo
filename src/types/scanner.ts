export interface ErrorTranslation {
  errorName: string
  plainExplanation: string
  commonCauses: string[]
  severity: "low" | "medium" | "high"
  canFix: boolean
  fixDescription: string
}

export interface ScriptOperation {
  action: string
  safe: boolean
}

export interface ScriptScanResult {
  whatItDoes: string
  operations: ScriptOperation[]
  dangerousItems: string[]
  safetyRating: number
  safetyLabel: "Safe" | "Use With Caution" | "Potentially Dangerous" | "Dangerous"
  recommendation: string
}
