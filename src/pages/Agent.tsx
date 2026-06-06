import { useEffect, useRef, useState } from "react"
import { Link, useLocation, useNavigate } from "react-router"
import { ArrowLeft, Send, Download, ShieldOff, Plus, Trash2, MessageSquare, Menu, X, CheckCircle2, Wrench } from "lucide-react"
import { Button } from "@/components/common/Button"
import { VoiceInput } from "@/components/common/VoiceInput"
import { Seo } from "@/components/common/Seo"
import { WarningBanner } from "@/components/common/WarningBanner"
import { CodeBlock } from "@/components/fix/CodeBlock"
import { VerifyResult } from "@/components/fix/VerifyResult"
import { useAgent } from "@/hooks/useAgent"
import { RotatingStatus } from "@/components/common/RotatingStatus"
import { AGENT_STATUS_MESSAGES } from "@/lib/statusMessages"
import type { ChatMessage, Conversation } from "@/types/agent"

const QUICK_STARTS = [
  { label: "Set Up My PC", prompt: "I just got a new PC. Can you help me set it up? I want to remove bloatware, install essential apps, and apply good privacy and performance settings." },
  { label: "Fix Multiple Problems", prompt: "I have a few problems with my PC. My WiFi keeps disconnecting, Windows Update is stuck, and my audio stopped working. Can you help with all of them?" },
  { label: "Automate My PC", prompt: "I want to automate some tasks on my PC. Can you set up automatic weekly cleanup, schedule a shutdown time, and create a backup routine for my Documents folder." },
]

function ScriptBubble({ message, onDownloadFix, onDownloadUndo }: {
  message: ChatMessage
  onDownloadFix: (msg: ChatMessage) => void
  onDownloadUndo: (msg: ChatMessage) => void
}) {
  const [downloaded, setDownloaded] = useState(false)
  const fixName = message.fixFilename ?? "FixeloFix.bat"
  const undoName = message.undoFilename ?? "UndoFix.bat"

  return (
    <div className="max-w-[85%] space-y-4">
      <div className="bg-surface-900 border border-surface-800 rounded-2xl rounded-tl-sm p-4 space-y-3">
        <p className="text-surface-300 text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
      </div>

      <div className="bg-surface-900 border border-brand-600/30 rounded-2xl p-5 space-y-4">
        <div className="flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 text-brand-400 shrink-0" />
          <h3 className="text-base font-semibold text-white">Your Fix Script Is Ready</h3>
        </div>

        <div className="space-y-2">
          {!downloaded ? (
            <Button size="lg" className="w-full" onClick={() => { onDownloadFix(message); setDownloaded(true) }}>
              <Download className="w-5 h-5" />
              Download {fixName}
            </Button>
          ) : (
            <div className="space-y-2">
              <div className="bg-green-950/30 border border-green-800/40 rounded-xl p-3 text-center text-green-300 text-sm font-medium">
                Fix downloaded! Also download the undo file for safety.
              </div>
              <Button variant="secondary" size="md" className="w-full" onClick={() => onDownloadUndo(message)}>
                <ShieldOff className="w-4 h-4" />
                Download {undoName}
              </Button>
              <Button variant="secondary" size="sm" className="w-full" onClick={() => onDownloadFix(message)}>
                <Download className="w-4 h-4" />
                Re-download {fixName}
              </Button>
            </div>
          )}
        </div>

        <WarningBanner>
          <strong>Windows may show a permission popup (UAC) when you run the file.</strong> Click "Yes" to allow it.
        </WarningBanner>

        <CodeBlock title="See script code (advanced)" code={message.fixScript ?? ""} />

        <VerifyResult intendedAction={message.content} defaultOpen={false} />
      </div>
    </div>
  )
}

