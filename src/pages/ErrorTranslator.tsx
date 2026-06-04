import { useState } from "react"
import { AlertCircle, Wrench, ChevronRight, CheckCircle, AlertTriangle, XCircle } from "lucide-react"
import { Button } from "@/components/common/Button"
import { LoadingSpinner } from "@/components/common/LoadingSpinner"
import { translateError } from "@/lib/scriptGenerator"
import type { ErrorTranslation } from "@/types/scanner"

const EXAMPLES = [
  "0x800f081f",
  "0x80070002",
  "SYSTEM_SERVICE_EXCEPTION",
  "0xc000021a",
  "Error 1068",
  "DRIVER_IRQL_NOT_LESS_OR_EQUAL",
]

const severityConfig = {
  low: { label: "Low Severity", color: "text-green-400", bg: "bg-green-950/30 border-green-800/40", Icon: CheckCircle },
  medium: { label: "Medium Severity", color: "text-amber-400", bg: "bg-amber-950/30 border-amber-800/40", Icon: AlertTriangle },
  high: { label: "High Severity", color: "text-red-400", bg: "bg-red-950/30 border-red-800/40", Icon: XCircle },
}

export default function ErrorTranslatorPage() {
  const [input, setInput] = useState("")
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<ErrorTranslation | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleTranslate = async () => {
    if (!input.trim()) return
    setLoading(true)
    setError(null)
    setResult(null)
    try {
      const translation = await translateError(input.trim())
      setResult(translation)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const sev = result ? severityConfig[result.severity] : null

  return (
    <div className="max-w-3xl mx-auto py-12 px-4 sm:px-6 space-y-8">
      <div className="text-center">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-brand-600/10 border border-brand-600/20 rounded-full text-brand-400 text-sm font-medium mb-6">
          <AlertCircle className="w-4 h-4" />
          AI-Powered Error Translator
        </div>
        <h1 className="text-3xl sm:text-4xl font-bold text-white mb-4">Windows Error Translator</h1>
        <p className="text-surface-400 text-lg max-w-xl mx-auto">
          Paste any Windows error code or message. Get a plain English explanation and a targeted fix.
        </p>
      </div>

      <div className="space-y-3">
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Paste your error code or message here... e.g. 0x800f081f or SYSTEM_SERVICE_EXCEPTION"
          rows={3}
          aria-label="Windows error code or message"
          className="w-full bg-surface-900 border border-surface-700 rounded-2xl px-5 py-4 text-white placeholder-surface-500 focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 resize-none text-base transition-all"
          onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleTranslate() } }}
        />
        <Button size="lg" className="w-full" disabled={!input.trim() || loading} onClick={handleTranslate}>
          <AlertCircle className="w-5 h-5" />
          {loading ? "Analyzing error..." : "Translate This Error"}
        </Button>
      </div>

      <div>
        <p className="text-sm text-surface-500 mb-3 text-center">Try a common error:</p>
        <div className="flex flex-wrap gap-2 justify-center">
          {EXAMPLES.map((ex) => (
            <button
              key={ex}
              onClick={() => setInput(ex)}
              className="px-3 py-1.5 bg-surface-900 border border-surface-700 rounded-lg text-xs text-surface-300 hover:border-brand-600 hover:text-brand-300 transition-colors cursor-pointer font-mono"
            >
              {ex}
            </button>
          ))}
        </div>
      </div>

      {loading && <LoadingSpinner message="Analyzing your error..." />}

      {error && (
        <div className="bg-red-950/50 border border-red-800/50 rounded-2xl p-4">
          <p className="text-red-300 text-sm">{error}</p>
        </div>
      )}

      {result && sev && (
        <div className="space-y-4">
          <div className="bg-surface-900 border border-surface-800 rounded-2xl p-6 space-y-3">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <h2 className="text-xl font-bold text-white">{result.errorName}</h2>
              <span className={`flex items-center gap-1.5 text-sm font-medium px-3 py-1 rounded-full border ${sev.bg} ${sev.color}`}>
                <sev.Icon className="w-4 h-4" />
                {sev.label}
              </span>
            </div>
            <p className="text-surface-300 leading-relaxed text-base">{result.plainExplanation}</p>
          </div>

          {result.commonCauses.length > 0 && (
            <div className="bg-surface-900 border border-surface-800 rounded-2xl p-6">
              <h3 className="text-white font-semibold mb-3">Common Causes</h3>
              <ul className="space-y-2">
                {result.commonCauses.map((cause, i) => (
                  <li key={i} className="flex items-start gap-2 text-surface-300 text-sm">
                    <ChevronRight className="w-4 h-4 text-brand-400 mt-0.5 shrink-0" />
                    {cause}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {result.canFix && result.fixDescription && (
            <div className="bg-brand-950/30 border border-brand-800/40 rounded-2xl p-6 space-y-4">
              <h3 className="text-brand-300 font-semibold">How to Fix This</h3>
              <p className="text-brand-200/80 text-sm leading-relaxed">{result.fixDescription}</p>
              <Button
                size="lg"
                className="w-full"
                onClick={() => {
                  const q = encodeURIComponent(`Windows error ${input}: ${result.plainExplanation} ${result.fixDescription}`)
                  window.location.href = `/?q=${q}`
                }}
              >
                <Wrench className="w-5 h-5" />
                Generate Fix Script for This Error
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
