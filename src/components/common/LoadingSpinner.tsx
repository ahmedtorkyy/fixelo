import { Loader2 } from "lucide-react"

interface LoadingSpinnerProps {
  message?: string
}

export function LoadingSpinner({ message = "Generating your fix..." }: LoadingSpinnerProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 gap-4">
      <div className="relative">
        <div className="w-16 h-16 rounded-full border-4 border-surface-800" />
        <Loader2 className="w-16 h-16 text-brand-500 animate-spin absolute inset-0" />
      </div>
      <p className="text-surface-300 text-sm font-medium">{message}</p>
      <p className="text-surface-500 text-xs">
        This usually takes 10-20 seconds
      </p>
    </div>
  )
}