# Project Natal: QA Round 1 & Linear Root-Cause Map (`PRO-5` – `PRO-31`)

## Project 1: Core Canvas, Graph Interactions & Persistence
- **`PRO-5` (`TC-1.2`, `TC-6.5` — Free Node Dragging & LocalStorage Persistence):**
  - **Files:** `src/components/tree/TreeCanvas.tsx` (L79, L186–192), `src/lib/layout.ts` (L4–8), `src/app/demo/page.tsx` (L84–100).
  - **Root Cause:** `TreeCanvas` keeps dragged positions in local `customPositions` state and never updates `person.positionX` / `person.positionY` in `treeData.people`. Additionally, `layoutFamilyTree` ignores stored `person.positionX` / `person.positionY` unless passed in `customPositions`.
  - **Fix:** Add `onNodePositionChange?: (personId: string, pos: { x: number; y: number }) => void` prop on `TreeCanvas`, persist dragged coordinates into `person.positionX` / `person.positionY` (or `person.customFields._manualPos`), and have `layoutFamilyTree` honor persisted manual coordinates until "Auto-Align" (`handleResetLayout`) clears them.
- **`PRO-6` (`TC-1.4` — Direct On-Canvas Handle Dragging & Connection):**
  - **Files:** `src/components/tree/PersonNode.tsx` (L66–81, L141, L219–234), `src/components/tree/TreeCanvas.tsx` (L195–222, L233).
  - **Root Cause:** React Flow defaults to `ConnectionMode.Strict`, handles are small (`w-3 h-3`), and the hover card (`bottom-full mb-2`) overlaps the top handle.
  - **Fix:** Enable `connectionMode={ConnectionMode.Loose}` on `<ReactFlow>`, enlarge handle hit areas (`w-3.5 h-3.5` with `z-20`), add `pointer-events-none` / offset to hover card, and normalize source/target handle pairs in `handleConnect`.
- **`PRO-7` (`TC-1.1` — Spouse Dashed Rose Lines):**
  - **Files:** `src/lib/layout.ts` (L748–792), `src/lib/tree-export.ts` (L86–101).
  - **Root Cause:** Spouse edges use `style: { stroke: '#f43f5e', strokeWidth: 2 }` without `strokeDasharray`.
  - **Fix:** Add `strokeDasharray: '6,4'` to all spouse edges in `layout.ts` and `tree-export.ts`.

---

## Project 2: Navigation, Responsive Mobile UX & UI Polish
- **`PRO-8` (`TC-10.1` — Disappearing Desktop Header & Breakpoints):**
  - **Files:** `src/components/tree/demo/DemoHeader.tsx` (L79–306).
  - **Root Cause:** Aggressive `hidden lg:inline-flex` and `hidden 2xl:inline-flex` classes hide essential actions on standard desktop widths (`1024px–1440px`), and header lacks `min-h-14 z-30 shrink-0`.
- **`PRO-9` (`TC-9.3`, `TC-10.1`, `TC-10.5` — Mobile Viewport Overhaul):**
  - **Files:** `src/components/tree/demo/DemoHeader.tsx`, `src/app/t/[slug]/SharedTreeClient.tsx`, `src/components/tree/MobilePersonPreview.tsx`, `src/components/tree/TreeCanvas.tsx`.
  - **Root Cause:** 7+ buttons crammed into one narrow header row on `375px` viewports.
  - **Fix:** Streamline `< 640px` header into 3 clean zones (Tree Switcher, View Switcher icon pill, Primary `+` / `⋯` menu), and polish mobile bottom preview sheet.
