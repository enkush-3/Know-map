import React from 'react';
import { X, AlertCircle, Zap, ArrowRightLeft, ExternalLink, GitBranch } from 'lucide-react';
import { useWorkspaceStore } from '../../../store/useWorkspaceStore';

export const InsightComparisonDrawer: React.FC = () => {
  const activeInsight = useWorkspaceStore((state) => state.activeInsightComparison);
  const closeInsight = useWorkspaceStore((state) => state.closeInsightComparison);
  const workspaces = useWorkspaceStore((state) => state.workspaces);
  const activeWorkspaceId = useWorkspaceStore((state) => state.activeWorkspaceId);
  const setActiveNodeId = useWorkspaceStore((state) => state.setActiveNodeId);

  if (!activeInsight) return null;

  const ws = workspaces[activeWorkspaceId];
  const sourceNode = ws?.nodes[activeInsight.sourceNodeId];
  const targetNode = ws?.nodes[activeInsight.targetNodeId];

  const isContradiction = activeInsight.insightType === 'contradiction';
  const isSynergy = activeInsight.insightType === 'synergy';

  const badgeColor = isContradiction ? '#f59e0b' : isSynergy ? '#a855f7' : '#38bdf8';
  const badgeBg = isContradiction
    ? 'rgba(245, 158, 11, 0.12)'
    : isSynergy
    ? 'rgba(168, 85, 247, 0.12)'
    : 'rgba(56, 189, 248, 0.12)';

  const handleJump = (nodeId: string) => {
    setActiveNodeId(nodeId);
    closeInsight();
  };

  return (
    <div
      style={{
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        maxHeight: '420px',
        background: 'rgba(10, 15, 28, 0.96)',
        backdropFilter: 'blur(20px)',
        borderTop: `2px solid ${badgeColor}`,
        boxShadow: `0 -10px 40px rgba(0, 0, 0, 0.7), 0 0 30px ${isContradiction ? 'rgba(245, 158, 11, 0.2)' : 'rgba(168, 85, 247, 0.2)'}`,
        padding: '16px 24px',
        zIndex: 40,
        overflowY: 'auto',
        animation: 'popoverFadeIn 0.2s cubic-bezier(0.16, 1, 0.3, 1) forwards',
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '4px 10px',
              borderRadius: '9999px',
              background: badgeBg,
              color: badgeColor,
              fontSize: '0.75rem',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.04em',
            }}
          >
            {isContradiction && <AlertCircle size={14} />}
            {isSynergy && <Zap size={14} />}
            {!isContradiction && !isSynergy && <ArrowRightLeft size={14} />}
            <span>Cross-Branch {activeInsight.insightType}</span>
            <span>({Math.round(activeInsight.similarityScore * 100)}% Match)</span>
          </div>

          <h3 style={{ fontSize: '1rem', fontWeight: 600, color: '#f8fafc' }}>
            {activeInsight.title}
          </h3>
        </div>

        <button
          onClick={closeInsight}
          style={{
            background: 'rgba(255, 255, 255, 0.05)',
            border: 'none',
            color: '#94a3b8',
            cursor: 'pointer',
            padding: '6px',
            borderRadius: '6px',
            display: 'flex',
            alignItems: 'center',
          }}
          title="Close drawer"
        >
          <X size={16} />
        </button>
      </div>

      {/* Synthesis description */}
      <div
        style={{
          background: 'rgba(255, 255, 255, 0.03)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: '8px',
          padding: '10px 14px',
          marginBottom: '14px',
          fontSize: '0.85rem',
          lineHeight: 1.55,
          color: '#cbd5e1',
        }}
      >
        <strong style={{ color: badgeColor }}>Autonomous Insight Analysis: </strong>
        {activeInsight.analysis}
      </div>

      {/* Side-by-Side Node Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
        {/* Source Node */}
        <div
          style={{
            background: 'rgba(15, 23, 42, 0.7)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '10px',
            padding: '12px 14px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.725rem', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <GitBranch size={12} /> Branch: <strong>{sourceNode?.branchName || 'Origin'}</strong>
            </span>
            {sourceNode && (
              <button
                onClick={() => handleJump(sourceNode.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  background: 'rgba(56, 189, 248, 0.1)',
                  border: '1px solid rgba(56, 189, 248, 0.25)',
                  borderRadius: '4px',
                  padding: '3px 8px',
                  color: '#38bdf8',
                  fontSize: '0.7rem',
                  cursor: 'pointer',
                }}
              >
                <span>Hop Timeline</span>
                <ExternalLink size={10} />
              </button>
            )}
          </div>
          <p style={{ fontSize: '0.8rem', color: '#cbd5e1', lineHeight: 1.5, maxHeight: '110px', overflowY: 'auto' }}>
            {sourceNode?.rawContent || 'Node content unavailable'}
          </p>
        </div>

        {/* Target Node */}
        <div
          style={{
            background: 'rgba(15, 23, 42, 0.7)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '10px',
            padding: '12px 14px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.725rem', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <GitBranch size={12} /> Branch: <strong>{targetNode?.branchName || 'Target'}</strong>
            </span>
            {targetNode && (
              <button
                onClick={() => handleJump(targetNode.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  background: 'rgba(56, 189, 248, 0.1)',
                  border: '1px solid rgba(56, 189, 248, 0.25)',
                  borderRadius: '4px',
                  padding: '3px 8px',
                  color: '#38bdf8',
                  fontSize: '0.7rem',
                  cursor: 'pointer',
                }}
              >
                <span>Hop Timeline</span>
                <ExternalLink size={10} />
              </button>
            )}
          </div>
          <p style={{ fontSize: '0.8rem', color: '#cbd5e1', lineHeight: 1.5, maxHeight: '110px', overflowY: 'auto' }}>
            {targetNode?.rawContent || 'Node content unavailable'}
          </p>
        </div>
      </div>
    </div>
  );
};
