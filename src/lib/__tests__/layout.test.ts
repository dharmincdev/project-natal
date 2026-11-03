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

  it('should preserve persisted person.positionX and person.positionY when present [PRO-5]', () => {
    const data = getInitialSmithTreeData();
    const baseline = layoutFamilyTree(data.people, data.relationships);
    const targetPerson = data.people[0];
    const baselineNode = baseline.nodes.find((n) => n.id === targetPerson.id)!;

    const peopleWithManualPos = data.people.map((p, idx) =>
      idx === 0
        ? {
            ...p,
            positionX: 480,
            positionY: 320,
            customFields: { ...p.customFields, _manualPos: 'true' },
          }
        : p
    );

    const { nodes } = layoutFamilyTree(peopleWithManualPos, data.relationships);
    const movedNode = nodes.find((n) => n.id === targetPerson.id)!;
    expect(movedNode.position).toEqual({ x: 480, y: 320 });
    expect(movedNode.position).not.toEqual(baselineNode.position);
  });

  it('should reset to algorithmic coordinates when positionX and positionY are undefined [PRO-5]', () => {
    const data = getInitialSmithTreeData();
    const baseline = layoutFamilyTree(data.people, data.relationships);
    const targetPerson = data.people[0];
    const baselineNode = baseline.nodes.find((n) => n.id === targetPerson.id)!;

    // First move to manual coordinates
    const movedPeople = data.people.map((p, idx) =>
      idx === 0
        ? {
            ...p,
            positionX: 640,
            positionY: 410,
          }
        : p
    );
    const movedLayout = layoutFamilyTree(movedPeople, data.relationships);
    expect(movedLayout.nodes.find((n) => n.id === targetPerson.id)?.position).toEqual({
      x: 640,
      y: 410,
    });

    // Then reset positionX and positionY to undefined (Auto-Align behavior)
    const resetPeople = movedPeople.map((p) => ({
      ...p,
      positionX: undefined as unknown as number,
      positionY: undefined as unknown as number,
    }));
    const resetLayout = layoutFamilyTree(resetPeople, data.relationships);
    const resetNode = resetLayout.nodes.find((n) => n.id === targetPerson.id)!;
    expect(resetNode.position).toEqual(baselineNode.position);
  });

  it('should style all spouse edges with rose stroke (#f43f5e) and dashed array (6,4) [PRO-7]', () => {
    const smith = getInitialSmithTreeData();
    const targaryen = getInitialHouseTargaryenTreeData();

    for (const dataset of [smith, targaryen]) {
      const { edges } = layoutFamilyTree(dataset.people, dataset.relationships);
      const spouseEdges = edges.filter(
        (e) =>
          e.sourceHandle === 'spouse-source' ||
          e.targetHandle === 'spouse-target' ||
          e.sourceHandle === 'union-right' ||
          e.targetHandle === 'union-left'
      );

      expect(spouseEdges.length).toBeGreaterThan(0);
      for (const edge of spouseEdges) {
        expect(edge.style?.stroke).toBe('#f43f5e');
        expect(edge.style?.strokeDasharray).toBe('6,4');
      }
    }
  });
});
