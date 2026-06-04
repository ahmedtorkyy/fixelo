import { AlertTriangle } from "lucide-react"

interface ErrorMessageProps {
  message: string
  onRetry?: () => void
}

export function ErrorMessage({ message, onRetry }: ErrorMessageProps) {
  return (
    <div className="bg-red-950/50 border border-red-800/50 rounded-2xl p-6">
      <div className="flex items-start gap-3">
        <AlertTriangle className="w-5 h-5 text-red-400 mt-0.5 shrink-0" />
        <div className="flex-1">
          <h3 className="text-red-300 font-semibold text-sm">Something went wrong</h3>
          <p className="text-red-400/80 text-sm mt-1">{message}</p>
          {onRetry && (
            <button
              onClick={onRetry}
              className="mt-3 text-sm text-red-300 hover:text-red-200 underline underline-offset-2 cursor-pointer"
            >
              Try again
            </button>
          )}
        </div>
      </div>
    </div>
  )
}