import { TreeData, Person } from '@/types/tree';
import { layoutFamilyTree } from '@/lib/layout';
import { exportToGedcom } from '@/lib/gedcom/exporter';

export type TreeExportSvgOptions = {
  themeMode: 'light' | 'dark';
  includeHeader: boolean;
};

export type TreeExportPngOptions = TreeExportSvgOptions & {
  resolution: 'standard' | 'high' | 'ultra';
};

/**
 * Generates an SVG string representation of the full family tree with card styling,
 * connectors, and generational layout.
 */
export function generateTreeSvg(treeData: TreeData, options: TreeExportSvgOptions): string {
  const { themeMode, includeHeader } = options;
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
  svg += `\n  <!-- Connection Lines -->\n  <g stroke-linecap="round" stroke-linejoin="round">`;
  for (const e of edges) {
    const isSpouse = e.id.includes('spouse') || e.style?.stroke === '#f43f5e';
    const strokeColor = isSpouse ? '#f43f5e' : (isDark ? '#64748b' : '#94a3b8');
    const strokeWidth = isSpouse ? 2 : 2.5;

    const sourceNode = nodes.find((n) => n.id === e.source);
    const targetNode = nodes.find((n) => n.id === e.target);

    if (sourceNode && targetNode) {
      const sx = sourceNode.position.x + (sourceNode.type === 'person' ? 128 : 7) + offsetX;
      const sy = sourceNode.position.y + (sourceNode.type === 'person' ? 90 : 7) + offsetY;
      const tx = targetNode.position.x + (targetNode.type === 'person' ? 128 : 7) + offsetX;
      const ty = targetNode.position.y + (targetNode.type === 'person' ? 0 : 7) + offsetY;

      const midY = (sy + ty) / 2;
      svg += `\n    <path d="M ${sx} ${sy} C ${sx} ${midY}, ${tx} ${midY}, ${tx} ${ty}" fill="none" stroke="${strokeColor}" stroke-width="${strokeWidth}"/>`;
    }
  }
  svg += `\n  </g>`;

  // Render Union Nodes
  svg += `\n  <!-- Union Nodes (Marriage anchors) -->\n  <g>`;
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
}

/**
 * Downloads the full family tree as a High-Resolution PNG.
 */
export function downloadTreePng(treeData: TreeData, options: TreeExportPngOptions): Promise<void> {
  return new Promise((resolve, reject) => {
    try {
      const svgString = generateTreeSvg(treeData, options);
      const scale = options.resolution === 'ultra' ? 3 : options.resolution === 'high' ? 2 : 1;

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
          downloadLink.download = `${treeData.tree.slug}-family-tree-${options.resolution}.png`;
          document.body.appendChild(downloadLink);
          downloadLink.click();
          document.body.removeChild(downloadLink);
          resolve();
        } else {
          reject(new Error('Canvas 2D context not available'));
        }
      };
      image.onerror = (e) => reject(e);
      image.src = blobURL;
    } catch (err) {
      reject(err);
    }
  });
}

/**
 * Downloads the full family tree as a Scalable Vector Graphics (.svg) file.
 */
export function downloadTreeSvg(treeData: TreeData, options: TreeExportSvgOptions): void {
  const svgString = generateTreeSvg(treeData, options);
  const blob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${treeData.tree.slug}-family-tree.svg`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Downloads tree data as a standard GEDCOM 7.0 (.ged) file.
 */
export function downloadTreeGedcom(treeData: TreeData): void {
  const gedcomContent = exportToGedcom(treeData);
  const blob = new Blob([gedcomContent], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${treeData.tree.slug}.ged`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Opens a print dialog formatted for a high-res printable poster.
 */
export function printTreePoster(treeData: TreeData, options: TreeExportSvgOptions): void {
  const svgString = generateTreeSvg(treeData, options);
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
          .poster-container {
            width: 100%;
            max-width: 100%;
            box-sizing: border-box;
            display: flex;
            flex-direction: column;
            align-items: center;
          }
          svg {
            width: 100%;
            height: auto;
            max-height: 94vh;
          }
          @media print {
            body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          }
        </style>
      </head>
      <body>
        <div class="poster-container">
          ${svgString}
        </div>
        <script>
          window.onload = () => {
            window.print();
            window.onafterprint = () => window.close();
          };
        </script>
      </body>
    </html>
  `);
  printWindow.document.close();
}
