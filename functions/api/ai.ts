// Cloudflare Pages Function — proxies AI calls server-side
// so API keys are never exposed to the browser.

interface ChatMessage {
  role: "user" | "assistant" | "system"
  content: string
}

interface RequestBody {
  messages: ChatMessage[]
  provider?: "openrouter" | "groq"
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

async function callOpenRouter(apiKey: string, messages: ChatMessage[]): Promise<string> {
  for (const model of OPENROUTER_MODELS) {
    const controller = new AbortController()
    const t = setTimeout(() => controller.abort(), 15000)
    let usedJsonMode = true
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
          // Model doesn't support json_object mode — retry once without it
          usedJsonMode = false
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
  for (const model of GROQ_MODELS) {
    const controller = new AbortController()
    const t = setTimeout(() => controller.abort(), 15000)
    let usedJsonMode = true
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
          // Model doesn't support json_object mode — retry once without it
          usedJsonMode = false
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
  throw new Error("All Groq models failed or timed out")
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

  const provider = body.provider ?? "openrouter"

  try {
    let content: string
    if (provider === "groq") {
      const key = context.env.GROQ_API_KEY
      if (!key) return new Response("Groq API key not configured", { status: 500, headers })
      content = await callGroq(key, body.messages)
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
