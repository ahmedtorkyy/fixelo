import path from "path"
import fs from "fs"
import react from "@vitejs/plugin-react"
import tailwindcss from "@tailwindcss/vite"
import { defineConfig, type Plugin } from "vite"

function loadGoogleKey(): string {
  const envPath = path.resolve(__dirname, ".env")
  try {
    const content = fs.readFileSync(envPath, "utf-8")
    for (const line of content.split("\n")) {
      const trimmed = line.trim()
      if (!trimmed || trimmed.startsWith("#")) continue
      const eq = trimmed.indexOf("=")
      if (eq === -1) continue
      const k = trimmed.slice(0, eq).trim()
      const v = trimmed.slice(eq + 1).trim()
      if (k === "GOOGLE_API_KEY") return v
    }
  } catch { /* .env may not exist */ }
  return ""
}

const GEMINI_MODELS = ["gemini-2.5-flash", "gemini-2.0-flash"]

async function callGemini(apiKey: string, messages: { role: string; content: string }[]): Promise<string> {
  const errors: string[] = []
  for (const model of GEMINI_MODELS) {
    const controller = new AbortController()
    const t = setTimeout(() => controller.abort(), 30000)
    try {
      const geminiMessages = messages.map(m => ({
        role: m.role === "system" ? "user" : m.role,
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
        errors.push(`${model}: HTTP ${res.status} — ${bodyText.slice(0, 200)}`)
        if (res.status === 429 || res.status === 413) continue
        if (res.status === 400 && bodyText.includes("responseMimeType")) {
          const retryBody = { contents: geminiMessages, generationConfig: { temperature: 0.3, maxOutputTokens: 16384 } }
          const retryRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(retryBody),
            signal: controller.signal,
          })
          if (!retryRes.ok) {
            const retryText = await retryRes.text().catch(() => "")
            errors.push(`${model} (retry): HTTP ${retryRes.status} — ${retryText.slice(0, 200)}`)
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
    } catch (err) {
      errors.push(`${model}: ${err instanceof Error ? err.message : String(err)}`)
      continue
    } finally {
      clearTimeout(t)
    }
  }
  throw new Error(`All Gemini models failed: ${errors.join(" | ")}`)
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

      let parsed: { messages?: { role: string; content: string }[] }
      try {
        parsed = JSON.parse(body)
      } catch {
        res.statusCode = 400
        res.end("Invalid JSON")
        return
      }

      try {
        const key = loadGoogleKey()
        if (!key) throw new Error("GOOGLE_API_KEY not set in .env")
        const content = await callGemini(key, parsed.messages ?? [])

        res.setHeader("Content-Type", "application/json")
        res.end(JSON.stringify({ content }))
      } catch (err: any) {
        res.statusCode = 502
        res.end(JSON.stringify({ error: err.message }))
      }
    })
  },
}

export default defineConfig({
  plugins: [react(), tailwindcss(), aiProxyPlugin],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
})
