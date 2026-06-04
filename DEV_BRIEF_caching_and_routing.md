# Fixelo — Developer Brief: Caching, Routing & AI Cost Plan

**From:** Ahmed (Torky)
**Goal:** Cut AI cost / free-tier rate-limit problems and improve reliability **without changing what the user sees or feels.** The "talk to it → problem fixed" experience stays exactly the same.

---

## Core principle

- The user experience does **not** change. Same free-text box, same tool pages with checkboxes, same result screen (summary + fix + undo), same log follow-up flow.
- What changes is **only what happens behind the scenes**: where the script comes from. The user cannot tell whether a script was generated live by AI or served from a pre-tested cache.
- "Cached" = **tested once on a real/VM Windows machine, then frozen.** That is what makes a cached fix *safer* than a live one, not just cheaper.

---

## 1. Free-text problems (home page)

- Keep the current flow: user types a problem → sees "Analyzing…" → gets fix + undo.
- Add an **intent router** that runs before generating anything:
  - **Step 1 — keyword match (free, instant):** map obvious words to a known problem/tool (e.g. "wifi / internet / slow connection" → WiFi fix). No AI call.
  - **Step 2 — cheap AI classifier (fallback):** if keywords don't hit, one small/fast AI call that reads the user's text + the tool list and returns a matching tool slug, OR "none → generate custom." Output is just a slug, so it is far cheaper/faster than generating a full script.
  - **Step 3 — live AI generation (last resort):** only when nothing matches (genuinely novel problem).
- **Common problems → serve the cached, pre-tested script instantly** (no generation cost, no spinner).
- **Novel/specific problems → live AI generation** exactly like today.
- **Suggest, don't hijack:** when routing to a tool, confirm — e.g. "Sounds like a WiFi issue — open the WiFi Fixer? [Yes] / [Generate a custom fix instead]". A wrong hard-redirect feels broken.
- **Accessibility:** if auto-navigating, announce it in an `aria-live` region (screen-reader users must hear the page changed). Torky uses NVDA — this matters.
- **Nice-to-have:** carry the detected intent into the tool page and **pre-check the relevant checkboxes** based on what the user typed.

## 2. The "not fixed" follow-up loop (keep as-is, it already fits)

