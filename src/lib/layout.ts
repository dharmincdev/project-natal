import { Node, Edge, MarkerType } from '@xyflow/react';
import { Person, Relationship } from '@/types/tree';

export function layoutFamilyTree(
  people: Person[],
  relationships: Relationship[],
  customPositions?: Record<string, { x: number; y: number }>
): { nodes: Node[]; edges: Edge[] } {
  // Map childId -> parentIds
  const parentsOf: Record<string, string[]> = {};
  // Map personId -> spouseIds
  const spousesOf: Record<string, string[]> = {};
  // Map personId -> siblingIds
  const siblingsOf: Record<string, string[]> = {};

  people.forEach(p => {
    parentsOf[p.id] = [];
    spousesOf[p.id] = [];
    siblingsOf[p.id] = [];
  });

  for (const rel of relationships) {
    if (rel.type === 'parent_child') {
      if (parentsOf[rel.personBId]) {
        parentsOf[rel.personBId].push(rel.personAId);
      }
    } else if (rel.type === 'spouse') {
      if (spousesOf[rel.personAId] && spousesOf[rel.personBId]) {
        spousesOf[rel.personAId].push(rel.personBId);
        spousesOf[rel.personBId].push(rel.personAId);
      }
    } else if (rel.type === 'sibling') {
      if (siblingsOf[rel.personAId] && siblingsOf[rel.personBId]) {
        siblingsOf[rel.personAId].push(rel.personBId);
        siblingsOf[rel.personBId].push(rel.personAId);
      }
    }
  }

  // 1. Biological Depth using memoized DAG traversal
  const memo: Record<string, number> = {};
  const visiting = new Set<string>();

  function getBioDepth(id: string): number {
    if (memo[id] !== undefined) return memo[id];
    if (visiting.has(id)) return 0; // Guard against cyclic dirty data

    visiting.add(id);
    const parents = parentsOf[id] || [];
    if (parents.length === 0) {
      visiting.delete(id);
      memo[id] = 0;
      return 0;
    }

    let maxParentDepth = 0;
    for (const pid of parents) {
      maxParentDepth = Math.max(maxParentDepth, getBioDepth(pid));
    }
    visiting.delete(id);
    const depth = maxParentDepth + 1;
    memo[id] = depth;
    return depth;
  }

  const gen: Record<string, number> = {};
  for (const p of people) {
    if ((parentsOf[p.id] || []).length > 0) {
      gen[p.id] = getBioDepth(p.id);
    }
  }

  // 2. People without parents in the tree inherit generation from their spouse(s) or siblings
  for (let pass = 0; pass < 5; pass++) {
    for (const p of people) {
      if (gen[p.id] !== undefined) continue;
      const spouses = spousesOf[p.id] || [];
      const sibs = siblingsOf[p.id] || [];
      const knownGens = [...spouses, ...sibs]
        .map(sid => gen[sid])
        .filter((g): g is number => g !== undefined);

      if (knownGens.length > 0) {
        gen[p.id] = Math.max(...knownGens);
      }
    }
  }

  // 3. Align people whose spouses/children are in a deeper generation
  // (e.g. Daemon Targaryen whose wives Laena & Rhaenyra are in Gen 5, and children in Gen 6)
  for (const p of people) {
    const spouses = spousesOf[p.id] || [];
    if (spouses.length === 0) continue;

    const spouseGens = spouses
      .map(sid => gen[sid])
      .filter((g): g is number => g !== undefined);

    if (spouseGens.length > 0) {
      const minSpouseGen = Math.min(...spouseGens);
      if (minSpouseGen > (gen[p.id] ?? 0)) {
        gen[p.id] = minSpouseGen;
      }
    }
  }

  // Disconnected roots default to generation 0
  for (const p of people) {
    if (gen[p.id] === undefined) {
      gen[p.id] = 0;
    }
  }

  // 3. Group people by generation
  const genGroups: Record<number, Person[]> = {};
  for (const p of people) {
    const g = gen[p.id];
    if (!genGroups[g]) genGroups[g] = [];
    genGroups[g].push(p);
  }

  const nodes: Node[] = [];
  const edges: Edge[] = [];
  const nodePositions: Record<string, { x: number; y: number }> = {};

  const getParents = (personId: string) => {
    return parentsOf[personId] || [];
  };

  const shareParents = (id1: string, id2: string) => {
    const p1 = getParents(id1);
    const p2 = getParents(id2);
    return p1.some(p => p2.includes(p));
  };

  const areBioSiblings = (id1: string, id2: string) => {
    return shareParents(id1, id2) || (siblingsOf[id1] || []).includes(id2);
  };

  const nodeWidth = 256;
  const spouseGap = 90;
  const unitGap = 130;
  const rowHeight = 270;

  function orderSpouseComponent(
    comp: string[],
    spousesOf: Record<string, string[]>,
    getParents: (id: string) => string[],
    nodePositions: Record<string, { x: number; y: number }>
  ): string[] {
    if (comp.length <= 1) return comp;
    if (comp.length === 2) {
      const pA = getParents(comp[0]).filter(pid => nodePositions[pid] !== undefined);
      const pB = getParents(comp[1]).filter(pid => nodePositions[pid] !== undefined);
      const avgA = pA.length > 0 ? pA.reduce((sum, pid) => sum + nodePositions[pid].x, 0) / pA.length : undefined;
      const avgB = pB.length > 0 ? pB.reduce((sum, pid) => sum + nodePositions[pid].x, 0) / pB.length : undefined;
      if (avgA !== undefined && avgB !== undefined) {
        return avgA <= avgB ? comp : [comp[1], comp[0]];
      }
      return comp;
    }

    const adj: Record<string, string[]> = {};
    for (const id of comp) {
      adj[id] = (spousesOf[id] || []).filter(sid => comp.includes(sid));
    }

    // Find endpoints (nodes with degree 1 in this component)
    const deg1 = comp.filter(id => (adj[id] || []).length === 1);

    // Sort deg1 endpoints so the one whose parents are more to the left goes first
    deg1.sort((a, b) => {
      const pA = getParents(a).filter(pid => nodePositions[pid] !== undefined);
      const pB = getParents(b).filter(pid => nodePositions[pid] !== undefined);
      const avgA = pA.length > 0 ? pA.reduce((sum, pid) => sum + nodePositions[pid].x, 0) / pA.length : 0;
      const avgB = pB.length > 0 ? pB.reduce((sum, pid) => sum + nodePositions[pid].x, 0) / pB.length : 0;
      if (avgA !== avgB) return avgA - avgB;
      return a.localeCompare(b);
    });

    const startNode = deg1.length > 0 ? deg1[0] : comp[0];

    const path: string[] = [startNode];
    const seen = new Set<string>([startNode]);

    while (path.length < comp.length) {
      const curr = path[path.length - 1];
      const next = (adj[curr] || []).find(nid => !seen.has(nid));
      if (next) {
        path.push(next);
        seen.add(next);
      } else {
        const remaining = comp.find(id => !seen.has(id));
        if (remaining) {
          path.push(remaining);
          seen.add(remaining);
        } else {
          break;
        }
      }
    }

    // Check if path flows in parent order; if not, reverse it
    let parentSlope = 0;
    for (let i = 0; i < path.length; i++) {
      for (let j = i + 1; j < path.length; j++) {
        const pA = getParents(path[i]).filter(pid => nodePositions[pid] !== undefined);
        const pB = getParents(path[j]).filter(pid => nodePositions[pid] !== undefined);
        if (pA.length > 0 && pB.length > 0) {
          const avgA = pA.reduce((sum, pid) => sum + nodePositions[pid].x, 0) / pA.length;
          const avgB = pB.reduce((sum, pid) => sum + nodePositions[pid].x, 0) / pB.length;
          parentSlope += (avgB - avgA);
        }
      }
    }
    if (parentSlope < 0) {
      path.reverse();
    }

    return path;
  }

  const sortedGens = Object.keys(genGroups).map(Number).sort((a, b) => a - b);

  // 4. Layout each generation
  for (const g of sortedGens) {
    const genPeople = genGroups[g];
    const genIds = new Set(genPeople.map(p => p.id));
    const visited = new Set<string>();

    type FamilyUnit = {
      type: 'individual' | 'couple' | 'cluster';
      members: string[];
      centerX?: number;
      clusterId?: number;
      isBridge?: boolean;
    };

    const units: FamilyUnit[] = [];

    for (const p of genPeople) {
      if (visited.has(p.id)) continue;

      // Find all connected spouses in this generation (connected component via BFS)
      const comp: string[] = [];
      const queue: string[] = [p.id];
      visited.add(p.id);

      while (queue.length > 0) {
        const curr = queue.shift()!;
        comp.push(curr);

        const genSpouses = (spousesOf[curr] || []).filter(sid => genIds.has(sid) && !visited.has(sid));
        for (const s of genSpouses) {
          visited.add(s);
          queue.push(s);
        }
      }

      // Order component linearly so spouses are adjacent to each other
      const orderedMembers = orderSpouseComponent(comp, spousesOf, getParents, nodePositions);

      units.push({
        type: orderedMembers.length === 1 ? 'individual' : orderedMembers.length === 2 ? 'couple' : 'cluster',
        members: orderedMembers,
      });
    }

    // Step 4A: Partition generation into Biological Sibling Clusters
    // Two people in genPeople belong to the same cluster if they are biological siblings
    const sibVisited = new Set<string>();
    const sibClusters: { id: number; members: Set<string>; centerX?: number }[] = [];

    for (const p of genPeople) {
      if (sibVisited.has(p.id)) continue;

      const clusterMembers = new Set<string>();
      const q: string[] = [p.id];
      sibVisited.add(p.id);

      while (q.length > 0) {
        const curr = q.shift()!;
        clusterMembers.add(curr);

        for (const other of genPeople) {
          if (!sibVisited.has(other.id) && areBioSiblings(curr, other.id)) {
            sibVisited.add(other.id);
            q.push(other.id);
          }
        }
      }

      // Compute cluster centerX from ancestors placed in earlier generations
      const validParents = Array.from(clusterMembers)
        .flatMap(id => getParents(id))
        .filter(pid => nodePositions[pid] !== undefined);

      let centerX: number | undefined = undefined;
      if (validParents.length > 0) {
        centerX = validParents.reduce((sum, pid) => sum + nodePositions[pid].x, 0) / validParents.length;
      }

      sibClusters.push({
        id: sibClusters.length,
        members: clusterMembers,
        centerX,
      });
    }

    // Assign units to sibling clusters
    const personToCluster: Record<string, number> = {};
    for (const sc of sibClusters) {
      for (const m of sc.members) {
        personToCluster[m] = sc.id;
      }
    }

    // Propagate centerX to clusters without direct parents if connected by marriage to placed clusters
    for (let pass = 0; pass < 3; pass++) {
      for (const unit of units) {
        if (unit.members.length >= 2) {
          const cIds = Array.from(new Set(unit.members.map(m => personToCluster[m]).filter(id => id !== undefined)));
          if (cIds.length >= 2) {
            const placed = cIds.filter(id => sibClusters[id].centerX !== undefined);
            const unplaced = cIds.filter(id => sibClusters[id].centerX === undefined);
            for (const uId of unplaced) {
              // Position unplaced cluster to the right of placed cluster (maternal / outside wing)
              const baseCenterX = placed.length > 0 ? sibClusters[placed[0]].centerX! : 0;
              sibClusters[uId].centerX = baseCenterX + 800;
            }
          }
        }
      }
    }

    // Sort sibling clusters by centerX (left to right)
    sibClusters.sort((a, b) => {
      if (a.centerX !== undefined && b.centerX !== undefined) return a.centerX - b.centerX;
      if (a.centerX !== undefined) return -1;
      if (b.centerX !== undefined) return 1;
      return a.id - b.id;
    });

    const clusterRank: Record<number, number> = {};
    sibClusters.forEach((sc, idx) => {
      clusterRank[sc.id] = idx;
    });

    // Tag units with primary cluster and bridge status
    for (const unit of units) {
      const cRanks = unit.members
        .map(m => personToCluster[m])
        .filter((cid): cid is number => cid !== undefined)
        .map(cid => clusterRank[cid]);

      if (cRanks.length > 0) {
        unit.clusterId = Math.min(...cRanks);
        const maxRank = Math.max(...cRanks);
        unit.isBridge = maxRank > unit.clusterId;
      }
    }

    // Sibling-Aware Unit Sorting:
    // 1. Sort by clusterRank
    // 2. Within the same cluster:
    //    - If this cluster bridges to a cluster on the right:
    //      Internal units come FIRST, bridge unit comes LAST (on the right flank facing the outside spouse)
    //    - Non-bridge units stay grouped on the interior/paternal side
    units.sort((a, b) => {
      const cA = a.clusterId ?? 999;
      const cB = b.clusterId ?? 999;
      if (cA !== cB) return cA - cB;

      // Inside the same cluster:
      // Put non-bridge units before bridge units so the bridge is on the right flank facing the outside spouse
      if (a.isBridge && !b.isBridge) return 1;
      if (!a.isBridge && b.isBridge) return -1;

      // If both are couples in the same cluster, check if one connects to outside branch / descendants
      const aHasMaternal = a.members.some(id => (siblingsOf[id] || []).length > 0 || getParents(id).length > 0);
      const bHasMaternal = b.members.some(id => (siblingsOf[id] || []).length > 0 || getParents(id).length > 0);
      if (aHasMaternal !== bHasMaternal) {
        return aHasMaternal ? 1 : -1;
      }

      // Secondary tie-breaker by member ID
      return a.members[0].localeCompare(b.members[0]);
    });

    // Sibling Facing Rule for Couples:
    // For each couple unit [m0, m1], orient the members so that whoever has siblings in adjacent
    // units faces toward their siblings, and the outside spouse faces the exterior.
    for (let uIdx = 0; uIdx < units.length; uIdx++) {
      const unit = units[uIdx];
      if (unit.members.length === 2) {
        const m0 = unit.members[0];
        const m1 = unit.members[1];

        const unitsLeft = units.slice(0, uIdx);
        const unitsRight = units.slice(uIdx + 1);

        const m0Left = unitsLeft.some(u => u.members.some(id => areBioSiblings(m0, id)));
        const m0Right = unitsRight.some(u => u.members.some(id => areBioSiblings(m0, id)));
        const m1Left = unitsLeft.some(u => u.members.some(id => areBioSiblings(m1, id)));
        const m1Right = unitsRight.some(u => u.members.some(id => areBioSiblings(m1, id)));

        const score0 = (m0Left ? 1 : 0) - (m0Right ? 1 : 0);
        const score1 = (m1Left ? 1 : 0) - (m1Right ? 1 : 0);

        if (score0 !== score1) {
          // The member with higher score (more siblings to the left) must be on the left (index 0)
          if (score0 < score1) {
            unit.members = [m1, m0];
          }
        } else {
          // If equal sibling scores, check cluster rank or parent positions
          const r0 = clusterRank[personToCluster[m0]];
          const r1 = clusterRank[personToCluster[m1]];
          if (r0 !== undefined && r1 !== undefined && r0 !== r1) {
            if (r0 > r1) {
              unit.members = [m1, m0];
            }
          } else {
            const p0 = getParents(m0).filter(pid => nodePositions[pid] !== undefined);
            const p1 = getParents(m1).filter(pid => nodePositions[pid] !== undefined);
            if (p0.length > 0 && p1.length > 0) {
              const avg0 = p0.reduce((sum, pid) => sum + nodePositions[pid].x, 0) / p0.length;
              const avg1 = p1.reduce((sum, pid) => sum + nodePositions[pid].x, 0) / p1.length;
              if (avg0 > avg1) {
                unit.members = [m1, m0];
              }
            }
          }
        }
      }
    }

    const unitWidths = units.map(u =>
      u.members.length * nodeWidth + (u.members.length - 1) * spouseGap
    );
    const totalRowWidth =
      unitWidths.reduce((sum, w) => sum + w, 0) +
      (units.length > 1 ? (units.length - 1) * unitGap : 0);

    let currentX = -totalRowWidth / 2;
    const currentY = g * rowHeight;

    for (let i = 0; i < units.length; i++) {
      const unit = units[i];
      for (let m = 0; m < unit.members.length; m++) {
        const memberId = unit.members[m];
        const person = people.find(p => p.id === memberId)!;

        let memX = currentX + m * (nodeWidth + spouseGap);
        let memY = currentY;

        if (customPositions && customPositions[memberId]) {
          memX = customPositions[memberId].x;
          memY = customPositions[memberId].y;
        }

        nodePositions[memberId] = { x: memX, y: memY };
        nodes.push({
          id: memberId,
          type: 'person',
          position: { x: memX, y: memY },
          data: { person },
          width: nodeWidth,
          height: 90,
          initialWidth: nodeWidth,
          initialHeight: 90,
        });
      }

      const unitWidth =
        unit.members.length * nodeWidth + (unit.members.length - 1) * spouseGap;
      currentX += unitWidth + unitGap;
    }
  }

  // 5. Marriage Union Junctions (Branching from couple to shared children)
  const getUnionKey = (id1: string, id2: string) => [id1, id2].sort().join('--');

  const areSpouses = (id1: string, id2: string) => {
    return relationships.some(
      r => r.type === 'spouse' &&
      ((r.personAId === id1 && r.personBId === id2) || (r.personAId === id2 && r.personBId === id1))
    );
  };

  // Find biological parent_child relationships for each child
  const childBioParents: Record<string, { parentId: string; relId: string }[]> = {};
  for (const rel of relationships) {
    if (rel.type === 'parent_child' && rel.subtype !== 'step' && rel.subtype !== 'adoptive') {
      if (!childBioParents[rel.personBId]) {
        childBioParents[rel.personBId] = [];
      }
      childBioParents[rel.personBId].push({ parentId: rel.personAId, relId: rel.id });
    }
  }

  // Identify married couples with shared biological children
  const unionsWithChildren: Record<
    string, 
    { parentA: string; parentB: string; children: string[]; handledRelIds: Set<string> }
  > = {};

  const handledRelIds = new Set<string>();

  for (const child of people) {
    const parents = childBioParents[child.id] || [];
    if (parents.length >= 2) {
      for (let i = 0; i < parents.length; i++) {
        for (let j = i + 1; j < parents.length; j++) {
          const pA = parents[i].parentId;
          const pB = parents[j].parentId;
          if (areSpouses(pA, pB)) {
            const uKey = getUnionKey(pA, pB);
            if (!unionsWithChildren[uKey]) {
              unionsWithChildren[uKey] = {
                parentA: pA,
                parentB: pB,
                children: [],
                handledRelIds: new Set(),
              };
            }
            if (!unionsWithChildren[uKey].children.includes(child.id)) {
              unionsWithChildren[uKey].children.push(child.id);
            }
            unionsWithChildren[uKey].handledRelIds.add(parents[i].relId);
            unionsWithChildren[uKey].handledRelIds.add(parents[j].relId);
            handledRelIds.add(parents[i].relId);
            handledRelIds.add(parents[j].relId);
            break;
          }
        }
      }
    }
  }

  // 5. Marriage Union Junctions & Multi-Lane Bus Routing
  // Group same-row unions by row and sort by X to assign distinct non-overlapping horizontal bus lanes
  const unionsByRow: Record<number, string[]> = {};
  for (const [uKey, union] of Object.entries(unionsWithChildren)) {
    const posA = nodePositions[union.parentA];
    const posB = nodePositions[union.parentB];
    if (!posA || !posB) continue;
    if (Math.abs(posA.y - posB.y) >= 50) {
      // If parents are on different rows, release handled rels to fall back to direct edges
      for (const relId of union.handledRelIds) {
        handledRelIds.delete(relId);
      }
      continue;
    }

    const rowG = Math.round(posA.y / rowHeight);
    if (!unionsByRow[rowG]) unionsByRow[rowG] = [];
    unionsByRow[rowG].push(uKey);
  }

  const unionBusY: Record<string, number> = {};
  for (const [rowStr, uKeys] of Object.entries(unionsByRow)) {
    const rowG = Number(rowStr);
    uKeys.sort((k1, k2) => {
      const u1 = unionsWithChildren[k1];
      const u2 = unionsWithChildren[k2];
      const cx1 = (nodePositions[u1.parentA].x + nodePositions[u1.parentB].x) / 2;
      const cx2 = (nodePositions[u2.parentA].x + nodePositions[u2.parentB].x) / 2;
      return cx1 - cx2;
    });

    const baseGapY = rowG * rowHeight + 85;
    for (let lane = 0; lane < uKeys.length; lane++) {
      unionBusY[uKeys[lane]] = baseGapY + 35 + lane * 35;
    }
  }

  // Helper to find an open vertical corridor between cards and unions across intermediate rows
  function findOpenCorridor(
    sourceY: number,
    targetY: number,
    preferredX: number
  ): number {
    const cardsBetween = people
      .map(p => nodePositions[p.id])
      .filter(pos => pos && pos.y > sourceY + 40 && pos.y < targetY - 40);

    if (cardsBetween.length === 0) {
      return preferredX;
    }

    const unionCentersBetween: { x: number; y: number }[] = [];
    for (const u of Object.values(unionsWithChildren)) {
      const pA = nodePositions[u.parentA];
      const pB = nodePositions[u.parentB];
      if (pA && pB) {
        const uY = (pA.y + pB.y) / 2 + 45;
        if (uY > sourceY + 40 && uY < targetY - 40) {
          const uX = (pA.x + pB.x + nodeWidth) / 2;
          unionCentersBetween.push({ x: uX, y: uY });
        }
      }
    }

    const rows: Record<number, { left: number; right: number }[]> = {};
    for (const c of cardsBetween) {
      const rY = Math.round(c.y);
      if (!rows[rY]) rows[rY] = [];
      rows[rY].push({ left: c.x - 20, right: c.x + nodeWidth + 20 });
    }

    const minLeft = Math.min(...cardsBetween.map(c => c.x)) - 65;
    const maxRight = Math.max(...cardsBetween.map(c => c.x + nodeWidth)) + 65;

    const candidates: number[] = [minLeft, maxRight];

    for (const intervals of Object.values(rows)) {
      intervals.sort((a, b) => a.left - b.left);
      for (let i = 0; i < intervals.length - 1; i++) {
        const gapLeft = intervals[i].right;
        const gapRight = intervals[i + 1].left;
        if (gapRight - gapLeft >= 30) {
          const mid = (gapLeft + gapRight) / 2;
          const isClearOfCards = Object.values(rows).every(rIntervals => 
            !rIntervals.some(inv => mid >= inv.left && mid <= inv.right)
          );
          const isClearOfUnions = !unionCentersBetween.some(uc => Math.abs(uc.x - mid) < 35);
          if (isClearOfCards && isClearOfUnions) {
            candidates.push(mid);
          }
        }
      }
    }

    candidates.sort((a, b) => Math.abs(a - preferredX) - Math.abs(b - preferredX));
    return candidates[0];
  }

  // Generate Union nodes and edges from unions to shared children
  for (const [uKey, union] of Object.entries(unionsWithChildren)) {
    const posA = nodePositions[union.parentA];
    const posB = nodePositions[union.parentB];
    if (!posA || !posB) continue;

    const isSameRow = Math.abs(posA.y - posB.y) < 50;
    if (!isSameRow) continue;

    const unionNodeId = `union-${uKey}`;
    const unionCenterX = (posA.x + posB.x + nodeWidth) / 2;
    const unionCenterY = (posA.y + posB.y) / 2 + 45;

    nodes.push({
      id: unionNodeId,
      type: 'union',
      position: { x: unionCenterX - 7, y: unionCenterY - 7 },
      data: {},
      width: 14,
      height: 14,
      initialWidth: 14,
      initialHeight: 14,
      selectable: false,
      draggable: false,
      deletable: false,
    });

    for (const childId of union.children) {
      if (!nodePositions[childId]) continue;
      const childPos = nodePositions[childId];
      const isMultiRow = childPos.y - unionCenterY > 350;

      if (isMultiRow) {
        // Multi-row child: route cleanly through outside vertical corridor so it NEVER slices through intermediate nodes
        const childCenterX = childPos.x + nodeWidth / 2;
        const viaX = findOpenCorridor(unionCenterY, childPos.y, childCenterX);

        const sourceRowG = Math.round(unionCenterY / rowHeight);
        const targetRowG = Math.round(childPos.y / rowHeight);
        const channel1Y = sourceRowG * rowHeight + 85 + 35 + (unionsByRow[sourceRowG]?.length || 1) * 35;
        const channel2Y = targetRowG * rowHeight - 35;

        edges.push({
          id: `edge-union-${uKey}-${childId}`,
          source: unionNodeId,
          sourceHandle: 'union-bottom',
          target: childId,
          targetHandle: 'top-target',
          type: 'channel',
          data: {
            channel1Y,
            viaX,
            channel2Y,
          },
          style: {
            stroke: '#64748b',
            strokeWidth: 2,
          },
          markerEnd: { type: MarkerType.ArrowClosed, color: '#64748b' },
        } as Edge);
      } else {
        const busY = unionBusY[uKey] ?? (unionCenterY + childPos.y) / 2;
        edges.push({
          id: `edge-union-${uKey}-${childId}`,
          source: unionNodeId,
          sourceHandle: 'union-bottom',
          target: childId,
          targetHandle: 'top-target',
          type: 'channel',
          data: {
            busY,
          },
          style: {
            stroke: '#64748b',
            strokeWidth: 2,
          },
          markerEnd: { type: MarkerType.ArrowClosed, color: '#64748b' },
        } as Edge);
      }
    }
  }

  // 6. Create Direct Edges (Spouses, Non-Union Parents, Step/Adoptive, and Siblings)
  for (const rel of relationships) {
    const a = rel.personAId;
    const b = rel.personBId;

    if (!nodePositions[a] || !nodePositions[b]) continue;

    if (rel.type === 'spouse') {
      const posA = nodePositions[a];
      const posB = nodePositions[b];

      const isSameRow = Math.abs(posA.y - posB.y) < 50;

      if (isSameRow) {
        let leftId = a;
        let rightId = b;
        if (posB.x < posA.x) {
          leftId = b;
          rightId = a;
        }

        const uKey = getUnionKey(a, b);
        const hasUnion = !!(unionsWithChildren[uKey] && isSameRow);

        if (hasUnion) {
          const unionNodeId = `union-${uKey}`;
          // 1. Left Spouse -> unionNodeId (union-left) - Solid Rose
          edges.push({
            id: `${rel.id}-left`,
            source: leftId,
            sourceHandle: 'spouse-source',
            target: unionNodeId,
            targetHandle: 'union-left',
            type: 'straight',
            style: { stroke: '#f43f5e', strokeWidth: 2 },
          });

          // 2. unionNodeId (union-right) -> Right Spouse - Solid Rose
          edges.push({
            id: `${rel.id}-right`,
            source: unionNodeId,
            sourceHandle: 'union-right',
            target: rightId,
            targetHandle: 'spouse-target',
            type: 'straight',
            style: { stroke: '#f43f5e', strokeWidth: 2 },
          });
        } else {
          // Direct spouse edge without children - Solid Rose
          edges.push({
            id: rel.id,
            source: leftId,
            sourceHandle: 'spouse-source',
            target: rightId,
            targetHandle: 'spouse-target',
            type: 'straight',
            style: { stroke: '#f43f5e', strokeWidth: 2 },
          });
        }
      } else {
        // Cross-row spouse connection (e.g. across generations) - Solid Rose
        const [upperId, lowerId] = posA.y < posB.y ? [a, b] : [b, a];
        edges.push({
          id: rel.id,
          source: upperId,
          sourceHandle: 'spouse-source',
          target: lowerId,
          targetHandle: 'spouse-target',
          type: 'default',
          style: { stroke: '#f43f5e', strokeWidth: 2 },
        });
      }
    } else if (rel.type === 'parent_child') {
      // If this parent_child relationship was cleanly handled by a married union junction, skip individual edge
      if (handledRelIds.has(rel.id)) continue;

      const isAdoptiveOrStep = rel.subtype === 'adoptive' || rel.subtype === 'step';
      const edgeColor = isAdoptiveOrStep ? '#0284c7' : '#64748b'; // sky-600 vs slate-500
      const pParent = nodePositions[a];
      const pChild = nodePositions[b];
      const isMultiRow = pParent && pChild && (pChild.y - pParent.y > 350);

      if (isMultiRow) {
        const childCenterX = pChild.x + nodeWidth / 2;
        const viaX = findOpenCorridor(pParent.y, pChild.y, childCenterX);

        const sourceRowG = Math.round(pParent.y / rowHeight);
        const targetRowG = Math.round(pChild.y / rowHeight);
        const channel1Y = sourceRowG * rowHeight + 85 + 35 + (unionsByRow[sourceRowG]?.length || 1) * 35;
        const channel2Y = targetRowG * rowHeight - 35;

        edges.push({
          id: rel.id,
          source: a,
          sourceHandle: 'bottom-source',
          target: b,
          targetHandle: 'top-target',
          type: 'channel',
          data: {
            channel1Y,
            viaX,
            channel2Y,
          },
          style: { 
            stroke: edgeColor, 
            strokeWidth: 2,
            strokeDasharray: isAdoptiveOrStep ? '5,5' : undefined,
          },
          markerEnd: { type: MarkerType.ArrowClosed, color: edgeColor },
        });
      } else {
        const sourceRowG = Math.round(pParent.y / rowHeight);
        const busY = sourceRowG * rowHeight + 85 + 35;
        edges.push({
          id: rel.id,
          source: a, // parent
          sourceHandle: 'bottom-source',
          target: b, // child
          targetHandle: 'top-target',
          type: 'channel',
          data: {
            busY,
          },
          style: { 
            stroke: edgeColor, 
            strokeWidth: 2, 
            strokeDasharray: isAdoptiveOrStep ? '5,5' : undefined,
          },
          markerEnd: { type: MarkerType.ArrowClosed, color: edgeColor },
        });
      }
    } else if (rel.type === 'sibling') {
      if (!shareParents(a, b)) {
        const isHalf = rel.subtype === 'half';
        edges.push({
          id: rel.id,
          source: a,
          target: b,
          type: 'step',
          style: { 
            stroke: '#8b5cf6', 
            strokeWidth: 1.5, 
            strokeDasharray: isHalf ? '2,4' : '3,3' 
          },
        });
      }
    }
  }

  // 7. Detect Orthogonal Intersections & Assign Arc Bridge Hop-Overs
  const nodeMap = new Map(nodes.map(n => [n.id, n]));

  type HSeg = { edgeId: string; y: number; minX: number; maxX: number };
  type VSeg = { edgeId: string; x: number; minY: number; maxY: number };

  const hSegs: HSeg[] = [];
  const vSegs: VSeg[] = [];

  for (const e of edges) {
    if (e.type !== 'channel') continue;
    const sNode = nodeMap.get(e.source);
    const tNode = nodeMap.get(e.target);
    if (!sNode || !tNode) continue;

    const sX = sNode.type === 'union' ? sNode.position.x + 7 : sNode.position.x + nodeWidth / 2;
    const sY = sNode.type === 'union' ? sNode.position.y + 7 : sNode.position.y + 90;
    const tX = tNode.position.x + nodeWidth / 2;
    const tY = tNode.position.y;

    const edgeData = e.data as any;

    if (edgeData?.viaX !== undefined) {
      const c1Y = edgeData.channel1Y ?? sY + 80;
      const c2Y = edgeData.channel2Y ?? tY - 60;
      const vX = edgeData.viaX;

      // V1: sX, sY -> c1Y
      vSegs.push({ edgeId: e.id, x: sX, minY: Math.min(sY, c1Y), maxY: Math.max(sY, c1Y) });
      // H1: c1Y, sX -> vX
      hSegs.push({ edgeId: e.id, y: c1Y, minX: Math.min(sX, vX), maxX: Math.max(sX, vX) });
      // V2: vX, c1Y -> c2Y
      vSegs.push({ edgeId: e.id, x: vX, minY: Math.min(c1Y, c2Y), maxY: Math.max(c1Y, c2Y) });
      // H2: c2Y, vX -> tX
      hSegs.push({ edgeId: e.id, y: c2Y, minX: Math.min(vX, tX), maxX: Math.max(vX, tX) });
      // V3: tX, c2Y -> tY
      vSegs.push({ edgeId: e.id, x: tX, minY: Math.min(c2Y, tY), maxY: Math.max(c2Y, tY) });
    } else {
      const busY = edgeData?.busY ?? (sY + tY) / 2;
      // V1: sX, sY -> busY
      vSegs.push({ edgeId: e.id, x: sX, minY: Math.min(sY, busY), maxY: Math.max(sY, busY) });
      // H1: busY, sX -> tX
      hSegs.push({ edgeId: e.id, y: busY, minX: Math.min(sX, tX), maxX: Math.max(sX, tX) });
      // V2: tX, busY -> tY
      vSegs.push({ edgeId: e.id, x: tX, minY: Math.min(busY, tY), maxY: Math.max(busY, tY) });
    }
  }

  const jumpsByEdge: Record<string, { x: number; y: number }[]> = {};
  const seenJumps = new Set<string>();

  for (const v of vSegs) {
    for (const h of hSegs) {
      if (v.edgeId === h.edgeId) continue;
      // Check if vertical segment intersects horizontal segment with safety margins from corners
      if (v.x > h.minX + 8 && v.x < h.maxX - 8) {
        if (h.y > v.minY + 8 && h.y < v.maxY - 8) {
          const key = `${v.edgeId}:${Math.round(v.x)},${Math.round(h.y)}`;
          if (!seenJumps.has(key)) {
            seenJumps.add(key);
            if (!jumpsByEdge[v.edgeId]) jumpsByEdge[v.edgeId] = [];
            jumpsByEdge[v.edgeId].push({ x: Math.round(v.x), y: Math.round(h.y) });
          }
        }
      }
    }
  }

  for (const e of edges) {
    if (jumpsByEdge[e.id]) {
      e.data = {
        ...(e.data || {}),
        jumps: jumpsByEdge[e.id],
      };
    }
  }

  return { nodes, edges };
}
