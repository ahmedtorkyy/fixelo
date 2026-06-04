import { useState } from "react"
import { ChevronDown, ChevronUp } from "lucide-react"

interface CodeBlockProps {
  code: string
  title: string
}

export function CodeBlock({ code, title }: CodeBlockProps) {
  const [expanded, setExpanded] = useState(false)

  return (
    <div className="bg-surface-950 border border-surface-800 rounded-xl overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        aria-expanded={expanded}
        className="w-full flex items-center justify-between px-4 py-3 text-sm text-surface-300 hover:text-white hover:bg-surface-900 transition-colors cursor-pointer"
      >
        <span className="font-medium">{title}</span>
        {expanded ? (
          <ChevronUp className="w-4 h-4" />
        ) : (
          <ChevronDown className="w-4 h-4" />
        )}
      </button>
      {expanded && (
        <div className="border-t border-surface-800">
          <pre className="p-4 text-xs text-green-400 font-mono overflow-x-auto leading-relaxed whitespace-pre-wrap break-all">
            {code}
          </pre>
        </div>
      )}
    </div>
  )
}