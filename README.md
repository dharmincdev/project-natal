# 🌳 Project Natal

> **Next-Generation Family Tree Builder** — Beautifully visualize, explore, and share family legacies with AI, interactive 3D spatial orbit, world migration maps, and instant reunion QR code sharing.

---

## ✨ Features

- **Overlap-Free Kinship Graph Engine:** Custom hierarchical layout algorithm with biological sibling clustering, sibling facing rules, lateral paternal vs. maternal wings, and orthogonal jump bridges.
- **4 Interactive Visualization Modes:**
  - **Flat 2D Canvas:** Infinite pan/zoom canvas powered by React Flow with custom person cards and marriage union hubs.
  - **3D Generational Orbit:** Interactive Three.js spatial galaxy model organizing generations into orbital rings.
  - **Interactive Family Timeline:** Chronological milestone stream with living age calculations and event filters.
  - **3D World Globe & Migration:** Interactive 3D globe charting ancestral birthplaces and migration journeys.
- **GEDCOM 7.0 & 5.5.1 Interoperability:** 1-click import and export of standard `.ged` genealogical files with live pre-import relationship metrics.
- **AI Family Historian:** Grounded AI agent that answers lineage questions, identifies oldest/youngest ancestors, and highlights birthdays without hallucinations.
- **Reunion & Event Sharing:** Instant smartphone QR code generation for reunion table tents, printable PDF posters, and 300 DPI PNG/SVG vector exports.
- **Cloud Backend & Privacy:** Supabase PostgreSQL database with strict Row-Level Security (RLS) policies, passwordless email magic link sign-in, and Google OAuth.
- **End-to-End Automated Testing:** Automated Playwright browser test suite covering core canvas, navigation, and file import workflows.

---

## 🛠️ Tech Stack

- **Framework:** [Next.js](https://nextjs.org/) (App Router, React 19)
- **Styling:** [Tailwind CSS v4](https://tailwindcss.com/), [shadcn/ui](https://ui.shadcn.com/)
- **Graph & 3D Visualization:** [@xyflow/react](https://reactflow.dev/), [Three.js](https://threejs.org/)
- **Backend & Authentication:** [Supabase](https://supabase.com/) (PostgreSQL, Row Level Security, Auth)
- **Interchange Standard:** Lineage-Linked GEDCOM 7.0 / 5.5.1
- **Testing:** [Playwright](https://playwright.dev/)

---

## 🚀 Getting Started

### 1. Clone & Install Dependencies

```bash
git clone https://github.com/dharmincdev/project-natal.git
cd project-natal
npm install
```

### 2. Configure Environment Variables

Copy `.env.example` to `.env.local`:

```bash
cp .env.example .env.local
```

Fill in your Supabase project credentials:
```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

### 3. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) (or `http://localhost:3001` if port 3000 is occupied).

### 4. Run Automated E2E Tests

```bash
npm run test:e2e
```

---

## 📄 License

Private / Proprietary. All rights reserved.
