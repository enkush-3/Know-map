import React, { useState } from 'react';
import { 
  Bot, 
  User, 
  GitBranch, 
  Focus, 
  Sparkles, 
  FileText, 
  Archive,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { KnowNode } from '../../types';
import { CragVerificationBadge } from './CragVerificationBadge';
import { ToolExecutionCard } from './ToolExecutionCard';
import { useWorkspaceStore } from '../../store/useWorkspaceStore';

interface Props {
  node: KnowNode;
  isLastInLineage?: boolean;
}

export const MessageItem: React.FC<Props> = ({ node }) => {
  const [showFullCompressed, setShowFullCompressed] = useState(false);
  const setActiveNodeId = useWorkspaceStore((state) => state.setActiveNodeId);
  const activeNodeId = useWorkspaceStore((state) => state.activeNodeId);
  const materializeGhostNode = useWorkspaceStore((state) => state.materializeGhostNode);

  const isUser = node.role === 'user';
  const isSelected = node.id === activeNodeId;

  // Format simple markdown into paragraphs and blocks
  const renderFormattedContent = (text: string) => {
    // Strip [TOOL:...] and [RESULT:...] if tool cards are shown
    const cleanText = text.replace(/\[TOOL:.*?\]\s*(\[RESULT:.*?\])?/g, '').trim();

    const lines = cleanText.split('\n');
    return lines.map((line, idx) => {
      if (line.startsWith('### ')) {
        return <h3 key={idx} style={{ fontSize: '1rem', fontWeight: 600, color: '#f8fafc', marginTop: '10px', marginBottom: '6px' }}>{line.replace('### ', '')}</h3>;
      }
      if (line.startsWith('#### ')) {
        return <h4 key={idx} style={{ fontSize: '0.9rem', fontWeight: 600, color: '#38bdf8', marginTop: '8px', marginBottom: '4px' }}>{line.replace('#### ', '')}</h4>;
      }
      if (line.startsWith('> ')) {
        return (
          <blockquote key={idx} style={{ borderLeft: '3px solid #38bdf8', background: 'rgba(56, 189, 248, 0.08)', padding: '6px 10px', borderRadius: '0 6px 6px 0', margin: '6px 0', fontSize: '0.825rem', color: '#93c5fd' }}>
            {line.replace('> ', '')}
          </blockquote>
        );
      }
      if (line.trim().startsWith('- ') || line.trim().startsWith('* ')) {
        return (
          <li key={idx} style={{ marginLeft: '1.2rem', marginBottom: '4px', fontSize: '0.85rem', color: '#cbd5e1' }}>
            {line.trim().substring(2)}
          </li>
        );
      }
      if (line.trim() === '') {
        return <div key={idx} style={{ height: '6px' }} />;
      }
      return (
        <p key={idx} style={{ marginBottom: '6px', fontSize: '0.865rem', lineHeight: 1.6, color: '#cbd5e1' }}>
          {line}
        </p>
      );
    });
  };

  return (
    <div
      style={{
        marginBottom: '20px',
        borderRadius: '12px',
        background: isUser ? 'rgba(15, 23, 42, 0.6)' : 'rgba(17, 26, 46, 0.75)',
        border: isSelected
          ? '1px solid rgba(56, 189, 248, 0.5)'
          : '1px solid rgba(255, 255, 255, 0.07)',
        boxShadow: isSelected
          ? '0 0 20px rgba(56, 189, 248, 0.15)'
          : '0 4px 16px rgba(0, 0, 0, 0.25)',
        padding: '14px 16px',
        transition: 'all 0.2s ease',
      }}
    >
      {/* Header bar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '10px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div
            style={{
              width: '26px',
              height: '26px',
              borderRadius: '6px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: isUser
                ? 'linear-gradient(135deg, #0284c7, #0369a1)'
                : 'linear-gradient(135deg, #6366f1, #4f46e5)',
              color: '#ffffff',
            }}
          >
            {isUser ? <User size={14} /> : <Bot size={14} />}
          </div>

          <span style={{ fontSize: '0.825rem', fontWeight: 600, color: '#f8fafc' }}>
            {isUser ? 'Inquiry Turn' : 'Assistant Synthesis'}
          </span>

          <span
            style={{
              fontSize: '0.7rem',
              color: '#64748b',
              background: 'rgba(255, 255, 255, 0.05)',
              padding: '2px 6px',
              borderRadius: '4px',
              fontFamily: 'var(--font-mono)',
            }}
          >
            Depth {node.depth}
          </span>

          {node.branchName && (
            <span
              style={{
                fontSize: '0.7rem',
                color: '#38bdf8',
                background: 'rgba(56, 189, 248, 0.1)',
                padding: '2px 6px',
                borderRadius: '4px',
              }}
            >
              {node.branchName}
            </span>
          )}
        </div>

        {/* Action icons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <button
            onClick={() => setActiveNodeId(node.id)}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#94a3b8',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              fontSize: '0.725rem',
              padding: '3px 6px',
              borderRadius: '4px',
            }}
            title="Focus camera on this node in DAG canvas"
          >
            <Focus size={12} />
            <span>Pan Canvas</span>
          </button>
        </div>
      </div>

      {/* Quote anchor pill if forked from selection */}
      {node.selectionAnchor && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            background: 'rgba(56, 189, 248, 0.12)',
            border: '1px solid rgba(56, 189, 248, 0.3)',
            borderRadius: '6px',
            padding: '6px 10px',
            marginBottom: '10px',
            fontSize: '0.75rem',
            color: '#38bdf8',
          }}
        >
          <GitBranch size={13} style={{ flexShrink: 0 }} />
          <span>
            <strong>Focused Anchor:</strong> &ldquo;{node.selectionAnchor.selectedText}&rdquo;
          </span>
        </div>
      )}

      {/* Feature 4: Compressed Leaf Summary view */}
      {node.isCompressed && node.compression ? (
        <div
          style={{
            background: 'rgba(245, 158, 11, 0.06)',
            border: '1px solid rgba(245, 158, 11, 0.25)',
            borderRadius: '8px',
            padding: '10px 12px',
            marginBottom: '10px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#f59e0b', fontSize: '0.75rem', fontWeight: 600 }}>
              <Archive size={13} />
              <span>Compressed Ancestor Summary (Token Optimization)</span>
            </div>
            <button
              onClick={() => setShowFullCompressed(!showFullCompressed)}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#f59e0b',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '2px',
                fontSize: '0.7rem',
              }}
            >
              {showFullCompressed ? 'Hide Details' : 'View Full Content'}
              {showFullCompressed ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
            </button>
          </div>

          <p style={{ fontSize: '0.825rem', color: '#fde68a', lineHeight: 1.5 }}>
            {node.compression.summaryContent}
          </p>

          {showFullCompressed && (
            <div style={{ marginTop: '10px', paddingTop: '10px', borderTop: '1px dashed rgba(245, 158, 11, 0.2)' }}>
              {renderFormattedContent(node.rawContent)}
            </div>
          )}
        </div>
      ) : (
        /* Regular content container with text-selection capture enabled */
        <div
          data-selectable-message={!isUser ? 'true' : 'false'}
          data-message-id={node.id}
          style={{
            userSelect: 'text',
            cursor: !isUser ? 'text' : 'default',
          }}
        >
          {renderFormattedContent(node.rawContent)}
        </div>
      )}

      {/* Inline Tool Execution Cards */}
      {node.toolInvocations && node.toolInvocations.length > 0 && (
        <div style={{ marginTop: '8px' }}>
          {node.toolInvocations.map((inv) => (
            <ToolExecutionCard key={inv.id} invocation={inv} />
          ))}
        </div>
      )}

      {/* CRAG Verification Badge */}
      {node.retrievalRecord && (
        <CragVerificationBadge retrievalRecord={node.retrievalRecord} />
      )}

      {/* Predictive Ghost Nodes Horizons if available */}
      {!isUser && node.ghostNodes && node.ghostNodes.length > 0 && (
        <div
          style={{
            marginTop: '12px',
            paddingTop: '10px',
            borderTop: '1px solid rgba(255, 255, 255, 0.08)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.725rem', color: '#a855f7', fontWeight: 600, marginBottom: '6px' }}>
            <Sparkles size={12} />
            <span>AI Horizon Predictive Vectors (Ready to Fork):</span>
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
            {node.ghostNodes.map((ghost) => (
              <button
                key={ghost.id}
                onClick={() => materializeGhostNode(ghost.id)}
                disabled={ghost.isMaterialized}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px',
                  background: ghost.isMaterialized
                    ? 'rgba(255, 255, 255, 0.04)'
                    : 'rgba(168, 85, 247, 0.1)',
                  border: ghost.isMaterialized
                    ? '1px dashed rgba(255, 255, 255, 0.1)'
                    : '1px dashed rgba(168, 85, 247, 0.4)',
                  borderRadius: '6px',
                  padding: '4px 8px',
                  color: ghost.isMaterialized ? '#64748b' : '#c084fc',
                  fontSize: '0.725rem',
                  cursor: ghost.isMaterialized ? 'default' : 'pointer',
                  transition: 'all 0.15s ease',
                }}
                title={ghost.suggestedPrompt}
              >
                <GitBranch size={11} />
                <span>{ghost.label}</span>
                {ghost.isMaterialized && <span style={{ fontSize: '0.65rem' }}>✓ Forked</span>}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Highlight tip for users */}
      {!isUser && (
        <div style={{ marginTop: '10px', fontSize: '0.675rem', color: '#64748b', display: 'flex', alignItems: 'center', gap: '4px' }}>
          <FileText size={11} />
          <span>Tip: Highlight any text in this response to fork a focused branch inquiry.</span>
        </div>
      )}
    </div>
  );
};
