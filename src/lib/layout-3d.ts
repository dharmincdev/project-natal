import { Person, Relationship, RelationshipType, RelationshipSubtype } from '@/types/tree';
import { isDeceased } from '@/lib/tree-utils';

export type Node3D = {
  id: string;
  person: Person;
  position: [number, number, number];
  generation: number;
  radius: number;
  angle: number;
  isDeceased: boolean;
};

export type Edge3D = {
  id: string;
  sourceId: string;
  targetId: string;
  type: RelationshipType;
  subtype: RelationshipSubtype;
  color: string;
  points: [number, number, number][];
  isDashed?: boolean;
};

export type Layout3DResult = {
  nodes: Node3D[];
  edges: Edge3D[];
  maxGen: number;
  bounds: {
    maxRadius: number;
    minY: number;
    maxY: number;
  };
};

/**
 * Generates 3D cylindrical orbital coordinates for all relatives in the family tree.
 * Generations descend along the Y-axis, while relatives are spaced around concentric orbital rings in the XZ plane.
 */
export function layoutFamilyTree3D(
  people: Person[],
  relationships: Relationship[]
): Layout3DResult {
  if (people.length === 0) {
    return {
      nodes: [],
      edges: [],
      maxGen: 0,
      bounds: { maxRadius: 200, minY: 0, maxY: 0 },
    };
  }

  // 1. Build relationship graphs
  const parentsOf: Record<string, string[]> = {};
  const childrenOf: Record<string, string[]> = {};
  const spousesOf: Record<string, string[]> = {};

  people.forEach(p => {
    parentsOf[p.id] = [];
    childrenOf[p.id] = [];
    spousesOf[p.id] = [];
  });

  for (const rel of relationships) {
    if (rel.type === 'parent_child') {
      if (parentsOf[rel.personBId]) parentsOf[rel.personBId].push(rel.personAId);
      if (childrenOf[rel.personAId]) childrenOf[rel.personAId].push(rel.personBId);
    } else if (rel.type === 'spouse') {
      if (spousesOf[rel.personAId] && spousesOf[rel.personBId]) {
        spousesOf[rel.personAId].push(rel.personBId);
        spousesOf[rel.personBId].push(rel.personAId);
      }
    }
  }

  // 2. Compute Generational Depths via memoized DAG traversal
  const memo: Record<string, number> = {};
  const visiting = new Set<string>();

  function getBioDepth(id: string): number {
    if (memo[id] !== undefined) return memo[id];
    if (visiting.has(id)) return 0;

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

  // Spouses without parents inherit their spouse's generation
  for (let pass = 0; pass < 5; pass++) {
    for (const p of people) {
      if (gen[p.id] !== undefined) continue;
      const spouses = spousesOf[p.id] || [];
      const knownGens = spouses.map(s => gen[s]).filter((g): g is number => g !== undefined);
      if (knownGens.length > 0) {
        gen[p.id] = Math.max(...knownGens);
      }
    }
  }

  // Multi-spouse generation alignment
  for (const p of people) {
    const spouses = spousesOf[p.id] || [];
    if (spouses.length === 0) continue;
    const spouseGens = spouses.map(s => gen[s]).filter((g): g is number => g !== undefined);
    if (spouseGens.length > 0) {
      const maxSpouseGen = Math.max(...spouseGens);
      if (maxSpouseGen > (gen[p.id] ?? 0)) {
        const children = childrenOf[p.id] || [];
        const hasDeeperChildren = children.some(cid => (gen[cid] ?? 0) > maxSpouseGen);
        if (hasDeeperChildren || children.length === 0) {
          gen[p.id] = maxSpouseGen;
        }
      }
    }
  }

  // Assign 0 to any remaining unassigned
  people.forEach(p => {
    if (gen[p.id] === undefined) gen[p.id] = 0;
  });

  const maxGen = Math.max(...Object.values(gen), 0);

  // Group by generation
  const genGroups = new Map<number, Person[]>();
  for (let g = 0; g <= maxGen; g++) genGroups.set(g, []);
  for (const p of people) {
    const g = gen[p.id];
    genGroups.get(g)!.push(p);
  }

  // 3. Compute 3D Cylindrical Coordinates (R, theta, Y)
  const nodeAngles = new Map<string, number>();
  const nodePositions = new Map<string, [number, number, number]>();
  const nodeRadii = new Map<string, number>();

  const Y_STEP = 110;
  const BASE_RADIUS = 190;
  const RADIUS_GROWTH = 32;

  // Center Y around 0
  const yOffset = (maxGen * Y_STEP) / 2;

  for (let g = 0; g <= maxGen; g++) {
    const group = genGroups.get(g) || [];
    if (group.length === 0) continue;

    const ringRadius = BASE_RADIUS + g * RADIUS_GROWTH;
    const y = yOffset - g * Y_STEP;

    // Cluster members in this generation
    const visited = new Set<string>();
    const clusters: Person[][] = [];

    // Prioritize clustering couples/spouses
    for (const person of group) {
      if (visited.has(person.id)) continue;

      const cluster: Person[] = [person];
      visited.add(person.id);

      const spousesInGen = (spousesOf[person.id] || []).filter(
        sid => gen[sid] === g && !visited.has(sid)
      );

      for (const sid of spousesInGen) {
        const spouse = group.find(p => p.id === sid);
        if (spouse) {
          cluster.push(spouse);
          visited.add(sid);
        }
      }

      clusters.push(cluster);
    }

    // Sort clusters by their parents' angular positions if applicable
    clusters.sort((a, b) => {
      const getAvgParentAngle = (members: Person[]) => {
        let sum = 0;
        let count = 0;
        for (const m of members) {
          const parents = parentsOf[m.id] || [];
          for (const pid of parents) {
            const pa = nodeAngles.get(pid);
            if (pa !== undefined) {
              sum += pa;
              count++;
            }
          }
        }
        return count > 0 ? sum / count : 0;
      };

      const angleA = getAvgParentAngle(a);
      const angleB = getAvgParentAngle(b);
      return angleA - angleB;
    });

    // Distribute clusters around 360 degrees (0 to 2*PI)
    const totalPeopleInGen = group.length;
    let currentAngle = 0;

    // Base angle spacing
    const angularStep = (2 * Math.PI) / Math.max(totalPeopleInGen, 1);

    clusters.forEach(cluster => {
      if (cluster.length === 1) {
        const p = cluster[0];
        // If has parents, gently pull towards parents' angle
        const parents = parentsOf[p.id] || [];
        const parentAngles = parents.map(pid => nodeAngles.get(pid)).filter((a): a is number => a !== undefined);

        let finalAngle = currentAngle;
        if (parentAngles.length > 0 && g > 0) {
          const avgParent = parentAngles.reduce((sum, val) => sum + val, 0) / parentAngles.length;
          finalAngle = (currentAngle + avgParent) / 2;
        }

        nodeAngles.set(p.id, finalAngle);
        nodeRadii.set(p.id, ringRadius);
        currentAngle += angularStep;
      } else {
        // Multi-member cluster (couple/polygamous unit)
        const clusterStep = 0.22;
        const startAngle = currentAngle;

        cluster.forEach((p, idx) => {
          const angle = startAngle + idx * clusterStep;
          nodeAngles.set(p.id, angle);
          nodeRadii.set(p.id, ringRadius);
        });

        currentAngle += Math.max(angularStep * cluster.length, clusterStep * cluster.length + 0.15);
      }
    });

    // Compute Cartesian (x, y, z)
    for (const p of group) {
      const angle = nodeAngles.get(p.id) ?? 0;
      const r = nodeRadii.get(p.id) ?? ringRadius;
      const x = r * Math.cos(angle);
      const z = r * Math.sin(angle);
      nodePositions.set(p.id, [x, y, z]);
    }
  }

  // 4. Create 3D Nodes
  const nodes: Node3D[] = people.map(p => {
    const pos = nodePositions.get(p.id) || [0, 0, 0];
    const g = gen[p.id] ?? 0;
    const r = nodeRadii.get(p.id) ?? BASE_RADIUS;
    const angle = nodeAngles.get(p.id) ?? 0;
    const dead = isDeceased(p);

    return {
      id: p.id,
      person: p,
      position: pos,
      generation: g,
      radius: r,
      angle,
      isDeceased: dead,
    };
  });

  // 5. Create 3D Curved Edges
  const edges: Edge3D[] = [];

  function generateCubicBezierPoints(
    p0: [number, number, number],
    p1: [number, number, number],
    p2: [number, number, number],
    p3: [number, number, number],
    segments = 24
  ): [number, number, number][] {
    const points: [number, number, number][] = [];
    for (let i = 0; i <= segments; i++) {
      const t = i / segments;
      const u = 1 - t;
      const tt = t * t;
      const uu = u * u;
      const uuu = uu * u;
      const ttt = tt * t;

      const x = uuu * p0[0] + 3 * uu * t * p1[0] + 3 * u * tt * p2[0] + ttt * p3[0];
      const y = uuu * p0[1] + 3 * uu * t * p1[1] + 3 * u * tt * p2[1] + ttt * p3[1];
      const z = uuu * p0[2] + 3 * uu * t * p1[2] + 3 * u * tt * p2[2] + ttt * p3[2];
      points.push([x, y, z]);
    }
    return points;
  }

  for (const rel of relationships) {
    const srcPos = nodePositions.get(rel.personAId);
    const tgtPos = nodePositions.get(rel.personBId);
    if (!srcPos || !tgtPos) continue;

    if (rel.type === 'parent_child') {
      const cp1: [number, number, number] = [srcPos[0], srcPos[1] - 35, srcPos[2]];
      const cp2: [number, number, number] = [tgtPos[0], tgtPos[1] + 35, tgtPos[2]];
      const points = generateCubicBezierPoints(srcPos, cp1, cp2, tgtPos);

      const color = rel.subtype === 'adoptive' || rel.subtype === 'step' ? '#0ea5e9' : '#94a3b8';
      edges.push({
        id: rel.id,
        sourceId: rel.personAId,
        targetId: rel.personBId,
        type: rel.type,
        subtype: rel.subtype,
        color,
        points,
        isDashed: rel.subtype === 'adoptive' || rel.subtype === 'step',
      });
    } else if (rel.type === 'spouse') {
      const pA = nodes.find(n => n.id === rel.personAId);
      const pB = nodes.find(n => n.id === rel.personBId);

      if (pA && pB && pA.generation === pB.generation) {
        const segments = 16;
        const ringR = pA.radius;
        const y = pA.position[1];
        const points: [number, number, number][] = [];

        let a1 = pA.angle;
        let a2 = pB.angle;

        let diff = a2 - a1;
        while (diff > Math.PI) diff -= 2 * Math.PI;
        while (diff < -Math.PI) diff += 2 * Math.PI;

        for (let i = 0; i <= segments; i++) {
          const t = i / segments;
          const a = a1 + diff * t;
          const arcR = ringR + Math.sin(t * Math.PI) * 10;
          points.push([arcR * Math.cos(a), y, arcR * Math.sin(a)]);
        }

        edges.push({
          id: rel.id,
          sourceId: rel.personAId,
          targetId: rel.personBId,
          type: rel.type,
          subtype: rel.subtype,
          color: '#f43f5e',
          points,
          isDashed: true,
        });
      } else {
        const midY = (srcPos[1] + tgtPos[1]) / 2;
        const cp1: [number, number, number] = [srcPos[0] * 1.08, midY, srcPos[2] * 1.08];
        const cp2: [number, number, number] = [tgtPos[0] * 1.08, midY, tgtPos[2] * 1.08];
        const points = generateCubicBezierPoints(srcPos, cp1, cp2, tgtPos);

        edges.push({
          id: rel.id,
          sourceId: rel.personAId,
          targetId: rel.personBId,
          type: rel.type,
          subtype: rel.subtype,
          color: '#f43f5e',
          points,
          isDashed: true,
        });
      }
    } else if (rel.type === 'sibling') {
      const cp1: [number, number, number] = [srcPos[0] * 0.95, srcPos[1] + 12, srcPos[2] * 0.95];
      const cp2: [number, number, number] = [tgtPos[0] * 0.95, tgtPos[1] + 12, tgtPos[2] * 0.95];
      const points = generateCubicBezierPoints(srcPos, cp1, cp2, tgtPos);

      edges.push({
        id: rel.id,
        sourceId: rel.personAId,
        targetId: rel.personBId,
        type: rel.type,
        subtype: rel.subtype,
        color: '#a855f7',
        points,
        isDashed: true,
      });
    }
  }

  const maxRadius = BASE_RADIUS + maxGen * RADIUS_GROWTH;
  const minY = yOffset - maxGen * Y_STEP;
  const maxY = yOffset;

  return {
    nodes,
    edges,
    maxGen,
    bounds: {
      maxRadius,
      minY,
      maxY,
    },
  };
}
