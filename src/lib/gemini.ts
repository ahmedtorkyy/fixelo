// All AI calls go through the Cloudflare Pages Function at /api/ai,
// which holds the provider keys server-side. No keys in the client bundle.

async function callProxy(prompt: string, provider: "openrouter" | "groq"): Promise<string> {
  const res = await fetch("/api/ai", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      messages: [{ role: "user", content: prompt }],
      provider,
    }),
  })

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
  const errors: string[] = []
  for (const provider of ["openrouter", "groq"] as const) {
    try {
      const result = await callProxy(prompt, provider)
      console.log(`[AI] ${provider} responded`)
      return result
    } catch (err) {
      errors.push(`${provider}: ${err instanceof Error ? err.message : String(err)}`)
    }
  }
  throw new Error(`All AI providers failed:\n${errors.join("\n")}`)
}

export const MODEL_ID = "Cloudflare proxy (OpenRouter + Groq)"