- Every generated script (cached or live) writes a log to Desktop + clipboard when it runs. **Cached scripts contain the same logging code**, so this is unaffected.
- If the fix didn't work, the user pastes the log back → AI reads it → either "the log shows it worked" or builds a **smarter second fix**.
- The log-based diagnosis (fix #2) is **always live AI** — every log is unique, it can't be cached. This is exactly where AI spend belongs.
- **Wiring note:** the diagnosis step needs to know *what fix #1 did*. When fix #1 is cached, store its "what it does" description alongside the cached script and pass it into the diagnosis call.

## 3. Tool pages (checkboxes) — keep the UX, cache per-option

- **Keep the checkbox UX unchanged.**
- **Do NOT pre-cache whole scripts per combination** — N checkboxes = 2^N combinations (e.g. 6 boxes = 64 files per tool). Not maintainable.
- Instead, **cache per-option building blocks:**
  - One **header** block (always): admin elevation + start log.
  - One **fix block per checkbox** — self-contained, follows all safety rules (capture original state → make change → verify → log). Each checkbox **also owns a matching undo block**.
  - One **footer** block (always): save log to Desktop + clipboard, completion message, `Read-Host`.
  - **Final fix file** = header + (only the checked blocks) + footer. **Final undo file** = header + (only the checked undo blocks) + footer.
- Result: user gets exactly the options they chose, instantly, with **zero AI cost**, and every block is pre-tested (AI can't hallucinate a fake cmdlet into a frozen block).
- **Undo correctness:** because each checkbox owns its own paired undo block, the combined undo always matches the combined fix. Test fix+undo as a pair per block.

## 4. How to build the cache (one-time content project)

For each common problem and each tool option:

1. **Draft with the existing AI** (one option/problem at a time), following current safety rules.
2. **Test on a real Windows machine or VM** — run it, confirm the log shows it actually worked, run the undo, confirm it fully restored.
3. **Freeze the tested version** as the official cached file/block. Served as-is from then on.

- **Roll out gradually.** Keep live AI as the fallback for anything not cached yet. Start with the **top 3–5 most-used tools/problems**, cache those, migrate the rest over time. Nothing breaks during migration.

## 5. AI provider & API keys

- **Claude Pro does NOT include an API key.** Pro and the Claude API are separate products with separate billing. API access = separate account at console.anthropic.com, pay-as-you-go per token.
- Same is true generally: any single provider key in the app means **all users' fixes run on Torky's paid account → bill scales with traffic.** This is the #1 reason caching matters at 1M-follower scale.
- **Security (already planned):** move all AI calls behind serverless functions so keys live server-side, never in the client bundle. Treat any keys currently shipped in the built JS as compromised and rotate them.
- **Free tiers (Groq / OpenRouter free models) are not viable at scale** — daily token/request caps will be exhausted fast. Plan for a cheap paid tier for the live-AI long tail; caching keeps that volume low.

## 6. Prompt improvements to add (current prompts are already strong)

Keep all existing safety rules (capture-before-change, verify-after, separate undo, hallucinated-cmdlet blocklist + runtime validator — all excellent). Add:

- **Scope guard:** if the request isn't a legitimate Windows repair/optimization (malicious, off-topic, illegal), return a polite refusal instead of a script.
- **Graceful "I can't do this safely":** let the AI say a problem needs manual steps instead of inventing a risky script.
- **Windows version awareness:** detect Win10 vs Win11 at runtime and branch, or state which versions a fix is tested for.
- **Idempotency:** running the same fix twice must cause no harm (users will double-run files).
- **Arabic output option:** localize the plain-English summary and the in-script `Write-Host` messages for Arabic-speaking followers.
- **API-level (not a prompt rule):** ensure max output tokens is high enough that long scripts don't get truncated mid-JSON and break.

---

## 7. Implementation map — exact files to ADD and EDIT

Notes for context: generation currently flows through `src/hooks/useScriptGenerator.ts` (home free-text) and `src/hooks/useToolGenerator.ts` (tool pages) → `src/lib/scriptGenerator.ts` → `src/lib/gemini.ts` (provider calls). Results are typed as `FixResult` in `src/types/fix.ts`. The cache must return that **same `FixResult` shape** so nothing downstream changes.

### A. New files to ADD

**Cache content (the pre-tested scripts/blocks):**
- `src/lib/cache/cachedFixes.ts` — map of common free-text problems → a full, tested `FixResult` (problemSummary, whatItDoes, whatItDoesNotTouch, fixScript, undoScript, scriptSafetyNotes). One entry per common problem (start with the top 5).
- `src/lib/cache/toolBlocks.ts` — per-option building blocks for tools. Shape: `Record<toolSlug, Record<optionId, { label, fixBlock, undoBlock }>>`. Each `fixBlock`/`undoBlock` is tested PowerShell that follows all safety rules (capture → change → verify → log).
- `src/lib/cache/scriptShell.ts` — the shared BAT header (admin elevation + `__PSSCRIPT__` marker + `$script:log` init + `Write-Log` function) and footer (save log to Desktop + clipboard, completion message, `Read-Host`). Used by the assembler so every assembled script is consistent.

**Cache logic:**
- `src/lib/cache/assembleToolScript.ts` — `assembleToolScript(tool, selectedOptionIds, inputValues)` → returns a `FixResult` by concatenating: header + chosen `fixBlock`s + footer (and the same for undo blocks). Generates `whatItDoes`/`problemSummary` text from the selected option labels. **No AI call.** Returns `null` if any selected option has no cached block (so the caller can fall back to live AI).
- `src/lib/cache/lookupCachedFix.ts` — `lookupCachedFix(problemText)` → returns a cached `FixResult` or `null`. Normalizes the text and matches against `cachedFixes.ts`.

**Routing:**
- `src/lib/router/intentRouter.ts` — `routeProblem(problemText)` → returns `{ kind: "cache" | "tool" | "generate", fix?, toolSlug?, preselectedOptionIds?, confidence }`. Runs keyword match first (reuse the `extractKeywords` logic already in `src/lib/batGenerator.ts`), then the classifier, then falls through to `generate`.
- `src/lib/router/keywordMap.ts` — table mapping keywords → toolSlug / cached-fix key.
- `src/lib/prompts/routerPrompt.ts` — prompt for the cheap classifier: input = user text + tool list (titles + descriptions from `toolConfigs.ts`); output = a single slug or `"none"`.

**Server (Cloudflare Pages Functions — keys live here, never in the client bundle):**
- `functions/api/ai.ts` — a Cloudflare Pages Function (export an `onRequestPost` handler). Maps automatically to the route `/api/ai`. Receives `{ prompt, mode }` from the browser, reads the provider keys from `context.env` (server-side secrets), calls the provider, returns the text. One small/fast model path for the classifier, one stronger path for full generation.
- Provider keys are set as **Cloudflare Pages environment variables / secrets** in the dashboard (NOT `VITE_`-prefixed, so they never reach the client bundle). Access them via `context.env.GROQ_API_KEY`, etc.
- `public/_redirects` (already exists: `/* /index.html 200`) handles SPA routing on Cloudflare Pages — no extra config file needed. Deploy without GitHub via `wrangler pages deploy dist` (Functions deploy together with it).

### B. Files to EDIT

- `src/hooks/useScriptGenerator.ts` — in `generateFix`, **before** `generateScript`: call `routeProblem(problemDescription)`. If `kind==="cache"` → set result from the cached `FixResult` (skip AI, skip loading spinner). If `kind==="tool"` → set a new "suggestion" step instead of generating. Else → live generate as today. *(Important: cached `FixResult` must include `whatItDoes` + `fixScript` so the existing `submitFailure` → diagnosis call still gets context — no change needed there if the cache is complete.)*
- `src/hooks/useToolGenerator.ts` — in `generate()`: first try `assembleToolScript(tool, selectedOptions, inputValues)`. If it returns a result → use it (no AI). If it returns `null` → fall back to the existing `generateToolScript` (live AI). Everything else (history entry, downloads) stays identical.
- `src/pages/Home.tsx` — handle the new "suggestion" step: render a confirm prompt ("Sounds like a WiFi issue — open the WiFi Fixer? [Yes] / [Generate a custom fix instead]") inside an `aria-live` region so NVDA announces it. On "Yes", navigate to `/tools/<slug>` passing `preselectedOptionIds` via router state.
- `src/types/fix.ts` — add the new flow step: extend `FixFlowStep` with `"suggestion"`. Optionally add a `RouteResult` type.
- `src/pages/tools/*` tool pages (or `src/components/tools/ToolPageLayout.tsx`) — read `preselectedOptionIds` from router `location.state` and pre-check those boxes on mount.
- `src/lib/scriptGenerator.ts` — add a `classifyProblem()` helper (or import from intentRouter) and a thin `generateContent`-style call for the classifier mode. No change to existing functions.
- `src/lib/gemini.ts` — switch provider calls to hit the Cloudflare Function endpoint `/api/ai` instead of calling OpenRouter/Groq directly with `VITE_` keys; add a `mode` param (classifier vs full); raise the max output tokens so long scripts don't truncate mid-JSON.
- `src/lib/prompts/systemPrompt.ts` and `src/lib/prompts/safetyRules.ts` — add the prompt improvements from section 6 (scope guard / refusal, graceful "needs manual steps", Windows version awareness, idempotency, optional Arabic output).
- `index.html` — (carryover) Open Graph + Twitter meta tags, favicon fix — see existing `UX_UI_REVIEW.md`.

### C. Build / migration order

1. Add the Cloudflare Pages Function (`functions/api/ai.ts`) + move keys to Cloudflare secrets; rotate old keys. (Security first.)
2. Build `scriptShell.ts` + `assembleToolScript.ts`; cache blocks for the **top 1 tool** (e.g. `slow-pc-fix`), test fix+undo on a Windows VM, wire `useToolGenerator` fallback. Prove the pattern end-to-end.
3. Roll the same per-option block pattern across the priority tools, then the rest.
4. Add `cachedFixes.ts` + `lookupCachedFix` + the intent router for the home free-text path.
5. Add the prompt improvements.

Keep live AI as the fallback at every step so nothing breaks during migration.

---

## Tools list (26 tools, current `toolConfigs.ts`)

**Performance & cleanup**
- `slow-pc-fix` — Slow PC Fix
- `gaming-boost` — Gaming Boost
- `monthly-maintenance` — Monthly Maintenance
- `startup-manager` — Startup Manager
- `ssd-optimizer` — SSD Optimizer
- `battery-optimizer` — Battery Optimizer

**Network**
- `wifi-network-fixer` — WiFi Network Fixer
- `network-optimizer` — Network Optimizer

**System repair**
- `windows-update-fixer` — Windows Update Fixer
- `blue-screen-recovery` — Blue Screen (BSOD) Recovery
- `corrupted-files-fix` — Corrupted Files Fix (SFC/DISM)
- `disk-error-fix` — Disk Error Fix (CHKDSK/SMART)
- `driver-manager` — Driver Manager

**Hardware / devices**
- `audio-fix` — Audio Fix
- `display-resolution-fix` — Display & Resolution Fix
- `printer-fix` — Printer Fix
- `usb-device-fix` — USB Device Fix

**Setup & customization**
- `new-pc-setup` — New PC Setup
- `winget-installer` — Winget Installer
- `dev-environment` — Dev Environment Setup
- `dark-mode-setup` — Dark Mode Setup
- `taskbar-customizer` — Taskbar Customizer

**Privacy & control**
- `privacy-protector` — Privacy Protector
- `parental-controls` — Parental Controls

**Automation**
- `auto-shutdown` — Auto Shutdown
- `auto-backup` — Auto Backup

*(Plus two standalone, non-checkbox pages: Error Translator and Script Scanner.)*

**Suggested caching priority (highest traffic first):** slow-pc-fix, wifi-network-fixer, audio-fix, windows-update-fixer, gaming-boost.
