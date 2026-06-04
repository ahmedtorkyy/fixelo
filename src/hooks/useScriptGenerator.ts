import { useState, useCallback, useRef } from "react"
import { useGemini } from "./useGemini"
import { routeProblem } from "@/lib/router/intentRouter"
import { getToolConfig } from "@/lib/toolConfigs"
import { downloadBatFile, generateFixFilenameFromProblem, generateUndoFilenameFromFix } from "@/lib/batGenerator"
import { addHistoryEntry, updateHistoryStatus, generateId } from "@/types/history"
import type { FixResult, HistoryEntry, FixFlowStep } from "@/types/fix"

interface ToolSuggestionItem {
  slug: string
  title: string
  description: string
  confidence: number
}

export function useScriptGenerator() {
  const {
    fixResult,
    diagnosisResult,
    loading,
    error,
    generateScript,
    generateDiagnosisFromLog,
    setResult,
    reset: resetGemini,
  } = useGemini()

  const [currentStep, setCurrentStep] = useState<FixFlowStep>("input")
  const [originalProblem, setOriginalProblem] = useState("")
  const [prefilledLog, setPrefilledLog] = useState("")
  const [suggestions, setSuggestions] = useState<ToolSuggestionItem[]>([])
  const lastHistoryIdRef = useRef<string | null>(null)

  const runAi = useCallback(
    async (problemDescription: string) => {
      setCurrentStep("loading")
      const result = await generateScript(problemDescription)
      if (result) {
        // Empty fixScript = AI says "not a Windows problem"
        if (!result.fixScript) {
          setCurrentStep("not-windows")
          return result
        }
        setCurrentStep("result")
        const id = generateId()
        lastHistoryIdRef.current = id
        const entry: HistoryEntry = {
          id,
          timestamp: Date.now(),
          problemDescription,
          fixResult: result,
          status: "unknown",
        }
        addHistoryEntry(entry)
      } else {
        setCurrentStep("input")
      }
      return result
    },
    [generateScript]
  )

  const generateFix = useCallback(
    async (problemDescription: string) => {
      setOriginalProblem(problemDescription)

      // Route: cached → tool suggestion → AI
      const route = routeProblem(problemDescription)
      if (route.type === "cached" && route.fixResult) {
        setCurrentStep("result")
        setResult(route.fixResult)
        const id = generateId()
        lastHistoryIdRef.current = id
        const entry: HistoryEntry = {
          id,
          timestamp: Date.now(),
          problemDescription,
          fixResult: route.fixResult,
          status: "unknown",
        }
        addHistoryEntry(entry)
        return route.fixResult
      }

      if (route.type === "tool-suggestion" && route.toolSuggestions) {
        const items: ToolSuggestionItem[] = route.toolSuggestions
          .map((s) => {
            const cfg = getToolConfig(s.slug)
            if (!cfg) return null
            return { slug: s.slug, title: cfg.title, description: cfg.description, confidence: s.confidence }
          })
          .filter((s): s is ToolSuggestionItem => s !== null)
        if (items.length > 0) {
          setSuggestions(items)
          setCurrentStep("suggestion")
          return null
        }
      }

      // Fall back to AI
      return runAi(problemDescription)
    },
    [runAi]
  )

  // Force AI generation, skipping the router (used by "generate a custom fix instead")
  const generateCustom = useCallback(
    async (problemDescription: string) => {
      setOriginalProblem(problemDescription)
      return runAi(problemDescription)
    },
    [runAi]
  )

  const downloadFix = useCallback(
    (result?: FixResult) => {
      const fix = result || fixResult
      if (!fix) return
      const filename = generateFixFilenameFromProblem(originalProblem)
      downloadBatFile(fix.fixScript, filename)
    },
    [fixResult, originalProblem]
  )

  const downloadUndo = useCallback(
    (result?: FixResult) => {
      const fix = result || fixResult
      if (!fix) return
      const fixFilename = generateFixFilenameFromProblem(originalProblem)
      const undoFilename = generateUndoFilenameFromFix(fixFilename)
      downloadBatFile(fix.undoScript, undoFilename)
    },
    [fixResult, originalProblem]
  )

  const downloadDiagnosisFix = useCallback(() => {
    if (!diagnosisResult) return
    const filename = generateFixFilenameFromProblem(originalProblem).replace(".bat", "_v2.bat")
    downloadBatFile(diagnosisResult.nextFixScript, filename)
  }, [diagnosisResult, originalProblem])

  const downloadDiagnosisUndo = useCallback(() => {
    if (!diagnosisResult) return
    const filename = generateFixFilenameFromProblem(originalProblem).replace(".bat", "_Fix_v2.bat")
    downloadBatFile(diagnosisResult.nextUndoScript, `Undo${filename}`)
  }, [diagnosisResult, originalProblem])

  const markCurrentFix = useCallback((status: "success" | "failed") => {
    if (lastHistoryIdRef.current) updateHistoryStatus(lastHistoryIdRef.current, status)
  }, [])

  const startFailureFlow = useCallback((prefill = "") => {
    markCurrentFix("failed")
    setPrefilledLog(prefill)
    setCurrentStep("failure-input")
  }, [markCurrentFix])

  const submitFailure = useCallback(
    async (userDescription: string, logContent: string) => {
      setCurrentStep("diagnosis-loading")
      const result = await generateDiagnosisFromLog(
        userDescription,
        logContent,
        originalProblem,
        fixResult?.whatItDoes ?? "",
        fixResult?.fixScript ?? ""
      )
      if (result) {
        setCurrentStep("diagnosis-result")
      } else {
        setCurrentStep("failure-input")
      }
      return result
    },
    [generateDiagnosisFromLog, originalProblem, fixResult]
  )

  const reset = useCallback(() => {
    resetGemini()
    setCurrentStep("input")
    setOriginalProblem("")
    setSuggestions([])
  }, [resetGemini])

  return {
    currentStep,
    originalProblem,
    fixResult,
    diagnosisResult,
    prefilledLog,
    suggestions,
    loading,
    error,
    generateFix,
    generateCustom,
    downloadFix,
    downloadUndo,
    downloadDiagnosisFix,
    downloadDiagnosisUndo,
    startFailureFlow,
    markCurrentFix,
    submitFailure,
    reset,
  }
}
