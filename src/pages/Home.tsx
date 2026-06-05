import { useEffect } from "react"
import { useNavigate } from "react-router"
import { useScriptGenerator } from "@/hooks/useScriptGenerator"
import { ProblemInput } from "@/components/fix/ProblemInput"
import { FixResultDisplay } from "@/components/fix/FixResult"
import { FailureRecovery } from "@/components/fix/FailureRecovery"
import { FixResultSkeleton } from "@/components/common/Skeleton"
import { LoadingSpinner } from "@/components/common/LoadingSpinner"
import { ErrorMessage } from "@/components/common/ErrorMessage"
import { Button } from "@/components/common/Button"
import { Seo } from "@/components/common/Seo"

export default function HomePage() {
  const {
    currentStep,
    originalProblem,
    fixResult,
    diagnosisResult,
    prefilledLog,
    suggestions,
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
  } = useScriptGenerator()

  const navigate = useNavigate()

  const handleEscalateToAgent = () => {
    const parts = [
      "I tried Fixelo's automatic fixes for this problem but they didn't fully solve it. Can you help me dig deeper, step by step?",
      "",
      `Original problem: ${originalProblem}`,
    ]
    if (fixResult?.whatItDoes) parts.push(`First fix tried: ${fixResult.whatItDoes}`)
    if (diagnosisResult?.whatNextFixDoesDifferently) parts.push(`Second (smarter) fix tried: ${diagnosisResult.whatNextFixDoesDifferently}`)
    parts.push("Both automatic fixes did not work.")
    navigate("/agent", { state: { handoff: parts.join("\n") } })
  }

  // Auto-trigger fix if coming from Error Translator with ?q= param
  useEffect(() => {
    const q = new URLSearchParams(window.location.search).get("q")
    if (q && currentStep === "input") {
      window.history.replaceState({}, "", "/")
      generateFix(q)
    }
  }, [])

  return (
    <>
    <Seo title="Fix any Windows problem in plain English" description="Describe your PC problem. Download a safe one-click fix with automatic undo. Free, no technical skill needed." canonical="https://fixelo.pages.dev" jsonLd={{
      "@context": "https://schema.org",
      "@graph": [
        {
          "@type": "WebSite",
          "name": "Fixelo",
          "url": "https://fixelo.pages.dev",
          "description": "Fix any Windows problem in plain English. Describe your problem, get a safe one-click fix.",
          "potentialAction": { "@type": "SearchAction", "target": "https://fixelo.pages.dev/?q={search_term_string}", "query-input": "required name=search_term_string" }
        },
        {
          "@type": "Organization",
          "name": "Fixelo",
          "url": "https://fixelo.pages.dev",
          "logo": "https://fixelo.pages.dev/app-logo.png"
        }
      ]
    }} />
    <div className="py-12 sm:py-16 px-4 sm:px-6">
      {currentStep === "not-windows" && fixResult && (
        <div className="max-w-3xl mx-auto text-center space-y-6" role="region" aria-live="polite">
          <h2 className="text-2xl font-bold text-white">Not a Windows problem I can fix</h2>
          <p className="text-surface-400 text-lg">
            {fixResult.problemSummary || "That doesn't look like a Windows PC problem I can fix. Try describing a PC issue — or browse the tools."}
          </p>
          <div className="pt-2">
            <button onClick={reset} className="text-sm text-surface-400 hover:text-white underline">
              Try another problem
            </button>
          </div>
        </div>
      )}

      {currentStep === "input" && (
        <>
          <ProblemInput onSubmit={generateFix} loading={false} />
          {error && (
            <div className="max-w-3xl mx-auto mt-6">
              <ErrorMessage message={error} onRetry={() => generateFix(originalProblem)} />
            </div>
          )}
        </>
      )}

      {currentStep === "suggestion" && (
        <div className="max-w-3xl mx-auto space-y-6" role="region" aria-live="polite" aria-label="Suggested tools">
          <div className="text-center space-y-2">
            <h2 className="text-2xl font-bold text-white">Pick a tool</h2>
            <p className="text-surface-400">
              Based on "<span className="text-white">{originalProblem.slice(0, 80)}</span>", one of these tools should help:
            </p>
          </div>
          <div className="space-y-3">
            {suggestions.map((s, i) => (
              <button
                key={s.slug}
                onClick={() => navigate(`/tools/${s.slug}`)}
                className="w-full text-left bg-surface-900 border border-surface-800 hover:border-brand-600/50 hover:bg-brand-600/5 rounded-2xl p-5 transition-all cursor-pointer"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-semibold text-white">{s.title}</h3>
                    <p className="text-sm text-surface-400 mt-1">{s.description}</p>
                  </div>
                  {i === 0 && (
                    <span className="shrink-0 text-xs text-brand-600 bg-brand-600/10 rounded-full px-2.5 py-1 self-start font-medium">
                      Best match
                    </span>
                  )}
                </div>
              </button>
            ))}
          </div>
          <div className="text-center pt-4 space-y-3">
            <Button variant="primary" size="lg" className="w-full max-w-sm mx-auto" onClick={() => generateCustom(originalProblem)}>
              Generate a custom fix instead
            </Button>
            <div>
              <button onClick={reset} className="text-sm text-surface-400 hover:text-white underline">
                Start over
              </button>
            </div>
          </div>
        </div>
      )}

      {currentStep === "loading" && (
        <div className="py-8">
          <p role="status" aria-live="polite" className="text-center text-surface-400 text-sm mb-8">
            Analyzing your problem, please wait: <span className="text-white">"{originalProblem.slice(0, 60)}{originalProblem.length > 60 ? "..." : ""}"</span>
          </p>
          <FixResultSkeleton />
        </div>
      )}

      {currentStep === "result" && fixResult && (
        <FixResultDisplay
          result={fixResult}
          problemDescription={originalProblem}
          onDownloadFix={() => downloadFix()}
          onDownloadUndo={() => downloadUndo()}
          onNotFixed={startFailureFlow}
          onMarkResult={markCurrentFix}
          onStartOver={reset}
        />
      )}

      {currentStep === "failure-input" && (
        <FailureRecovery
          onSubmitFailure={submitFailure}
          loading={false}
          diagnosisResult={null}
          initialLog={prefilledLog}
          onStartOver={reset}
        />
      )}

      {currentStep === "diagnosis-loading" && (
        <div className="max-w-3xl mx-auto">
          <LoadingSpinner message="Reading what happened to build a smarter fix..." />
        </div>
      )}

      {currentStep === "diagnosis-result" && diagnosisResult && (
        <FailureRecovery
          onSubmitFailure={submitFailure}
          loading={false}
          diagnosisResult={diagnosisResult}
          onDownloadFix={() => downloadDiagnosisFix()}
          onDownloadUndo={() => downloadDiagnosisUndo()}
          onEscalate={handleEscalateToAgent}
          onStartOver={reset}
        />
      )}
    </div>
    </>
  )
}
