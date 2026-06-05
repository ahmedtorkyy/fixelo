async function callProxy(prompt: string): Promise<string> {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 45000)

  const res = await fetch("/api/ai", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      messages: [{ role: "user", content: prompt }],
    }),
    signal: controller.signal,
  })
  clearTimeout(timeout)

  if (!res.ok) {
    const body = await res.text().catch(() => "")
    throw new Error(`AI proxy ${res.status}: ${body.slice(0, 200)}`)
  }

  const data = await res.json()
  const content: string = data?.content ?? ""
  if (!content.trim()) throw new Error("Empty response from AI proxy")

  const t = content.trim()
  if (t.startsWith("<") || t.startsWith("<!DOCTYPE")) {
    throw new Error("Returned HTML error page")
  }

  return content
}

export async function generateContent(prompt: string): Promise<string> {
  try {
    const result = await callProxy(prompt)
    return result
  } catch (err) {
    throw new Error(`Gemini failed: ${err instanceof Error ? err.message : String(err)}`)
  }
}

export const MODEL_ID = "Gemini 2.5 Flash (via Cloudflare proxy)"
