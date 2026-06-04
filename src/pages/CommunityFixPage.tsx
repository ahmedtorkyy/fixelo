import { useParams, Link } from "react-router"
import { ArrowLeft, Download, ShieldOff } from "lucide-react"
import { Button } from "@/components/common/Button"
import { WarningBanner } from "@/components/common/WarningBanner"
import { CodeBlock } from "@/components/fix/CodeBlock"
import { getCommunityFix } from "@/lib/communityFixes"
import { useGemini } from "@/hooks/useGemini"
import { useDownloadCounts } from "@/hooks/useSupabase"
import { downloadBatFile, generateFixFilename, generateUndoFilename } from "@/lib/batGenerator"
import { LoadingSpinner } from "@/components/common/LoadingSpinner"

export default function CommunityFixPage() {
  const { slug } = useParams()
  const fix = slug ? getCommunityFix(slug) : undefined
  const { fixResult, loading, error, generateScript, reset } = useGemini()
  const { counts, incrementCount } = useDownloadCounts()

  const downloadCount = fix ? (counts[fix.slug] ?? fix.downloads) : 0

  const handleDownload = (scriptContent: string, filename: string) => {
    downloadBatFile(scriptContent, filename)
    if (fix) incrementCount(fix.slug)
  }

  if (!fix) {
    return (
      <div className="max-w-3xl mx-auto py-12 px-4 sm:px-6 text-center">
        <h2 className="text-2xl font-bold text-white mb-4">Fix not found</h2>
        <p className="text-surface-400 mb-6">This fix doesn't exist in the library.</p>
        <Link to="/community" className="text-brand-400 hover:text-brand-300 underline">
          Browse all fixes
        </Link>
      </div>
    )
  }

  const handleGenerate = () => {
    generateScript(fix.fixPrompt)
  }

  if (fixResult) {
    return (
      <div className="max-w-3xl mx-auto py-12 px-4 sm:px-6 space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-white">{fix.title} — Ready</h2>
          <button
            onClick={reset}
            className="flex items-center gap-1.5 text-sm text-surface-400 hover:text-white transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </button>
        </div>

        <div className="bg-surface-900 border border-surface-800 rounded-2xl p-6">
          <h3 className="text-lg font-semibold text-white mb-2">What This Will Do</h3>
          <p className="text-surface-300 leading-relaxed">{fixResult.problemSummary}</p>
        </div>

        <div className="bg-surface-900 border border-surface-800 rounded-2xl p-6">
          <h3 className="text-lg font-semibold text-white mb-2">Step by Step</h3>
          <p className="text-surface-300 leading-relaxed">{fixResult.whatItDoes}</p>
        </div>

        <div className="bg-green-950/30 border border-green-800/40 rounded-2xl p-6">
          <h3 className="text-lg font-semibold text-green-300 flex items-center gap-2 mb-2">
            <ShieldOff className="w-5 h-5" />
            What This Fix Does NOT Touch
          </h3>
          <p className="text-green-200/70 leading-relaxed">{fixResult.whatItDoesNotTouch}</p>
        </div>

        {fixResult.scriptSafetyNotes && (
          <div className="bg-amber-950/30 border border-amber-800/40 rounded-2xl p-6">
            <h3 className="text-lg font-semibold text-amber-300">Important Notes</h3>
            <p className="text-amber-200/70 leading-relaxed mt-2">{fixResult.scriptSafetyNotes}</p>
          </div>
        )}

        <CodeBlock title="See what this script does (advanced)" code={fixResult.fixScript} />

        <div className="space-y-3">
          <Button size="lg" className="w-full" onClick={() => handleDownload(fixResult.fixScript, generateFixFilename(fix.title))}>
            <Download className="w-5 h-5" />
            Download {fix.title} Fix
          </Button>
          <Button variant="secondary" size="md" className="w-full" onClick={() => handleDownload(fixResult.undoScript, generateUndoFilename(generateFixFilename(fix.title)))}>
            <ShieldOff className="w-4 h-4" />
            Download Undo File
          </Button>
        </div>

        <WarningBanner>
          Windows may show a permission popup (UAC) when you run the file. Click "Yes" to allow it.
        </WarningBanner>
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto py-12 px-4 sm:px-6 space-y-6">
      <Link to="/community" className="flex items-center gap-1.5 text-sm text-surface-400 hover:text-white transition-colors">
        <ArrowLeft className="w-4 h-4" />
        Back to library
      </Link>

      <div className="flex items-start gap-4">
        <div className="w-12 h-12 bg-brand-600/15 rounded-xl flex items-center justify-center shrink-0">
          <fix.icon className="w-6 h-6 text-brand-400" />
        </div>
        <div>
          <p className="text-xs text-surface-500 uppercase tracking-wider font-medium">{fix.category}</p>
          <h1 className="text-2xl font-bold text-white">{fix.title}</h1>
        </div>
      </div>

      <p className="text-surface-300 leading-relaxed">{fix.longDescription}</p>

      <div className="text-surface-500 text-sm">{downloadCount.toLocaleString()} downloads</div>

      {error && (
        <div className="bg-red-950/50 border border-red-800/50 rounded-2xl p-6">
          <h3 className="text-red-300 font-semibold mb-2">Something went wrong</h3>
          <p className="text-red-400/80 text-sm">{error}</p>
          <Button variant="secondary" size="sm" className="mt-3" onClick={handleGenerate}>Try again</Button>
        </div>
      )}

      {loading ? (
        <LoadingSpinner message={`Generating ${fix.title} fix...`} />
      ) : (
        <Button size="lg" className="w-full" onClick={handleGenerate}>
          Generate Fix Script
        </Button>
      )}

      <WarningBanner>
        This fix will be generated specifically for your system. You will see exactly what the script does before downloading it, and you will receive an undo file to reverse any changes.
      </WarningBanner>
    </div>
  )
}