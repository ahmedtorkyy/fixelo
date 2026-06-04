import { readFileSync, writeFileSync } from "fs"
import { resolve } from "path"

const filePath = resolve("src/lib/cache/toolBlocks.ts")
let content = readFileSync(filePath, "utf-8")

function wrapPs(code, label) {
  let t = code.trim()
  if (t.startsWith("try {") && /\} catch \{/.test(t)) return null
  const sl = label.replace(/"/g, '`"')
  return `try {\n${t}\n} catch {\n  Write-Log "Error in ${sl}: $($_.Exception.Message)" "Red"\n}`
}

// Match: (script: or undoScript:)  optional spaces  backtick  content  backtick
// The backtick is on the same line as the keyword
// Content pattern handles escaped backticks (\`) and other escape sequences
const regex = /(script:|undoScript:)( *)(`)((?:[^`\\]|\\.)*)(`)/g

let total = 0
let wrapped = 0
let skipped = 0

content = content.replace(regex, (match, keyword, spaces, bt1, code, bt2, offset) => {
  total++
  const before = content.substring(0, offset)
  const labels = [...before.matchAll(/label:\s*"([^"]+)"/g)]
  const label = labels.length > 0 ? labels[labels.length - 1][1] : "Unknown"
  
  const result = wrapPs(code, label)
  if (result === null) {
    skipped++
    return match
  }
  wrapped++
  return `${keyword}${spaces}${bt1}${result}${bt2}`
})

writeFileSync(filePath, content, "utf-8")
console.log(`Total: ${total}, Wrapped: ${wrapped}, Already wrapped (skipped): ${skipped}`)
