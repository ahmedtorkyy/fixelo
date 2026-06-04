import { useState } from "react"
import { ArrowLeft, Download, ShieldOff, CheckCircle2, ChevronRight } from "lucide-react"
import { useNavigate } from "react-router"
import { Button } from "@/components/common/Button"
import { WarningBanner } from "@/components/common/WarningBanner"
import { TrustBanner } from "@/components/common/TrustBanner"
import { CodeBlock } from "@/components/fix/CodeBlock"
import { VerifyResult } from "@/components/fix/VerifyResult"
import { useGemini } from "@/hooks/useGemini"
import { downloadBatFile, generateFixFilename, generateUndoFilename } from "@/lib/batGenerator"
import { LoadingSpinner } from "@/components/common/LoadingSpinner"
import { ErrorMessage } from "@/components/common/ErrorMessage"
import { showToast } from "@/components/common/Toast"

type DiagFixStep = "download" | "verify" | "success"

interface FixFromDiagnosisProps {
  problem: string
  onBack: () => void
}

export function FixFromDiagnosis({ problem, onBack }: FixFromDiagnosisProps) {
  const { fixResult, loading, error, generateScript } = useGemini()
  const [downloaded, setDownloaded] = useState(false)
  const [step, setStep] = useState<DiagFixStep>("download")
  const navigate = useNavigate()

  const escalateToAgent = () => {
    const handoff = `Fixelo found this issue in my PC health scan and built a fix, but it didn't fully solve it. Can you help me dig deeper, step by step?\n\nIssue: ${problem}`
    navigate("/agent", { state: { handoff } })
  }

  const handleGenerate = () => {
    generateScript(problem)
  }

  const fixFilename = generateFixFilename(problem)
  const undoFilename = generateUndoFilename(fixFilename)

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
                Your fix ran successfully and the problem should be resolved.
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

    // --- VERIFY SCREEN ---
    if (step === "verify") {
      return (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-white">Did it work?</h2>
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
            After running the fix, paste the log it copied to your clipboard and we'll confirm it worked — or just tell us below.
          </p>

          <VerifyResult intendedAction={problem} defaultOpen />

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
          <h2 className="text-2xl font-bold text-white">Your Fix Is Ready</h2>
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

        <div className="bg-surface-900 border border-surface-800 rounded-2xl p-6">
          <h3 className="text-lg font-semibold text-white mb-2">Problem</h3>
          <p className="text-surface-300 leading-relaxed">{fixResult.problemSummary}</p>
        </div>

        <div className="bg-surface-900 border border-surface-800 rounded-2xl p-6">
          <h3 className="text-lg font-semibold text-white mb-2">What This Fix Will Do</h3>
          <p className="text-surface-300 leading-relaxed">{fixResult.whatItDoes}</p>
        </div>

        <div className="bg-green-950/30 border border-green-800/40 rounded-2xl p-6">
          <h3 className="text-lg font-semibold text-green-300 mb-2">What This Fix Does NOT Touch</h3>
          <p className="text-green-200/70 leading-relaxed">{fixResult.whatItDoesNotTouch}</p>
        </div>

        {fixResult.scriptSafetyNotes && (
          <div className="bg-amber-950/30 border border-amber-800/40 rounded-2xl p-6">
            <h3 className="text-lg font-semibold text-amber-300">Important Notes</h3>
            <p className="text-amber-200/70 leading-relaxed mt-2">{fixResult.scriptSafetyNotes}</p>
          </div>
        )}

        <CodeBlock title="See What This Fix Does (advanced)" code={fixResult.fixScript} />

        <div className="space-y-3 pt-2">
          {!downloaded ? (
            <Button
              size="lg"
              className="w-full"
              onClick={() => {
                downloadBatFile(fixResult.fixScript, fixFilename)
                setDownloaded(true)
                showToast("Fix file downloaded!")
              }}
            >
              <Download className="w-5 h-5" />
              Download {fixFilename}
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
                onClick={() => { downloadBatFile(fixResult.undoScript, undoFilename); showToast("Undo file downloaded!") }}
              >
                <ShieldOff className="w-4 h-4" />
                Download {undoFilename}
              </Button>
            </div>
          )}
        </div>

        <WarningBanner>
          Windows may show a permission popup (UAC) when you run the file. Click "Yes" to allow it.
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

  // --- LOADING / GENERATE SCREEN ---
  return (
    <div className="space-y-6">
      <button
        onClick={onBack}
        className="flex items-center gap-1.5 text-sm text-surface-400 hover:text-white transition-colors cursor-pointer"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to health report
      </button>

      <div className="bg-surface-900 border border-surface-800 rounded-2xl p-6">
        <h3 className="text-lg font-semibold text-white mb-2">Generating fix for:</h3>
        <p className="text-surface-300">{problem}</p>
      </div>

      {error && <ErrorMessage message={error} onRetry={handleGenerate} />}

      {loading ? (
        <LoadingSpinner message="Generating your fix..." />
      ) : (
        <Button size="lg" className="w-full" onClick={handleGenerate}>
          Generate Fix
        </Button>
      )}
    </div>
  )
}