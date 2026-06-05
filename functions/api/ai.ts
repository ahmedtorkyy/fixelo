// Cloudflare Pages Function — proxies AI calls server-side
// so API keys are never exposed to the browser.

interface ChatMessage {
  role: "user" | "assistant" | "system"
  content: string
}

interface RequestBody {
  messages: ChatMessage[]
  provider?: "openrouter" | "groq" | "gemini"
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

const GEMINI_MODELS = ["gemini-pro"]

async function callOpenRouter(apiKey: string, messages: ChatMessage[]): Promise<string> {
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
          const data: any = await retryRes.json()
          const content: string = data.choices?.[0]?.message?.content ?? ""
          if (content?.trim()) return content
          continue
        }
        continue
      }
      const data: any = await res.json()
      const content: string = data.choices?.[0]?.message?.content ?? ""
      if (content?.trim()) return content
    } catch {
      continue
    } finally {
      clearTimeout(t)
    }
  }
  throw new Error("All OpenRouter models failed or timed out")
}

async function callGroq(apiKey: string, messages: ChatMessage[]): Promise<string> {
  const errors: string[] = []
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
        errors.push(`${model}: HTTP ${res.status} — ${bodyText.slice(0, 200)}`)
        if (res.status === 429 || res.status === 413) continue
        if (res.status === 400 && bodyText.includes("response_format")) {
          // Model doesn't support response_format — retry once without it
          const retryBody = { model, messages, temperature: 0.3, max_tokens: 16384 }
          const retryRes = await fetch("https://api.groq.com/openai/v1/chat/completions", {
            method: "POST",
            headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
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
          const content: string = data.choices?.[0]?.message?.content ?? ""
          if (content?.trim()) return content
          continue
        }
        continue
      }
      const data: any = await res.json()
      const content: string = data.choices?.[0]?.message?.content ?? ""
      if (content?.trim()) return content
    } catch (err) {
      errors.push(`${model}: ${err instanceof Error ? err.message : String(err)}`)
      continue
    } finally {
      clearTimeout(t)
    }
  }
  throw new Error(`All Groq models failed: ${errors.join(" | ")}`)
}

async function callGemini(apiKey: string, messages: ChatMessage[]): Promise<string> {
  for (const model of GEMINI_MODELS) {
    const controller = new AbortController()
    const t = setTimeout(() => controller.abort(), 15000)
    try {
      const body = { contents: messages.map(m => ({ role: m.role === "system" ? "user" : m.role, parts: [{ text: m.content }] })), generationConfig: { temperature: 0.3, maxOutputTokens: 16384, responseMimeType: "application/json" } }
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
          const retryBody = { contents: messages.map(m => ({ role: m.role === "system" ? "user" : m.role, parts: [{ text: m.content }] })), generationConfig: { temperature: 0.3, maxOutputTokens: 16384 } }
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

export async function onRequest(context: {
  request: Request
  env: Record<string, string>
}): Promise<Response> {
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  }

  if (context.request.method === "OPTIONS") {
    return new Response(null, { status: 204, headers })
  }

  if (context.request.method !== "POST") {
    return new Response("Method not allowed", { status: 405, headers })
  }

  let body: RequestBody
  try {
    body = await context.request.json()
  } catch {
    return new Response("Invalid JSON", { status: 400, headers })
  }

  const provider = body.provider ?? "groq"

  try {
    let content: string
    if (provider === "groq") {
      const key = context.env.GROQ_API_KEY
      if (!key) return new Response("Groq API key not configured", { status: 500, headers })
      content = await callGroq(key, body.messages)
    } else if (provider === "gemini") {
      const key = context.env.GOOGLE_API_KEY
      if (!key) return new Response("Gemini API key not configured", { status: 500, headers })
      content = await callGemini(key, body.messages)
    } else {
      const key = context.env.OPENROUTER_API_KEY
      if (!key) return new Response("OpenRouter API key not configured", { status: 500, headers })
      content = await callOpenRouter(key, body.messages)
    }

    return new Response(JSON.stringify({ content }), {
      status: 200,
      headers: { ...headers, "Content-Type": "application/json" },
    })
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error"
    return new Response(JSON.stringify({ error: msg }), {
      status: 502,
      headers: { ...headers, "Content-Type": "application/json" },
    })
  }
}
