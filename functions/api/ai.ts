interface ChatMessage {
  role: "user" | "assistant" | "system"
  content: string
}

const GEMINI_MODELS = ["gemini-2.5-flash", "gemini-2.0-flash", "gemini-2.5-flash-lite"]

async function callGemini(apiKey: string, messages: ChatMessage[]): Promise<string> {
  const errors: string[] = []
  for (const model of GEMINI_MODELS) {
    const controller = new AbortController()
    const t = setTimeout(() => controller.abort(), 30000)
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
        errors.push(`${model}: HTTP ${res.status} — ${bodyText.slice(0, 200)}`)
        if (res.status === 429 || res.status === 413) continue
        if (res.status === 400 && bodyText.includes("responseMimeType")) {
          const retryBody = { contents: messages.map(m => ({ role: m.role === "system" ? "user" : m.role, parts: [{ text: m.content }] })), generationConfig: { temperature: 0.3, maxOutputTokens: 16384 } }
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

  let body: { messages?: ChatMessage[] }
  try {
    body = await context.request.json()
  } catch {
    return new Response("Invalid JSON", { status: 400, headers })
  }

  try {
    const key = context.env.GOOGLE_API_KEY
    if (!key) return new Response("Gemini API key not configured", { status: 500, headers })
    const content = await callGemini(key, body.messages ?? [])

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
