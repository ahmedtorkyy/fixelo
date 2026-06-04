import { useState, useCallback, useRef, useEffect } from "react"
import { generateContent } from "@/lib/gemini"
import { buildAgentPrompt, parseAgentResponse } from "@/lib/prompts/agentPrompt"
import { createConversation, addMessage, saveConversation, deleteConversation, loadConversations, clearAllConversations, saveActiveConversationId, loadActiveConversationId } from "@/lib/agentStorage"
import { downloadBatFile, generateFixFilename, generateUndoFilename } from "@/lib/batGenerator"
import { getToolConfig } from "@/lib/toolConfigs"
import type { Conversation, ChatMessage, AgentStep } from "@/types/agent"
import { generateMessageId } from "@/lib/agentStorage"

const FIXIE_GREETING: ChatMessage = {
  id: "greeting",
  role: "assistant",
  content: "Hey! I'm Fixie, your Windows assistant. Tell me what's going on with your PC and I'll help you fix it. I can handle multiple problems at once, set up your PC, or automate anything on Windows.\n\nWhat can I help you with?",
  timestamp: Date.now(),
}

export function useAgent() {
  const [conversation, setConversation] = useState<Conversation | null>(() => {
    const activeId = loadActiveConversationId()
    if (!activeId) return null
    return loadConversations().find((c) => c.id === activeId) ?? null
  })
  const [conversationsList, setConversationsList] = useState<Conversation[]>(() => loadConversations())
  const [step, setStep] = useState<AgentStep>("chatting")
  const [input, setInput] = useState("")
  const abortRef = useRef(false)

  // Remember which conversation is open so a page refresh (F5) restores it.
  useEffect(() => {
    saveActiveConversationId(conversation?.id ?? null)
  }, [conversation])

  const sendMessage = useCallback(async (text: string) => {
    let conv = conversation

    if (!conv) {
      conv = createConversation(text)
    }

    const userMsg: ChatMessage = {
      id: generateMessageId(),
      role: "user",
      content: text,
      timestamp: Date.now(),
    }

    conv = addMessage(conv, userMsg)
    setConversation(conv)

    setStep("generating")
    abortRef.current = false

    try {
      const allMessages = conv.messages.map((m) => ({
        role: m.role as "user" | "assistant",
        content: m.content,
      }))

      const prompt = buildAgentPrompt(allMessages)
      const raw = await generateContent(prompt)

      if (abortRef.current) {
        setStep("chatting")
        return
      }

      const parsed = parseAgentResponse(raw)

      let assistantMsg: ChatMessage

      if (parsed.type === "tool-suggestion" && parsed.toolSuggestion) {
        const cfg = getToolConfig(parsed.toolSuggestion.slug)
        const toolName = cfg?.title ?? parsed.toolSuggestion.slug
        assistantMsg = {
          id: generateMessageId(),
          role: "assistant",
          content: parsed.content || `I recommend using the **${toolName}** tool for this.`,
          timestamp: Date.now(),
          isToolSuggestion: true,
          suggestedToolSlug: parsed.toolSuggestion.slug,
          suggestedToolName: toolName,
        }
      } else if (parsed.type === "script") {
        assistantMsg = {
          id: generateMessageId(),
          role: "assistant",
          content: parsed.content || "I've generated your fix script!",
          timestamp: Date.now(),
          isScript: true,
          fixScript: parsed.scriptData?.fixScript ?? "",
          undoScript: parsed.scriptData?.undoScript ?? "",
          fixFilename: generateFixFilename(text),
          undoFilename: generateUndoFilename(generateFixFilename(text)),
        }
      } else {
        const content = parsed.content?.trim()
        assistantMsg = {
          id: generateMessageId(),
          role: "assistant",
          content: content || "I received your message. How can I help you with your Windows PC?",
          timestamp: Date.now(),
        }
      }

      conv = addMessage(conv, assistantMsg)
      setConversation(conv)
      saveConversation(conv)
      setConversationsList(loadConversations())
      setStep("chatting")
    } catch (err) {
      const errorMsg: ChatMessage = {
        id: generateMessageId(),
        role: "assistant",
        content: err instanceof Error ? err.message : "Something went wrong. Please try again.",
        timestamp: Date.now(),
      }
      conv = addMessage(conv, errorMsg)
      setConversation(conv)
      setStep("chatting")
    }
  }, [conversation])

  const handleQuickStart = useCallback((text: string) => {
    setInput("")
    sendMessage(text)
  }, [sendMessage])

  const handleSend = useCallback(() => {
    if (!input.trim()) return
    const text = input.trim()
    setInput("")
    sendMessage(text)
  }, [input, sendMessage])

  const handleDownloadFix = useCallback((msg: ChatMessage) => {
    if (!msg.fixScript) return
    downloadBatFile(msg.fixScript, msg.fixFilename ?? "FixeloFix.bat")
  }, [])

  const handleDownloadUndo = useCallback((msg: ChatMessage) => {
    if (!msg.undoScript) return
    downloadBatFile(msg.undoScript, msg.undoFilename ?? "UndoFix.bat")
  }, [])

  const startNewConversation = useCallback(() => {
    setConversation(null)
    setStep("chatting")
    setInput("")
  }, [])

  const loadConversation = useCallback((id: string) => {
    const convs = loadConversations()
    const conv = convs.find((c) => c.id === id) ?? null
    setConversation(conv)
    setStep("chatting")
  }, [])

  const handleDeleteConversation = useCallback((id: string) => {
    deleteConversation(id)
    setConversationsList(loadConversations())
    if (conversation?.id === id) {
      setConversation(null)
    }
  }, [conversation])

  const handleUseTool = useCallback((slug: string) => {
    // Navigate to the tool page — handled by the caller via window.location
  }, [])

  const handleClearAll = useCallback(() => {
    clearAllConversations()
    setConversationsList([])
    setConversation(null)
  }, [])

  const messages = conversation
    ? conversation.messages
    : [FIXIE_GREETING]

  return {
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
    handleUseTool,
    startNewConversation,
    loadConversation,
    handleDeleteConversation,
    handleClearAll,
    hasConversation: conversation !== null,
  }
}