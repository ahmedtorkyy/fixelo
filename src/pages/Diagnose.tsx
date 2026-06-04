import { useState, useRef } from "react"
import { Download, ClipboardPaste, ArrowLeft, Wrench, Wand2 } from "lucide-react"
import { Button } from "@/components/common/Button"
import { LoadingSpinner } from "@/components/common/LoadingSpinner"
import { ErrorMessage } from "@/components/common/ErrorMessage"
import { WarningBanner } from "@/components/common/WarningBanner"
import { HealthCardComponent } from "@/components/diagnose/HealthCard"
import { FixFromDiagnosis } from "@/components/diagnose/FixFromDiagnosis"
import { BatchFix } from "@/components/diagnose/BatchFix"
import { CHECK_MY_PC_SCRIPT } from "@/lib/diagnosticScript"
import { downloadBatFile } from "@/lib/batGenerator"
import { generateDiagnosisReport } from "@/lib/scriptGenerator"
import type { BatchIssue } from "@/lib/prompts/batchFixPrompt"
import type { DiagnosisReport } from "@/types/fix"

type DiagnoseStep = "main" | "loading" | "results" | "fixing" | "batch-fixing"

export default function DiagnosePage() {
  const [step, setStep] = useState<DiagnoseStep>("main")
  const [report, setReport] = useState("")
  const [diagnosis, setDiagnosis] = useState<DiagnosisReport | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [fixPrompt, setFixPrompt] = useState<string | null>(null)
  const [selected, setSelected] = useState<Set<number>>(new Set())
  const [batchIssues, setBatchIssues] = useState<BatchIssue[]>([])

  const handleDownloadScript = () => {
    downloadBatFile(CHECK_MY_PC_SCRIPT, "CheckMyPC.bat")
  }

  const reportRef = useRef<HTMLTextAreaElement>(null)

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText()
      if (text && text.trim()) {
        setReport(text)
        return
      }
    } catch {
      // Browser blocked programmatic paste — fall through to manual paste.
    }
    reportRef.current?.focus()
  }

  const handleSubmit = async () => {
    if (!report.trim()) return
    setStep("loading")
    setError(null)
    try {
      const result = await generateDiagnosisReport(report.trim())
      setDiagnosis(result)
      // Pre-select all critical (red) issues that can be fixed.
      const initial = new Set<number>()
      result.cards.forEach((c, i) => {
        if (c.fixAvailable && c.status === "red") initial.add(i)
      })
      setSelected(initial)
      setStep("results")
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to analyze report. Please try again."
      setError(message)
      setStep("main")
    }
  }

  const toggleSelected = (index: number) => {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(index)) next.delete(index)
      else next.add(index)
      return next
    })
  }

  const handleFixThis = (prompt: string) => {
    setFixPrompt(prompt)
    setStep("fixing")
  }

  const handleGenerateSelected = () => {
    if (!diagnosis) return
    const issues: BatchIssue[] = diagnosis.cards
      .map((c, i) => ({ c, i }))
      .filter(({ c, i }) => selected.has(i) && c.fixAvailable)
      .map(({ c }) => ({ title: c.title, fixPrompt: c.fixPrompt }))
    if (issues.length === 0) return
    setBatchIssues(issues)
    setStep("batch-fixing")
  }

  const handleBackToResults = () => {
    setFixPrompt(null)
    setStep("results")
  }

  if (step === "fixing" && fixPrompt) {
    return (
      <div className="max-w-3xl mx-auto py-12 px-4 sm:px-6">
        <FixFromDiagnosis problem={fixPrompt} onBack={handleBackToResults} />
      </div>
    )
  }

  if (step === "batch-fixing") {
    return (
      <div className="max-w-3xl mx-auto py-12 px-4 sm:px-6">
        <BatchFix issues={batchIssues} onBack={handleBackToResults} />
      </div>
    )
  }

  if (step === "loading") {
    return (
      <div className="max-w-3xl mx-auto py-12 px-4 sm:px-6">
        <LoadingSpinner message="Analyzing your PC diagnostic report..." />
      </div>
    )
  }

  if (step === "results" && diagnosis) {
    const fixableCount = diagnosis.cards.filter((c) => c.fixAvailable).length
    const selectedCount = diagnosis.cards.filter((c, i) => c.fixAvailable && selected.has(i)).length
    const tooMany = selectedCount > 6

    return (
      <div className={`max-w-4xl mx-auto py-12 px-4 sm:px-6 ${fixableCount > 0 ? "pb-32" : ""}`}>
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl font-bold text-white">PC Health Report</h1>
          <button
            onClick={() => { setStep("main"); setDiagnosis(null); setReport(""); setSelected(new Set()); }}
            className="flex items-center gap-1.5 text-sm text-surface-400 hover:text-white transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            New diagnosis
          </button>
        </div>

        <div className="bg-surface-900 border border-surface-800 rounded-2xl p-6 mb-6">
          <p className="text-surface-300 leading-relaxed">{diagnosis.summary}</p>
        </div>

        {fixableCount > 0 && (
          <p className="text-sm text-surface-300 mb-4">
            Tick the problems you want fixed, then generate one combined fix for all of them — or use “Fix just this one”
            on any single card.
          </p>
        )}

        <ul className="space-y-4 list-none p-0 m-0">
          {diagnosis.cards.map((card, i) => (
            <li key={i}>
              <HealthCardComponent
                card={card}
                onFix={handleFixThis}
                selectable
                selected={selected.has(i)}
                onToggleSelect={() => toggleSelected(i)}
              />
            </li>
          ))}
        </ul>

        {fixableCount > 0 && (
          <div className="fixed bottom-0 inset-x-0 z-40 border-t border-surface-800 bg-surface-950/90 backdrop-blur-md">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <p role="status" aria-live="polite" className="text-sm text-surface-300">
                <span className="font-semibold text-white">{selectedCount}</span> of {fixableCount} fixable{" "}
                {fixableCount === 1 ? "issue" : "issues"} selected
                {tooMany && (
                  <span className="block text-amber-300 text-xs mt-1">
                    That’s a lot at once — consider fixing in two smaller batches for a cleaner script.
                  </span>
                )}
              </p>
              <Button
                size="lg"
                disabled={selectedCount === 0}
                onClick={handleGenerateSelected}
                className="sm:w-auto"
              >
                <Wand2 className="w-5 h-5" />
                Generate one fix for {selectedCount} selected
              </Button>
            </div>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto py-12 px-4 sm:px-6 space-y-8">
      <div className="text-center">
        <h1 className="text-3xl sm:text-4xl font-bold text-white mb-4">Diagnose My PC</h1>
        <p className="text-surface-400 text-lg max-w-xl mx-auto">
          Don't know what's wrong? Download our diagnostic tool, run it, and paste the results for a clear health check.
        </p>
      </div>

      {/* Step 1 — Download */}
      <section aria-labelledby="step1-heading">
        <div className="bg-surface-900 border border-surface-800 rounded-2xl p-6 space-y-4">
          <h2 id="step1-heading" className="text-lg font-semibold text-white">Step 1 — Download and Run the Scanner</h2>
          <ol className="space-y-2 text-surface-300 text-sm list-decimal list-inside">
            <li>Click Download CheckMyPC below to get the scanner file</li>
            <li>Double-click the downloaded file to run it — it will ask for admin permission, click Yes</li>
            <li>Wait about 15 seconds — it scans your system and copies the report to your clipboard</li>
            <li>The report is also saved to your Desktop as Fixelo_Log.txt</li>
          </ol>
          <Button size="lg" className="w-full" onClick={handleDownloadScript}>
            <Download className="w-5 h-5" />
            Download CheckMyPC.bat
          </Button>
          <WarningBanner>
            This script only reads system information. It does not make any changes to your PC.
          </WarningBanner>
        </div>
      </section>

      {/* Step 2 — Paste */}
      <section aria-labelledby="step2-heading">
        <div className="space-y-4">
          <div className="bg-surface-900 border border-surface-800 rounded-2xl p-6">
            <h2 id="step2-heading" className="text-lg font-semibold text-white mb-2">Step 2 — Paste Your Report</h2>
            <p className="text-surface-400 text-sm">
              After running the scanner, paste the report below. Press Ctrl and V to paste, or use the Paste from Clipboard button.
            </p>
          </div>

          {error && <ErrorMessage message={error} onRetry={handleSubmit} />}

          <label htmlFor="report-textarea" className="sr-only">Diagnostic report</label>
          <textarea
            id="report-textarea"
            ref={reportRef}
            value={report}
            onChange={(e) => setReport(e.target.value)}
            placeholder="Paste your diagnostic report here..."
            rows={10}
            aria-label="Paste your diagnostic report here"
            className="w-full bg-surface-900 border border-surface-700 rounded-2xl px-5 py-4 text-white placeholder-surface-500 focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 resize-none text-sm font-mono transition-all"
          />

          <div className="flex gap-3">
            <Button variant="secondary" size="md" onClick={handlePaste}>
              <ClipboardPaste className="w-4 h-4" />
              Paste from Clipboard
            </Button>
            <Button size="md" className="flex-1" disabled={!report.trim()} onClick={handleSubmit}>
              <Wrench className="w-4 h-4" />
              Analyze Report
            </Button>
          </div>
        </div>
      </section>
    </div>
  )
}