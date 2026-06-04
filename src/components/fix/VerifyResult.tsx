import { useState, useRef } from "react"
import { CheckCircle2, AlertTriangle, Loader2, ClipboardPaste, ShieldCheck, ChevronDown, ChevronUp } from "lucide-react"
import { Button } from "@/components/common/Button"
import { verifyFix } from "@/lib/scriptGenerator"
import { showToast } from "@/components/common/Toast"
import type { VerifyResult as VerifyResultData } from "@/types/fix"

interface VerifyResultProps {
  intendedAction: string
  defaultOpen?: boolean
}

export function VerifyResult({ intendedAction, defaultOpen = false }: VerifyResultProps) {
  const [open, setOpen] = useState(defaultOpen)
  const [log, setLog] = useState("")
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<VerifyResultData | null>(null)
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

  const handleVerify = async () => {
    if (!log.trim() || loading) return
    setLoading(true)
    setResult(null)
    try {
      setResult(await verifyFix(intendedAction, log.trim()))
    } catch {
      setResult({ verified: false, summary: "Couldn't read the log. Please try again.", details: "" })
    } finally {
      setLoading(false)
    }
  }

  return (
    <section aria-labelledby="verify-heading" className="bg-surface-900 border border-surface-800 rounded-2xl p-6">
      <button
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="w-full flex items-center justify-between text-left cursor-pointer"
      >
        <span id="verify-heading" className="text-lg font-semibold text-white flex items-center gap-2">
          <ShieldCheck aria-hidden="true" className="w-5 h-5 text-brand-400 shrink-0" />
          Confirm it worked
        </span>
        {open ? <ChevronUp className="w-5 h-5 text-surface-400" /> : <ChevronDown className="w-5 h-5 text-surface-400" />}
      </button>

      {open && (
        <div className="mt-4 space-y-3">
          <p className="text-sm text-surface-300">
            After you run the fix, paste the log it copied to your clipboard and we'll confirm it actually did what you
            wanted.
          </p>
          <label htmlFor="verify-log" className="sr-only">Paste your fix log to confirm it worked</label>
          <textarea
            id="verify-log"
            ref={logRef}
            value={log}
            onChange={(e) => setLog(e.target.value)}
            placeholder="Paste your log here (Ctrl+V)..."
            rows={6}
            className="w-full bg-surface-950 border border-surface-700 rounded-xl px-4 py-3 text-white placeholder-surface-500 focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 resize-none text-sm font-mono transition-all"
            disabled={loading}
          />
          <div className="flex flex-col sm:flex-row gap-3">
            <Button type="button" variant="secondary" size="sm" onClick={handlePaste} disabled={loading}>
              <ClipboardPaste className="w-4 h-4" />
              Paste from clipboard
            </Button>
            <Button type="button" size="sm" className="flex-1" onClick={handleVerify} disabled={!log.trim() || loading}>
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
              {loading ? "Checking your log..." : "Check my log"}
            </Button>
          </div>

          {result && (
            <div
              role="status"
              aria-live="polite"
              className={`rounded-xl p-4 border ${
                result.verified ? "bg-green-950/30 border-green-800/40" : "bg-amber-950/30 border-amber-800/40"
              }`}
            >
              <p className={`font-semibold flex items-center gap-2 ${result.verified ? "text-green-300" : "text-amber-300"}`}>
                {result.verified
                  ? <CheckCircle2 className="w-5 h-5 shrink-0" aria-hidden="true" />
                  : <AlertTriangle className="w-5 h-5 shrink-0" aria-hidden="true" />}
                {result.summary}
              </p>
              {result.details && (
                <p className={`text-sm mt-2 leading-relaxed ${result.verified ? "text-green-100/80" : "text-amber-100/80"}`}>
                  {result.details}
                </p>
              )}
            </div>
          )}
        </div>
      )}
    </section>
  )
}