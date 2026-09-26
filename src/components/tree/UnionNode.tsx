'use client';

import React from 'react';
import { Handle, Position } from '@xyflow/react';

export default function UnionNode() {
  return (
    <div className="relative w-3.5 h-3.5 flex items-center justify-center pointer-events-none select-none">
      <Handle
        type="target"
        position={Position.Left}
        id="union-left"
        className="!w-1.5 !h-1.5 !opacity-0 pointer-events-none"
      />
      <Handle
        type="source"
        position={Position.Right}
        id="union-right"
        className="!w-1.5 !h-1.5 !opacity-0 pointer-events-none"
      />
      <Handle
        type="target"
        position={Position.Top}
        id="union-top"
        className="!w-1.5 !h-1.5 !opacity-0 pointer-events-none"
      />
      <div 
        className="w-3 h-3 rounded-full bg-card border-2 border-rose-500 shadow-xs ring-2 ring-rose-500/25 flex items-center justify-center transition-transform"
        title="Marriage Union"
      >
        <div className="w-1 h-1 rounded-full bg-rose-500" />
      </div>
      <Handle
        type="source"
        position={Position.Bottom}
        id="union-bottom"
        className="!w-1.5 !h-1.5 !bg-primary !border-0 !opacity-0 pointer-events-none"
      />
    </div>
  );
}
