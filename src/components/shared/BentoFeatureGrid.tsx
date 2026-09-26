'use client';

import {
  Sparkles,
  QrCode,
  Network,
  Globe2,
  Moon,
  FileDown,
  ShieldCheck,
  Heart,
  Users,
  Orbit,
  Clock3,
  LayoutGrid,
} from 'lucide-react';

/* ── individual tile components ── */

function TileCanvas() {
  return (
    <div className="bento-tile bento-canvas group relative overflow-hidden bg-zinc-950 text-white">
      {/* Decorative tree lines */}
      <svg
        className="absolute inset-0 w-full h-full opacity-[0.12]"
        viewBox="0 0 400 400"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        {/* Grandparent */}
        <circle cx="200" cy="60" r="18" stroke="white" strokeWidth="1.5" />
        {/* Parent lines */}
        <line x1="200" y1="78" x2="140" y2="150" stroke="white" strokeWidth="1" />
        <line x1="200" y1="78" x2="260" y2="150" stroke="white" strokeWidth="1" />
        {/* Parents */}
        <circle cx="140" cy="165" r="14" stroke="white" strokeWidth="1.5" />
        <circle cx="260" cy="165" r="14" stroke="white" strokeWidth="1.5" />
        {/* Spouse line */}
        <line x1="154" y1="165" x2="246" y2="165" stroke="white" strokeWidth="1" strokeDasharray="4 3" />
        {/* Child lines */}
        <line x1="140" y1="179" x2="120" y2="260" stroke="white" strokeWidth="1" />
        <line x1="260" y1="179" x2="200" y2="260" stroke="white" strokeWidth="1" />
        <line x1="260" y1="179" x2="280" y2="260" stroke="white" strokeWidth="1" />
        {/* Children */}
        <circle cx="120" cy="275" r="12" stroke="white" strokeWidth="1.5" />
        <circle cx="200" cy="275" r="12" stroke="white" strokeWidth="1.5" />
        <circle cx="280" cy="275" r="12" stroke="white" strokeWidth="1.5" />
        {/* Grandchild */}
        <line x1="200" y1="287" x2="200" y2="340" stroke="white" strokeWidth="1" />
        <circle cx="200" cy="355" r="10" stroke="white" strokeWidth="1.5" />
      </svg>

      <div className="relative z-10 flex flex-col justify-between h-full p-6 sm:p-8">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-medium backdrop-blur-sm mb-4">
            <Network className="w-3.5 h-3.5" />
            Interactive Canvas
          </div>
          <h3 className="text-2xl sm:text-3xl font-bold tracking-tight leading-tight">
            Drag, zoom &<br />explore your entire<br />family lineage
          </h3>
        </div>
        <p className="text-sm text-white/60 mt-4">
          Overlap-free hierarchical layout with automatic generational depth, couple grouping, and paternal/maternal separation.
        </p>
      </div>
    </div>
  );
}

