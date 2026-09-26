'use client';

import React, { useState } from 'react';
import { TreeData, Person } from '@/types/tree';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Download, Printer, Image, FileCode, Check, Sparkles, Layers, FileSpreadsheet } from 'lucide-react';
import { layoutFamilyTree } from '@/lib/layout';
import { exportToGedcom } from '@/lib/gedcom/exporter';

type ExportTreeModalProps = {
  isOpen: boolean;
  onClose: () => void;
  treeData: TreeData;
};

export default function ExportTreeModal({
  isOpen,
  onClose,
  treeData,
}: ExportTreeModalProps) {
  const [resolution, setResolution] = useState<'standard' | 'high' | 'ultra'>('high');
  const [themeMode, setThemeMode] = useState<'light' | 'dark'>('light');
  const [includeHeader, setIncludeHeader] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);

  // Generate SVG string representing the entire family tree
  const generateTreeSvg = () => {
    const { nodes, edges } = layoutFamilyTree(treeData.people, treeData.relationships);

    if (nodes.length === 0) return '';

    const personNodes = nodes.filter((n) => n.type === 'person');
    const unionNodes = nodes.filter((n) => n.type === 'union');

    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;

    for (const n of nodes) {
      const w = n.type === 'person' ? 256 : 14;
      const h = n.type === 'person' ? 90 : 14;
      if (n.position.x < minX) minX = n.position.x;
      if (n.position.y < minY) minY = n.position.y;
      if (n.position.x + w > maxX) maxX = n.position.x + w;
      if (n.position.y + h > maxY) maxY = n.position.y + h;
    }

    const padding = 80;
    const headerHeight = includeHeader ? 100 : 20;

    const width = Math.max(800, maxX - minX + padding * 2);
    const height = Math.max(600, maxY - minY + padding * 2 + headerHeight);

    const offsetX = -minX + padding;
    const offsetY = -minY + padding + headerHeight;

    const isDark = themeMode === 'dark';
    const bgColor = isDark ? '#0f172a' : '#ffffff';
    const textColor = isDark ? '#f8fafc' : '#0f172a';
    const subtextColor = isDark ? '#94a3b8' : '#64748b';
    const cardBg = isDark ? '#1e293b' : '#ffffff';
    const cardBorder = isDark ? '#334155' : '#e2e8f0';

    let svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}" font-family="system-ui, -apple-system, sans-serif">
  <!-- Background -->
  <rect width="100%" height="100%" fill="${bgColor}"/>
  
  <!-- Subtle Grid Pattern -->
  <defs>
    <pattern id="grid-dots" width="24" height="24" patternUnits="userSpaceOnUse">
      <circle cx="2" cy="2" r="1" fill="${isDark ? '#334155' : '#e2e8f0'}"/>
    </pattern>
  </defs>
  <rect width="100%" height="100%" fill="url(#grid-dots)" opacity="0.6"/>
`;

    // Header Title
    if (includeHeader) {
      svg += `
  <!-- Tree Title Header -->
  <g transform="translate(${width / 2}, 50)" text-anchor="middle">
    <text y="0" font-size="28" font-weight="bold" fill="${textColor}">${treeData.tree.name}</text>
    <text y="24" font-size="13" fill="${subtextColor}">
      ${treeData.people.length} Members • ${treeData.relationships.length} Connections • Project Natal
    </text>
  </g>
