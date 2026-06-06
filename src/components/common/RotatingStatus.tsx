import { useEffect, useState } from "react"

interface RotatingStatusProps {
  messages: string[]
  interval?: number
}

export function RotatingStatus({ messages, interval = 3000 }: RotatingStatusProps) {
  const [index, setIndex] = useState(0)
  const current = messages[index % messages.length]

  useEffect(() => {
    const t = setInterval(() => setIndex((i) => i + 1), interval)
    return () => clearInterval(t)
  }, [messages.length, interval])

  return (
    <div className="flex items-start gap-3">
      <div className="w-8 h-8 bg-brand-600 rounded-lg flex items-center justify-center shrink-0 mt-0.5">
        <span className="text-white text-sm font-bold">F</span>
      </div>
      <div className="bg-surface-900 border border-surface-800 rounded-2xl rounded-tl-sm px-4 py-3 space-y-2 min-w-[200px]">
        <p className="text-surface-300 text-sm" key={index}>{current}</p>
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 bg-brand-400 rounded-full animate-pulse" />
          <div className="w-2 h-2 bg-brand-400 rounded-full animate-pulse" style={{ animationDelay: "0.2s" }} />
          <div className="w-2 h-2 bg-brand-400 rounded-full animate-pulse" style={{ animationDelay: "0.4s" }} />
        </div>
      </div>
    </div>
  )
}
