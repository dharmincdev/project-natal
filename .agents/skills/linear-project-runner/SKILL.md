---
name: linear-project-runner
description: >-
  Executes Project Natal Linear Projects (Project 1 through Project 7) and PRO-* tickets
  end-to-end with automated Linear status transitions, root-cause lookups, TDD regression tests,
  strict verification gates (tsc, Vitest, Playwright on port 3001), and conventional Git commits.
  Use this skill whenever the user asks to run, execute, implement, or verify a Linear Project
  or PRO-* ticket in Project Natal.
---

# Project Natal: Linear Project Runner Skill

Use this skill to execute any **Project Natal** Linear Project (`Project 1`–`Project 7`) or ticket (`PRO-5`–`PRO-31`) from start to finish with zero regressions.

## Step-by-Step Execution Protocol

### 1. Load the Root-Cause Map & Move Tickets to "In Progress"
1. Read [root-cause-map.md](./references/root-cause-map.md) for the target Project/tickets to locate the exact files, line numbers, and QA test cases (`TC-*`).
2. Mark the target Linear tickets as `"In Progress"` using the helper script:
   ```bash
   node .agents/skills/linear-project-runner/scripts/linear-status.mjs start PRO-X PRO-Y
   ```

### 2. Write or Update Automated Regression Tests First
Before or alongside the implementation, add or update a test covering the exact QA failure mode:
- **Logic / Graph / Parser / Export / API contracts:** Add Vitest assertions in `src/lib/__tests__/`.
- **Canvas / UI / Mobile / Navigation / Modals:** Add Playwright E2E assertions in `e2e/` targeting `http://localhost:3001`.
- **MVP Scope Changes (`PRO-13`, `PRO-14`, `PRO-15`, `PRO-20`):** Update `src/data/qa-test-cases.ts` and `e2e/qa-harness.spec.ts` so the `/qa` harness reflects the streamlined MVP test count.

### 3. Implement the Vertical-Slice Fix
Follow the architectural invariants in [`AGENTS.md`](../../../AGENTS.md) and [`SPEC.md`](../../../SPEC.md):
- Never rely on ephemeral React state when `localStorage` (`src/lib/storage.ts`) or Supabase (`src/lib/supabase/`) persistence is required.
- Never use `any`; use strict domain types from `src/types/tree.ts`.

### 4. Run the Mandatory Verification Gate
All three checks must pass with **0 errors**:
1. Typecheck:
   ```bash
   npx tsc --noEmit
   ```
2. Unit & Integration Suite:
   ```bash
   npm run test:unit
   ```
3. End-to-End Playwright Suite (against port `3001`):
   ```bash
   npx playwright test
   ```

### 5. Commit & Close Linear Tickets
1. Stage and commit changes referencing the Linear ticket IDs:
   ```bash
   git add -A
   git -c user.name="dharmincdev" -c user.email="dharminc.dev@gmail.com" commit -m "<type>(<scope>): <summary> [PRO-X, PRO-Y]"
   ```
2. Transition the Linear tickets to `"Done"` and post a verification comment:
   ```bash
   node .agents/skills/linear-project-runner/scripts/linear-status.mjs done "Verified: tsc 0 errors, Vitest green, Playwright E2E passed." PRO-X PRO-Y
   ```

