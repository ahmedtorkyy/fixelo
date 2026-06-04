import { useFixHistory } from "@/hooks/useFixHistory"
import { Card } from "@/components/common/Card"
import { Button } from "@/components/common/Button"
import { downloadBatFile, generateFixFilenameFromProblem, generateUndoFilenameFromFix } from "@/lib/batGenerator"
import { Clock, Download, Trash2, RotateCcw } from "lucide-react"
import type { HistoryEntry } from "@/types/fix"

export default function HistoryPage() {
  const { history, clearAll } = useFixHistory()

  const handleDownload = (entry: HistoryEntry, type: "fix" | "undo") => {
    const fixFilename = generateFixFilenameFromProblem(entry.problemDescription)
    if (type === "fix") {
      downloadBatFile(entry.fixResult.fixScript, fixFilename)
    } else {
      const undoFilename = generateUndoFilenameFromFix(fixFilename)
      downloadBatFile(entry.fixResult.undoScript, undoFilename)
    }
  }

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    })
  }

  return (
    <div className="max-w-4xl mx-auto py-12 px-4 sm:px-6">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white">My Fixes</h1>
          <p className="text-surface-400 mt-1">Your recent fix history — up to 10 fixes are saved locally.</p>
        </div>
        {history.length > 0 && (
          <Button variant="danger" size="sm" onClick={clearAll}>
            <Trash2 className="w-4 h-4" />
            Clear All
          </Button>
        )}
      </div>

      {history.length === 0 ? (
        <Card className="text-center py-16">
          <Clock className="w-12 h-12 text-surface-600 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-white mb-2">No fixes yet</h2>
          <p className="text-surface-400">
            When you generate fixes, they'll appear here so you can re-download them.
          </p>
        </Card>
      ) : (
        <div className="space-y-4">
          {history.map((entry) => (
            <Card key={entry.id} hover>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <p className="text-white font-medium truncate">
                    {entry.problemDescription}
                  </p>
                  <p className="text-surface-500 text-sm mt-1">
                    {formatDate(entry.timestamp)}
                  </p>
                  {entry.status === "success" && (
                    <span className="inline-block mt-2 text-xs px-2 py-0.5 rounded-full bg-green-600/20 text-green-400 font-medium">Worked</span>
                  )}
                  {entry.status === "failed" && (
                    <span className="inline-block mt-2 text-xs px-2 py-0.5 rounded-full bg-amber-600/20 text-amber-400 font-medium">Didn't work</span>
                  )}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => handleDownload(entry, "fix")}
                  >
                    <Download className="w-3.5 h-3.5" />
                    Fix
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDownload(entry, "undo")}
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    Undo
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}