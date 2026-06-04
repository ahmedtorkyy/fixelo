import { useState, useEffect, createContext, useContext, useCallback } from "react"
import { CheckCircle, XCircle, X } from "lucide-react"

interface Toast {
  id: string
  message: string
  type: "success" | "error"
}

interface ToastContextValue {
  showToast: (message: string, type?: "success" | "error") => void
}

const ToastContext = createContext<ToastContextValue>({ showToast: () => {} })

export function useToast() {
  return useContext(ToastContext)
}

let externalShowToast: ((message: string, type?: "success" | "error") => void) | null = null

export function showToast(message: string, type: "success" | "error" = "success") {
  externalShowToast?.(message, type)
}

export function ToastContainer() {
  const [toasts, setToasts] = useState<Toast[]>([])

  const addToast = useCallback((message: string, type: "success" | "error" = "success") => {
    const id = Date.now().toString(36)
    setToasts((prev) => [...prev, { id, message, type }])
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id))
    }, 3000)
  }, [])

  useEffect(() => {
    externalShowToast = addToast
    return () => { externalShowToast = null }
  }, [addToast])

  if (toasts.length === 0) return null

  return (
    <div
      className="fixed bottom-6 right-6 z-50 flex flex-col gap-2 pointer-events-none"
      role="status"
      aria-live="polite"
      aria-atomic="true"
    >
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg pointer-events-auto card-enter ${
            toast.type === "success"
              ? "bg-green-950 border border-green-800/60 text-green-300"
              : "bg-red-950 border border-red-800/60 text-red-300"
          }`}
        >
          {toast.type === "success"
            ? <CheckCircle className="w-4 h-4 shrink-0" />
            : <XCircle className="w-4 h-4 shrink-0" />
          }
          <span className="text-sm font-medium">{toast.message}</span>
          <button
            onClick={() => setToasts((prev) => prev.filter((t) => t.id !== toast.id))}
            className="ml-1 opacity-60 hover:opacity-100 cursor-pointer"
            aria-label="Dismiss notification"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      ))}
    </div>
  )
}
