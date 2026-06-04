export function buildExplainPrompt(script: string): string {
  return `You are a Windows expert explaining a script to someone with zero technical knowledge.

Read this script and explain what it does in plain English, step by step. For each major action, write one clear sentence in simple language. Imagine you are explaining this to someone who has never seen code before.

Do not use words like: cmdlet, parameter, variable, registry key, array, loop, function, syntax.
Instead say: "this checks your system", "this turns off a setting", "this clears some files", etc.

---SCRIPT---
${script.slice(0, 6000)}
---END---

Write your explanation as plain readable paragraphs. No JSON, no code blocks, no bullet points with dashes. Just clear sentences grouped by what the script is doing.

Start with one sentence summarizing what the script does overall, then explain the main steps.`
}