- **`PRO-10` (`TC-2.3` — Deceased Toggle & Birth/Death Date Alignment):**
  - **Files:** `src/components/tree/detail/PersonEditForm.tsx` (L139–206), `src/components/tree/dialogs/PersonBasicInfoForm.tsx` (L175–238).
  - **Root Cause:** `Birth Date` `<Label>` is outside the `grid-cols-2` container while `Death Date` `<Label>` is inside column 2, pushing the Death Date input down by `22px`. Toggle is an unstyled raw checkbox.
  - **Fix:** Place a styled pill switch for `Living / Deceased` above the grid, and place both `<Label htmlFor="birthDate">` and `<Label htmlFor="deathDate">` inside their respective grid columns so both `<Input type="date">` elements align horizontally.
- **`PRO-11` (`TC-7.1` — Free Tier 25-Member Capacity Badge & Paywall Spacing):**
  - **Files:** `src/components/tree/demo/DemoHeader.tsx` (L282–300), `src/components/shared/UpgradeModal.tsx` (L144–180).
- **`PRO-12` (`TC-8.3` — Shared Link Theme Palette `/t/[slug]`):**
  - **Files:** `src/app/t/[slug]/SharedTreeClient.tsx` (L85–95, L176, L185).
  - **Root Cause:** Uses hardcoded `bg-gray-50 dark:bg-gray-900`, `dark:bg-gray-800`, and `text-blue-600` instead of `bg-background`, `bg-card`, `border-border`, and `text-primary`.

---

## Project 3: Viewport Consolidation & MVP Scope Pruning
- **`PRO-13` (`TC-4.1` — Remove 3D Orbital Constellation View `🪐 3D`):**
  - **Files:** `src/components/tree/ViewModeSwitcher.tsx`, `src/app/demo/page.tsx`, `src/app/t/[slug]/SharedTreeClient.tsx`, `src/data/qa-test-cases.ts`.
- **`PRO-14` (`TC-4.2`, `TC-4.3`, `TC-4.4` — Consolidate Timeline Stream, Lifespan Tracks & Year Scrubber):**
  - **Files:** `src/components/tree/TreeTimeline.tsx`, `src/data/qa-test-cases.ts`.
  - **Fix:** Combine the interactive Time Traveler Year Scrubber at the top of `TreeTimeline.tsx` with unified Lifespan Bars + Chronological Decade Stream in one view.
- **`PRO-15` (`TC-4.5`, `TC-4.6` — Upgrade 3D Globe Detail & Remove Broken 2D Map Toggle):**
  - **Files:** `src/components/tree/TreeWorldGlobe.tsx`, `src/data/qa-test-cases.ts`.

---

## Project 4: GEDCOM Interoperability & High-Fidelity Exports
- **`PRO-16` & `PRO-17` (`TC-5.1`, `TC-5.2`, `TC-5.3` — GEDCOM Import & Round-Trip Export):**
  - **Files:** `src/lib/gedcom/parser.ts` (L38–45, L137, L146), `src/lib/gedcom/exporter.ts` (L124–163), `src/components/tree/ImportGedcomDialog.tsx`.
  - **Root Cause:**
    1. In `parser.ts` (L38), `0 @I1@ INDI` parses `'INDI'` into `line.tag` and `undefined` into `line.value`, but L137 checks `line.value === 'INDI'` and L146 checks `line.value === 'FAM'`—causing **0 individuals and 0 families** to ever be parsed!
    2. In `exporter.ts` (L124–163), `FAM` records are only emitted for married couples (`spouseRelationships`), dropping single-parent `parent_child` relationships and `sibling` relationships.
- **`PRO-18` (`TC-5.4`, `TC-5.5` — High-DPI PNG/SVG/PDF Export w/ Accurate Orthogonal Lines):**
  - **Files:** `src/lib/tree-export.ts` (L84–103, L161–202).
  - **Root Cause:** `generateTreeSvg` draws cubic Bézier curves from the bottom of every node instead of using the orthogonal `channel` step routing and side-handle dashed spouse lines from `layoutFamilyTree`.

---

