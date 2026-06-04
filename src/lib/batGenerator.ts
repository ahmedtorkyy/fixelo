const STOP_WORDS = new Set([
  "my", "the", "a", "an", "is", "are", "was", "were", "it", "its", "i",
  "me", "we", "us", "our", "am", "been", "being", "have", "has", "had",
  "do", "does", "did", "will", "would", "shall", "should", "may", "might",
  "can", "could", "to", "of", "in", "for", "on", "with", "at", "by", "from",
  "that", "this", "these", "those", "and", "or", "but", "not", "no", "so",
  "if", "then", "than", "too", "very", "just", "about", "also", "really",
  "keeps", "keep", "getting", "got", "always", "still", "very", "quite",
  "some", "any", "all", "each", "every", "much", "more", "most",
])

function extractKeywords(problem: string): string[] {
  return problem
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, "")
    .trim()
    .split(/\s+/)
    .filter((word) => word.length > 0 && !STOP_WORDS.has(word))
}

export function downloadBatFile(content: string, filename: string): void {
  const blob = new Blob([content], { type: "application/bat" })
  const url = URL.createObjectURL(blob)
  const link = document.createElement("a")
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

export function generateFixFilename(problemDescription: string): string {
  const keywords = extractKeywords(problemDescription)
  const slug = keywords.slice(0, 5).join("-") || "fix"
  return `Fix_${slug}.bat`
}

export function generateUndoFilename(fixFilename: string): string {
  return fixFilename.replace(/^Fix_/, "Undo_")
}

export function generateFixFilenameFromProblem(problem: string): string {
  return generateFixFilename(problem)
}

export function generateUndoFilenameFromFix(fixFilename: string): string {
  return generateUndoFilename(fixFilename)
}