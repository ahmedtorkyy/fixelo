# Fixelo — Review of Caching / Routing Implementation

**Reviewed:** June 3, 2026
**Verdict:** The architecture matches the plan and the logic is mostly right — **but the project does not compile right now.** 8 files were saved truncated (cut off at the end), and there are 4 real bugs in the script-shell layer that will stop generated scripts from running even after the files are restored. Nothing here is a dead end; it's all fixable.

---

## A. BLOCKER — 8 files are truncated on disk (project won't build)

Every file the developer edited today is cut off mid-content, missing its closing braces / backticks / exports. Confirmed with both `tsc` and a raw byte check (e.g. `gemini.ts` literally ends `"...proxy not deployed — f`). This looks like a botched save/transfer, not a logic mistake — the endings were simply lost.

Files that need their endings restored:

- `src/lib/gemini.ts` — ends mid-string inside `callCloudflareProxy`; **missing the whole `generateContent` export** (the function the entire app calls). Until this is restored, no AI fix can be generated at all.
- `src/lib/prompts/safetyRules.ts` — cut off mid-rule (the new scope-guard rule: "...repair, optimization, or configuration task (e.g. it asks to"). Missing the rest of the array + `formatSafetyRules()` export.
- `src/lib/prompts/systemPrompt.ts` — template literal never closed; missing the closing backtick + `getSystemPrompt()` export.
- `src/lib/scriptGenerator.ts` — truncated near line 303.
- `src/types/fix.ts` — truncated near line 53.
- `src/hooks/useScriptGenerator.ts` — truncated near line 118.
- `src/hooks/useToolGenerator.ts` — truncated near line 91.
- `src/pages/Home.tsx` — JSX not closed; truncated near line 95.

**Action:** re-save/restore the complete version of each of these 8 files, then run `npm run build` and confirm zero TypeScript errors before anything else. Ask the developer for the full versions — the truncation happened on save, the code itself was probably written correctly.

---

## B. Script-shell bugs (will break generated scripts even after the build is fixed)

These live in `src/lib/cache/scriptShell.ts` and affect **every** cached fix and every assembled tool script.

### B1. CRITICAL — `%RANDOM%` is expanded twice, so the script runs a file that doesn't exist
`wrapPsInBat` writes the PowerShell to `%TEMP%\Fixelo_%RANDOM%.ps1`, then runs `%TEMP%\Fixelo_%RANDOM%.ps1`. In cmd, `%RANDOM%` produces a **different number each time it appears**, so it writes one file and tries to execute a different (non-existent) one. Every assembled/cached script fails to launch.
**Fix:** capture the name once: `set "PSFILE=%TEMP%\Fixelo_%RANDOM%.ps1"` and reuse `%PSFILE%` for both the write and the run (this is exactly the pattern already in `systemPrompt.ts`).

### B2. CRITICAL — building the .ps1 with `echo.` inside `> file ( ... )` is too fragile
`escapePsForBat` only escapes `(` and `)`. But PowerShell code is full of `|`, `>`, `<`, `&`, `%`, `"`, `@` — all of which break a cmd parenthesized-redirect block or corrupt the written script. The blocks already contain `|`, `@(...)`, `$env:`, etc., so this will mangle them.
**Fix:** don't echo the script line-by-line. Use the proven approach already documented in `systemPrompt.ts`: append the PowerShell after a `__PSSCRIPT__` marker in the BAT and extract it with `[IO.File]::ReadAllText`. Reuse that exact shell for the assembled scripts.

### B3. HIGH — assembled/cached scripts don't auto-elevate (UAC)
`psRequireAdmin()` only *checks* for admin and exits if missing — it never requests elevation. A non-technical user double-clicks the `.bat`, isn't admin, sees "please run as Administrator," and the script quits. Your AI-generated scripts auto-elevate (`net session` + `Start-Process -Verb RunAs`); the cached/assembled ones must do the same so the experience is identical.

### B4. HIGH — cached/assembled scripts produce no log, which breaks the "not fixed" follow-up
This is the design point we agreed on. `scriptShell.ts` and the blocks use plain `Write-Host` — there's **no `$script:log`, no `Fixelo_Log.txt` saved to Desktop, no clipboard copy.** But the whole "my problem isn't fixed → paste the log → AI builds a smarter fix #2" loop depends on every script writing that log. A user who runs a *cached* fix that doesn't work will have no log to paste.
**Fix:** put the `Write-Log` function + the Desktop-file + clipboard save into `scriptShell` so every assembled/cached script logs exactly like the AI-generated ones. (The blocks should call `Write-Log`, not `Write-Host`.)

---

## C. Medium / polish

- **No "verify after change" in the cached blocks.** Safety rule #13 requires re-checking each change and logging "Verified: …". The `slow-pc-fix` blocks just make the change with a `Write-Host`. Add a verification line per block to meet your own standard (and to make the log useful for fix #2).
- **`whatItDoesNotTouch` is generic boilerplate.** `assembleToolScript` and `cachedFixes` claim the script "will NOT modify Windows Update settings / installed applications," but some options (e.g. update-related tools, bloatware removal) *do*. Make the disclaimer reflect the actual selected blocks, or it undercuts the trust message.
- **Duplicated tool list.** `routerPrompt.ts` hardcodes all 26 slugs, duplicating `toolConfigs.ts`. Derive it from `getAllToolSlugs()` so it can't drift.
- **Security not finished.** `gemini.ts` added the `/api/ai` Cloudflare proxy (good) but **still keeps the direct `VITE_OPENROUTER_API_KEY` / `VITE_GROQ_API_KEY` calls**, and `.env.local` still holds those `VITE_` keys. As long as those direct calls and `VITE_` vars exist, a rebuild re-embeds the keys in the client bundle. Once the proxy works: remove the direct browser calls, delete the `VITE_` keys, keep keys only as Cloudflare secrets, and rotate the old ones.

---

## D. What's GOOD (keep it)

- The structure follows the plan cleanly: `cache/` (blocks, assembler, lookup, shell), `router/` (keyword map, classifier prompt, intent router), and the Cloudflare function.
- **Wiring is actually done** (this is the part people skip): `useScriptGenerator.generateFix` calls `routeProblem` before any AI; `useToolGenerator.generate` tries `assembleToolScript` and cleanly falls back to live AI (`cached ?? await generateToolScript(...)`); `Home.tsx` has the new `suggestion` step.
- The cached `FixResult` keeps the same shape as the rest of the app, so history/downloads/diagnosis don't need changes.
- The intent router's tiering is sensible: exact cached fix → keyword tool suggestion → (optional cheap AI classifier) → full AI. Confidence thresholds (0.4 / 0.6 / 0.2) are reasonable starting points.
- The Cloudflare function is structured correctly: keys from `context.env`, provider fallback, 429-aware model rotation, CORS/OPTIONS handled.

---

## Suggested fix order

1. Restore the 8 truncated files; `npm run build` must pass with zero errors.
2. Fix `scriptShell.ts`: reuse the `__PSSCRIPT__` + `ReadAllText` shell from `systemPrompt.ts` (fixes B1 + B2), add auto-elevation (B3), add the `Write-Log` + log-save/clipboard footer (B4).
3. Test one assembled tool script (e.g. `slow-pc-fix` with 2 boxes) on a Windows VM: it runs, elevates, logs to Desktop, and the undo restores. Then do the same for one cached fix.
4. Add per-block "Verified:" lines; fix the `whatItDoesNotTouch` accuracy.
5. Finish security: remove direct `VITE_` calls, rotate keys, keys only in Cloudflare secrets.
