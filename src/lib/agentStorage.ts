import type { Conversation, ChatMessage } from "@/types/agent"

const STORAGE_KEY = "fixelo_agent_history"
const ACTIVE_KEY = "fixelo_agent_active_id"
const MAX_CONVERSATIONS = 20

export function saveActiveConversationId(id: string | null): void {
  if (id) localStorage.setItem(ACTIVE_KEY, id)
  else localStorage.removeItem(ACTIVE_KEY)
}

export function loadActiveConversationId(): string | null {
  return localStorage.getItem(ACTIVE_KEY)
}

export function loadConversations(): Conversation[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    return JSON.parse(raw) as Conversation[]
  } catch {
    return []
  }
}

export function saveConversation(conversation: Conversation): void {
  const conversations = loadConversations()
  const idx = conversations.findIndex((c) => c.id === conversation.id)
  if (idx >= 0) {
    conversations[idx] = { ...conversation, updatedAt: Date.now() }
  } else {
    conversations.unshift(conversation)
  }
  const trimmed = conversations.slice(0, MAX_CONVERSATIONS)
  localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed))
}

export function deleteConversation(id: string): void {
  const conversations = loadConversations().filter((c) => c.id !== id)
  localStorage.setItem(STORAGE_KEY, JSON.stringify(conversations))
}

export function clearAllConversations(): void {
  localStorage.removeItem(STORAGE_KEY)
}

export function generateMessageId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8)
}

export function generateConversationId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8)
}

export function createConversation(firstMessage: string): Conversation {
  return {
    id: generateConversationId(),
    title: firstMessage.slice(0, 50) + (firstMessage.length > 50 ? "..." : ""),
    messages: [],
    createdAt: Date.now(),
    updatedAt: Date.now(),
  }
}

export function addMessage(conversation: Conversation, message: ChatMessage): Conversation {
  return {
    ...conversation,
    messages: [...conversation.messages, message],
    updatedAt: Date.now(),
  }
}