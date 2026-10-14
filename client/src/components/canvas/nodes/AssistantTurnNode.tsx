import React, { memo } from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import { Bot, ShieldCheck, AlertTriangle, Globe, Terminal, Sparkles } from 'lucide-react';
import { KnowNode } from '../../../types';
import { useWorkspaceStore } from '../../../store/useWorkspaceStore';

export const AssistantTurnNode = memo(({ id, data }: NodeProps) => {
  const node = (data as any)?.node as KnowNode;
  const isInActiveLineage = (data as any)?.isInActiveLineage as boolean;
  const activeNodeId = useWorkspaceStore((state) => state.activeNodeId);
  const setActiveNodeId = useWorkspaceStore((state) => state.setActiveNodeId);

  if (!node) return null;

  const isSelected = id === activeNodeId;
  const ret = node.retrievalRecord;

  return (
    <div
      onClick={() => setActiveNodeId(node.id)}
      style={{
        width: '340px',
        borderRadius: '10px',
        background: isSelected
          ? 'rgba(18, 28, 50, 0.98)'
          : 'rgba(14, 22, 38, 0.92)',
        backdropFilter: 'blur(12px)',
        border: isSelected
          ? '2px solid #6366f1'
          : isInActiveLineage
          ? '1.5px solid rgba(99, 102, 241, 0.6)'
          : '1px solid rgba(255, 255, 255, 0.1)',
        boxShadow: isSelected
          ? '0 0 25px rgba(99, 102, 241, 0.35)'
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
          background: '#6366f1',
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
              background: '#4f46e5',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Bot size={12} />
          </div>
          <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#e0e7ff' }}>
            Assistant Synthesis
          </span>
          <span style={{ fontSize: '0.675rem', color: '#64748b' }}>
            d={node.depth}
          </span>
        </div>

        {isInActiveLineage && (
          <span
            style={{
              fontSize: '0.65rem',
              color: '#818cf8',
              background: 'rgba(99, 102, 241, 0.15)',
              padding: '1px 6px',
              borderRadius: '9999px',
              fontWeight: 500,
            }}
          >
            Active Path
          </span>
        )}
      </div>

      {/* Meta tags: CRAG & Tools */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px', marginBottom: '8px' }}>
        {ret && (
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              fontSize: '0.675rem',
              fontWeight: 600,
              padding: '2px 6px',
              borderRadius: '4px',
              background:
                ret.evaluationStatus === 'correct'
                  ? 'rgba(16, 185, 129, 0.12)'
                  : ret.evaluationStatus === 'ambiguous'
                  ? 'rgba(245, 158, 11, 0.12)'
                  : 'rgba(244, 63, 94, 0.12)',
              color:
                ret.evaluationStatus === 'correct'
                  ? '#10b981'
                  : ret.evaluationStatus === 'ambiguous'
                  ? '#f59e0b'
                  : '#f43f5e',
              border: `1px solid ${
                ret.evaluationStatus === 'correct'
                  ? 'rgba(16, 185, 129, 0.3)'
                  : ret.evaluationStatus === 'ambiguous'
                  ? 'rgba(245, 158, 11, 0.3)'
                  : 'rgba(244, 63, 94, 0.3)'
              }`,
            }}
          >
            {ret.evaluationStatus === 'correct' && <ShieldCheck size={11} />}
            {ret.evaluationStatus === 'ambiguous' && <AlertTriangle size={11} />}
            {ret.evaluationStatus === 'incorrect' && <Globe size={11} />}
            <span>CRAG {ret.evaluationStatus}</span>
          </span>
        )}

        {node.toolInvocations?.map((tool) => (
          <span
            key={tool.id}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '3px',
              fontSize: '0.675rem',
              fontFamily: 'var(--font-mono)',
              padding: '2px 6px',
              borderRadius: '4px',
              background: 'rgba(56, 189, 248, 0.1)',
              color: '#38bdf8',
              border: '1px solid rgba(56, 189, 248, 0.25)',
            }}
          >
            <Terminal size={10} />
            <span>{tool.toolName}</span>
          </span>
        ))}

        {node.ghostNodes && node.ghostNodes.length > 0 && (
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '3px',
              fontSize: '0.65rem',
              padding: '2px 6px',
              borderRadius: '4px',
              background: 'rgba(168, 85, 247, 0.1)',
              color: '#c084fc',
              border: '1px solid rgba(168, 85, 247, 0.25)',
            }}
          >
            <Sparkles size={10} />
            <span>{node.ghostNodes.length} Horizons</span>
          </span>
        )}
      </div>

      {/* Excerpt */}
      <p
        style={{
          fontSize: '0.785rem',
          color: '#cbd5e1',
          lineHeight: 1.45,
          display: '-webkit-box',
          WebkitLineClamp: 4,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden',
        }}
      >
        {node.rawContent.replace(/[#*`>]/g, '')}
      </p>

      <Handle
        type="source"
        position={Position.Right}
        style={{
          background: '#6366f1',
          width: '8px',
          height: '8px',
          border: '2px solid #0f172a',
        }}
      />
    </div>
  );
});

AssistantTurnNode.displayName = 'AssistantTurnNode';
