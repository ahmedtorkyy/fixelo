import path from "path"
import fs from "fs"
import react from "@vitejs/plugin-react"
import tailwindcss from "@tailwindcss/vite"
import { defineConfig, type Plugin } from "vite"

// Load .env manually for the AI proxy (Vite doesn't expose non-VITE_ vars to process.env)
function loadApiKeys(): { openrouter: string; groq: string } {
  const envPath = path.resolve(__dirname, ".env")
  const keys = { openrouter: "", groq: "" }
  try {
    const content = fs.readFileSync(envPath, "utf-8")
    for (const line of content.split("\n")) {
      const trimmed = line.trim()
      if (!trimmed || trimmed.startsWith("#")) continue
      const eq = trimmed.indexOf("=")
      if (eq === -1) continue
      const k = trimmed.slice(0, eq).trim()
      const v = trimmed.slice(eq + 1).trim()
      if (k === "OPENROUTER_API_KEY") keys.openrouter = v
      if (k === "GROQ_API_KEY") keys.groq = v
    }
  } catch { /* .env may not exist */ }
  return keys
}

const aiProxyPlugin: Plugin = {
  name: "ai-proxy",
  configureServer(server) {
    server.middlewares.use("/api/ai", async (req, res) => {
      if (req.method !== "POST") {
        res.statusCode = 405
        res.end("Method not allowed")
        return
      }

      let body = ""
      for await (const chunk of req) body += chunk

      let parsed: { messages?: { role: string; content: string }[]; provider?: string }
      try {
        parsed = JSON.parse(body)
      } catch {
        res.statusCode = 400
        res.end("Invalid JSON")
        return
      }

      const provider = parsed.provider ?? "openrouter"
      const messages = parsed.messages ?? []

      try {
        const keys = loadApiKeys()
        let content: string
        if (provider === "groq") {
          if (!keys.groq) throw new Error("GROQ_API_KEY not set in .env")
          content = await callGroq(keys.groq, messages)
        } else {
          if (!keys.openrouter) throw new Error("OPENROUTER_API_KEY not set in .env")
          content = await callOpenRouter(keys.openrouter, messages)
        }

        res.setHeader("Content-Type", "application/json")
        res.end(JSON.stringify({ content }))
      } catch (err: any) {
        res.statusCode = 502
        res.end(JSON.stringify({ error: err.message }))
      }
    })
  },
}

async function callOpenRouter(
  apiKey: string,
  messages: { role: string; content: string }[]
): Promise<string> {
  const models = [
    "meta-llama/llama-3.3-70b-instruct:free",
    "google/gemma-4-31b-it:free",
  ]
  for (const model of models) {
    const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({ model, messages, temperature: 0.3, max_tokens: 8192 }),
    })
    if (!res.ok) {
      if (res.status === 429 || res.status === 413) continue
      const body = await res.text()
      throw new Error(`OpenRouter ${res.status}: ${body.slice(0, 200)}`)
    }
    const data = await res.json()
    const c: string = data.choices?.[0]?.message?.content ?? ""
    if (c?.trim()) return c
  }
  throw new Error("All OpenRouter models failed or rate limited")
}

async function callGroq(
  apiKey: string,
  messages: { role: string; content: string }[]
): Promise<string> {
  const models = [
    "llama-3.3-70b-versatile",
    "llama-3.1-8b-instant",
    "gemma2-9b-it",
  ]
  for (const model of models) {
    const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({ model, messages, temperature: 0.3, max_tokens: 8192 }),
    })
    if (!res.ok) {
      if (res.status === 429 || res.status === 413) continue
      const body = await res.text()
      throw new Error(`Groq ${res.status}: ${body.slice(0, 200)}`)
    }
    const data = await res.json()
    const c: string = data.choices?.[0]?.message?.content ?? ""
    if (c?.trim()) return c
  }
  throw new Error("All Groq models failed or rate limited")
}

export default defineConfig({
  plugins: [react(), tailwindcss(), aiProxyPlugin],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
})