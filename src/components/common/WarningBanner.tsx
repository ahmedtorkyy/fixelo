import { AlertTriangle } from "lucide-react"

interface WarningBannerProps {
  children: React.ReactNode
}

export function WarningBanner({ children }: WarningBannerProps) {
  return (
    <div className="bg-amber-950/40 border border-amber-800/50 rounded-xl p-4">
      <div className="flex items-start gap-3">
        <AlertTriangle className="w-5 h-5 text-amber-400 mt-0.5 shrink-0" />
        <div className="text-sm text-amber-200/90 leading-relaxed">{children}</div>
      </div>
    </div>
  )
}