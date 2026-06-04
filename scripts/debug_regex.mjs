import { readFileSync } from "fs"

const content = readFileSync("src/lib/cache/toolBlocks.ts", "utf-8")

// Find first script: occurrence
const idx = content.indexOf("script:")
if (idx >= 0) {
  console.log("Context around first script:")
  console.log(content.substring(idx - 10, idx + 150))
  console.log("\n---\n")
}

// Test the regex step by step
const simpleRegex = /(script:|undoScript:)(\s*\n\s*)(`)((?:[^`\\]|\\.)*)(`)/g
const matches = [...content.matchAll(simpleRegex)]
console.log("Matches found:", matches.length)
if (matches.length > 0) {
  console.log("First match preview:", matches[0][0].substring(0, 120))
  console.log("Keyword:", matches[0][1])
  console.log("Content length:", matches[0][4].length)
  console.log("Content start:", matches[0][4].substring(0, 60))
}
