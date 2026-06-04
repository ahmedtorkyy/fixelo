import { useState, useEffect, useRef } from "react"
import { ArrowLeft, Download, ShieldOff, CheckCircle2, ChevronRight } from "lucide-react"
import { useNavigate } from "react-router"
import { Button } from "@/components/common/Button"
import { WarningBanner } from "@/components/common/WarningBanner"
import { TrustBanner } from "@/components/common/TrustBanner"
import { CodeBlock } from "@/components/fix/CodeBlock"
import { VerifyResult } from "@/components/fix/VerifyResult"
import { LoadingSpinner } from "@/components/common/LoadingSpinner"
import { ErrorMessage } from "@/components/common/ErrorMessage"
import { useGemini } from "@/hooks/useGemini"
import { downloadBatFile } from "@/lib/batGenerator"
import { showToast } from "@/components/common/Toast"
import type { BatchIssue } from "@/lib/prompts/batchFixPrompt"

type BatchFixStep = "download" | "verify" | "success"

interface BatchFixProps {
  issues: BatchIssue[]
  onBack: () => void
}

export function BatchFix({ issues, onBack }: BatchFixProps) {
  const { fixResult, error, generateBatchScript } = useGemini()
  const [downloaded, setDownloaded] = useState(false)
  const [step, setStep] = useState<BatchFixStep>("download")
  const navigate = useNavigate()

  const escalateToAgent = () => {
    const list = issues.map((it) => `- ${it.title}`).join("\n")
    const handoff = `I ran a PC health scan and Fixelo built a combined fix for these issues, but it didn't fully solve them. Can you help me dig deeper, step by step?\n\nIssues:\n${list}`
    navigate("/agent", { state: { handoff } })
  }

  const headingRef = useRef<HTMLHeadingElement>(null)
  const startedRef = useRef(false)

  useEffect(() => {
    if (startedRef.current) return
    startedRef.current = true
    generateBatchScript(issues)
  }, [generateBatchScript, issues])

  useEffect(() => {
    if (fixResult) headingRef.current?.focus()
  }, [fixResult])

  if (fixResult) {
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
                Your combined fix ran successfully and the problems should be resolved.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 justify-center pt-4">
              <Button variant="secondary" size="lg" onClick={onBack}>
                <ArrowLeft className="w-5 h-5" />
                Back to health report
              </Button>
            </div>
          </div>
        </div>
      )
    }

    const actionLabel = issues.map((it) => it.title).join(", ")

    // --- VERIFY SCREEN ---
    if (step === "verify") {
      return (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h1 ref={headingRef} tabIndex={-1} className="text-2xl font-bold text-white outline-none">
              Did it work?
            </h1>
            <button
              onClick={onBack}
              className="flex items-center gap-1.5 text-sm text-surface-400 hover:text-white transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to health report
            </button>
          </div>

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
            After running the combined fix, paste the log it copied to your clipboard and we'll confirm it worked — or just tell us below.
          </p>

          <VerifyResult intendedAction={actionLabel} defaultOpen />

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
                onClick={() => setStep("success")}
              >
                <CheckCircle2 className="w-4 h-4" />
                Yes, it worked
              </Button>
              <Button
                variant="primary"
                size="md"
                className="flex-1"
                onClick={escalateToAgent}
              >
                No — get help from Fixie
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

    // --- DOWNLOAD SCREEN ---
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 ref={headingRef} tabIndex={-1} className="text-2xl font-bold text-white outline-none">
            Your Combined Fix Is Ready
          </h1>
          <button
            onClick={onBack}
            className="flex items-center gap-1.5 text-sm text-surface-400 hover:text-white transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to health report
          </button>
        </div>

        {/* Step indicator */}
        <div className="flex items-center gap-2 text-sm py-2">
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

        <div className="bg-brand-600/10 border border-brand-500/30 rounded-2xl p-5">
          <p className="text-xs font-semibold uppercase tracking-wider text-brand-300 mb-2">
            Fixing {issues.length} {issues.length === 1 ? "issue" : "issues"} in one script
          </p>
          <ul className="list-disc list-inside text-brand-100 text-sm space-y-1">
            {issues.map((it) => (
              <li key={it.title}>{it.title}</li>
            ))}
          </ul>
        </div>

        <div className="bg-surface-900 border border-surface-800 rounded-2xl p-6">
          <h2 className="text-lg font-semibold text-white mb-2">Problem Summary</h2>
          <p className="text-surface-300 leading-relaxed">{fixResult.problemSummary}</p>
        </div>

        <div className="bg-surface-900 border border-surface-800 rounded-2xl p-6">
          <h2 className="text-lg font-semibold text-white mb-2">What This Fix Will Do</h2>
          <p className="text-surface-300 leading-relaxed whitespace-pre-wrap">{fixResult.whatItDoes}</p>
        </div>

        <div className="bg-green-950/30 border border-green-800/40 rounded-2xl p-6">
          <h2 className="text-lg font-semibold text-green-300 mb-2">What This Fix Does NOT Touch</h2>
          <p className="text-green-200/70 leading-relaxed">{fixResult.whatItDoesNotTouch}</p>
        </div>

        {fixResult.scriptSafetyNotes && (
          <div className="bg-amber-950/30 border border-amber-800/40 rounded-2xl p-6">
            <h2 className="text-lg font-semibold text-amber-300">Important Notes</h2>
            <p className="text-amber-200/70 leading-relaxed mt-2">{fixResult.scriptSafetyNotes}</p>
          </div>
        )}

        <CodeBlock title="See what this combined fix does (advanced)" code={fixResult.fixScript} />

        <div className="space-y-3 pt-2">
          {!downloaded ? (
            <Button
              size="lg"
              className="w-full"
              onClick={() => {
                downloadBatFile(fixResult.fixScript, "Fixelo_PC_Repair.bat")
                setDownloaded(true)
                showToast("Combined fix downloaded!")
              }}
            >
              <Download className="w-5 h-5" />
              Download Combined Fix
            </Button>
          ) : (
            <div className="space-y-3">
              <div className="bg-green-950/30 border border-green-800/40 rounded-xl p-3 text-center text-green-300 text-sm font-medium">
                Fix downloaded! Also download the undo file for safety.
              </div>
              <Button
                variant="secondary"
                size="md"
                className="w-full"
                onClick={() => { downloadBatFile(fixResult.undoScript, "Fixelo_PC_Repair_Undo.bat"); showToast("Undo file downloaded!") }}
              >
                <ShieldOff className="w-4 h-4" />
                Download Undo File
              </Button>
            </div>
          )}
        </div>

        <WarningBanner>
          Windows may show a permission popup (UAC) when you run the file. This is normal — the script needs admin
          access. Click "Yes" to allow it.
        </WarningBanner>

        <TrustBanner />

        <div className="pt-2">
          <Button variant="primary" size="lg" className="w-full" onClick={() => setStep("verify")}>
            I've run the script — did it work?
            <ChevronRight className="w-5 h-5" />
          </Button>
        </div>
      </div>
    )
  }

  // --- LOADING / ERROR ---
  return (
    <div className="space-y-6">
      <button
        onClick={onBack}
        className="flex items-center gap-1.5 text-sm text-surface-400 hover:text-white transition-colors cursor-pointer"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to health report
      </button>

      {error ? (
        <ErrorMessage message={error} onRetry={() => generateBatchScript(issues)} />
      ) : (
        <LoadingSpinner message={`Building one combined fix for ${issues.length} ${issues.length === 1 ? "issue" : "issues"}...`} />
      )}
    </div>
  )
}