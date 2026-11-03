import { describe, it, expect } from 'vitest';
import { generateTreeSvg, resolveExportScale } from '@/lib/tree-export';
import { getInitialSmithTreeData } from '@/data/fixtures/smith-family';

describe('Tree Vector Export Engine (SPEC.md §5.5, PRO-18)', () => {
  const treeData = getInitialSmithTreeData();

  it('generates valid SVG XML string containing background, title, and person nodes', () => {
    const svg = generateTreeSvg(treeData, {
      themeMode: 'light',
      includeHeader: true,
    });

    expect(svg).toContain('<svg xmlns="http://www.w3.org/2000/svg"');
    expect(svg).toContain('Smith Family Tree');
    expect(svg).toContain('Robert Smith');
    expect(svg).toContain('Margaret Smith');
    expect(svg).toContain('</svg>');
  });

  it('renders spouse edges with dashed rose lines (stroke-dasharray="6,4", #f43f5e) and heart badges', () => {
    const svg = generateTreeSvg(treeData, {
      themeMode: 'light',
      includeHeader: true,
    });

    expect(svg).toContain('stroke="#f43f5e"');
    expect(svg).toContain('stroke-dasharray="6,4"');
    expect(svg).toContain('♥');
  });

  it('renders parent-child channel edges as orthogonal step paths without cubic Bezier curves', () => {
    const svg = generateTreeSvg(treeData, {
      themeMode: 'light',
      includeHeader: true,
    });

    // Orthogonal paths use M ... L ... Q ... L ... rather than cubic Bezier C ...
    expect(svg).toMatch(/<path d="M [\d.]+ [\d.]+ L [\d.]+ [\d.]+ Q [\d.]+ [\d.]+ [\d.]+ [\d.]+/);
    expect(svg).not.toMatch(/<path d="M [\d.]+ [\d.]+ C /);
  });

  it('defaults export resolution scale to 3x DPI for retina-grade exports', () => {
    expect(resolveExportScale()).toBe(3);
    expect(resolveExportScale({ resolution: 'ultra' })).toBe(3);
    expect(resolveExportScale({ resolution: 'high' })).toBe(2);
    expect(resolveExportScale({ resolution: 'standard' })).toBe(1);
    expect(resolveExportScale({ scale: 4 })).toBe(4);
  });

  it('generates dark-mode SVG when themeMode is dark', () => {
    const svg = generateTreeSvg(treeData, {
      themeMode: 'dark',
      includeHeader: true,
    });

    expect(svg).toContain('fill="#0f172a"'); // Dark background
    expect(svg).toContain('fill="#f8fafc"'); // Light text on dark bg
  });

  it('omits header title when includeHeader is false', () => {
    const svg = generateTreeSvg(treeData, {
      themeMode: 'light',
      includeHeader: false,
    });

    expect(svg).not.toContain('Tree Title Header');
  });

  it('returns empty string if tree has no people', () => {
    const emptyTree = {
      ...treeData,
      people: [],
      relationships: [],
    };
    const svg = generateTreeSvg(emptyTree, {
      themeMode: 'light',
      includeHeader: true,
    });
    expect(svg).toBe('');
  });
});
