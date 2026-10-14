import React, { memo } from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import { User, GitBranch } from 'lucide-react';
import { KnowNode } from '../../../types';
import { useWorkspaceStore } from '../../../store/useWorkspaceStore';

export const UserTurnNode = memo(({ id, data }: NodeProps) => {
  const node = (data as any)?.node as KnowNode;
  const isInActiveLineage = (data as any)?.isInActiveLineage as boolean;
  const activeNodeId = useWorkspaceStore((state) => state.activeNodeId);
  const setActiveNodeId = useWorkspaceStore((state) => state.setActiveNodeId);

  if (!node) return null;

  const isSelected = id === activeNodeId;

  return (
    <div
      onClick={() => setActiveNodeId(node.id)}
      style={{
        width: '320px',
        borderRadius: '10px',
        background: isSelected
          ? 'rgba(15, 23, 42, 0.98)'
          : 'rgba(12, 18, 34, 0.92)',
        backdropFilter: 'blur(12px)',
        border: isSelected
          ? '2px solid #38bdf8'
          : isInActiveLineage
          ? '1.5px solid rgba(56, 189, 248, 0.6)'
          : '1px solid rgba(255, 255, 255, 0.1)',
        boxShadow: isSelected
          ? '0 0 25px rgba(56, 189, 248, 0.35)'
          : '0 8px 24px rgba(0, 0, 0, 0.4)',
        padding: '12px',
        cursor: 'pointer',
        transition: 'all 0.2s ease',
      }}
    >
      <Handle
        type="target"
        position={Position.Left}
        style={{
          background: '#38bdf8',
          width: '8px',
          height: '8px',
          border: '2px solid #0f172a',
        }}
      />

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <div
            style={{
              width: '20px',
              height: '20px',
              borderRadius: '4px',
              background: '#0284c7',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <User size={12} />
          </div>
          <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#38bdf8' }}>
            User Inquiry
          </span>
          <span style={{ fontSize: '0.675rem', color: '#64748b' }}>
            d={node.depth}
          </span>
        </div>

        {isInActiveLineage && (
          <span
            style={{
              fontSize: '0.65rem',
              color: '#38bdf8',
              background: 'rgba(56, 189, 248, 0.15)',
              padding: '1px 6px',
              borderRadius: '9999px',
              fontWeight: 500,
            }}
          >
            Active Path
          </span>
        )}
      </div>

      {/* Focused Anchor Quote if forked */}
      {node.selectionAnchor && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '5px',
            fontSize: '0.7rem',
            color: '#7dd3fc',
            background: 'rgba(56, 189, 248, 0.08)',
            padding: '3px 6px',
            borderRadius: '4px',
            marginBottom: '6px',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          <GitBranch size={11} style={{ flexShrink: 0 }} />
          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>
            Anchor: &ldquo;{node.selectionAnchor.selectedText}&rdquo;
          </span>
        </div>
      )}

      {/* Prompt preview */}
      <p
        style={{
          fontSize: '0.785rem',
          color: '#e2e8f0',
          lineHeight: 1.45,
          display: '-webkit-box',
          WebkitLineClamp: 3,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden',
        }}
      >
        {node.rawContent}
      </p>

      <Handle
        type="source"
        position={Position.Right}
        style={{
          background: '#38bdf8',
          width: '8px',
          height: '8px',
          border: '2px solid #0f172a',
        }}
      />
    </div>
  );
});

UserTurnNode.displayName = 'UserTurnNode';
