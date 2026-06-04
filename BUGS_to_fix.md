# Fixelo — Bugs to Fix

## BLOCKER — 8 files are truncated on disk (project won't build)

Every file edited on June 3 is cut off mid-content, missing its closing braces / backticks / exports. Confirmed with `tsc` and a raw byte check (e.g. `gemini.ts` ends `"...proxy not deployed — f`). Restore the complete version of each, then run `npm run build` and confirm zero TypeScript errors.

- `src/lib/gemini.ts` — ends mid-string in `callCloudflareProxy`; **missing the entire `generateContent` export** the app depends on.
- `src/lib/prompts/safetyRules.ts` — cut off mid-rule; missing rest of array + `formatSafetyRules()` export.
- `src/lib/prompts/systemPrompt.ts` — template literal never closed; missing closing backtick + `getSystemPrompt()` export.
- `src/lib/scriptGenerator.ts` — truncated near line 303.
- `src/types/fix.ts` — truncated near line 53.
- `src/hooks/useScriptGenerator.ts` — truncated near line 118.
- `src/hooks/useToolGenerator.ts` — truncated near line 91.
- `src/pages/Home.tsx` — JSX not closed; truncated near line 95.

## CRITICAL — `scriptShell.ts`: `%RANDOM%` expanded twice

`wrapPsInBat` writes the PowerShell to `%TEMP%\Fixelo_%RANDOM%.ps1`, then runs `%TEMP%\Fixelo_%RANDOM%.ps1`. `%RANDOM%` gives a different number each time, so it writes one file and runs a different, non-existent one — every cached/assembled script fails to launch.
**Fix:** capture once — `set "PSFILE=%TEMP%\Fixelo_%RANDOM%.ps1"` — and reuse `%PSFILE%` for both the write and the run (same pattern already in `systemPrompt.ts`).

## CRITICAL — `scriptShell.ts`: fragile `echo.` script-building

The .ps1 is built with `echo.` lines inside a `> file ( ... )` block, and `escapePsForBat` only escapes `(` and `)`. PowerShell code contains `|`, `>`, `<`, `&`, `%`, `"`, `@`, which break the cmd block or corrupt the written script. The blocks already use `|`, `@(...)`, `$env:`.
**Fix:** don't echo line-by-line. Use the `__PSSCRIPT__` marker + `[IO.File]::ReadAllText` approach already in `systemPrompt.ts` and reuse that shell for assembled scripts.

## HIGH — `scriptShell.ts`: cached/assembled scripts don't auto-elevate (UAC)

`psRequireAdmin()` only checks for admin and exits if missing — it never requests elevation. A user double-clicking the `.bat` (not admin) gets "please run as Administrator" and it quits. AI-generated scripts auto-elevate (`net session` + `Start-Process -Verb RunAs`); cached/assembled scripts must do the same.

## HIGH — cached/assembled scripts produce no log (breaks "not fixed" follow-up)

`scriptShell.ts` and the blocks use plain `Write-Host` — no `$script:log`, no `Fixelo_Log.txt` saved to Desktop, no clipboard copy. The "problem not fixed → paste log → AI builds fix #2" flow depends on every script writing that log; a user running a cached fix that fails has no log to paste.
**Fix:** put the `Write-Log` function + Desktop-file + clipboard save into `scriptShell` so every assembled/cached script logs like the AI-generated ones; blocks should call `Write-Log`, not `Write-Host`.

## MEDIUM — cached blocks skip "verify after change"

Safety rule #13 requires re-checking each change and logging "Verified: …". The `slow-pc-fix` blocks make the change with a `Write-Host` and no re-check. Add a verification line per block.

## MEDIUM — `whatItDoesNotTouch` is inaccurate boilerplate

`assembleToolScript` and `cachedFixes` claim the script "will NOT modify Windows Update settings / installed applications," but some options do. Make the disclaimer reflect the actually-selected blocks.

## MEDIUM — security not finished (keys still in client bundle)

`gemini.ts` added the `/api/ai` Cloudflare proxy but still keeps the direct `VITE_OPENROUTER_API_KEY` / `VITE_GROQ_API_KEY` browser calls, and `.env.local` still holds those `VITE_` keys — a rebuild re-embeds them in the client bundle. Once the proxy works: remove the direct browser calls, delete the `VITE_` keys, keep keys only as Cloudflare secrets, and rotate the old ones.

## LOW — duplicated tool list in `routerPrompt.ts`

`routerPrompt.ts` hardcodes all 26 slugs, duplicating `toolConfigs.ts` (drift risk). Derive from `getAllToolSlugs()`.