`;
    }

    // Render Edges
    svg += `  <!-- Relationship Edges -->\n  <g>`;
    const nodeMap = new Map(nodes.map((n) => [n.id, n]));

    for (const e of edges) {
      const sNode = nodeMap.get(e.source);
      const tNode = nodeMap.get(e.target);
      if (!sNode || !tNode) continue;

      const sX = (sNode.type === 'union' ? sNode.position.x + 7 : sNode.position.x + 256) + offsetX;
      const sY = (sNode.type === 'union' ? sNode.position.y + 7 : sNode.position.y + 45) + offsetY;
      const tX = (tNode.position.x) + offsetX;
      const tY = (tNode.position.y + 45) + offsetY;

      let stroke = '#64748b';
      let strokeWidth = 2;
      let dasharray = '';

      if (e.type === 'straight') {
        stroke = '#f43f5e';
        strokeWidth = 2;
      } else if (e.style?.stroke) {
        stroke = e.style.stroke as string;
      }

      if (e.style?.strokeDasharray) {
        dasharray = `stroke-dasharray="${e.style.strokeDasharray}"`;
      }

      // Draw path
      if (e.type === 'straight') {
        svg += `\n    <line x1="${sX}" y1="${sY}" x2="${tX}" y2="${tY}" stroke="${stroke}" stroke-width="${strokeWidth}" ${dasharray}/>`;
      } else {
        // Stepped channel / descent line
        const midY = (sY + tY) / 2;
        const p1X = (sNode.type === 'union' ? sNode.position.x + 7 : sNode.position.x + 128) + offsetX;
        const p1Y = (sNode.type === 'union' ? sNode.position.y + 7 : sNode.position.y + 90) + offsetY;
        const p2X = tNode.position.x + 128 + offsetX;
        const p2Y = tNode.position.y + offsetY;

        const pathData = `M ${p1X} ${p1Y} L ${p1X} ${midY} L ${p2X} ${midY} L ${p2X} ${p2Y}`;
        svg += `\n    <path d="${pathData}" fill="none" stroke="${stroke}" stroke-width="${strokeWidth}" stroke-linejoin="round" stroke-linecap="round" ${dasharray}/>`;
      }
    }
    svg += `\n  </g>`;

    // Render Union Nodes
    svg += `\n  <!-- Union Nodes -->\n  <g>`;
    for (const u of unionNodes) {
      const cx = u.position.x + 7 + offsetX;
      const cy = u.position.y + 7 + offsetY;
      svg += `\n    <circle cx="${cx}" cy="${cy}" r="6" fill="#f43f5e" stroke="${bgColor}" stroke-width="2"/>`;
      svg += `\n    <circle cx="${cx}" cy="${cy}" r="2" fill="#ffffff"/>`;
    }
    svg += `\n  </g>`;

    // Render Person Nodes
    svg += `\n  <!-- Person Nodes -->\n  <g>`;
    for (const n of personNodes) {
      const p = (n.data as { person?: Person })?.person;
      if (!p) continue;
      const x = n.position.x + offsetX;
      const y = n.position.y + offsetY;
      const isDeceased = !!p.deathDate;

      const cardFill = isDeceased ? (isDark ? '#1e293b' : '#f1f5f9') : cardBg;
      const strokeColor = isDeceased ? (isDark ? '#475569' : '#cbd5e1') : cardBorder;
      const initials = `${p.firstName[0] || ''}${p.lastName[0] || ''}`.toUpperCase() || '?';

      const birthYear = p.birthDate ? p.birthDate.split('-')[0] : null;
      const deathYear = p.deathDate ? p.deathDate.split('-')[0] : null;
      let yearText = '';
      if (birthYear && deathYear) yearText = `${birthYear} – ${deathYear}`;
      else if (birthYear) yearText = `b. ${birthYear}`;
      else if (deathYear) yearText = `d. ${deathYear}`;

      svg += `
    <g transform="translate(${x}, ${y})">
      <rect width="256" height="90" rx="12" fill="${cardFill}" stroke="${strokeColor}" stroke-width="1.5" filter="drop-shadow(0 2px 4px rgba(0,0,0,0.06))"/>
      
      <!-- Avatar Circle -->
      <circle cx="36" cy="45" r="22" fill="${isDark ? '#334155' : '#e2e8f0'}"/>
      <text x="36" y="50" font-size="14" font-weight="bold" fill="${textColor}" text-anchor="middle">${initials}</text>
      
      <!-- Name -->
      <text x="68" y="38" font-size="13" font-weight="bold" fill="${textColor}">${p.firstName} ${p.lastName}</text>
      
      <!-- Dates -->
      <text x="68" y="56" font-size="11" fill="${subtextColor}">${yearText}</text>
      
      ${isDeceased ? `<rect x="180" y="10" width="66" height="18" rx="4" fill="${isDark ? '#334155' : '#e2e8f0'}"/>
      <text x="213" y="22" font-size="9" font-weight="bold" fill="${textColor}" text-anchor="middle">DECEASED</text>` : ''}
    </g>`;
    }
    svg += `\n  </g>\n</svg>`;

    return svg;
  };

  // Download High-Resolution PNG
  const handleDownloadPng = () => {
    setIsExporting(true);
    try {
      const svgString = generateTreeSvg();
      const scale = resolution === 'ultra' ? 3 : resolution === 'high' ? 2 : 1;

      const blob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
      const URL = window.URL || window.webkitURL || window;
      const blobURL = URL.createObjectURL(blob);

      const image = new window.Image();
      image.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = image.width * scale;
        canvas.height = image.height * scale;

        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = 'high';
          ctx.scale(scale, scale);
          ctx.drawImage(image, 0, 0);

          const pngUrl = canvas.toDataURL('image/png');
          const downloadLink = document.createElement('a');
          downloadLink.href = pngUrl;
          downloadLink.download = `${treeData.tree.slug}-family-tree-${resolution}.png`;
          document.body.appendChild(downloadLink);
          downloadLink.click();
          document.body.removeChild(downloadLink);

          setDownloadSuccess(true);
          setTimeout(() => setDownloadSuccess(false), 3000);
        }
        setIsExporting(false);
      };
      image.src = blobURL;
    } catch (err) {
      console.error('Error generating PNG:', err);
      setIsExporting(false);
    }
  };

  // Download Scalable Vector SVG
  const handleDownloadSvg = () => {
    const svgString = generateTreeSvg();
    const blob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${treeData.tree.slug}-family-tree.svg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setDownloadSuccess(true);
    setTimeout(() => setDownloadSuccess(false), 3000);
  };

  // Download GEDCOM 7.0 standard file
  const handleDownloadGedcom = () => {
    const gedcomContent = exportToGedcom(treeData);
    const blob = new Blob([gedcomContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${treeData.tree.slug}.ged`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setDownloadSuccess(true);
    setTimeout(() => setDownloadSuccess(false), 3000);
  };

  // Print Poster / PDF Layout
  const handlePrintPoster = () => {
    const svgString = generateTreeSvg();
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>${treeData.tree.name} — Printable Family Tree</title>
          <style>
            @page {
              size: landscape;
              margin: 1cm;
            }
            body {
              margin: 0;
              padding: 0;
              display: flex;
              align-items: center;
              justify-content: center;
              min-height: 100vh;
              background-color: #fff;
              font-family: system-ui, sans-serif;
            }
            svg {
              max-width: 100%;
              height: auto;
              page-break-inside: avoid;
            }
          </style>
        </head>
        <body>
          ${svgString}
          <script>
            window.onload = () => {
              window.print();
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[500px] p-5 sm:p-6">
        <DialogHeader className="space-y-1.5 pb-2 border-b">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <Download className="w-4 h-4" />
            </div>
            <DialogTitle className="text-lg sm:text-xl font-bold">
              Export Family Tree
            </DialogTitle>
          </div>
          <DialogDescription className="text-xs sm:text-sm text-muted-foreground">
            Download your full family tree diagram in high resolution for framing, printing, or archiving.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Tree Info Summary */}
          <div className="p-3 rounded-xl border bg-muted/20 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-foreground">{treeData.tree.name}</p>
              <p className="text-[11px] text-muted-foreground">
                {treeData.people.length} Members • {treeData.relationships.length} Connections
              </p>
            </div>
            <Badge variant="outline" className="text-xs bg-background">
              All Generations
            </Badge>
          </div>

          {/* Resolution Options */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold">Image Resolution (DPI)</Label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setResolution('standard')}
                className={`p-2.5 rounded-lg border text-center transition-all text-xs ${
                  resolution === 'standard'
                    ? 'border-primary bg-primary/10 text-primary font-bold'
                    : 'border-border bg-card text-muted-foreground hover:bg-muted/40'
                }`}
              >
                <div>Standard (1x)</div>
                <div className="text-[10px] opacity-75">Web & Mobile</div>
              </button>
              <button
                type="button"
                onClick={() => setResolution('high')}
                className={`p-2.5 rounded-lg border text-center transition-all text-xs ${
                  resolution === 'high'
                    ? 'border-primary bg-primary/10 text-primary font-bold'
                    : 'border-border bg-card text-muted-foreground hover:bg-muted/40'
                }`}
              >
                <div>High (2x)</div>
                <div className="text-[10px] opacity-75">Print & Frame</div>
              </button>
              <button
                type="button"
                onClick={() => setResolution('ultra')}
                className={`p-2.5 rounded-lg border text-center transition-all text-xs ${
                  resolution === 'ultra'
                    ? 'border-primary bg-primary/10 text-primary font-bold'
                    : 'border-border bg-card text-muted-foreground hover:bg-muted/40'
                }`}
              >
                <div>Ultra (3x)</div>
                <div className="text-[10px] opacity-75">Poster Size</div>
              </button>
            </div>
          </div>

          {/* Style & Theme Option */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Color Style</Label>
              <div className="grid grid-cols-2 gap-1.5">
                <button
                  type="button"
                  onClick={() => setThemeMode('light')}
                  className={`p-2 rounded-lg border text-xs font-medium transition-all ${
                    themeMode === 'light'
                      ? 'border-primary bg-primary/10 text-primary font-bold'
                      : 'border-border bg-card text-muted-foreground'
                  }`}
                >
                  Light
                </button>
                <button
                  type="button"
                  onClick={() => setThemeMode('dark')}
                  className={`p-2 rounded-lg border text-xs font-medium transition-all ${
                    themeMode === 'dark'
                      ? 'border-primary bg-primary/10 text-primary font-bold'
                      : 'border-border bg-card text-muted-foreground'
                  }`}
                >
                  Dark
                </button>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Title Banner</Label>
              <div className="grid grid-cols-2 gap-1.5">
                <button
                  type="button"
                  onClick={() => setIncludeHeader(true)}
                  className={`p-2 rounded-lg border text-xs font-medium transition-all ${
                    includeHeader
                      ? 'border-primary bg-primary/10 text-primary font-bold'
                      : 'border-border bg-card text-muted-foreground'
                  }`}
                >
                  Include
                </button>
                <button
                  type="button"
                  onClick={() => setIncludeHeader(false)}
                  className={`p-2 rounded-lg border text-xs font-medium transition-all ${
                    !includeHeader
                      ? 'border-primary bg-primary/10 text-primary font-bold'
                      : 'border-border bg-card text-muted-foreground'
                  }`}
                >
                  Diagram Only
                </button>
              </div>
            </div>
          </div>

          {/* Action Buttons Grid */}
          <div className="pt-2 space-y-2">
            <Button
              onClick={handleDownloadPng}
              disabled={isExporting}
              className="w-full h-10 gap-2 bg-primary text-primary-foreground font-semibold shadow-xs"
            >
              {downloadSuccess ? (
                <>
                  <Check className="w-4 h-4 text-emerald-400" />
                  <span>Downloaded PNG!</span>
                </>
              ) : (
                <>
                  <Image className="w-4 h-4" />
                  <span>Download High-Res PNG ({resolution.toUpperCase()})</span>
                </>
              )}
            </Button>

            <div className="grid grid-cols-3 gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handlePrintPoster}
                className="h-9 gap-1.5 text-xs font-medium"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>PDF / Print</span>
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={handleDownloadSvg}
                className="h-9 gap-1.5 text-xs font-medium"
              >
                <FileCode className="w-3.5 h-3.5" />
                <span>SVG Vector</span>
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={handleDownloadGedcom}
                className="h-9 gap-1.5 text-xs font-medium text-primary hover:text-primary hover:bg-primary/5"
              >
                <FileSpreadsheet className="w-3.5 h-3.5" />
                <span>GEDCOM 7.0</span>
              </Button>
            </div>
          </div>
        </div>

        <DialogFooter className="pt-2 border-t">
          <Button variant="ghost" size="sm" onClick={onClose} className="text-xs">
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
