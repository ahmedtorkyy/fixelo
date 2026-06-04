import { useState, useEffect, useRef } from "react"
import { Download, ShieldOff, ArrowLeft, BookOpen, Loader2, CheckCircle2, ChevronRight } from "lucide-react"
import { Button } from "@/components/common/Button"
import { WarningBanner } from "@/components/common/WarningBanner"
import { CodeBlock } from "./CodeBlock"
import { NextSteps } from "./NextSteps"
import { VerifyResult } from "./VerifyResult"
import { TrustBanner } from "@/components/common/TrustBanner"
import type { FixResult } from "@/types/fix"
import { generateFixFilenameFromProblem, generateUndoFilenameFromFix } from "@/lib/batGenerator"
import { explainScript } from "@/lib/scriptGenerator"
import { showToast } from "@/components/common/Toast"

type FixStep = "download" | "verify" | "success"

interface FixResultDisplayProps {
  result: FixResult
  problemDescription: string
  onDownloadFix: () => void
  onDownloadUndo: () => void
  onNotFixed: (prefillLog?: string) => void
  onMarkResult?: (status: "success" | "failed") => void
  onStartOver: () => void
}

export function FixResultDisplay({
  result,
  problemDescription,
  onDownloadFix,
  onDownloadUndo,
  onNotFixed,
  onMarkResult,
  onStartOver,
}: FixResultDisplayProps) {
  const [step, setStep] = useState<FixStep>("download")
  const [downloaded, setDownloaded] = useState(false)
  const [explanation, setExplanation] = useState<string | null>(null)
  const [explaining, setExplaining] = useState(false)
  const headingRef = useRef<HTMLHeadingElement>(null)

  const fixFilename = generateFixFilenameFromProblem(problemDescription)
  const undoFilename = generateUndoFilenameFromFix(fixFilename)

  useEffect(() => {
    headingRef.current?.focus()
  }, [step])

  const handleExplain = async () => {
    if (explanation) { setExplanation(null); return }
    setExplaining(true)
    try {
      const text = await explainScript(result.fixScript)
      setExplanation(text)
    } catch {
      setExplanation("Could not generate explanation. Please try again.")
    } finally {
      setExplaining(false)
    }
  }

  const handleDownloadFix = () => {
    onDownloadFix()
    setDownloaded(true)
    showToast("Fix file downloaded!")
  }

  const handleDownloadUndo = () => {
    onDownloadUndo()
    showToast("Undo file downloaded!")
  }

  // --- SUCCESS SCREEN ---
  if (step === "success") {
    return (
      <div className="max-w-3xl mx-auto">
        <div className="text-center py-16 space-y-6">
          <div className="w-20 h-20 bg-green-600/20 rounded-full flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-10 h-10 text-green-400" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Fix Applied!</h1>
            <p className="text-surface-300 text-lg">
              Your fix ran successfully and the problem should be resolved.
            </p>
          </div>
          <p className="text-surface-400 text-sm">
            You can re-download the fix or its undo file anytime from My Fixes.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center pt-4">
            <Button variant="secondary" size="lg" onClick={onStartOver}>
              <ArrowLeft className="w-5 h-5" />
              Fix something else
            </Button>
          </div>
        </div>
      </div>
    )
  }

  // --- VERIFY SCREEN ---
  if (step === "verify") {
    return (
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <h1
            ref={headingRef}
            tabIndex={-1}
            className="text-2xl font-bold text-white outline-none"
          >
            Did it work?
          </h1>
          <button
            onClick={onStartOver}
            className="flex items-center gap-1.5 text-sm text-surface-400 hover:text-white transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            Start over
          </button>
        </div>

        {/* Step indicator */}
        <div className="flex items-center gap-2 text-sm py-2">
          <span className="flex items-center gap-1.5 text-surface-500">
            <span className="w-5 h-5 rounded-full bg-brand-600/30 text-brand-400 text-xs flex items-center justify-center">&#10003;</span>
            Download
          </span>
          <span className="text-surface-600">→</span>
          <span className="flex items-center gap-1.5 text-brand-400 font-medium">
            <span className="w-5 h-5 rounded-full bg-brand-600 text-white text-xs flex items-center justify-center">2</span>
            Verify
          </span>
        </div>

        <p className="text-surface-300 leading-relaxed">
          After running the fix, paste the log it copied to your clipboard and we'll confirm it
          worked — or just tell us below.
        </p>

        <VerifyResult intendedAction={problemDescription} defaultOpen />

        <div className="bg-surface-900 border border-surface-800 rounded-2xl p-6">
          <h2 className="text-lg font-semibold text-white mb-1">Quick answer</h2>
          <p className="text-sm text-surface-400 mb-4">
            No log handy? No problem — just let us know how it went.
          </p>
          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              variant="secondary"
              size="md"
              className="flex-1"
              onClick={() => { onMarkResult?.("success"); setStep("success") }}
            >
              <CheckCircle2 className="w-4 h-4" />
              Yes, it worked
            </Button>
            <Button
              variant="primary"
              size="md"
              className="flex-1"
              onClick={() => { onMarkResult?.("failed"); onNotFixed() }}
            >
              No — get a smarter fix
            </Button>
          </div>
        </div>

        <button
          onClick={() => setStep("download")}
          className="flex items-center gap-1.5 text-sm text-surface-400 hover:text-white transition-colors cursor-pointer mx-auto"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to fix details
        </button>
      </div>
    )
  }

  // --- DOWNLOAD SCREEN (default) ---
  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between card-enter" style={{ animationDelay: "0ms" }}>
        <h1
          ref={headingRef}
          tabIndex={-1}
          className="text-2xl font-bold text-white outline-none flex items-center gap-2"
        >
          <CheckCircle2 aria-hidden="true" className="w-6 h-6 text-green-400 shrink-0" />
          Your Fix Is Ready
        </h1>
        <button
          onClick={onStartOver}
          className="flex items-center gap-1.5 text-sm text-surface-400 hover:text-white transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          Start over
        </button>
      </div>

      {/* Step indicator */}
      <div className="flex items-center gap-2 text-sm py-2 card-enter" style={{ animationDelay: "30ms" }}>
        <span className="flex items-center gap-1.5 text-brand-400 font-medium">
          <span className="w-5 h-5 rounded-full bg-brand-600 text-white text-xs flex items-center justify-center">1</span>
          Download
        </span>
        <span className="text-surface-600">→</span>
        <span className="flex items-center gap-1.5 text-surface-500">
          <span className="w-5 h-5 rounded-full bg-surface-800 text-surface-400 text-xs flex items-center justify-center">2</span>
          Verify
        </span>
      </div>

      <div className="bg-surface-900 border border-surface-800 rounded-2xl p-6 space-y-4 card-enter" style={{ animationDelay: "60ms" }}>
        <h3 className="text-lg font-semibold text-white">Problem Summary</h3>
        <p className="text-surface-300 leading-relaxed">{result.problemSummary}</p>
      </div>

      <div className="bg-surface-900 border border-surface-800 rounded-2xl p-6 space-y-4 card-enter" style={{ animationDelay: "120ms" }}>
        <h3 className="text-lg font-semibold text-white">What This Fix Will Do</h3>
        <p className="text-surface-300 leading-relaxed">{result.whatItDoes}</p>
      </div>

      <div className="bg-green-950/30 border border-green-800/40 rounded-2xl p-6 space-y-4 card-enter" style={{ animationDelay: "180ms" }}>
        <h3 className="text-lg font-semibold text-green-300 flex items-center gap-2">
          <ShieldOff className="w-5 h-5" />
          What This Fix Does NOT Touch
        </h3>
        <p className="text-green-200/70 leading-relaxed">{result.whatItDoesNotTouch}</p>
      </div>

      {result.scriptSafetyNotes && (
        <div className="bg-amber-950/30 border border-amber-800/40 rounded-2xl p-6 space-y-3">
          <h3 className="text-lg font-semibold text-amber-300">Important Notes</h3>
          <p className="text-amber-200/70 leading-relaxed">{result.scriptSafetyNotes}</p>
        </div>
      )}

      <CodeBlock title="See What This Fix Does (advanced)" code={result.fixScript} />

      {/* Explain this script */}
      <div className="bg-surface-900/50 border border-surface-800 rounded-xl p-4">
        <button
          onClick={handleExplain}
          disabled={explaining}
          aria-expanded={explanation !== null}
          className="flex items-center gap-2 text-sm text-brand-400 hover:text-brand-300 transition-colors cursor-pointer disabled:opacity-50"
        >
          {explaining
            ? <Loader2 className="w-4 h-4 animate-spin" />
            : <BookOpen className="w-4 h-4" />
          }
          {explaining ? "Generating explanation..." : explanation ? "Hide explanation" : "Explain this script to me in plain English"}
        </button>
        {explanation && (
          <div className="mt-4 pt-4 border-t border-surface-800">
            <p className="text-surface-300 text-sm leading-relaxed whitespace-pre-wrap">{explanation}</p>
          </div>
        )}
      </div>

      <div className="space-y-3 pt-2">
        <Button size="lg" className="w-full" onClick={handleDownloadFix}>
          <Download className="w-5 h-5" />
          Download {fixFilename}
        </Button>

        {downloaded && (
          <Button variant="secondary" size="md" className="w-full" onClick={handleDownloadUndo}>
            <ShieldOff className="w-4 h-4" />
            Download {undoFilename} (undo)
          </Button>
        )}
      </div>

      <WarningBanner>
        <strong>Windows may show a permission popup (UAC) when you run the file.</strong> This is normal — the script
        needs admin access to fix system problems. Click "Yes" to allow it.
      </WarningBanner>

      <TrustBanner />

      <NextSteps />

      <div className="pt-2">
        <Button variant="primary" size="lg" className="w-full" onClick={() => setStep("verify")}>
          I've run the script — did it work?
          <ChevronRight className="w-5 h-5" />
        </Button>
      </div>
    </div>
  )
}