function ToolSuggestionBubble({ message, onUseTool }: {
  message: ChatMessage
  onUseTool: (slug: string) => void
}) {
  return (
    <div className="max-w-[85%] space-y-3">
      <div className="bg-surface-900 border border-brand-600/30 rounded-2xl rounded-tl-sm p-4 space-y-3">
        <div className="flex items-center gap-2">
          <Wrench className="w-5 h-5 text-brand-400 shrink-0" />
          <h3 className="text-base font-semibold text-white">Found a matching tool</h3>
        </div>
        <p className="text-surface-300 text-sm leading-relaxed">{message.content}</p>
        <Button size="md" className="w-full" onClick={() => onUseTool(message.suggestedToolSlug ?? "")}>
          <Wrench className="w-4 h-4" />
          Open {message.suggestedToolName ?? "Tool"}
        </Button>
      </div>
    </div>
  )
}

function MessageBubble({ message, onDownloadFix, onDownloadUndo, onUseTool }: {
  message: ChatMessage
  onDownloadFix: (msg: ChatMessage) => void
  onDownloadUndo: (msg: ChatMessage) => void
  onUseTool: (slug: string) => void
}) {
  const isUser = message.role === "user"

  if (message.isToolSuggestion && message.suggestedToolSlug) {
    return (
      <div className="flex justify-start">
        <ToolSuggestionBubble message={message} onUseTool={onUseTool} />
      </div>
    )
  }

  if (message.isScript && message.fixScript) {
    return (
      <div className="flex justify-start">
        <ScriptBubble message={message} onDownloadFix={onDownloadFix} onDownloadUndo={onDownloadUndo} />
      </div>
    )
  }

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div className={`max-w-[85%] px-4 py-3 ${isUser
        ? "bg-brand-600 rounded-2xl rounded-tr-sm"
        : "bg-surface-900 border border-surface-800 rounded-2xl rounded-tl-sm"
      }`}>
        <p className={`text-sm leading-relaxed whitespace-pre-wrap ${isUser ? "text-white" : "text-surface-300"}`}>
          {message.content}
        </p>
        <p className={`text-xs mt-1.5 ${isUser ? "text-brand-200" : "text-surface-600"}`}>
          {new Date(message.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
        </p>
      </div>
    </div>
  )
}

function ConversationItem({ conv, isActive, onLoad, onDelete }: {
  conv: Conversation
  isActive: boolean
  onLoad: () => void
  onDelete: () => void
}) {
  return (
    <div
      className={`flex items-center gap-2 px-3 py-2.5 rounded-lg cursor-pointer group transition-colors ${
        isActive ? "bg-brand-600/15 border border-brand-600/30" : "hover:bg-surface-800"
      }`}
      onClick={onLoad}
    >
      <MessageSquare className="w-3.5 h-3.5 text-surface-500 shrink-0" />
      <span className="flex-1 text-xs text-surface-300 truncate">{conv.title}</span>
      <button
        onClick={(e) => { e.stopPropagation(); onDelete() }}
        className="opacity-0 group-hover:opacity-100 text-surface-600 hover:text-red-400 transition-all cursor-pointer"
      >
        <Trash2 className="w-3 h-3" />
      </button>
    </div>
  )
}

export default function AgentPage() {
  const {
    conversation,
    conversationsList,
    messages,
    step,
    input,
    setInput,
    handleSend,
    handleQuickStart,
    handleDownloadFix,
    handleDownloadUndo,
    startNewConversation,
    loadConversation,
    handleDeleteConversation,
    handleClearAll,
    hasConversation,
  } = useAgent()

  const location = useLocation()
  const navigate = useNavigate()
  const handoffDone = useRef(false)

  useEffect(() => {
    const handoff = (location.state as { handoff?: string } | null)?.handoff
    if (handoff && !handoffDone.current) {
      handoffDone.current = true
      handleQuickStart(handoff)
      navigate("/agent", { replace: true })
    }
  }, [location.state, handleQuickStart, navigate])

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const isGenerating = step === "generating"

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages, isGenerating])

  return (
    <>
    <Seo title="Fixie AI Agent — Conversational Windows Fixer" description="Chat with Fixie, your AI Windows assistant. Describe your problems conversationally and get safe PowerShell scripts with automatic undo." canonical="https://fixelo.pages.dev/agent" />
    <div className="flex h-[calc(100vh-4rem)] overflow-hidden">

      {/* Sidebar */}
      <div className={`${sidebarOpen ? "w-64" : "w-0"} shrink-0 transition-all duration-200 overflow-hidden border-r border-surface-800 bg-surface-950 flex flex-col`}>
        <div className="p-3 border-b border-surface-800 flex items-center justify-between">
          <span className="text-xs font-semibold text-surface-400 uppercase tracking-wider">Conversations</span>
          {conversationsList.length > 0 && (
            <button onClick={handleClearAll} className="text-xs text-surface-600 hover:text-red-400 transition-colors cursor-pointer">
              Clear all
            </button>
          )}
        </div>
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {conversationsList.length === 0 ? (
            <p className="text-xs text-surface-600 text-center py-4">No saved conversations</p>
          ) : (
            conversationsList.map((conv) => (
              <ConversationItem
                key={conv.id}
                conv={conv}
                isActive={conversation?.id === conv.id}
                onLoad={() => { loadConversation(conv.id); setSidebarOpen(false) }}
                onDelete={() => handleDeleteConversation(conv.id)}
              />
            ))
          )}
        </div>
      </div>

      {/* Main chat area */}
      <div className="flex-1 flex flex-col min-w-0">

        {/* Header */}
        <div className="border-b border-surface-800 bg-surface-950 px-4 py-3 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="text-surface-400 hover:text-white transition-colors cursor-pointer"
              title="Conversation history"
            >
              {sidebarOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
            </button>
            <div className="w-8 h-8 bg-brand-600 rounded-lg flex items-center justify-center">
              <span className="text-white text-sm font-bold">F</span>
            </div>
            <div>
              <h1 className="text-white font-semibold text-sm">Fixie</h1>
              <p className="text-surface-500 text-xs">Your Windows AI assistant</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => { startNewConversation(); setSidebarOpen(false) }}
              className="flex items-center gap-1.5 text-sm text-surface-400 hover:text-white transition-colors cursor-pointer"
              title="New conversation"
            >
              <Plus className="w-4 h-4" />
              New chat
            </button>
            <Link to="/" className="text-surface-400 hover:text-white text-sm flex items-center gap-1">
              <ArrowLeft className="w-4 h-4" />
              Home
            </Link>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 py-6 space-y-4">
          {messages.map((msg) => (
            <MessageBubble
              key={msg.id}
              message={msg}
              onDownloadFix={handleDownloadFix}
              onDownloadUndo={handleDownloadUndo}
              onUseTool={(slug) => navigate(`/tools/${slug}`)}
            />
          ))}

          {isGenerating && (
            <div className="flex justify-start">
              <RotatingStatus messages={AGENT_STATUS_MESSAGES} />
            </div>
          )}

          {!hasConversation && messages.length <= 1 && (
            <div className="mt-8">
              <p className="text-surface-500 text-sm text-center mb-4">Quick start:</p>
              <div className="flex flex-col sm:flex-row gap-2 justify-center">
                {QUICK_STARTS.map((qs) => (
                  <button
                    key={qs.label}
                    onClick={() => handleQuickStart(qs.prompt)}
                    disabled={isGenerating}
                    className="px-4 py-2.5 bg-surface-900 border border-surface-700 rounded-xl text-sm text-surface-300 hover:border-brand-600 hover:text-brand-300 transition-colors cursor-pointer disabled:opacity-50"
                  >
                    {qs.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="border-t border-surface-800 bg-surface-950 p-4 shrink-0">
          <form
            onSubmit={(e) => { e.preventDefault(); handleSend() }}
            className="flex gap-2"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Describe your problem or what you need..."
              disabled={isGenerating}
              className="flex-1 bg-surface-900 border border-surface-700 rounded-xl px-4 py-3 text-white placeholder-surface-500 focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 text-sm disabled:opacity-50"
            />
            <VoiceInput onTranscript={(text) => setInput((prev) => prev ? prev + " " + text : text)} disabled={isGenerating} />
            <Button type="submit" disabled={isGenerating || !input.trim()} size="md">
              <Send className="w-4 h-4" />
              {isGenerating ? "Thinking..." : "Send"}
            </Button>
          </form>
          <p className="text-xs text-surface-600 mt-2 text-center">
            Fixie generates Windows scripts using AI. Always review scripts before running them.
          </p>
        </div>
      </div>
    </div>
    </>
  )
}