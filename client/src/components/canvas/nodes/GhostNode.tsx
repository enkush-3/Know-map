import React, { memo } from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import { Sparkles, GitBranch, ArrowRight, ShieldAlert, Cpu, Share2 } from 'lucide-react';
import { GhostNodeData } from '../../../types';
import { useWorkspaceStore } from '../../../store/useWorkspaceStore';

export const GhostNode = memo(({ data }: NodeProps) => {
  const ghost = (data as any)?.ghost as GhostNodeData;
  const materializeGhostNode = useWorkspaceStore((state) => state.materializeGhostNode);

  if (!ghost) return null;

  const getVectorDetails = (type: string) => {
    switch (type) {
      case 'critical_counter':
        return { label: 'Critical Counter', color: '#f43f5e', icon: ShieldAlert };
      case 'mechanistic_deepdive':
        return { label: 'Mechanistic Deepdive', color: '#38bdf8', icon: Cpu };
      case 'adjacent_transfer':
        return { label: 'Adjacent Transfer', color: '#a855f7', icon: Share2 };
      default:
        return { label: 'Horizon Vector', color: '#a855f7', icon: Sparkles };
    }
  };

  const vector = getVectorDetails(ghost.vectorType);
  const Icon = vector.icon;

  return (
    <div
      onClick={() => !ghost.isMaterialized && materializeGhostNode(ghost.id)}
      style={{
        width: '260px',
        borderRadius: '8px',
        background: 'rgba(168, 85, 247, 0.06)',
        backdropFilter: 'blur(8px)',
        border: ghost.isMaterialized
          ? '1px dashed rgba(255, 255, 255, 0.15)'
          : '1.5px dashed rgba(168, 85, 247, 0.5)',
        boxShadow: ghost.isMaterialized ? 'none' : '0 4px 20px rgba(168, 85, 247, 0.15)',
        padding: '10px 12px',
        cursor: ghost.isMaterialized ? 'default' : 'pointer',
        transition: 'all 0.2s ease',
        opacity: ghost.isMaterialized ? 0.45 : 0.95,
      }}
    >
      <Handle
        type="target"
        position={Position.Left}
        style={{
          background: '#a855f7',
          width: '6px',
          height: '6px',
          border: '1px solid #0f172a',
        }}
      />

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
          <Icon size={12} style={{ color: vector.color }} />
          <span style={{ fontSize: '0.675rem', fontWeight: 600, color: vector.color }}>
            {vector.label}
          </span>
        </div>

        <span
          style={{
            fontSize: '0.625rem',
            color: '#a855f7',
            background: 'rgba(168, 85, 247, 0.15)',
            padding: '1px 5px',
            borderRadius: '4px',
          }}
        >
          {ghost.isMaterialized ? 'Materialized' : 'Ghost Horizon'}
        </span>
      </div>

      {/* Ghost title */}
      <h5
        style={{
          fontSize: '0.785rem',
          fontWeight: 600,
          color: '#f8fafc',
          marginBottom: '4px',
        }}
      >
        {ghost.label}
      </h5>

      {/* Suggested prompt preview */}
      <p
        style={{
          fontSize: '0.725rem',
          color: '#cbd5e1',
          lineHeight: 1.4,
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden',
          marginBottom: '8px',
        }}
      >
        {ghost.suggestedPrompt}
      </p>

      {/* Action */}
      {!ghost.isMaterialized && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end',
            gap: '4px',
            fontSize: '0.675rem',
            color: '#c084fc',
            fontWeight: 600,
          }}
        >
          <GitBranch size={11} />
          <span>Click to Materialize</span>
          <ArrowRight size={10} />
        </div>
      )}
    </div>
  );
});

GhostNode.displayName = 'GhostNode';