## Project 5: Audio Vault Reliability & Cleanup
- **`PRO-19` (`TC-3.3` — Stored Audio Memory Playback in Chrome):**
  - **Files:** `src/data/fixtures/smith-family.ts` (L50), `src/components/tree/AudioRecorder.tsx` (L64–86), `src/components/tree/PersonVaultSection.tsx` (L49–70).
  - **Root Cause:** Seed WAV in `smith-family.ts` is 16 bytes (2ms of silence), and `AudioRecorder` does not negotiate supported Chrome MIME types (`audio/webm;codecs=opus`, `audio/mp4`) or generate an audible synthesized waveform fallback.
- **`PRO-20` (`TC-3.2` — Remove "Simulate Voice" Button from User UI):**
  - **Files:** `src/components/tree/AudioRecorder.tsx` (L238–245), `src/data/qa-test-cases.ts`.

---

## Project 6: Supabase Backend Infrastructure, Auth, Storage & Realtime
- **`PRO-27` (`[BACK-1]` — Server-Side `@supabase/ssr` Client, Middleware & `/auth/callback`):**
  - **Files:** `src/lib/supabase/server.ts`, `src/middleware.ts`, `src/app/auth/callback/route.ts`.
- **`PRO-28` (`[BACK-2]` — Granular CRUD API Routes & Atomic GEDCOM RPC):**
  - **Files:** `src/lib/supabase/db.ts`, `src/app/api/trees/route.ts`, `src/app/api/trees/[id]/route.ts`, `supabase/migrations/004_production_backend.sql`.
- **`PRO-29` (`[BACK-3]` — Supabase Storage Buckets for Audio & Document Vault):**
  - **Files:** `supabase/migrations/004_production_backend.sql`, `src/lib/supabase/storage.ts`, `src/components/tree/AudioRecorder.tsx`, `src/components/tree/DocumentUploader.tsx`.
- **`PRO-30` (`[BACK-4]` — Supabase Realtime Collaboration & Presence):**
  - **Files:** `src/lib/supabase/realtime.ts`, `src/app/demo/page.tsx`, `src/components/tree/demo/DemoHeader.tsx`.
- **`PRO-31` (`[BACK-5]` — Database-Level Tier Capacity Triggers & Graph Constraints):**
  - **Files:** `supabase/migrations/004_production_backend.sql`.
- **`PRO-21`, `PRO-22`, `PRO-23` (`TC-6.1`, `TC-6.2`, `TC-6.4`, `TC-6.5`, `TC-8.2` — Auth Modal, Cloud Sync Indicator & Collaborator Invite API):**
  - **Files:** `src/components/shared/AuthModal.tsx`, `src/components/shared/UserNav.tsx`, `src/app/api/collaborators/invite/route.ts`, `src/components/tree/collaborators/CollaboratorInviteForm.tsx`.

---

## Project 7: Stripe Monetization & AI Family Historian
- **`PRO-24` (`TC-7.2`, `TC-7.3` — $5 One-Time & $7/mo Pro Stripe Checkout Flows):**
  - **Files:** `src/components/shared/UpgradeModal.tsx`, `src/app/api/stripe/checkout/route.ts`, `src/app/dashboard/page.tsx`.
  - **Fix:** Redirect to Stripe Checkout when configured; when in local/demo mode, display an interactive Checkout Confirmation step with clear feedback and URL query state (`?upgrade_success=true&tier=pro`) instead of silently closing the modal.
- **`PRO-25` (`TC-7.4` — Enforce AI Family Historian Tier Gating):**
  - **Files:** `src/components/chat/ChatPanel.tsx`, `src/components/tree/demo/DemoHeader.tsx`.
- **`PRO-26` (`TC-7.5`, `TC-7.6` — Harden AI Family Historian Reasoning Engine & Verify Webhooks):**
  - **Files:** `src/lib/ai/chat.ts`, `src/app/api/ai/chat/route.ts`, `src/lib/__tests__/stripe-webhook.test.ts`.

