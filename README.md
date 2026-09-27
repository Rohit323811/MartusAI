# MartusAI ⚖️

**Know your rights. Before the deadline does.**

Upload any legal document. Get plain-language answers, cited sources, and a
draft response — in under 30 seconds. Built for the Lex Hacks
Hackathon 2K26.

> MartusAI provides legal **information**, not legal advice.

## Stack

- Next.js 14 (App Router) + TypeScript
- Tailwind CSS + shadcn-style UI primitives
- Framer Motion (subtle, purposeful)
- Lucide React icons
- Supabase (magic-link auth — Phase 5)
- Grok API for vision + text analysis (Phase 2)

## Getting started

```bash
cd lexlocal
npm install
cp .env.local.example .env.local   # fill in before Phase 2
npm run dev
```

Open http://localhost:3000.

## Phase status

| Phase | Scope | Status |
| --- | --- | --- |
| 1 | Skeleton + design system + landing + input tabs + processing + minimal results | ✅ |
| 2 | 3-try gate, Supabase magic-link auth, anonymous banner, Community Wisdom | ✅ |
| 3 | Real Grok pipeline (vision + text, Zod-validated, rate-limited, graceful failures) | ✅ code-ready — needs `XAI_API_KEY` |
| 4 | Results core: Confidence Heatmap, Explain toggle, Citation Drawer, Rights Radar | ✅ |
| 5 | Red Flag overlay + Case Strength scorer + Draft editor | ⏳ next |
| 6 | Legal Aid Matchmaker (Leaflet) + Save wiring | ⏳ |
| 7 | Polish + responsive + a11y audit | ⏳ |
| 8 | Ship (TESTS.md, README, demo video, Devpost) | ⏳ |
| M | Modules: PlainSite · ContractFlow · EvidenceChain · TenantShield (Groq-powered) | ✅ |

## Modules (Groq-powered)

Four standalone tools, each with its own page and API route, sharing the
design system. They use `GROQ_API_KEY` (llama-3.3-70b-versatile via the
OpenAI SDK) and run in demo mode without it:

| Module | Route | API | What it does |
| --- | --- | --- | --- |
| PlainSite | `/plainsite` | `POST /api/plainsite/translate` | Plain-English rewrite (6th-grade), ≤5 key points, user-disadvantageous clause flags |
| ContractFlow | `/contractflow` | `POST /api/contractflow/extract` `/flag` `/route` `/reminders` | PDF/DOCX → structured terms; flag deviations vs `contract_templates`; approval path; deadlines + `.ics` download |
| EvidenceChain | `/evidencechain` | `POST /api/evidencechain/hash` | SHA-256 + EXIF/PDF metadata; appends to `evidence_log`; Chain-of-Custody card with QR; re-verify |
| TenantShield | `/tenantshield` | `POST /api/tenantshield/analyze` | Deadline card, downloadable response letter, court prep checklist |

Run `supabase/migrations/002_modules.sql` to create `contract_templates`
and `evidence_log`. A "Modules" sidebar (desktop) / collapsible bar
(mobile) links to all four from every page.

> Without `XAI_API_KEY` set, the app runs in demo mode: /api/analyze returns
> the sample eviction analysis through the exact same pipeline (validation,
> storage, counter) so every screen is demoable. Add the key and the real
> Grok calls take over — no code changes needed.

### Supabase setup (optional, enables sign-in + saved analyses)

1. Create a project at supabase.com
2. Run `supabase/migrations/001_init.sql` in the SQL editor
3. Enable Email magic-link auth (Authentication → Providers → Email)
4. Copy URL + anon key into `.env.local`

## Project structure

See the repo tree — `src/app` (routes + API), `src/components` (UI),
`src/lib` (clients, prompts, schemas), `data/` (seeded cases + clinics).

## Scripts

- `npm run dev` — start dev server
- `npm run build` — production build
- `npm run typecheck` — `tsc --noEmit`
- `npm run lint` — ESLint
