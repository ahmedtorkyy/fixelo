export type MessageRole = "user" | "assistant"

export interface ChatMessage {
  id: string
  role: MessageRole
  content: string
  timestamp: number
  isPlan?: boolean
  planSteps?: string[]
  isScript?: boolean
  fixScript?: string
  undoScript?: string
  fixFilename?: string
  undoFilename?: string
}

export interface Conversation {
  id: string
  title: string
  messages: ChatMessage[]
  createdAt: number
  updatedAt: number
}

export type AgentStep = "chatting" | "generating" | "done"