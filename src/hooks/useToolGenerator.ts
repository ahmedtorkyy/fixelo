import { useState, useCallback } from "react"
import { useLocation } from "react-router"
import { generateToolScript } from "@/lib/scriptGenerator"
import { assembleToolScript } from "@/lib/cache/assembleToolScript"
import { downloadBatFile, generateFixFilename, generateUndoFilename } from "@/lib/batGenerator"
import { addHistoryEntry, generateId } from "@/types/history"
import type { FixResult, HistoryEntry } from "@/types/fix"
import type { ToolConfig } from "@/lib/toolConfigs"

type ToolStep = "select" | "loading" | "result" | "error"

export function useToolGenerator(tool: ToolConfig) {
  const location = useLocation()
  const preselected = (location.state as { preselected?: string[] })?.preselected

  const [currentStep, setCurrentStep] = useState<ToolStep>("select")
  const [selectedOptions, setSelectedOptions] = useState<string[]>(
    preselected ?? tool.options.filter((o) => o.type !== "text" && o.type !== "time" && o.defaultValue).map((o) => o.id)
  )
  const [inputValues, setInputValues] = useState<Record<string, string>>(
    Object.fromEntries(
      tool.options
        .filter((o) => o.type === "text" || o.type === "time")
        .map((o) => [o.id, o.inputDefaultValue ?? ""])
    )
  )
  const [result, setResult] = useState<FixResult | null>(null)
  const [error, setError] = useState<string | null>(null)

  const toggleOption = useCallback((optionId: string) => {
    setSelectedOptions((prev) =>
      prev.includes(optionId) ? prev.filter((id) => id !== optionId) : [...prev, optionId]
    )
  }, [])

  const setInputValue = useCallback((optionId: string, value: string) => {
    setInputValues((prev) => ({ ...prev, [optionId]: value }))
  }, [])

  const generate = useCallback(async () => {
    const hasSelections = selectedOptions.length > 0 || Object.values(inputValues).some((v) => v.trim())
    if (!hasSelections) return

    setCurrentStep("loading")
    setError(null)
    setResult(null)

    try {
      // Try cache first — no AI cost
      const cached = assembleToolScript(tool, selectedOptions)
      const fixResult = cached ?? await generateToolScript(tool, selectedOptions, inputValues)
      setResult(fixResult)
      setCurrentStep("result")

      const entry: HistoryEntry = {
        id: generateId(),
        timestamp: Date.now(),
        problemDescription: `${tool.title}: ${selectedOptions.map((id) => tool.options.find((o) => o.id === id)?.label).join(", ")}`,
        fixResult,
        status: "unknown",
      }
      addHistoryEntry(entry)
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Something went wrong. Please try again."
      setError(message)
      setCurrentStep("error")
    }
  }, [tool, selectedOptions, inputValues])

  const downloadFix = useCallback(() => {
    if (!result) return
    const filename = generateFixFilename(tool.title)
    downloadBatFile(result.fixScript, filename)
  }, [result, tool.title])

  const downloadUndo = useCallback(() => {
    if (!result) return
    const fixFilename = generateFixFilename(tool.title)
    const undoFilename = generateUndoFilename(fixFilename)
    downloadBatFile(result.undoScript, undoFilename)
  }, [result, tool.title])

  const reset = useCallback(() => {
    setCurrentStep("select")
    setResult(null)
    setError(null)
    setSelectedOptions(tool.options.filter((o) => o.type !== "text" && o.type !== "time" && o.defaultValue).map((o) => o.id))
    setInputValues(
      Object.fromEntries(
        tool.options
          .filter((o) => o.type === "text" || o.type === "time")
          .map((o) => [o.id, o.inputDefaultValue ?? ""])
      )
    )
  }, [tool])

  return {
    currentStep,
    selectedOptions,
    inputValues,
    result,
    error,
    toggleOption,
    setInputValue,
    generate,
    downloadFix,
    downloadUndo,
    reset,
  }
}
