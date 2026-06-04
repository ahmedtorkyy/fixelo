import { useState, useRef } from "react"
import { ClipboardPaste, AlertCircle, ArrowLeft, MessageSquareText, RefreshCw, CheckCircle2 } from "lucide-react"
import { Button } from "@/components/common/Button"
import { CodeBlock } from "./CodeBlock"
import { WarningBanner } from "@/components/common/WarningBanner"
import { showToast } from "@/components/common/Toast"
import type { DiagnosisResult } from "@/types/fix"

interface FailureRecoveryProps {
  onSubmitFailure: (description: string, log: string) => void
  loading: boolean
  diagnosisResult: DiagnosisResult | null
  onDownloadFix?: () => void
  onDownloadUndo?: () => void
  onStartOver: () => void
  initialLog?: string
  onEscalate?: () => void
}

export function FailureRecovery({
  onSubmitFailure,
  loading,
  diagnosisResult,
  onDownloadFix,
  onDownloadUndo,
  onStartOver,
  initialLog = "",
  onEscalate,
}: FailureRecoveryProps) {
  const [description, setDescription] = useState("")
  const [log, setLog] = useState(initialLog)

  const canSubmit = (description.trim() || log.trim()) && !loading

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (canSubmit) {
      onSubmitFailure(description.trim(), log.trim())
    }
  }

  const logRef = useRef<HTMLTextAreaElement>(null)

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText()
      if (text && text.trim()) {
        setLog(text)
        showToast("Log pasted from clipboard!")
        return
      }
      showToast("Your clipboard looks empty. Run the fix first, then try again.", "error")
    } catch {
      logRef.current?.focus()
      showToast("Press Ctrl and V now to paste your log into the box.", "error")
    }
  }

  if (diagnosisResult) {
    if (diagnosisResult.status === "resolved") {
      return (
        <div className="max-w-3xl mx-auto space-y-6">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-white flex items-center gap-2">
              <CheckCircle2 aria-hidden="true" className="w-6 h-6 text-green-400 shrink-0" />
              Looks Fixed!
            </h1>
            <button
              onClick={onStartOver}
              className="flex items-center gap-1.5 text-sm text-surface-400 hover:text-white transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              Start over
            </button>
          </div>

          <div className="bg-green-950/30 border border-green-800/40 rounded-2xl p-6">
            <h2 className="text-lg font-semibold text-green-300 mb-2">Good news</h2>
            <p className="text-green-100/80 leading-relaxed">{diagnosisResult.whatSucceeded}</p>
          </div>

          <p className="text-surface-300 text-sm">
            Your log shows this is already resolved, so you don't need another fix. If the problem is still happening in
            real life, you can dig deeper with Fixie.
          </p>

          <div className="flex flex-col sm:flex-row gap-3">
            <Button variant="secondary" size="md" onClick={onStartOver}>Fix something else</Button>
            {onEscalate && (
              <Button size="md" onClick={onEscalate}>It's still happening — continue with Fixie</Button>
            )}
          </div>
        </div>
      )
    }

    return (
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-white">Diagnosis</h1>
          <button
            onClick={onStartOver}
            className="flex items-center gap-1.5 text-sm text-surface-400 hover:text-white transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            Start over
          </button>
        </div>

        {diagnosisResult.retryStrategy && (
          <div className="bg-brand-600/10 border border-brand-500/30 rounded-2xl p-5 flex items-start gap-3">
            <RefreshCw aria-hidden="true" className="w-5 h-5 text-brand-300 mt-0.5 shrink-0" />
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-brand-300 mb-1">Our new approach</p>
              <p className="text-brand-100 leading-relaxed">{diagnosisResult.retryStrategy}</p>
            </div>
          </div>
        )}

        <div className="bg-surface-900 border border-surface-800 rounded-2xl p-6">
          <h3 className="text-lg font-semibold text-white mb-3">What Succeeded</h3>
          <p className="text-surface-300 leading-relaxed">{diagnosisResult.whatSucceeded}</p>
        </div>

        <div className="bg-red-950/30 border border-red-800/40 rounded-2xl p-6">
          <h3 className="text-lg font-semibold text-red-300 mb-3 flex items-center gap-2">
            <AlertCircle className="w-5 h-5" />
            What Failed
          </h3>
          <p className="text-red-200/70 leading-relaxed">{diagnosisResult.whatFailed}</p>
        </div>

        <div className="bg-amber-950/30 border border-amber-800/40 rounded-2xl p-6">
          <h3 className="text-lg font-semibold text-amber-300 mb-3">Why It Failed</h3>
          <p className="text-amber-200/70 leading-relaxed">{diagnosisResult.whyItFailed}</p>
        </div>

        <div className="bg-brand-950/30 border border-brand-800/40 rounded-2xl p-6">
          <h3 className="text-lg font-semibold text-brand-300 mb-3">What the New Fix Does Differently</h3>
          <p className="text-brand-200/70 leading-relaxed">{diagnosisResult.whatNextFixDoesDifferently}</p>
        </div>

        {diagnosisResult.nextFixScript && (
          <CodeBlock title="See What the New Fix Does (advanced)" code={diagnosisResult.nextFixScript} />
        )}

        {diagnosisResult.nextScriptSafetyNotes && (
          <div className="bg-amber-950/30 border border-amber-800/40 rounded-2xl p-6">
            <h3 className="text-lg font-semibold text-amber-300">Important Notes</h3>
            <p className="text-amber-200/70 leading-relaxed mt-2">{diagnosisResult.nextScriptSafetyNotes}</p>
          </div>
        )}

        <div className="space-y-3 pt-2">
          {onDownloadFix && (
            <Button size="lg" className="w-full" onClick={onDownloadFix}>
              Download Targeted Fix (v2)
            </Button>
          )}
          {onDownloadUndo && (
            <Button variant="secondary" size="md" className="w-full" onClick={onDownloadUndo}>
              Download Undo (v2)
            </Button>
          )}
        </div>

        <WarningBanner>
          This is a targeted fix based on the specific failure point in your log. It addresses what went wrong with
          the first attempt.
        </WarningBanner>

        {onEscalate && (
          <div className="bg-surface-900 border border-surface-800 rounded-2xl p-6">
            <h2 className="text-lg font-semibold text-white mb-1">Still not fixed after this?</h2>
            <p className="text-sm text-surface-300 mb-4">
              Two automatic fixes haven't solved it, so this one needs a closer look. Switch to Fixie, your AI agent —
              it can ask questions, go back and forth, and dig deeper than a one-shot script. We'll bring everything
              we already tried along with you.
            </p>
            <Button size="md" onClick={onEscalate}>Continue with Fixie, the AI agent</Button>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">Let's get this fixed</h1>
        <button
          onClick={onStartOver}
          className="flex items-center gap-1.5 text-sm text-surface-400 hover:text-white transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          Start over
        </button>
      </div>

      <p className="text-surface-300">
        The first fix didn't do it — no problem. Tell us what happened and we'll build a smarter, more targeted fix.
        Fill in either box below (or both). The more you tell us, the better the next fix.
      </p>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Plain-English box — the easy, primary path */}
        <div className="bg-surface-900 border border-surface-800 rounded-2xl p-6 space-y-3">
          <div className="flex items-center gap-2">
            <MessageSquareText aria-hidden="true" className="w-5 h-5 text-brand-400 shrink-0" />
            <h2 className="text-lg font-semibold text-white">Tell us what happened</h2>
          </div>
          <p className="text-surface-300 text-sm">
            In your own words: Did the file run? Did you see an error message? What is your PC still doing wrong?
          </p>
          <label htmlFor="what-happened" className="sr-only">Describe what happened when you ran the fix</label>
          <textarea
            id="what-happened"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Example: I double-clicked the file, clicked Yes, the black window flashed and closed, but my wifi still drops every few minutes."
            rows={5}
            className="w-full bg-surface-950 border border-surface-700 rounded-xl px-4 py-3 text-white placeholder-surface-500 focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 resize-none text-base transition-all"
            disabled={loading}
          />
        </div>

        {/* Log box — clearly visible, explained, no longer hidden */}
        <div className="bg-surface-900 border border-surface-800 rounded-2xl p-6 space-y-3">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <h2 className="text-lg font-semibold text-white">Paste the fix log</h2>
            <span className="text-xs font-medium text-green-300 bg-green-950/40 border border-green-800/40 px-2.5 py-0.5 rounded-full">
              Recommended — most accurate
            </span>
          </div>
          <p className="text-surface-300 text-sm">
            When the fix finished running, it automatically copied a detailed log to your clipboard. Paste it here and
            our AI can pinpoint exactly what went wrong. Press{" "}
            <kbd className="px-1.5 py-0.5 bg-surface-800 rounded text-xs font-mono text-surface-200">Ctrl</kbd>
            {" "}+{" "}
            <kbd className="px-1.5 py-0.5 bg-surface-800 rounded text-xs font-mono text-surface-200">V</kbd>
            {" "}or use the button below. If you don't have it, just use the box above.
          </p>
          <label htmlFor="fix-log" className="sr-only">Paste the fix log from your clipboard</label>
          <textarea
            id="fix-log"
            ref={logRef}
            value={log}
            onChange={(e) => setLog(e.target.value)}
            placeholder="Paste your log here (Ctrl+V)..."
            rows={7}
            className="w-full bg-surface-950 border border-surface-700 rounded-xl px-4 py-3 text-white placeholder-surface-500 focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 resize-none text-sm font-mono transition-all"
            disabled={loading}
          />
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={handlePaste}
            disabled={loading}
          >
            <ClipboardPaste className="w-4 h-4" />
            Paste from clipboard
          </Button>
        </div>

        <Button
          type="submit"
          size="lg"
          disabled={!canSubmit}
          className="w-full"
        >
          {loading ? "Building your smarter fix..." : "Get My Smarter Fix"}
        </Button>
        {!canSubmit && !loading && (
          <p className="text-sm text-surface-400 text-center">
            Add a short description or paste your log to continue.
          </p>
        )}
      </form>
    </div>
  )
}