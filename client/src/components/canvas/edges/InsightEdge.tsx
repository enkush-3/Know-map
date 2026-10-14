import React from 'react';
import { EdgeProps, getBezierPath, BaseEdge, EdgeLabelRenderer } from '@xyflow/react';
import { AlertCircle, Zap, ArrowRightLeft } from 'lucide-react';
import { InsightEdgeData } from '../../../types';
import { useWorkspaceStore } from '../../../store/useWorkspaceStore';

export const InsightEdge: React.FC<EdgeProps> = ({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  data,
}) => {
  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  const insight = (data as any)?.insight as InsightEdgeData;
  const openInsightComparison = useWorkspaceStore((state) => state.openInsightComparison);

  if (!insight) {
    return <BaseEdge id={id} path={edgePath} style={{ stroke: '#f59e0b', strokeDasharray: '5,5' }} />;
  }

  const isContradiction = insight.insightType === 'contradiction';
  const isSynergy = insight.insightType === 'synergy';

  const badgeColor = isContradiction ? '#f59e0b' : isSynergy ? '#a855f7' : '#38bdf8';
  const badgeBg = isContradiction
    ? 'rgba(245, 158, 11, 0.15)'
    : isSynergy
    ? 'rgba(168, 85, 247, 0.15)'
    : 'rgba(56, 189, 248, 0.15)';
  const badgeBorder = isContradiction
    ? 'rgba(245, 158, 11, 0.4)'
    : isSynergy
    ? 'rgba(168, 85, 247, 0.4)'
    : 'rgba(56, 189, 248, 0.4)';

  const splineClass = isContradiction
    ? 'insight-spline-contradiction'
    : isSynergy
    ? 'insight-spline-synergy'
    : 'insight-spline-dependency';

  return (
    <>
      <BaseEdge
        id={id}
        path={edgePath}
        className={splineClass}
        style={{
          strokeWidth: 2,
        }}
      />
      <EdgeLabelRenderer>
        <div
          style={{
            position: 'absolute',
            transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
            pointerEvents: 'all',
            zIndex: 10,
          }}
        >
          <button
            onClick={() => openInsightComparison(insight)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              background: badgeBg,
              backdropFilter: 'blur(8px)',
              border: `1px solid ${badgeBorder}`,
              borderRadius: '9999px',
              padding: '3px 8px',
              color: badgeColor,
              fontSize: '0.675rem',
              fontWeight: 600,
              cursor: 'pointer',
              boxShadow: `0 2px 10px rgba(0, 0, 0, 0.5)`,
              transition: 'transform 0.15s ease',
            }}
            title="Click to open cross-branch semantic comparison drawer"
          >
            {isContradiction && <AlertCircle size={11} />}
            {isSynergy && <Zap size={11} />}
            {!isContradiction && !isSynergy && <ArrowRightLeft size={11} />}
            <span>
              {isContradiction ? 'Contradiction' : isSynergy ? 'Synergy' : 'Cross Insight'} (
              {Math.round(insight.similarityScore * 100)}%)
            </span>
          </button>
        </div>
      </EdgeLabelRenderer>
    </>
  );
};
