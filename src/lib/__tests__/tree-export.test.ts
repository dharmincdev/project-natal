import { describe, it, expect } from 'vitest';
import { generateTreeSvg } from '@/lib/tree-export';
import { getInitialSmithTreeData } from '@/data/fixtures/smith-family';

describe('Tree Vector Export Engine (SPEC.md §5.5)', () => {
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
