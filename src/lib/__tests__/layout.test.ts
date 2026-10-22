import { describe, it, expect } from 'vitest';
import { getInitialHouseTargaryenTreeData } from '@/data/fixtures/house-targaryen';
import { getInitialRiveraChenTreeData } from '@/data/fixtures/rivera-chen';
import { getInitialSmithTreeData } from '@/data/fixtures/smith-family';
import { layoutFamilyTree } from '@/lib/layout';

describe('Generational Layout Engine (layoutFamilyTree)', () => {
  it('should layout Smith Family tree without duplicate node IDs', () => {
    const data = getInitialSmithTreeData();
    const { nodes, edges } = layoutFamilyTree(data.people, data.relationships);

    expect(nodes.length).toBeGreaterThan(0);
    const nodeIds = nodes.map((n) => n.id);
    const duplicateIds = nodeIds.filter((id, idx) => nodeIds.indexOf(id) !== idx);
    expect(duplicateIds).toEqual([]);
    expect(edges.length).toBeGreaterThan(0);
  });

  it('should layout House Targaryen complex lineage without duplicate node IDs', () => {
    const data = getInitialHouseTargaryenTreeData();
    const { nodes, edges } = layoutFamilyTree(data.people, data.relationships);

    expect(nodes.length).toBeGreaterThan(0);
    const nodeIds = nodes.map((n) => n.id);
    const duplicateIds = nodeIds.filter((id, idx) => nodeIds.indexOf(id) !== idx);
    expect(duplicateIds).toEqual([]);
    expect(edges.length).toBeGreaterThan(0);
  });

  it('should layout Rivera-Chen blended family without duplicate node IDs', () => {
    const data = getInitialRiveraChenTreeData();
    const { nodes, edges } = layoutFamilyTree(data.people, data.relationships);

    expect(nodes.length).toBeGreaterThan(0);
    const nodeIds = nodes.map((n) => n.id);
    const duplicateIds = nodeIds.filter((id, idx) => nodeIds.indexOf(id) !== idx);
    expect(duplicateIds).toEqual([]);
    expect(edges.length).toBeGreaterThan(0);
  });
});
