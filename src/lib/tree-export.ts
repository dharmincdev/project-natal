import { TreeData, Person } from '@/types/tree';
import { layoutFamilyTree } from '@/lib/layout';
import { exportToGedcom } from '@/lib/gedcom/exporter';

export type TreeExportSvgOptions = {
  themeMode: 'light' | 'dark';
  includeHeader: boolean;
};

export type TreeExportPngOptions = Partial<TreeExportSvgOptions> & {
  resolution?: 'standard' | 'high' | 'ultra';
  scale?: number;
};

const NODE_WIDTH = 256;
const NODE_HEIGHT = 90;

type JumpPoint = {
  x: number;
  y: number;
};

type ExportEdgeData = {
  busY?: number;
  midY?: number;
  channel1Y?: number;
  viaX?: number;
  channel2Y?: number;
  jumps?: JumpPoint[];
  relationshipType?: string;
};

/**
 * Generates an orthogonal stepped SVG path with rounded corners and optional line-jump arcs,
 * matching ChannelEdge in the interactive canvas.
 */
function createOrthogonalSteppedPath(
  points: { x: number; y: number }[],
  jumps: JumpPoint[] = [],
  radius = 8,
  jumpR = 6
): string {
  if (!points || points.length < 2) return '';

  // Remove consecutive duplicate points
  const cleaned: { x: number; y: number }[] = [points[0]];
  for (let i = 1; i < points.length; i++) {
    const prev = cleaned[cleaned.length - 1];
    if (Math.abs(points[i].x - prev.x) > 0.5 || Math.abs(points[i].y - prev.y) > 0.5) {
      cleaned.push(points[i]);
    }
  }

  if (cleaned.length < 2) {
    return `M ${points[0].x} ${points[0].y} L ${points[points.length - 1].x} ${points[points.length - 1].y}`;
  }

  let d = `M ${cleaned[0].x} ${cleaned[0].y}`;
  let currX = cleaned[0].x;
  let currY = cleaned[0].y;

  function appendSegment(toX: number, toY: number) {
    if (Math.abs(currX - toX) < 0.5 && jumps.length > 0) {
      const x = currX;
      const segMinY = Math.min(currY, toY);
      const segMaxY = Math.max(currY, toY);
      const isDown = toY >= currY;

      const segJumps = jumps.filter(
        (j) =>
          j &&
          Math.abs(j.x - x) < 2 &&
          j.y > segMinY + jumpR + 2 &&
          j.y < segMaxY - jumpR - 2
      );

      if (isDown) {
        segJumps.sort((a, b) => a.y - b.y);
        for (const j of segJumps) {
          d += ` L ${x} ${j.y - jumpR}`;
          d += ` A ${jumpR} ${jumpR} 0 0 1 ${x} ${j.y + jumpR}`;
        }
      } else {
        segJumps.sort((a, b) => b.y - a.y);
        for (const j of segJumps) {
          d += ` L ${x} ${j.y + jumpR}`;
          d += ` A ${jumpR} ${jumpR} 0 0 0 ${x} ${j.y - jumpR}`;
        }
      }
    }
    d += ` L ${toX} ${toY}`;
    currX = toX;
    currY = toY;
  }

  for (let i = 1; i < cleaned.length - 1; i++) {
    const pPrev = cleaned[i - 1];
    const pCurr = cleaned[i];
    const pNext = cleaned[i + 1];

    const dx1 = pCurr.x - pPrev.x;
    const dy1 = pCurr.y - pPrev.y;
    const len1 = Math.hypot(dx1, dy1);

    const dx2 = pNext.x - pCurr.x;
    const dy2 = pNext.y - pCurr.y;
    const len2 = Math.hypot(dx2, dy2);

    if (len1 === 0 || len2 === 0) continue;

    const r = Math.min(radius, len1 / 2, len2 / 2);

    const startX = pCurr.x - (dx1 / len1) * r;
    const startY = pCurr.y - (dy1 / len1) * r;

    const endX = pCurr.x + (dx2 / len2) * r;
    const endY = pCurr.y + (dy2 / len2) * r;

    appendSegment(startX, startY);
    d += ` Q ${pCurr.x} ${pCurr.y} ${endX} ${endY}`;
    currX = endX;
    currY = endY;
  }

  const last = cleaned[cleaned.length - 1];
  appendSegment(last.x, last.y);
  return d;
}

