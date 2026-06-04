# Fixelo — UX / UI / Accessibility Review

A prioritized review of the current build. Focus areas (per your request): **accessibility / screen-reader support**, **visual polish & UI**, and **flow & conversion**. Mobile is out of scope here.

Overall: this is a strong, well-structured app. The dark theme is consistent, the component architecture is clean, the core "describe → review → download" flow is genuinely good, and the safety/undo messaging builds trust. The improvements below are about taking it from "good" to "polished and sellable to a million-follower audience."

Each item lists the file(s) involved so you can jump straight there.

---

## Priority 1 — Accessibility (do these first)

These matter both for your own NVDA workflow and because they are real quality differentiators. Several are quick wins.

### 1. Nothing is announced when the app changes state (the biggest gap)
**Files:** `src/pages/Home.tsx`, `src/components/tools/ToolPageLayout.tsx`

The whole core flow swaps content in place: `input → loading → result`. There is no `aria-live` region anywhere, so a screen-reader user submits a problem and hears silence — no "Generating…", no "Your fix is ready." They have to manually hunt the page to discover something changed.

Fix: wrap the loading message and the result heading in a live region, e.g. a container with `role="status" aria-live="polite"`. Also move keyboard focus to the result heading (`<h2 tabIndex={-1}>` + `ref.focus()`) when the result mounts, so the reader lands on it automatically. Apply the same pattern in `ToolPageLayout`.

### 2. Toasts are invisible to screen readers
**File:** `src/components/common/Toast.tsx`

`ToastContainer` renders downloads/confirmations ("Fix file downloaded!") with no `aria-live` and no `role`. For a sighted user it's a nice confirmation; for a screen-reader user the download appears to do nothing. Add `role="status" aria-live="polite"` (use `assertive` for errors) on the toast wrapper. Also the toast close button (`<X />`) has no `aria-label` — add `aria-label="Dismiss notification"`.

### 3. The main problem input has no real label
**File:** `src/components/fix/ProblemInput.tsx`

The home textarea relies only on `placeholder`. Placeholders are not labels — they vanish on focus and aren't reliably read. Add a visually-hidden label: `<label htmlFor="problem" className="sr-only">Describe your Windows problem</label>` and `id="problem"` on the textarea (or at minimum `aria-label`). The Tools search input (`src/pages/Tools.tsx`) has the same issue.

### 4. No "skip to content" link
**Files:** `src/components/layout/Layout.tsx`, `src/components/layout/Header.tsx`

Keyboard and screen-reader users must tab through the full nav on every page. Add a skip link as the first focusable element (visually hidden until focused) pointing at `<main id="main">`. Small change, big quality-of-life win.

### 5. Animations don't respect reduced-motion
**File:** `src/index.css`

`fadeInUp`, `shimmer`, and the `animate-pulse` mic all run unconditionally. Some users (vestibular sensitivity) and OS settings expect motion to stop. Wrap the keyframe-driven classes in:
```css
@media (prefers-reduced-motion: reduce) {
  .page-enter, .card-enter, .skeleton { animation: none; }
}
```

### 6. Icon-only buttons rely on `title` instead of `aria-label`
**Files:** `src/components/common/VoiceInput.tsx`, `src/components/layout/Header.tsx`

`title` is weakly/inconsistently announced. The voice button should use `aria-label` (toggle between "Start voice input" / "Stop voice input") plus `aria-pressed={listening}`. The mobile menu button has `aria-label` (good) but is missing `aria-expanded={mobileOpen}` and `aria-controls`. Audit all icon-only buttons (copy button in `CodeBlock`, the "Explain this script" toggle) for the same.

### 7. Low-contrast secondary text
**File:** `src/index.css` (palette), used widely

