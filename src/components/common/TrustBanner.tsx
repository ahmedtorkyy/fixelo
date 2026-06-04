import { ShieldCheck, FileSearch } from "lucide-react"

export function TrustBanner() {
  return (
    <div className="bg-surface-900/50 border border-surface-700 rounded-xl p-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="flex items-center gap-2.5">
          <FileSearch className="w-4 h-4 text-surface-400 shrink-0" />
          <p className="text-xs text-surface-400">
            <span className="text-surface-300 font-medium">Fully transparent</span> — tap "See script code" to read every command before running it.
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <ShieldCheck className="w-4 h-4 text-surface-400 shrink-0" />
          <p className="text-xs text-surface-400">
            <span className="text-surface-300 font-medium">Undo included</span> — every fix comes with an undo script that reverses all changes.
          </p>
        </div>
      </div>
    </div>
  )
}