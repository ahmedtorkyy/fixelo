import { useState } from "react"
import { Wrench, Sparkles, ShieldCheck, Eye, ScanSearch } from "lucide-react"
import { Link } from "react-router"
import { Button } from "@/components/common/Button"
import { VoiceInput } from "@/components/common/VoiceInput"

interface ProblemInputProps {
  onSubmit: (problem: string) => void
  loading: boolean
}

export function ProblemInput({ onSubmit, loading }: ProblemInputProps) {
  const [problem, setProblem] = useState("")

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (problem.trim() && !loading) {
      onSubmit(problem.trim())
    }
  }

  const examples = [
    "My WiFi keeps disconnecting",
    "Windows Update is stuck",
    "My PC is really slow",
    "I'm getting a blue screen error",
    "My audio stopped working",
    "USB device not recognized",
  ]

  return (
    <div className="max-w-3xl mx-auto">
      <div className="text-center mb-10">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-brand-600/10 border border-brand-600/20 rounded-full text-brand-400 text-sm font-medium mb-6">
          <Sparkles className="w-4 h-4" />
          Free — No technical knowledge required
        </div>
        <h1 className="text-4xl sm:text-5xl font-bold text-white mb-4 leading-tight">
          Describe it. Download it.<span className="text-brand-400"> Done.</span>
        </h1>
        <p className="text-surface-400 text-lg max-w-xl mx-auto">
          Describe your Windows problem in plain English. Get a downloadable fix file with an automatic undo.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="relative">
          <label htmlFor="problem-input" className="sr-only">
            Describe your Windows problem
          </label>
          <textarea
            id="problem-input"
            value={problem}
            onChange={(e) => setProblem(e.target.value)}
            placeholder="What's wrong with your Windows PC? Example: My WiFi keeps disconnecting every few minutes..."
            rows={4}
            className="w-full bg-surface-900 border border-surface-700 rounded-2xl px-5 py-4 text-white placeholder-surface-500 focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 resize-none text-base transition-all"
            disabled={loading}
          />
          <div className="absolute bottom-3 right-3 flex items-center gap-2">
            {problem.length > 0 && <span className="text-xs text-surface-500">{problem.length} characters</span>}
            <VoiceInput onTranscript={(text) => setProblem((prev) => prev ? prev + " " + text : text)} disabled={loading} />
          </div>
        </div>

        <Button
          type="submit"
          size="lg"
          disabled={!problem.trim() || loading}
          className="w-full"
        >
          <Wrench className="w-5 h-5" />
          {loading ? "Generating your fix..." : "Get My Fix"}
        </Button>
      </form>

      <div className="mt-8">
        <p id="examples-label" className="text-sm text-surface-400 mb-3 text-center">Or try a common problem:</p>
        <div className="flex flex-wrap gap-2 justify-center" role="group" aria-labelledby="examples-label">
          {examples.map((example) => (
            <button
              key={example}
              type="button"
              onClick={() => setProblem(example)}
              className="px-3 py-1.5 bg-surface-900 border border-surface-700 rounded-lg text-sm text-surface-300 hover:border-brand-600 hover:text-brand-300 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400 focus-visible:ring-offset-2 focus-visible:ring-offset-surface-950"
              disabled={loading}
            >
              {example}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-10 grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { Icon: ShieldCheck, iconColor: "text-green-400", title: "Always Safe", desc: "Every fix comes with an automatic undo file. Reverse any change instantly.", accent: "border-green-800/30 bg-green-950/20" },
          { Icon: Eye, iconColor: "text-brand-400", title: "Full Transparency", desc: "See exactly what the script does before you download it. No surprises.", accent: "border-brand-800/30 bg-brand-950/20" },
          { Icon: ScanSearch, iconColor: "text-amber-400", title: "Smart Diagnosis", desc: "AI scans your system first, then applies a fix targeted to what it finds.", accent: "border-amber-800/30 bg-amber-950/20" },
        ].map((item) => (
          <div
            key={item.title}
            className={`border rounded-2xl p-5 ${item.accent}`}
          >
            <item.Icon aria-hidden="true" className={`w-7 h-7 mb-3 ${item.iconColor}`} />
            <h3 className="text-sm font-bold text-white mb-1.5">{item.title}</h3>
            <p className="text-xs text-surface-400 leading-relaxed">{item.desc}</p>
          </div>
        ))}
      </div>

      <p className="mt-8 text-center text-sm text-surface-400">
        Cannot describe your problem?{" "}
        <Link to="/community" className="text-brand-400 hover:text-brand-300 underline underline-offset-2">
          Browse common fixes
        </Link>
      </p>
    </div>
  )
}