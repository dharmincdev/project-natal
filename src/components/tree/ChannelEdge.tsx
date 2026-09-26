'use client';

import React from 'react';
import { BaseEdge, EdgeProps } from '@xyflow/react';

export type JumpPoint = {
  x: number;
  y: number;
};

type ChannelEdgeData = {
  busY?: number;
  channel1Y?: number;
  viaX?: number;
  channel2Y?: number;
  jumps?: JumpPoint[];
};

function createRoundedSteppedPath(
  points: { x: number; y: number }[],
  jumps: JumpPoint[] = [],
  radius = 8,
  jumpR = 6
): string {
  if (!points || points.length < 2) return '';
  const safeJumps = Array.isArray(jumps) ? jumps : [];

  // Validate all coordinates are finite numbers
  for (const pt of points) {
    if (typeof pt.x !== 'number' || isNaN(pt.x) || typeof pt.y !== 'number' || isNaN(pt.y)) {
      return '';
    }
  }

  let d = `M ${points[0].x} ${points[0].y}`;

  let currX = points[0].x;
  let currY = points[0].y;

  function appendSegment(toX: number, toY: number) {
    // Check if segment is vertical
    if (Math.abs(currX - toX) < 0.5) {
      const x = currX;
      const segMinY = Math.min(currY, toY);
      const segMaxY = Math.max(currY, toY);
      const isDown = toY >= currY;

      // Filter jumps strictly on this vertical segment
      const segJumps = safeJumps.filter(
        j => j && typeof j.x === 'number' && typeof j.y === 'number' &&
             Math.abs(j.x - x) < 2 && j.y > segMinY + jumpR + 2 && j.y < segMaxY - jumpR - 2
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

  for (let i = 1; i < points.length - 1; i++) {
    const pPrev = points[i - 1];
    const pCurr = points[i];
    const pNext = points[i + 1];

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

  const last = points[points.length - 1];
  appendSegment(last.x, last.y);
  return d;
}

export default function ChannelEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  style,
  markerEnd,
  data,
}: EdgeProps) {
  if (
    typeof sourceX !== 'number' || isNaN(sourceX) ||
    typeof sourceY !== 'number' || isNaN(sourceY) ||
    typeof targetX !== 'number' || isNaN(targetX) ||
    typeof targetY !== 'number' || isNaN(targetY)
  ) {
    return null;
  }

  const edgeData = data as ChannelEdgeData | undefined;

  let points: { x: number; y: number }[];

  if (edgeData?.viaX !== undefined) {
    const c1Y = edgeData.channel1Y ?? sourceY + 80;
    const c2Y = edgeData.channel2Y ?? targetY - 60;
    const vX = edgeData.viaX;

    points = [
      { x: sourceX, y: sourceY },
      { x: sourceX, y: c1Y },
      { x: vX, y: c1Y },
      { x: vX, y: c2Y },
      { x: targetX, y: c2Y },
      { x: targetX, y: targetY },
    ];
  } else {
    const busY = edgeData?.busY ?? (sourceY + targetY) / 2;
    points = [
      { x: sourceX, y: sourceY },
      { x: sourceX, y: busY },
      { x: targetX, y: busY },
      { x: targetX, y: targetY },
    ];
  }

  const path = createRoundedSteppedPath(points, edgeData?.jumps, 8, 6);
  if (!path) return null;

  return (
    <BaseEdge
      id={id}
      path={path}
      style={style}
      markerEnd={markerEnd}
    />
  );
}
