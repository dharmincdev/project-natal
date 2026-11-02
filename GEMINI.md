# Project Natal: Agentic Workflow & Linear Roadmap Index

See [`AGENTS.md`](./AGENTS.md) for core architectural rules, tech stack constraints, and Supabase backend invariants, and [`SPEC.md`](./SPEC.md) for the authoritative product specification.

## 1. Active Linear Projects (`Project Natal` / `PRO`)
* **Project 1 (Core Canvas & Persistence):** `PRO-5` (LocalStorage/Coordinate Auto-Save), `PRO-6` (Handle Drag Connections), `PRO-7` (Dashed Rose Spouse Edges).
* **Project 2 (Navigation, Mobile UX & Polish):** `PRO-8` (Persistent 3-Zone Header), `PRO-9` (Mobile Viewport Overhaul), `PRO-10` (Deceased Toggle & Date Alignment), `PRO-11` (Capacity Badge Spacing), `PRO-12` (Shared Link Palette).
* **Project 3 (Viewport Consolidation & MVP Pruning):** `PRO-13` (Remove 3D Orbit), `PRO-14` (Unified Timeline + Tracks + Year Scrubber), `PRO-15` (3D Globe Detail & Remove 2D Map Toggle).
* **Project 4 (GEDCOM & High-Fidelity Exports):** `PRO-16` (External GEDCOM Parser), `PRO-17` (GEDCOM Round-Trip Export/Import), `PRO-18` (High-DPI PNG/SVG/PDF Export w/ Matching Lines).
* **Project 5 (Audio Vault Reliability):** `PRO-19` (Chrome Audio Playback via Storage/Base64), `PRO-20` (Remove Simulated Voice Memory UI).
* **Project 6 (Supabase Backend, Auth, Storage & Realtime):** `PRO-21` (Header Sign-In CTA & Auth Modal), `PRO-22` (Inspectable Cloud Sync), `PRO-23` (Collaborator Invite Emails), `PRO-27` (`@supabase/ssr` Server Client & `/auth/callback`), `PRO-28` (Granular CRUD APIs & Atomic GEDCOM RPC), `PRO-29` (Supabase Storage Buckets for Audio/Docs), `PRO-30` (Supabase Realtime Collaboration & Presence), `PRO-31` (DB Tier Capacity & Graph Triggers).
* **Project 7 (Stripe Monetization & AI Historian):** `PRO-24` (\$5 One-Time & \$7/mo Pro Checkout Flows), `PRO-25` (AI Historian Tier Gating), `PRO-26` (AI Kinship Reasoning Engine & Webhook Verification).

## 2. Agentic Execution Protocol
1. **Before coding a ticket:** Read the relevant section of `SPEC.md` and inspect existing unit/E2E tests.
2. **Vertical-slice implementation:** Never build a UI control without wiring its real persistence/backend handler (`src/lib/supabase/`, `src/app/api/`, or `src/lib/storage.ts`).
3. **Verification gate before completing any ticket:**
   * `npx tsc --noEmit` (0 errors)
   * `npm run test:unit` (all Vitest suites green)
   * `npx playwright test` (E2E verification on `http://localhost:3001`)
   * Update the corresponding `/qa` test case definition in `src/data/qa-test-cases.ts` if MVP scope changed.