/**
 * Generates an SVG string representation of the full family tree with card styling,
 * orthogonal channel connectors, dashed rose spouse connectors, and generational layout.
 */
export function generateTreeSvg(
  treeData: TreeData,
  options: Partial<TreeExportSvgOptions> = {}
): string {
  const themeMode = options.themeMode ?? 'light';
  const includeHeader = options.includeHeader ?? true;
  const { nodes, edges } = layoutFamilyTree(treeData.people, treeData.relationships);

  if (nodes.length === 0) return '';

  const nodeMap = new Map(nodes.map((n) => [n.id, n]));
  const personNodes = nodes.filter((n) => n.type === 'person');
  const unionNodes = nodes.filter((n) => n.type === 'union');

  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  for (const n of nodes) {
    const w = n.type === 'person' ? NODE_WIDTH : 14;
    const h = n.type === 'person' ? NODE_HEIGHT : 14;
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

  const parts: string[] = [];

  parts.push(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}" font-family="system-ui, -apple-system, sans-serif">
  <!-- Background -->
  <rect width="100%" height="100%" fill="${bgColor}"/>
  
  <!-- Subtle Grid Pattern -->
  <defs>
    <pattern id="grid-dots" width="24" height="24" patternUnits="userSpaceOnUse">
      <circle cx="2" cy="2" r="1" fill="${isDark ? '#334155' : '#e2e8f0'}"/>
    </pattern>
  </defs>
  <rect width="100%" height="100%" fill="url(#grid-dots)" opacity="0.6"/>`);

  // Header Title
  if (includeHeader) {
    parts.push(`
  <!-- Tree Title Header -->
  <g transform="translate(${width / 2}, 50)" text-anchor="middle">
    <text y="0" font-size="28" font-weight="bold" fill="${textColor}">${treeData.tree.name}</text>
    <text y="24" font-size="13" fill="${subtextColor}">
      ${treeData.people.length} Members • ${treeData.relationships.length} Connections • Project Natal
    </text>
  </g>`);
  }

  // Render Edges
  parts.push(`\n  <!-- Connection Lines -->\n  <g stroke-linecap="round" stroke-linejoin="round">`);

  const spouseHeartBadges: { x: number; y: number }[] = [];

  for (const e of edges) {
    const sourceNode = nodeMap.get(e.source);
    const targetNode = nodeMap.get(e.target);
    if (!sourceNode || !targetNode) continue;

    const edgeData = e.data as ExportEdgeData | undefined;
    const isSpouse =
      e.id.startsWith('spouse-') ||
      e.id.includes('spouse') ||
      edgeData?.relationshipType === 'spouse' ||
      e.sourceHandle?.includes('spouse') ||
      e.targetHandle?.includes('spouse') ||
      e.sourceHandle === 'right' ||
      e.sourceHandle === 'left' ||
      e.style?.stroke === '#f43f5e';

    if (isSpouse) {
      let sx: number;
      let sy: number;
      let tx: number;
      let ty: number;

      if (sourceNode.type === 'person' && targetNode.type === 'person') {
        const [leftNode, rightNode] =
          sourceNode.position.x <= targetNode.position.x
            ? [sourceNode, targetNode]
            : [targetNode, sourceNode];
        sx = leftNode.position.x + NODE_WIDTH + offsetX;
        sy = leftNode.position.y + NODE_HEIGHT / 2 + offsetY;
        tx = rightNode.position.x + offsetX;
        ty = rightNode.position.y + NODE_HEIGHT / 2 + offsetY;
        spouseHeartBadges.push({ x: (sx + tx) / 2, y: (sy + ty) / 2 });
      } else if (sourceNode.type === 'person' && targetNode.type === 'union') {
        sx = sourceNode.position.x + NODE_WIDTH + offsetX;
        sy = sourceNode.position.y + NODE_HEIGHT / 2 + offsetY;
        tx = targetNode.position.x + 7 + offsetX;
        ty = targetNode.position.y + 7 + offsetY;
      } else if (sourceNode.type === 'union' && targetNode.type === 'person') {
        sx = sourceNode.position.x + 7 + offsetX;
        sy = sourceNode.position.y + 7 + offsetY;
        tx = targetNode.position.x + offsetX;
        ty = targetNode.position.y + NODE_HEIGHT / 2 + offsetY;
      } else {
        sx = sourceNode.position.x + 7 + offsetX;
        sy = sourceNode.position.y + 7 + offsetY;
        tx = targetNode.position.x + 7 + offsetX;
        ty = targetNode.position.y + 7 + offsetY;
      }

      parts.push(
        `\n    <path d="M ${sx} ${sy} L ${tx} ${ty}" fill="none" stroke="#f43f5e" stroke-width="2" stroke-dasharray="6,4"/>`
      );
      continue;
    }

    // Parent-child or sibling orthogonal channel routing
    const strokeColor =
      (typeof e.style?.stroke === 'string' ? e.style.stroke : undefined) ||
      (isDark ? '#64748b' : '#94a3b8');
    const strokeWidth = typeof e.style?.strokeWidth === 'number' ? e.style.strokeWidth : 2;
    const dashArrayAttr = e.style?.strokeDasharray
      ? ` stroke-dasharray="${e.style.strokeDasharray}"`
      : '';

    const sx =
      sourceNode.position.x + (sourceNode.type === 'person' ? NODE_WIDTH / 2 : 7) + offsetX;
    const sy =
      sourceNode.position.y + (sourceNode.type === 'person' ? NODE_HEIGHT : 7) + offsetY;
    const tx =
      targetNode.position.x + (targetNode.type === 'person' ? NODE_WIDTH / 2 : 7) + offsetX;
    const ty = targetNode.position.y + (targetNode.type === 'person' ? 0 : 7) + offsetY;

    let points: { x: number; y: number }[];

    if (edgeData?.viaX !== undefined) {
      const c1Y = edgeData.channel1Y !== undefined ? edgeData.channel1Y + offsetY : sy + 80;
      const c2Y = edgeData.channel2Y !== undefined ? edgeData.channel2Y + offsetY : ty - 60;
      const vX = edgeData.viaX + offsetX;
      points = [
        { x: sx, y: sy },
        { x: sx, y: c1Y },
        { x: vX, y: c1Y },
        { x: vX, y: c2Y },
        { x: tx, y: c2Y },
        { x: tx, y: ty },
      ];
    } else {
      const rawMidY = edgeData?.midY ?? edgeData?.busY;
      const midY = rawMidY !== undefined ? rawMidY + offsetY : (sy + ty) / 2;
      points = [
        { x: sx, y: sy },
        { x: sx, y: midY },
        { x: tx, y: midY },
        { x: tx, y: ty },
      ];
    }

    const offsetJumps = Array.isArray(edgeData?.jumps)
      ? edgeData.jumps.map((j) => ({ x: j.x + offsetX, y: j.y + offsetY }))
      : [];

    const pathD = createOrthogonalSteppedPath(points, offsetJumps, 8, 6);
    if (pathD) {
      parts.push(
        `\n    <path d="${pathD}" fill="none" stroke="${strokeColor}" stroke-width="${strokeWidth}"${dashArrayAttr}/>`
      );
    }
  }
  parts.push(`\n  </g>`);

  // Render Union Nodes & Spouse Heart Badges
  parts.push(`\n  <!-- Union Nodes (Marriage anchors) -->\n  <g>`);
  for (const u of unionNodes) {
    const cx = u.position.x + 7 + offsetX;
    const cy = u.position.y + 7 + offsetY;
    parts.push(
      `\n    <circle cx="${cx}" cy="${cy}" r="8" fill="${cardBg}" stroke="#f43f5e" stroke-width="1.5"/>`
    );
    parts.push(
      `\n    <text x="${cx}" y="${cy + 3.5}" font-size="9" fill="#f43f5e" text-anchor="middle">♥</text>`
    );
  }
  for (const badge of spouseHeartBadges) {
    parts.push(
      `\n    <circle cx="${badge.x}" cy="${badge.y}" r="8" fill="${cardBg}" stroke="#f43f5e" stroke-width="1.5"/>`
    );
    parts.push(
      `\n    <text x="${badge.x}" y="${badge.y + 3.5}" font-size="9" fill="#f43f5e" text-anchor="middle">♥</text>`
    );
  }
  parts.push(`\n  </g>`);

  // Render Person Nodes
  parts.push(`\n  <!-- Person Nodes -->\n  <g>`);
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

    parts.push(`
    <g transform="translate(${x}, ${y})">
      <rect width="${NODE_WIDTH}" height="${NODE_HEIGHT}" rx="12" fill="${cardFill}" stroke="${strokeColor}" stroke-width="1.5" filter="drop-shadow(0 2px 4px rgba(0,0,0,0.06))"/>
      
      <!-- Avatar Circle -->
      <circle cx="36" cy="45" r="22" fill="${isDark ? '#334155' : '#e2e8f0'}"/>
      <text x="36" y="50" font-size="14" font-weight="bold" fill="${textColor}" text-anchor="middle">${initials}</text>
      
      <!-- Name -->
      <text x="68" y="38" font-size="13" font-weight="bold" fill="${textColor}">${p.firstName} ${p.lastName}</text>
      
      <!-- Dates -->
      <text x="68" y="56" font-size="11" fill="${subtextColor}">${yearText}</text>
      
      ${
        isDeceased
          ? `<rect x="180" y="10" width="66" height="18" rx="4" fill="${isDark ? '#334155' : '#e2e8f0'}"/>
      <text x="213" y="22" font-size="9" font-weight="bold" fill="${textColor}" text-anchor="middle">DECEASED</text>`
          : ''
      }
    </g>`);
  }
  parts.push(`\n  </g>\n</svg>`);

  return parts.join('');
}

/**
 * Resolves the target DPI scale multiplier (defaults to 3x Retina/Ultra quality).
 */
export function resolveExportScale(options?: TreeExportPngOptions): number {
  if (typeof options?.scale === 'number' && options.scale > 0) {
    return options.scale;
  }
  if (options?.resolution === 'standard') return 1;
  if (options?.resolution === 'high') return 2;
  return 3;
}

/**
 * Downloads the full family tree as a High-Resolution PNG (defaults to 3x DPI).
 */
export function downloadTreePng(
  treeData: TreeData,
  options: TreeExportPngOptions = {}
): Promise<void> {
  return new Promise((resolve, reject) => {
    try {
      const svgString = generateTreeSvg(treeData, options);
      const scale = resolveExportScale(options);
      const resolutionLabel = options.resolution ?? 'ultra';

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
          downloadLink.download = `${treeData.tree.slug}-family-tree-${resolutionLabel}.png`;
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
export function downloadTreeSvg(
  treeData: TreeData,
  options: Partial<TreeExportSvgOptions> = {}
): void {
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
 * Opens a print dialog formatted for a high-res 3x DPI printable poster / PDF.
 */
export function printTreePoster(
  treeData: TreeData,
  options: TreeExportPngOptions = {},
  scale = 3
): void {
  const effectiveScale = options.scale ?? scale;
  const svgString = generateTreeSvg(treeData, options);
  const printWindow = window.open('', '_blank');
  if (!printWindow) return;

  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>${treeData.tree.name} — Printable Family Tree (${effectiveScale}x DPI)</title>
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
            shape-rendering: geometricPrecision;
            text-rendering: geometricPrecision;
          }
          @media print {
            body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          }
        </style>
      </head>
      <body>
        <div class="poster-container" data-dpi-scale="${effectiveScale}">
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

export const exportTreeAsPng = downloadTreePng;
export const exportTreeAsSvg = downloadTreeSvg;
export const exportTreeAsPdf = printTreePoster;
export const exportTreeAsGedcom = downloadTreeGedcom;
