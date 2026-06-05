import path from "path"
import fs from "fs"
import react from "@vitejs/plugin-react"
import tailwindcss from "@tailwindcss/vite"
import { defineConfig, type Plugin } from "vite"

// Load .env manually for the AI proxy (Vite doesn't expose non-VITE_ vars to process.env)
function loadApiKeys(): { openrouter: string; groq: string; google: string } {
  const envPath = path.resolve(__dirname, ".env")
  const keys = { openrouter: "", groq: "", google: "" }
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
      if (k === "GOOGLE_API_KEY") keys.google = v
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

      const provider = parsed.provider ?? "groq"
      const messages = parsed.messages ?? []

      try {
        const keys = loadApiKeys()
        let content: string
        if (provider === "groq") {
          if (!keys.groq) throw new Error("GROQ_API_KEY not set in .env")
          content = await callGroq(keys.groq, messages)
        } else if (provider === "gemini") {
          if (!keys.google) throw new Error("GOOGLE_API_KEY not set in .env")
          content = await callGemini(keys.google, messages)
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

const OPENROUTER_MODELS = [
  "meta-llama/llama-3.3-70b-instruct:free",
  "qwen/qwen3-coder:free",
  "meta-llama/llama-4-scout:free",
  "google/gemma-4-31b-it:free",
]

const GROQ_MODELS = [
  "llama-3.3-70b-versatile",
  "meta-llama/llama-4-scout-17b-16e-instruct",
  "llama-3.1-8b-instant",
  "gemma2-9b-it",
]

const GEMINI_MODELS = ["gemini-2.0-flash", "gemini-1.5-flash"]

async function callOpenRouter(
  apiKey: string,
  messages: { role: string; content: string }[]
): Promise<string> {
  for (const model of OPENROUTER_MODELS) {
    const controller = new AbortController()
    const t = setTimeout(() => controller.abort(), 15000)
    try {
      const body: Record<string, unknown> = { model, messages, temperature: 0.3, max_tokens: 16384, response_format: { type: "json_object" } }
      const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
        body: JSON.stringify(body),
        signal: controller.signal,
      })
      if (!res.ok) {
        const bodyText = await res.text().catch(() => "")
        if (res.status === 429 || res.status === 413) continue
        if (res.status === 400 && bodyText.includes("response_format")) {
          const retryBody = { model, messages, temperature: 0.3, max_tokens: 16384 }
          const retryRes = await fetch("https://openrouter.ai/api/v1/chat/completions", {
            method: "POST",
            headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
            body: JSON.stringify(retryBody),
            signal: controller.signal,
          })
          if (!retryRes.ok) {
            if (retryRes.status === 429 || retryRes.status === 413) continue
            continue
          }
          const data = await retryRes.json() as { choices?: { message?: { content?: string } }[] }
          const c: string = data.choices?.[0]?.message?.content ?? ""
          if (c?.trim()) return c
          continue
        }
        continue
      }
      const data = await res.json() as { choices?: { message?: { content?: string } }[] }
      const c: string = data.choices?.[0]?.message?.content ?? ""
      if (c?.trim()) return c
    } catch {
      continue
    } finally {
      clearTimeout(t)
    }
  }
  throw new Error("All OpenRouter models failed or timed out")
}

async function callGroq(
  apiKey: string,
  messages: { role: string; content: string }[]
): Promise<string> {
  for (const model of GROQ_MODELS) {
    const controller = new AbortController()
    const t = setTimeout(() => controller.abort(), 15000)
    try {
      const body: Record<string, unknown> = { model, messages, temperature: 0.3, max_tokens: 16384, response_format: { type: "json_object" } }
      const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
        body: JSON.stringify(body),
        signal: controller.signal,
      })
      if (!res.ok) {
        const bodyText = await res.text().catch(() => "")
        if (res.status === 429 || res.status === 413) continue
        if (res.status === 400 && bodyText.includes("response_format")) {
          const retryBody = { model, messages, temperature: 0.3, max_tokens: 16384 }
          const retryRes = await fetch("https://api.groq.com/openai/v1/chat/completions", {
            method: "POST",
            headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
            body: JSON.stringify(retryBody),
            signal: controller.signal,
          })
          if (!retryRes.ok) {
            if (retryRes.status === 429 || retryRes.status === 413) continue
            continue
          }
          const data = await retryRes.json() as { choices?: { message?: { content?: string } }[] }
          const c: string = data.choices?.[0]?.message?.content ?? ""
          if (c?.trim()) return c
          continue
        }
        continue
      }
      const data = await res.json() as { choices?: { message?: { content?: string } }[] }
      const c: string = data.choices?.[0]?.message?.content ?? ""
      if (c?.trim()) return c
    } catch {
      continue
    } finally {
      clearTimeout(t)
    }
  }
  throw new Error("All Groq models failed or timed out")
}

async function callGemini(
  apiKey: string,
  messages: { role: string; content: string }[]
): Promise<string> {
  for (const model of GEMINI_MODELS) {
    const controller = new AbortController()
    const t = setTimeout(() => controller.abort(), 15000)
    try {
      // Gemini API expects 'contents' instead of 'messages' and specific role mapping
      const geminiMessages = messages.map(m => ({
        role: m.role === "system" ? "user" : m.role, // Gemini doesn't have 'system' role, map to 'user'
        parts: [{ text: m.content }]
      }))
      const body = { contents: geminiMessages, generationConfig: { temperature: 0.3, maxOutputTokens: 16384, responseMimeType: "application/json" } }
      const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
        signal: controller.signal,
      })
      if (!res.ok) {
        const bodyText = await res.text().catch(() => "")
        if (res.status === 429 || res.status === 413) continue
        if (res.status === 400 && bodyText.includes("responseMimeType")) {
          // Model doesn't support responseMimeType — retry once without it
          const retryBody = { contents: geminiMessages, generationConfig: { temperature: 0.3, maxOutputTokens: 16384 } }
          const retryRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(retryBody),
            signal: controller.signal,
          })
          if (!retryRes.ok) {
            if (retryRes.status === 429 || retryRes.status === 413) continue
            continue
          }
          const data: any = await retryRes.json()
          const content: string = data.candidates?.[0]?.content?.parts?.[0]?.text ?? ""
          if (content?.trim()) return content
          continue
        }
        continue
      }
      const data: any = await res.json()
      const content: string = data.candidates?.[0]?.content?.parts?.[0]?.text ?? ""
      if (content?.trim()) return content
    } catch {
      continue
    } finally {
      clearTimeout(t)
    }
  }
  throw new Error("All Gemini models failed or timed out")
}

export default defineConfig({
  plugins: [react(), tailwindcss(), aiProxyPlugin],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
})
