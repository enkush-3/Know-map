import React from 'react';
import { EdgeProps, getBezierPath, BaseEdge } from '@xyflow/react';

export const LineageEdge: React.FC<EdgeProps> = ({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style = {},
  data,
}) => {
  const [edgePath] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  const isInActiveLineage = (data as any)?.isInActiveLineage as boolean;

  const edgeStyle = isInActiveLineage
    ? {
        ...style,
        stroke: '#38bdf8',
        strokeWidth: 2.5,
        filter: 'drop-shadow(0 0 4px rgba(56, 189, 248, 0.6))',
      }
    : {
        ...style,
        stroke: '#475569',
        strokeWidth: 1.2,
      };

  return <BaseEdge id={id} path={edgePath} style={edgeStyle} />;
};
