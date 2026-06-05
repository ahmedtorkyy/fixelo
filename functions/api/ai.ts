interface ChatMessage {
  role: "user" | "assistant" | "system"
  content: string
}

const GEMINI_MODELS = ["gemini-2.5-flash", "gemini-2.0-flash", "gemini-2.5-flash-lite", "gemini-1.5-flash", "gemini-1.5-pro"]

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

async function callDeepSeek(apiKey: string, messages: ChatMessage[]): Promise<string> {
  const body = { model: "deepseek-v4-flash", messages, temperature: 0.3, max_tokens: 16384, response_format: { type: "json_object" } }
  const controller = new AbortController()
  const t = setTimeout(() => controller.abort(), 30000)
  try {
    const res = await fetch("https://api.deepseek.com/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify(body),
      signal: controller.signal,
    })
    if (!res.ok) {
      const bodyText = await res.text().catch(() => "")
      throw new Error(`DeepSeek HTTP ${res.status}: ${bodyText.slice(0, 200)}`)
    }
    const data: any = await res.json()
    const content: string = data.choices?.[0]?.message?.content ?? ""
    if (!content?.trim()) throw new Error("Empty DeepSeek response")
    return content
  } finally {
    clearTimeout(t)
  }
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

  const msgs = body.messages ?? []

  // Try Gemini first
  const geminiKey = context.env.GOOGLE_API_KEY
  if (geminiKey) {
    try {
      const content = await callGemini(geminiKey, msgs)
      return new Response(JSON.stringify({ content }), {
        status: 200,
        headers: { ...headers, "Content-Type": "application/json" },
      })
    } catch (err) {
      const geminiErr = err instanceof Error ? err.message : String(err)
      // Fall through to DeepSeek
      const deepseekKey = context.env.DEEPSEEK_API_KEY
      if (deepseekKey) {
        try {
          const content = await callDeepSeek(deepseekKey, msgs)
          return new Response(JSON.stringify({ content }), {
            status: 200,
            headers: { ...headers, "Content-Type": "application/json" },
          })
        } catch (dsErr) {
          const dsMsg = dsErr instanceof Error ? dsErr.message : String(dsErr)
          return new Response(JSON.stringify({ error: `Gemini: ${geminiErr} | DeepSeek: ${dsMsg}` }), {
            status: 502,
            headers: { ...headers, "Content-Type": "application/json" },
          })
        }
      }
      return new Response(JSON.stringify({ error: geminiErr }), {
        status: 502,
        headers: { ...headers, "Content-Type": "application/json" },
      })
    }
  }

  // No Gemini key — try DeepSeek only
  const deepseekKey = context.env.DEEPSEEK_API_KEY
  if (deepseekKey) {
    try {
      const content = await callDeepSeek(deepseekKey, msgs)
      return new Response(JSON.stringify({ content }), {
        status: 200,
        headers: { ...headers, "Content-Type": "application/json" },
      })
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      return new Response(JSON.stringify({ error: msg }), {
        status: 502,
        headers: { ...headers, "Content-Type": "application/json" },
      })
    }
  }

  return new Response(JSON.stringify({ error: "No API keys configured" }), {
    status: 500,
    headers: { ...headers, "Content-Type": "application/json" },
  })
}
