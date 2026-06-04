import { useEffect, useRef, useState } from "react"
import { ArrowLeft, Download, ShieldOff, CheckCircle2, ChevronRight, MessageSquareText } from "lucide-react"
import { Link, useNavigate } from "react-router"
import { Button } from "@/components/common/Button"
import { WarningBanner } from "@/components/common/WarningBanner"
import { TrustBanner } from "@/components/common/TrustBanner"
import { FixResultSkeleton } from "@/components/common/Skeleton"
import { CodeBlock } from "@/components/fix/CodeBlock"
import { VerifyResult } from "@/components/fix/VerifyResult"
import { useToolGenerator } from "@/hooks/useToolGenerator"
import { showToast } from "@/components/common/Toast"
import type { ToolConfig } from "@/lib/toolConfigs"

type ToolStep = "download" | "verify" | "success" | "failure"

interface ToolPageProps {
  tool: ToolConfig
}

export function ToolPageLayout({ tool }: ToolPageProps) {
  const navigate = useNavigate()
  const {
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
  } = useToolGenerator(tool)

  const [flowStep, setFlowStep] = useState<ToolStep>("download")
  const [downloaded, setDownloaded] = useState(false)

  const hasInputs = tool.options.some((o) => o.type === "text" || o.type === "time")
  const canGenerate = selectedOptions.length > 0 || (hasInputs && Object.values(inputValues).some((v) => v.trim()))

  const resultHeadingRef = useRef<HTMLHeadingElement>(null)
  useEffect(() => {
    if (currentStep === "result") resultHeadingRef.current?.focus()
  }, [currentStep])

  useEffect(() => {
    if (currentStep !== "result") {
      setFlowStep("download")
      setDownloaded(false)
    }
  }, [currentStep])

  if (currentStep === "loading") {
    return (
      <div className="max-w-3xl mx-auto py-12 px-4 sm:px-6">
        <p role="status" aria-live="polite" className="text-center text-surface-400 text-sm mb-8">Generating your <span className="text-white">{tool.title}</span> script, please wait...</p>
        <FixResultSkeleton />
      </div>
    )
  }

  if (currentStep === "error" && error) {
    return (
      <div className="max-w-3xl mx-auto py-12 px-4 sm:px-6">
        <button
          onClick={reset}
          className="flex items-center gap-1.5 text-sm text-surface-400 hover:text-white transition-colors cursor-pointer mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to {tool.title}
        </button>
        <div className="bg-red-950/50 border border-red-800/50 rounded-2xl p-6">
          <h3 className="text-red-300 font-semibold mb-2">Something went wrong</h3>
          <p className="text-red-400/80 text-sm">{error}</p>
          <Button variant="secondary" size="sm" className="mt-4" onClick={reset}>
            Try again
          </Button>
        </div>
      </div>
    )
  }

  if (currentStep === "result" && result) {
    // --- SUCCESS SCREEN ---
    if (flowStep === "success") {
      return (
        <div className="max-w-3xl mx-auto py-12 px-4 sm:px-6">
          <div className="text-center py-16 space-y-6">
            <div className="w-20 h-20 bg-green-600/20 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-10 h-10 text-green-400" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">Script Ran Successfully!</h1>
              <p className="text-surface-300 text-lg">
                Your {tool.title} script completed and the changes should be applied.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 justify-center pt-4">
              <Button variant="secondary" size="lg" onClick={reset}>
                <ArrowLeft className="w-5 h-5" />
                Start over
              </Button>
            </div>
          </div>
        </div>
      )
    }

    // --- VERIFY SCREEN ---
    if (flowStep === "verify") {
      return (
        <div className="max-w-3xl mx-auto py-12 px-4 sm:px-6 space-y-6">
          <div className="flex items-center justify-between">
            <h1 ref={resultHeadingRef} tabIndex={-1} className="text-2xl font-bold text-white outline-none">
              Did it work?
            </h1>
            <button
              onClick={reset}
              className="flex items-center gap-1.5 text-sm text-surface-400 hover:text-white transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              Start over
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
            After running the script, paste the log it copied to your clipboard and we'll confirm it worked — or just tell us below.
          </p>

          <VerifyResult intendedAction={tool.title} defaultOpen />

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
                onClick={() => setFlowStep("success")}
              >
                <CheckCircle2 className="w-4 h-4" />
                Yes, it worked
              </Button>
              <Button
                variant="primary"
                size="md"
                className="flex-1"
                onClick={() => setFlowStep("failure")}
              >
                No, it didn't work
              </Button>
            </div>
          </div>

          <button
            onClick={() => setFlowStep("download")}
            className="flex items-center gap-1.5 text-sm text-surface-400 hover:text-white transition-colors cursor-pointer mx-auto"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to script details
          </button>
        </div>
      )
    }

    // --- FAILURE SCREEN ---
    if (flowStep === "failure") {
      const handoffContext = [
        `I tried the ${tool.title} tool in Fixelo but it didn't fix my problem.`,
        ``,
        `Options selected: ${selectedOptions.map((id) => tool.options.find((o) => o.id === id)?.label).filter(Boolean).join(", ") || "None"}`,
        `Tool description: ${tool.longDescription}`,
      ].join("\n")

      return (
        <div className="max-w-3xl mx-auto py-12 px-4 sm:px-6 space-y-6">
          <div className="flex items-center justify-between">
            <h1 tabIndex={-1} className="text-2xl font-bold text-white outline-none">
              Still having trouble?
            </h1>
            <button
              onClick={reset}
              className="flex items-center gap-1.5 text-sm text-surface-400 hover:text-white transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              Start over
            </button>
          </div>

          <p className="text-surface-300 leading-relaxed">
            The {tool.title} script didn't solve the problem. Here's what you can do next:
          </p>

          <div className="bg-surface-900 border border-surface-800 rounded-2xl p-6 space-y-4">
            <Button
              variant="secondary"
              size="lg"
              className="w-full"
              onClick={reset}
            >
              Try different options
            </Button>
            <p className="text-xs text-surface-500 text-center -mt-2">
              Go back and select different settings to generate a new script.
            </p>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-surface-700" />
              </div>
              <div className="relative flex justify-center">
                <span className="bg-surface-900 px-3 text-xs text-surface-500">or</span>
              </div>
            </div>

            <Button
              size="lg"
              className="w-full"
              onClick={() => navigate("/agent", { state: { handoff: handoffContext } })}
            >
              <MessageSquareText className="w-5 h-5" />
              Ask Fixie for help
            </Button>
            <p className="text-xs text-surface-500 text-center -mt-2">
              Switch to Fixie, your AI agent, for personalized step-by-step help.
            </p>
          </div>

          <button
            onClick={() => setFlowStep("verify")}
            className="flex items-center gap-1.5 text-sm text-surface-400 hover:text-white transition-colors cursor-pointer mx-auto"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to verify
          </button>
        </div>
      )
    }

    // --- DOWNLOAD SCREEN ---
    return (
      <div className="max-w-3xl mx-auto py-12 px-4 sm:px-6 space-y-6">
        <div className="flex items-center justify-between">
          <h1
            ref={resultHeadingRef}
            tabIndex={-1}
            className="text-2xl font-bold text-white outline-none"
          >
            {tool.title} — Ready
          </h1>
          <button
            onClick={reset}
            className="flex items-center gap-1.5 text-sm text-surface-400 hover:text-white transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            Start over
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

        <div className="bg-surface-900 border border-surface-800 rounded-2xl p-6 space-y-4">
          <h3 className="text-lg font-semibold text-white">What This Will Do</h3>
          <p className="text-surface-300 leading-relaxed">{result.problemSummary}</p>
        </div>

        <div className="bg-surface-900 border border-surface-800 rounded-2xl p-6 space-y-4">
          <h3 className="text-lg font-semibold text-white">Step by Step</h3>
          <p className="text-surface-300 leading-relaxed">{result.whatItDoes}</p>
        </div>

        <div className="bg-green-950/30 border border-green-800/40 rounded-2xl p-6 space-y-4">
          <h3 className="text-lg font-semibold text-green-300 flex items-center gap-2">
            <ShieldOff className="w-5 h-5" />
            What This Script Does NOT Touch
          </h3>
          <p className="text-green-200/70 leading-relaxed">{result.whatItDoesNotTouch}</p>
        </div>

        {result.scriptSafetyNotes && (
          <div className="bg-amber-950/30 border border-amber-800/40 rounded-2xl p-6 space-y-3">
            <h3 className="text-lg font-semibold text-amber-300">Important Notes</h3>
            <p className="text-amber-200/70 leading-relaxed">{result.scriptSafetyNotes}</p>
          </div>
        )}

        <CodeBlock title="See what this script does (advanced)" code={result.fixScript} />

        <div className="space-y-3 pt-2">
          {!downloaded ? (
            <Button size="lg" className="w-full" onClick={() => { downloadFix(); setDownloaded(true); showToast("Fix script downloaded!") }}>
              <Download className="w-5 h-5" />
              Download {tool.title} Script
            </Button>
          ) : (
            <div className="space-y-3">
              <div className="bg-green-950/30 border border-green-800/40 rounded-xl p-3 text-center text-green-300 text-sm font-medium">
                Script downloaded! Also download the undo file for safety.
              </div>
              <Button variant="secondary" size="md" className="w-full" onClick={() => { downloadUndo(); showToast("Undo script downloaded!") }}>
                <ShieldOff className="w-4 h-4" />
                Download Undo Script
              </Button>
              <Button variant="secondary" size="sm" className="w-full" onClick={() => downloadFix()}>
                <Download className="w-4 h-4" />
                Re-download {tool.title} Script
              </Button>
            </div>
          )}
        </div>

        <WarningBanner>
          Windows may show a permission popup (UAC) when you run the file. This is normal —
          the script needs admin access. Click "Yes" to allow it.
        </WarningBanner>

        <TrustBanner />

        <div className="pt-2">
          <Button variant="primary" size="lg" className="w-full" onClick={() => setFlowStep("verify")}>
            I've run the script — did it work?
            <ChevronRight className="w-5 h-5" />
          </Button>
        </div>
      </div>
    )
  }

  // --- INPUT SCREEN ---
  return (
    <div className="max-w-3xl mx-auto py-12 px-4 sm:px-6">
      <div className="flex items-center gap-2 text-xs text-surface-500 mb-6">
        <Link to="/tools" className="hover:text-brand-400 transition-colors">Tools</Link>
        <span>›</span>
        <span className="text-surface-400">{tool.category}</span>
        <span>›</span>
        <span className="text-white">{tool.title}</span>
      </div>
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-brand-600/20 rounded-xl flex items-center justify-center">
            <tool.icon className="w-5 h-5 text-brand-400" />
          </div>
          <div>
            <p className="text-xs text-surface-500 uppercase tracking-wider font-medium">{tool.category}</p>
            <h1 className="text-2xl font-bold text-white">{tool.title}</h1>
          </div>
        </div>
        <p className="text-surface-400 leading-relaxed">{tool.longDescription}</p>
      </div>

      <div className="bg-surface-900 border border-surface-800 rounded-2xl p-6 mb-6">
        <h2 className="text-lg font-semibold text-white mb-4">Select what you want to apply</h2>
        <div className="space-y-3">
          {tool.options.map((option) => {
            if (option.type === "text" || option.type === "time") {
              return (
                <div key={option.id} className="flex items-start gap-3 p-3 rounded-xl bg-surface-950 border border-surface-700">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white mb-1">
                      {option.label}
                    </p>
                    <p className="text-xs text-surface-500 mb-2">{option.description}</p>
                    <input
                      type={option.type === "time" ? "time" : "text"}
                      value={inputValues[option.id] ?? ""}
                      onChange={(e) => setInputValue(option.id, e.target.value)}
                      placeholder={option.placeholder}
                      className="w-full bg-surface-900 border border-surface-600 rounded-lg px-3 py-2 text-white text-sm placeholder-surface-500 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500/20"
                    />
                  </div>
                </div>
              )
            }

            const isSelected = selectedOptions.includes(option.id)
            return (
              <label
                key={option.id}
                className={`flex items-start gap-3 p-3 rounded-xl cursor-pointer transition-all ${
                  isSelected
                    ? "bg-brand-600/10 border border-brand-600/30"
                    : "bg-surface-950 border border-surface-700 hover:border-surface-600"
                }`}
              >
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={() => toggleOption(option.id)}
                  className="mt-1 w-4 h-4 rounded border-surface-600 text-brand-600 focus:ring-brand-500 accent-brand-600"
                />
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-medium ${isSelected ? "text-white" : "text-surface-300"}`}>
                    {option.label}
                  </p>
                  <p className="text-xs text-surface-500 mt-0.5">{option.description}</p>
                </div>
              </label>
            )
          })}
        </div>
      </div>

      <Button
        size="lg"
        className="w-full"
        disabled={!canGenerate}
        onClick={generate}
      >
        Generate Script
      </Button>

      {!canGenerate && (
        <p className="text-sm text-surface-500 text-center mt-3">
          Select at least one option or fill in a value to generate your script.
        </p>
      )}
    </div>
  )
}