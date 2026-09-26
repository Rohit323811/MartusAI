# TESTS.md — MartusAI

## Phase 2–4 checks (current build)

Functional (verified in-browser):
- [x] Fresh browser → 3 free tries; badge shows "N free analyses left"
- [x] After 3rd success, counter = 3 and badge flips to "Sign in to continue"
- [x] 4th attempt blocked BEFORE any API call; SignUpGateModal opens
- [x] Gate copy exact per spec; "continue browsing" dismisses; results never hidden
- [x] Counter increments ONLY on success (API 500/502/timeout → no increment)
- [x] Sign-in clears the counter (signed-in = unlimited)
- [x] Magic-link modal: email → signInWithOtp → "check your email" state;
      graceful explanatory error when Supabase keys are absent
- [x] Anonymous banner: dismiss for session (sessionStorage), auth-aware text
- [x] Community Wisdom: 3 cards mobile carousel → desktop grid; add-outcome
      appends to `martusai_outcomes` and re-renders instantly with toast
- [x] Summary heatmap: high=none / medium=amber / low=red tints; dotted
      citation underlines open the drawer (click + Enter/Space)
- [x] Citation drawer: 420px right sheet desktop, 80vh bottom sheet mobile;
      Esc + X + backdrop close; focus moves to X on open, returns on close;
      `#citation-{id}` hash set/cleared (shareable)
- [x] Explain toggle Legal/Plain/Simple switches from cache with 150ms fade
- [x] Rights Radar: horizontal desktop / vertical mobile; urgency computed
      client-side from dates (overdue red pulse, soon amber, safe green);
      node tap → Remind Me → sign-in prompt when anonymous; Supabase insert
      when signed in; localStorage fallback; empty state with manual add
- [x] Results page: sticky header (issue/jurisdiction/demo pill, try badge,
      Save, Share→clipboard), sticky Sources sidebar mini-TOC, save card
- [x] /api/analyze: 5 req/min per IP; requestId returned + shown on failure
      screen; Zod failures logged server-side, never crash the client
- [x] No horizontal scroll at 320 / 375 / 768 / 1440 (audited, two overflow
      bugs found and fixed: grid min-width, unwrappable header actions)

Pipeline (code-verified, needs key for live run):
- [ ] 3 real documents end-to-end (eviction / wage theft / loan) — needs XAI_API_KEY
- [x] Demo fallback: without key, sample analysis flows through identical path

## Phase 1 checks

- [x] `npm run build` passes with zero TypeScript errors
- [x] Landing page renders at 320 / 375 / 768 / 1024 / 1440 px with no horizontal scroll
- [x] Upload tab: drag-and-drop + file picker + size/type validation
- [x] Type tab: textarea with min-length gate + character counter
- [x] "Try a sample document" routes through processing to results
- [x] Processing sequence shows 4 cinematic steps, then redirects
- [x] Results page renders summary + confidence heatmap + citation drawer
- [x] Citation drawer opens via click/Enter/Space, closes via X/Esc/backdrop
- [x] Anonymous banner visible on all pages; sign-in modal is UI-only stub
- [x] Keyboard: skip link, tab order, focus rings, Esc closes drawer
- [x] No spinners — skeleton loaders + cinematic sequence only
- [x] `prefers-reduced-motion` disables animation

## Phase 8 plan (per brief §13)

Three real anonymized documents will be run end-to-end and logged here with
screenshots:

1. Eviction notice
2. Wage-theft letter
3. Predatory loan contract

For each: red flags detected, deadlines dated, citations resolve, draft is
coherent, heatmap matches citation coverage. Responsive audit at 375 / 393 /
768 / 1440 / 1920 px. One Vitest unit test per API route.
