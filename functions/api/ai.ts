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
  "google/gemma-4-31b-it:free",
  "nvidia/nemotron-3-super-120b-a12b:free",
  "openai/gpt-oss-120b:free",
  "qwen/qwen3-coder:free",
  "meta-llama/llama-3.3-70b-instruct:free",
]

const GROQ_MODELS = [
  "llama-3.3-70b-versatile",
  "qwen/qwen3-32b",
  "llama-3.1-8b-instant",
  "openai/gpt-oss-120b",
]

async function callOpenRouter(apiKey: string, messages: ChatMessage[]): Promise<string> {
  for (const model of OPENROUTER_MODELS) {
    const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({ model, messages, temperature: 0.3, max_tokens: 8192 }),
    })
    if (!res.ok) {
      const body = await res.text().catch(() => "")
      if (res.status === 429) continue
      throw new Error(`OpenRouter ${res.status}: ${body.slice(0, 200)}`)
    }
    const data: any = await res.json()
    const content: string = data.choices?.[0]?.message?.content ?? ""
    if (content?.trim()) return content
  }
  throw new Error("All OpenRouter models failed or rate limited")
}

async function callGroq(apiKey: string, messages: ChatMessage[]): Promise<string> {
  for (const model of GROQ_MODELS) {
    const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({ model, messages, temperature: 0.3, max_tokens: 8192 }),
    })
    if (!res.ok) {
      const body = await res.text().catch(() => "")
      if (res.status === 429) continue
      throw new Error(`Groq ${res.status}: ${body.slice(0, 200)}`)
    }
    const data: any = await res.json()
    const content: string = data.choices?.[0]?.message?.content ?? ""
    if (content?.trim()) return content
  }
  throw new Error("All Groq models failed or rate limited")
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