function TileViews() {
  const modes = [
    { icon: <LayoutGrid className="w-5 h-5" />, label: 'Flat', color: 'text-blue-500' },
    { icon: <Orbit className="w-5 h-5" />, label: '3D Orbit', color: 'text-violet-500' },
    { icon: <Clock3 className="w-5 h-5" />, label: 'Timeline', color: 'text-amber-500' },
    { icon: <Globe2 className="w-5 h-5" />, label: 'Globe', color: 'text-emerald-500' },
  ];

  return (
    <div className="bento-tile bento-views bg-card border border-border/60">
      <div className="p-5 flex flex-col h-full">
        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
          4 Visualization Modes
        </span>
        <div className="grid grid-cols-2 gap-3 flex-1">
          {modes.map((m) => (
            <div
              key={m.label}
              className="flex flex-col items-center justify-center rounded-xl bg-muted/50 border border-border/40 p-3 gap-1.5"
            >
              <span className={m.color}>{m.icon}</span>
              <span className="text-[11px] font-medium">{m.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function TileGlobe() {
  return (
    <div className="bento-tile bento-globe relative overflow-hidden bg-gradient-to-br from-blue-600 via-cyan-600 to-emerald-600 text-white">
      {/* Abstract globe arcs */}
      <svg
        className="absolute right-[-20px] bottom-[-20px] w-[140px] h-[140px] opacity-20"
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <circle cx="50" cy="50" r="45" stroke="white" strokeWidth="1" />
        <ellipse cx="50" cy="50" rx="25" ry="45" stroke="white" strokeWidth="0.8" />
        <ellipse cx="50" cy="50" rx="45" ry="25" stroke="white" strokeWidth="0.8" />
        <line x1="5" y1="50" x2="95" y2="50" stroke="white" strokeWidth="0.5" />
        <line x1="50" y1="5" x2="50" y2="95" stroke="white" strokeWidth="0.5" />
      </svg>

      <div className="relative z-10 p-5 flex flex-col justify-between h-full">
        <Globe2 className="w-8 h-8 drop-shadow-md" />
        <div>
          <h4 className="font-bold text-lg leading-tight">3D World Globe</h4>
          <p className="text-xs text-white/70 mt-1">See where your family migrated across the globe</p>
        </div>
      </div>
    </div>
  );
}

function TileAI() {
  return (
    <div className="bento-tile bento-ai bg-gradient-to-br from-violet-600 to-indigo-700 text-white relative overflow-hidden">
      {/* Decorative sparkle burst */}
      <div className="absolute top-3 right-3 opacity-20">
        <Sparkles className="w-16 h-16" />
      </div>
      <div className="relative z-10 p-5 flex flex-col justify-between h-full">
        <Sparkles className="w-7 h-7 fill-white/30" />
        <div>
          <h4 className="font-bold text-lg leading-tight">AI Family Historian</h4>
          <p className="text-[13px] text-white/70 mt-1.5 italic">
            &ldquo;Who was born in March?&rdquo;
          </p>
        </div>
      </div>
    </div>
  );
}

function TilePrivacy() {
  return (
    <div className="bento-tile bento-privacy bg-card border border-border/60">
      <div className="p-5 flex flex-col justify-between h-full">
        <ShieldCheck className="w-7 h-7 text-emerald-500" />
        <div>
          <h4 className="font-semibold text-base leading-tight">Privacy First</h4>
          <p className="text-xs text-muted-foreground mt-1">Your data stays yours. No ads. No tracking.</p>
        </div>
      </div>
    </div>
  );
}

function TileFree() {
  return (
    <div className="bento-tile bento-free bg-card border border-border/60">
      <div className="p-5 flex flex-col items-center justify-center h-full text-center">
        <span className="text-4xl font-black text-emerald-500 tracking-tighter">25+</span>
        <span className="text-xs font-semibold mt-1">Members Free</span>
        <span className="text-[11px] text-muted-foreground mt-0.5">No credit card</span>
      </div>
    </div>
  );
}

function TileQR() {
  return (
    <div className="bento-tile bento-qr bg-card border border-border/60 relative overflow-hidden">
      {/* Decorative QR pattern */}
      <svg
        className="absolute right-2 bottom-2 w-[72px] h-[72px] opacity-[0.08] dark:opacity-[0.15]"
        viewBox="0 0 60 60"
        fill="currentColor"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <rect x="0" y="0" width="20" height="20" rx="2" />
        <rect x="25" y="0" width="5" height="5" />
        <rect x="35" y="0" width="5" height="5" />
        <rect x="40" y="0" width="20" height="20" rx="2" />
        <rect x="4" y="4" width="12" height="12" rx="1" fillOpacity="0.3" />
        <rect x="44" y="4" width="12" height="12" rx="1" fillOpacity="0.3" />
        <rect x="0" y="25" width="5" height="5" />
        <rect x="10" y="25" width="5" height="5" />
        <rect x="25" y="25" width="10" height="10" />
        <rect x="45" y="25" width="5" height="5" />
        <rect x="55" y="25" width="5" height="5" />
        <rect x="0" y="40" width="20" height="20" rx="2" />
        <rect x="4" y="44" width="12" height="12" rx="1" fillOpacity="0.3" />
        <rect x="25" y="40" width="5" height="5" />
        <rect x="35" y="45" width="5" height="5" />
        <rect x="45" y="40" width="5" height="10" />
        <rect x="55" y="40" width="5" height="5" />
        <rect x="40" y="55" width="20" height="5" />
      </svg>

      <div className="relative z-10 p-5 flex flex-col justify-between h-full">
        <QrCode className="w-7 h-7 text-blue-500" />
        <div>
          <h4 className="font-semibold text-base leading-tight">QR Code Sharing</h4>
          <p className="text-xs text-muted-foreground mt-1">Scan at reunions. No app download.</p>
        </div>
      </div>
    </div>
  );
}

function TileExport() {
  return (
    <div className="bento-tile bento-export bg-card border border-border/60">
      <div className="p-5 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center gap-4 h-full">
        <FileDown className="w-8 h-8 text-amber-500 shrink-0" />
        <div className="flex-1">
          <h4 className="font-bold text-base sm:text-lg leading-tight">
            High-Res Export
          </h4>
          <p className="text-xs text-muted-foreground mt-1">
            Print poster-size family trees at 300 DPI
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          {['PNG', 'PDF', 'SVG'].map((fmt) => (
            <span
              key={fmt}
              className="inline-flex items-center rounded-md bg-amber-100 dark:bg-amber-900/30 px-2.5 py-1 text-xs font-bold text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800/50"
            >
              {fmt}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

function TileGenealogy() {
  return (
    <div className="bento-tile bento-genealogy bg-card border border-border/60">
      <div className="p-5 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center gap-4 h-full">
        <Heart className="w-8 h-8 text-rose-500 shrink-0" />
        <div className="flex-1">
          <h4 className="font-bold text-base sm:text-lg leading-tight">
            Rich Genealogy Data
          </h4>
          <p className="text-xs text-muted-foreground mt-1">
            Maiden names, biological gender, career milestones, and custom fields
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          {['Née', '⚧', '🎓', '✦'].map((icon, i) => (
            <span
              key={i}
              className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-rose-100 dark:bg-rose-900/30 text-sm border border-rose-200 dark:border-rose-800/50"
            >
              {icon}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

function TileStrip() {
  const pills = [
    { label: 'Dark Mode', icon: <Moon className="w-3.5 h-3.5" /> },
    { label: 'Step & Adoptive', icon: <Users className="w-3.5 h-3.5" /> },
    { label: 'GEDCOM Import', icon: <FileDown className="w-3.5 h-3.5" /> },
    { label: 'Offline Ready', icon: <ShieldCheck className="w-3.5 h-3.5" /> },
  ];

  return (
    <div className="bento-tile bento-strip bg-muted/40 border border-border/40">
      <div className="p-4 flex items-center justify-center h-full">
        <div className="flex flex-wrap justify-center gap-2.5">
          {pills.map((pill) => (
            <span
              key={pill.label}
              className="inline-flex items-center gap-1.5 rounded-full bg-card border border-border/60 px-3 py-1.5 text-xs font-medium text-muted-foreground shadow-xs"
            >
              {pill.icon}
              {pill.label}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ── main bento grid ── */

export default function BentoFeatureGrid() {
  return (
    <section className="w-full max-w-6xl px-4 sm:px-6 py-16">
      <div className="text-center mb-10">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/5 border border-primary/20 px-3 py-1 text-xs font-semibold text-primary mb-4">
          <Sparkles className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
          Everything You Need
        </span>
        <h3 className="text-2xl sm:text-3xl font-bold tracking-tight">
          Built for Modern Families & Memorable Gatherings
        </h3>
        <p className="text-muted-foreground text-sm mt-2 max-w-lg mx-auto">
          Every detail is engineered to make capturing and celebrating your family story effortless.
        </p>
      </div>

      <div className="bento-grid">
        <TileCanvas />
        <TileViews />
        <TileGlobe />
        <TileAI />
        <TilePrivacy />
        <TileFree />
        <TileQR />
        <TileExport />
        <TileGenealogy />
        <TileStrip />
      </div>

      <style jsx>{`
        .bento-grid {
          display: grid;
          gap: 1rem;
          grid-template-columns: repeat(4, 1fr);
          grid-template-rows: auto;
          grid-template-areas:
            "canvas canvas views  globe"
            "canvas canvas views  globe"
            "ai     privacy free  qr"
            "export export  genealogy genealogy"
            "strip  strip   strip strip";
        }

        .bento-tile {
          border-radius: 1rem;
          min-height: 0;
          transition: transform 0.2s ease, box-shadow 0.2s ease;
        }

        .bento-tile:hover {
          transform: scale(1.015);
          box-shadow: 0 8px 30px rgba(0, 0, 0, 0.08);
        }

        :global(.dark) .bento-tile:hover {
          box-shadow: 0 8px 30px rgba(0, 0, 0, 0.3);
        }

        .bento-canvas    { grid-area: canvas; min-height: 280px; }
        .bento-views     { grid-area: views; }
        .bento-globe     { grid-area: globe; }
        .bento-ai        { grid-area: ai; }
        .bento-privacy   { grid-area: privacy; }
        .bento-free      { grid-area: free; }
        .bento-qr        { grid-area: qr; }
        .bento-export    { grid-area: export; }
        .bento-genealogy { grid-area: genealogy; }
        .bento-strip     { grid-area: strip; }

        /* Tablet: 2-column */
        @media (max-width: 1023px) {
          .bento-grid {
            grid-template-columns: repeat(2, 1fr);
            grid-template-areas:
              "canvas canvas"
              "views  globe"
              "ai     privacy"
              "free   qr"
              "export export"
              "genealogy genealogy"
              "strip  strip";
          }
        }

        /* Mobile: single column */
        @media (max-width: 639px) {
          .bento-grid {
            grid-template-columns: 1fr;
            grid-template-areas:
              "canvas"
              "views"
              "globe"
              "ai"
              "privacy"
              "free"
              "qr"
              "export"
              "genealogy"
              "strip";
          }

          .bento-canvas {
            min-height: 220px;
          }
        }
      `}</style>
    </section>
  );
}
