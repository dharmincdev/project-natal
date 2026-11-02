<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Project Natal: Agent Engineering Rules & Guidelines

You are working on **Project Natal**, a production-grade modern family tree and oral history platform.

## 1. Prime Directive: Spec & Linear Alignment
* **Canonical Specification:** Always treat `SPEC.md` as the single source of truth for architectural decisions, domain models, feature boundaries, and security rules.
* **Linear Issue Tracking (`PRO-*`):** All work is tracked in the **Project Natal (`PRO`)** Linear team across 7 Projects (`PRO-5` through `PRO-31`). Reference the corresponding Linear ticket ID in commits and PRs, and update ticket statuses as tasks complete.
* **MVP Scope Guardrails:** The 3D Orbit (`TreeOrbit3D`) and 2D Flat Map projection toggle are deprecated for MVP (`PRO-13`, `PRO-15`). Timeline views are consolidated into a single unified Timeline experience (`PRO-14`).

## 2. Technology Stack & Constraints
* **Framework:** Next.js 16.3+ (App Router) with React 19. Always use async `cookies()`, `headers()`, `params`, and `searchParams`.
* **Language:** TypeScript in strict mode. Never use `any` when a domain type exists in `src/types/tree.ts`.
* **Styling:** Tailwind CSS v4, `@base-ui/react`, Radix primitives, Lucide icons.
* **Graph Engine:** `@xyflow/react` v12+. Ensure all node handle IDs, persisted manual coordinates (`positionX`, `positionY`), and orthogonal/dashed-spouse line calculations follow `src/lib/layout.ts`.
* **3D World Visualization:** `three` v0.185+ for the interactive 3D World Migration Globe (`TreeWorldGlobe.tsx`).
* **Database, Auth & Storage:** Supabase PostgreSQL with RLS policies, `@supabase/ssr` Server/Browser clients, Supabase Storage buckets (`vault-audio`, `vault-docs`, `avatars`), and Supabase Realtime channels.
* **Payments:** Stripe Checkout and Webhooks (`/api/stripe/checkout`, `/api/stripe/webhook`).

## 3. Production Backend & Supabase Architecture Standards
* **No Bulk Client Overwrites:** Never dump the entire tree via bulk client `.upsert()` without handling deletions. Use granular mutations (`upsertPerson`, `updateNodePositions`, `deletePerson`, `createRelationship`, `deleteRelationship`) and atomic Postgres RPCs for bulk imports (`import_gedcom_tree`).
* **No Ephemeral `blob:` URLs in Database:** Never persist browser-local `blob:http://...` URLs to PostgreSQL or `localStorage`. Upload audio stories and documents to **Supabase Storage buckets** (with Base64 Data URL fallback strictly for offline unauthenticated demo mode).
* **Server-Side Enforcement:** Enforce tier member limits (`free`: 25, `onetime`: 100, `pro`: unlimited), RBAC permissions (`Owner`, `Admin`, `Editor`, `Viewer`), and DAG cycle checks on the server/database layer in addition to client UI guards.
* **Graceful Degradation (Offline-First):** Preserve `localStorage` fallback (`src/lib/storage.ts`) when unauthenticated or when external API keys are absent, ensuring user coordinates and edits persist across browser refreshes.

## 4. Engineering & Verification Standards
* **Type Safety:** Always run `npx tsc --noEmit` after modifying code. All changes must compile with 0 errors.
* **Unit & Integration Tests:** Run `npm run test:unit` (Vitest) to verify graph invariants, layout math, GEDCOM round-trips, privacy redaction, and API contracts.
* **End-to-End Tests:** Run Playwright tests (`npx playwright test`) against real user flows on port `3001`.
* **Graph Invariant Rule:** All parent-child mutations must be validated against cycles (Directed Acyclic Graph invariant). A person can never be an ancestor of themselves.
* **Living Person Privacy:** On public `/t/[slug]` views, living individuals must be redacted (`"Living Relative"`, masked birth dates) according to `SPEC.md` Section 6.1.

## 5. Git & Commits
* Always author Git commits with:
  ```bash
  GIT_CONFIG_GLOBAL=/dev/null git -c user.name="dharmincdev" -c user.email="dharminc.dev@gmail.com" commit -m "<type>(<scope>): <description> [PRO-XX]"
  ```
* Write clean, conventional commit messages (`feat:`, `fix:`, `refactor:`, `test:`, `docs:`).

