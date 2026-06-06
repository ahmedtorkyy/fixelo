import { useState } from "react"
import { Shield, CheckCircle, XCircle, AlertTriangle, Star } from "lucide-react"
import { Button } from "@/components/common/Button"
import { LoadingSpinner } from "@/components/common/LoadingSpinner"
import { Seo } from "@/components/common/Seo"
import { scanScript } from "@/lib/scriptGenerator"
import { SCRIPT_SCAN_MESSAGES } from "@/lib/statusMessages"
import type { ScriptScanResult } from "@/types/scanner"

const labelConfig = {
  "Safe": { color: "text-green-400", bg: "bg-green-950/30 border-green-800/40", Icon: CheckCircle, stars: 5 },
  "Use With Caution": { color: "text-amber-400", bg: "bg-amber-950/30 border-amber-800/40", Icon: AlertTriangle, stars: 3 },
  "Potentially Dangerous": { color: "text-orange-400", bg: "bg-orange-950/30 border-orange-800/40", Icon: AlertTriangle, stars: 2 },
  "Dangerous": { color: "text-red-400", bg: "bg-red-950/30 border-red-800/40", Icon: XCircle, stars: 1 },
}

function SafetyStars({ rating }: { rating: number }) {
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          className={`w-5 h-5 ${i <= rating ? "text-brand-400 fill-brand-400" : "text-surface-700"}`}
        />
      ))}
    </div>
  )
}

export default function ScriptScannerPage() {
  const [script, setScript] = useState("")
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<ScriptScanResult | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleScan = async () => {
    if (!script.trim()) return
    setLoading(true)
    setError(null)
    setResult(null)
    try {
      const scan = await scanScript(script.trim())
      setResult(scan)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const labelCfg = result ? labelConfig[result.safetyLabel] : null

  const seoTitle = result ? `Script Safety Report — Fixelo` : "Script Safety Scanner — Fixelo"
  const seoDesc = result
    ? `Script safety analysis: ${result.dangerousItems.length > 0 ? result.dangerousItems.join(", ").substring(0, 140) : "No risks found"}`
    : "Paste any PowerShell or batch script to get an AI safety analysis. See exactly what each command does before you run it."

  return (
    <>
    <Seo title={seoTitle} description={seoDesc} canonical="https://fixelo.pages.dev/script-scanner" />
    <div className="max-w-3xl mx-auto py-12 px-4 sm:px-6 space-y-8">
      <div className="text-center">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-brand-600/10 border border-brand-600/20 rounded-full text-brand-400 text-sm font-medium mb-6">
          <Shield className="w-4 h-4" />
          AI-Powered Safety Scanner
        </div>
        <h1 className="text-3xl sm:text-4xl font-bold text-white mb-4">Script Safety Scanner</h1>
        <p className="text-surface-400 text-lg max-w-xl mx-auto">
          Paste any BAT or PowerShell script you found online. Get a plain English explanation of what it does and a safety rating before you run it.
        </p>
      </div>

      <div className="space-y-3">
        <label htmlFor="script-input" className="block text-sm font-medium text-surface-300">
          Paste your script here
        </label>
        <textarea
          id="script-input"
          value={script}
          onChange={(e) => setScript(e.target.value)}
          placeholder="Paste any .bat or PowerShell script here..."
          rows={10}
          className="w-full bg-surface-900 border border-surface-700 rounded-2xl px-5 py-4 text-white placeholder-surface-500 focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 resize-none text-sm font-mono transition-all"
        />
        <Button size="lg" className="w-full" disabled={!script.trim() || loading} onClick={handleScan}>
          <Shield className="w-5 h-5" />
          {loading ? "Scanning script..." : "Scan This Script"}
        </Button>
      </div>

      {loading && <LoadingSpinner messages={SCRIPT_SCAN_MESSAGES} />}

      {error && (
        <div className="bg-red-950/50 border border-red-800/50 rounded-2xl p-4">
          <p className="text-red-300 text-sm">{error}</p>
        </div>
      )}

      {result && labelCfg && (
        <div className="space-y-4">
          {/* Safety verdict */}
          <div className={`border rounded-2xl p-6 space-y-3 ${labelCfg.bg}`}>
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div className="flex items-center gap-2">
                <labelCfg.Icon className={`w-6 h-6 ${labelCfg.color}`} />
                <span className={`text-xl font-bold ${labelCfg.color}`}>{result.safetyLabel}</span>
              </div>
              <SafetyStars rating={result.safetyRating} />
            </div>
            <p className={`text-sm leading-relaxed ${labelCfg.color} opacity-80`}>{result.recommendation}</p>
          </div>

          {/* What it does */}
          <div className="bg-surface-900 border border-surface-800 rounded-2xl p-6">
            <h3 className="text-white font-semibold mb-2">What This Script Does</h3>
            <p className="text-surface-300 text-sm leading-relaxed">{result.whatItDoes}</p>
          </div>

          {/* Dangerous items */}
          {result.dangerousItems.length > 0 && (
            <div className="bg-red-950/30 border border-red-800/40 rounded-2xl p-6">
              <h3 className="text-red-300 font-semibold mb-3 flex items-center gap-2">
                <XCircle className="w-4 h-4" />
                Suspicious or Dangerous Items Found
              </h3>
              <ul className="space-y-2">
                {result.dangerousItems.map((item, i) => (
                  <li key={i} className="text-red-200/70 text-sm flex items-start gap-2">
                    <span className="text-red-400 shrink-0">•</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Operations breakdown */}
          {result.operations.length > 0 && (
            <div className="bg-surface-900 border border-surface-800 rounded-2xl p-6">
              <h3 className="text-white font-semibold mb-3">Step by Step Breakdown</h3>
              <ul className="space-y-2.5">
                {result.operations.map((op, i) => (
                  <li key={i} className="flex items-start gap-3 text-sm">
                    {op.safe
                      ? <CheckCircle className="w-4 h-4 text-green-400 mt-0.5 shrink-0" />
                      : <XCircle className="w-4 h-4 text-red-400 mt-0.5 shrink-0" />
                    }
                    <span className={op.safe ? "text-surface-300" : "text-red-300"}>{op.action}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
    </>
  )
}