A few grays fall below WCAG AA (4.5:1) for small text on the near-black background:
- `text-surface-600` (#475569) — used for the footer copyright and breadcrumb arrows — lands around **2.7:1 (fails)**.
- `text-surface-500` (#64748b) — used for many captions/helper texts — is around **4.4:1 (borderline)**.

Bump small secondary text up one step (use `surface-400` as the floor for body-size text; reserve `surface-500/600` for large text or decorative dividers only).

### 8. Heading hierarchy drops the `h1` on result screens
**Files:** `src/components/fix/FixResult.tsx`, `ToolPageLayout.tsx`

On the input screen the page `h1` is the tagline; once the result renders, the top heading becomes an `h2` ("Your Fix Is Ready") and there's no `h1` on the page. Screen-reader users navigating by heading lose the top-level anchor. Make the result's primary heading an `h1`, or keep a consistent page-level `h1`.

### 9. Decorative emoji are read aloud
**File:** `src/components/fix/ProblemInput.tsx`

The three feature cards use emoji (🛡️ 👁️ 🔍) as icons. NVDA will announce them ("shield", "eye"). Since the adjacent title already conveys meaning, wrap the emoji in `<span aria-hidden="true">`. (See also visual note #3 below about replacing them entirely.)

---

## Priority 2 — Visual polish & UI

### 1. The hero image is built but unused
**Files:** `src/assets/hero.png`, `src/pages/Home.tsx`

`hero.png` ships in the bundle but the landing page is text-only. Either use it (a hero visual strengthens the page for a social-media audience landing from TikTok/IG) or remove it to cut bundle weight. For your audience, a polished hero with a short looping product shot or a clean device mockup would lift perceived quality.

### 2. Mixed icon languages
**Files:** `src/components/fix/ProblemInput.tsx` (emoji) vs. everywhere else (lucide-react)

The whole app uses crisp lucide icons except the home feature cards, which use emoji. Emoji render differently per OS and look less premium. Swap to lucide (`ShieldCheck`, `Eye`, `ScanSearch`) for a consistent, sharp visual identity — this is the first thing visitors see.

### 3. Inconsistent page widths
**Files:** `Home.tsx`/`ProblemInput.tsx` (`max-w-3xl`), `Tools.tsx` (`max-w-5xl`)

Minor, but the jump in container width between sections can feel slightly off. Decide on a system (e.g. reading content `max-w-3xl`, grids/galleries `max-w-5xl`) and apply it deliberately.

### 4. Add visible keyboard-focus styling
**File:** `src/components/common/Button.tsx` and nav/chips

Inputs have nice `focus:ring` states, but buttons, nav links, and the example "chips" rely on the browser default outline (often invisible on dark UIs). Add a `focus-visible:ring-2 focus-visible:ring-brand-400 focus-visible:ring-offset-2 focus-visible:ring-offset-surface-950` utility to interactive elements. This helps keyboard users and looks intentional.

### 5. Small tactile feedback on the primary button
**File:** `src/components/common/Button.tsx`

A subtle `active:scale-[0.98]` and slightly stronger pressed state makes the main "Get My Fix" / "Download" buttons feel more responsive — cheap, high perceived-quality.

---

## Priority 3 — Flow & conversion

The funnel is clean. These are about trust and tying the product to your brand/business.

### 1. No social sharing preview (Open Graph tags) — high value for you
**File:** `index.html`

There are no `og:` or `twitter:card` meta tags. When you (or a follower) drop the Fixelo link in a TikTok bio, IG story, or a tweet, it renders as a bare URL with no image, title, or description — much lower click-through. Add:
```html
<meta property="og:title" content="Fixelo — Fix any Windows problem in plain English">
<meta property="og:description" content="Describe your PC problem. Download a safe fix with automatic undo. Free.">
<meta property="og:image" content="https://YOURDOMAIN/og-cover.png">
<meta property="og:type" content="website">
<meta name="twitter:card" content="summary_large_image">
```
For a creator driving traffic from social, this is one of the highest-ROI changes on the list.

### 2. No social proof
**Files:** `Home.tsx` / `ProblemInput.tsx`

You have a million followers — the landing page doesn't say so. A light trust strip ("Trusted by 1M+ followers", a count of fixes generated, or 2–3 short testimonials) right under the hero would raise conversion meaningfully, especially for non-technical visitors deciding whether to run a downloaded file.

### 3. No bridge to the things you sell
You sell apps, games, and books to your audience, but the app doesn't cross-sell. A tasteful footer block or a post-download card ("Liked this? Check out my apps →") turns free utility traffic into product discovery without hurting the core experience.

### 4. Tell non-technical users how to actually run the file
**File:** `src/components/fix/FixResult.tsx`

After download you show the UAC warning (good), but not the basic "how to run it" steps. Your audience is non-technical. Add a short numbered "How to run your fix": 1) Find the file in your Downloads, 2) Double-click it, 3) Click **Yes** on the Windows popup. This reduces drop-off at the very last step where the value is delivered.

### 5. Arabic / RTL is not handled
**Files:** `index.html` (`lang="en"`), `VoiceInput.tsx` (`lang="en-US"`)

Your audience is partly Arabic-speaking. Voice input is hard-coded to English, and there's no RTL/`dir` handling. Not urgent, but if you localize later, plan for `dir="rtl"`, an Arabic voice locale, and mirrored layout. Worth noting now so it's not a rewrite later.

---

## Quick-win checklist (highest impact, lowest effort)

1. Add `role="status" aria-live="polite"` to the toast container and to loading/result regions.
2. Add a real (sr-only) label to the home textarea and the tools search.
3. Add Open Graph + Twitter card meta tags to `index.html`.
4. Add `aria-label` (+ `aria-pressed` / `aria-expanded`) to the voice, menu, copy, and explain buttons.
5. Add a `prefers-reduced-motion` block to `index.css`.
6. Bump `surface-600`/`surface-500` small text up to `surface-400`.
7. Add a skip-to-content link.
8. Swap the emoji feature-card icons for lucide icons (or at least `aria-hidden` them).

---

## What's already done well (keep it)

- Clean, consistent dark theme and component system.
- Genuinely good core flow with progressive disclosure (the "advanced: see the script" + "explain in plain English" pattern is excellent).
- Strong, repeated safety/undo messaging — the right trust anchor for this product.
- Voice input on the main field — a thoughtful accessibility/convenience touch.
- Good use of skeletons during loading.
- Sensible routing, breadcrumbs on tool pages, and a real 404.
- `Diagnose.tsx` already uses `aria-labelledby` / `sr-only` correctly — use it as the template for fixing the other pages.
