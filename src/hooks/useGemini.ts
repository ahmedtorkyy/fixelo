import { useState, useCallback } from "react"
import { generateFix, generateBatchFix, generateDiagnosis } from "@/lib/scriptGenerator"
import type { BatchIssue } from "@/lib/prompts/batchFixPrompt"
import type { FixResult, DiagnosisResult } from "@/types/fix"

function friendlyErrorMessage(err: unknown, fallback: string): string {
  if (!(err instanceof Error)) return fallback

  const msg = err.message

  if (msg.includes("timed out")) return msg
  if (msg.includes("503") || msg.includes("UNAVAILABLE") || msg.includes("overloaded")) {
    return "The AI service is busy right now. Wait a few seconds and try again."
  }
  if (msg.includes("429") || msg.includes("RESOURCE_EXHAUSTED") || msg.includes("quota") || msg.includes("rate_limit")) {
    return "We've hit our daily limit. Please try again tomorrow."
  }
  if (msg.includes("API key") || msg.includes("401") || msg.includes("PERMISSION_DENIED") || msg.includes("invalid_api_key")) {
    return "There's a configuration issue. Please contact support."
  }
  if (msg.includes("Failed to parse")) return msg

  return fallback
}

export function useGemini() {
  const [fixResult, setFixResult] = useState<FixResult | null>(null)
  const [diagnosisResult, setDiagnosisResult] = useState<DiagnosisResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const generateScript = useCallback(async (problemDescription: string): Promise<FixResult | null> => {
    setLoading(true)
    setError(null)
    setFixResult(null)
    setDiagnosisResult(null)

    try {
      const result = await generateFix(problemDescription)
      setFixResult(result)
      return result
    } catch (err) {
      setError(friendlyErrorMessage(err, "Something went wrong. Please try again."))
      return null
    } finally {
      setLoading(false)
    }
  }, [])

  const generateBatchScript = useCallback(async (issues: BatchIssue[]): Promise<FixResult | null> => {
    setLoading(true)
    setError(null)
    setFixResult(null)
    setDiagnosisResult(null)

    try {
      const result = await generateBatchFix(issues)
      setFixResult(result)
      return result
    } catch (err) {
      setError(friendlyErrorMessage(err, "Something went wrong. Please try again."))
      return null
    } finally {
      setLoading(false)
    }
  }, [])

  const generateDiagnosisFromLog = useCallback(
    async (
      userDescription: string,
      logContent: string,
      originalProblem: string,
      originalFixSummary: string,
      originalFixScript: string
    ): Promise<DiagnosisResult | null> => {
      setLoading(true)
      setError(null)
      setDiagnosisResult(null)

      try {
        const result = await generateDiagnosis(userDescription, logContent, originalProblem, originalFixSummary, originalFixScript)
        setDiagnosisResult(result)
        return result
      } catch (err) {
        setError(friendlyErrorMessage(err, "Failed to analyze the log. Please try again."))
        return null
      } finally {
        setLoading(false)
      }
    },
    []
  )

  const setResult = useCallback((result: FixResult | null) => {
    setFixResult(result)
  }, [])

  const reset = useCallback(() => {
    setFixResult(null)
    setDiagnosisResult(null)
    setLoading(false)
    setError(null)
  }, [])

  return {
    fixResult,
    diagnosisResult,
    loading,
    error,
    generateScript,
    generateBatchScript,
    generateDiagnosisFromLog,
    setResult,
    reset,
  }
}