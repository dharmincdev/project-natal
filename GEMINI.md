# Project Natal: Agent Engineering Rules & Guidelines

You are working on **Project Natal**, a high-performance modern family tree and oral history platform.

## 1. Prime Directive: Spec Alignment
* **Canonical Specification:** Always treat `SPEC.md` as the single source of truth for architectural decisions, domain models, feature boundaries, and security rules.
* **No Spec Drift:** Never invent alternative schemas, endpoints, or data models without explicit alignment with `SPEC.md`.

## 2. Technology Stack & Constraints
* **Framework:** Next.js 16.3+ (App Router) with React 19.
* **Language:** TypeScript in strict mode. Never use `any` when a domain type exists in `src/types/tree.ts`.
* **Styling:** Tailwind CSS v4, `@base-ui/react`, Radix primitives, Lucide icons.
* **Graph Engine:** `@xyflow/react` v12+. Ensure all node handle IDs and orthogonal line calculations follow `src/lib/layout.ts`.
* **3D Visualizations:** `three` v0.185+ for 3D Orbit (`TreeOrbit3D.tsx`) and Globe (`TreeWorldGlobe.tsx`).
* **Database & Auth:** Supabase PostgreSQL with RLS policies and GoTrue Auth.
* **Payments:** Stripe Checkout and Webhooks.

## 3. Engineering & Code Quality Standards
* **Type Safety:** Always run `npx tsc --noEmit` after modifying code. All changes must compile with 0 errors.
* **Testing:** Run Playwright tests (`npx playwright test`) to ensure zero regressions on existing E2E user flows.
* **Graceful Degradation (Offline-First):** Always preserve local fallback (`localStorage` in `src/lib/storage.ts`) so the app runs smoothly even when Supabase, Stripe, or OpenAI API keys are not present in `.env.local`.
* **Graph Invariant Rule:** All parent-child mutations must be validated against cycles (Directed Acyclic Graph invariant). A person can never be an ancestor of themselves.
* **Living Person Privacy:** On public `/t/[slug]` views, living individuals must be redacted (`"Living Relative"`, masked birth dates) according to `SPEC.md` Section 6.1.

## 4. Git & Commits
* Always author Git commits with:
  ```bash
  GIT_CONFIG_GLOBAL=/dev/null git -c user.name="dharmincdev" -c user.email="dharminc.dev@gmail.com" commit -m "<type>: <description>"
  ```
* Write clean, conventional commit messages (`feat:`, `fix:`, `refactor:`, `test:`, `docs:`).
