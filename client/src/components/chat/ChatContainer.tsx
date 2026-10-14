import React, { useRef, useState, useEffect } from 'react';
import { Send, Sparkles, Loader2, GitBranch, Cpu, Compass } from 'lucide-react';
import { useWorkspaceStore } from '../../store/useWorkspaceStore';
import { useTextSelection } from '../../hooks/useTextSelection';
import { MessageItem } from './MessageItem';
import { InlinePromptPopover } from './InlinePromptPopover';
import { ToolExecutionCard } from './ToolExecutionCard';

export const ChatContainer: React.FC = () => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const bottomScrollRef = useRef<HTMLDivElement | null>(null);
  const [linearPrompt, setLinearPrompt] = useState('');

  const activeLineage = useWorkspaceStore((state) => state.activeLineage);
  const isStreaming = useWorkspaceStore((state) => state.isStreaming);
  const streamingStatus = useWorkspaceStore((state) => state.streamingStatus);
  const streamingChunk = useWorkspaceStore((state) => state.streamingChunk);
  const activeToolInvocation = useWorkspaceStore((state) => state.activeToolInvocation);
  const submitLinearPrompt = useWorkspaceStore((state) => state.submitLinearPrompt);
  const activeNodeId = useWorkspaceStore((state) => state.activeNodeId);

  // Bind DOM selection tracking to this scroll container
  useTextSelection(containerRef);

  // Auto-scroll on new message or streaming
  useEffect(() => {
    bottomScrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeLineage.length, streamingChunk]);

  const handleSendLinear = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!linearPrompt.trim() || isStreaming) return;
    const promptToSend = linearPrompt.trim();
    setLinearPrompt('');
    await submitLinearPrompt(promptToSend);
  };

  const handleQuickPrompt = (prompt: string) => {
    setLinearPrompt(prompt);
  };

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        background: 'var(--bg-surface)',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Stream Header */}
      <div
        style={{
          padding: '12px 18px',
          borderBottom: '1px solid var(--border-subtle)',
          background: 'rgba(12, 18, 34, 0.95)',
          backdropFilter: 'blur(10px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexShrink: 0,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div
            style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              background: '#38bdf8',
              boxShadow: '0 0 10px #38bdf8',
            }}
          />
          <h2 style={{ fontSize: '0.875rem', fontWeight: 600, color: '#f8fafc' }}>
            Active Lineage Path <span style={{ color: '#38bdf8', fontFamily: 'var(--font-mono)' }}>P(N)</span>
          </h2>
          <span
            style={{
              fontSize: '0.725rem',
              color: '#94a3b8',
              background: 'rgba(255, 255, 255, 0.05)',
              padding: '2px 8px',
              borderRadius: '9999px',
            }}
          >
            {activeLineage.length} turns in sequence
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.725rem', color: '#64748b' }}>
          <Compass size={13} />
          <span>Showing unique branch ancestors</span>
        </div>
      </div>

      {/* Scrollable Chat Message Stream */}
      <div
        ref={containerRef}
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '18px 20px',
          position: 'relative',
        }}
      >
        {/* Floating selection popover */}
        <InlinePromptPopover />

        {activeLineage.map((node, index) => (
          <MessageItem
            key={node.id}
            node={node}
            isLastInLineage={index === activeLineage.length - 1}
          />
        ))}

        {/* Live streaming status card */}
        {isStreaming && (
          <div
            style={{
              marginBottom: '20px',
              borderRadius: '12px',
              background: 'rgba(17, 26, 46, 0.9)',
              border: '1px solid rgba(56, 189, 248, 0.4)',
              boxShadow: '0 0 25px rgba(56, 189, 248, 0.15)',
              padding: '14px 16px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
              <Loader2 size={16} className="spin" style={{ color: '#38bdf8', animation: 'spin 1s linear infinite' }} />
              <span className="shimmer-text" style={{ fontSize: '0.8rem', fontWeight: 600, color: '#38bdf8' }}>
                {streamingStatus || 'Autonomous Reasoning Pipeline Active...'}
              </span>
            </div>

            {activeToolInvocation && (
              <ToolExecutionCard invocation={activeToolInvocation} />
            )}

            {streamingChunk && (
              <div style={{ fontSize: '0.85rem', lineHeight: 1.6, color: '#cbd5e1' }}>
                {streamingChunk}
              </div>
            )}
          </div>
        )}

        <div ref={bottomScrollRef} />
      </div>

      {/* Suggested Quick Triggers */}
      <div
        style={{
          padding: '6px 16px',
          background: 'rgba(8, 12, 22, 0.95)',
          borderTop: '1px solid var(--border-subtle)',
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          overflowX: 'auto',
          flexShrink: 0,
        }}
      >
        <span style={{ fontSize: '0.675rem', color: '#64748b', whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: '4px' }}>
          <Sparkles size={11} /> Quick explore:
        </span>
        <button
          onClick={() => handleQuickPrompt('Calculate the commit-wait duration if epsilon spikes to 14ms')}
          style={{
            background: 'rgba(56, 189, 248, 0.08)',
            border: '1px solid rgba(56, 189, 248, 0.2)',
            borderRadius: '6px',
            padding: '3px 8px',
            fontSize: '0.7rem',
            color: '#7dd3fc',
            cursor: 'pointer',
            whiteSpace: 'nowrap',
          }}
        >
          [Toolformer] Calculate latency
        </button>
        <button
          onClick={() => handleQuickPrompt('Stress-test fsync crash during WAL sector write')}
          style={{
            background: 'rgba(245, 158, 11, 0.08)',
            border: '1px solid rgba(245, 158, 11, 0.2)',
            borderRadius: '6px',
            padding: '3px 8px',
            fontSize: '0.7rem',
            color: '#fcd34d',
            cursor: 'pointer',
            whiteSpace: 'nowrap',
          }}
        >
          [Contradiction] WAL crash
        </button>
        <button
          onClick={() => handleQuickPrompt('Retrieve recent fallback filings on circuit court doctrines')}
          style={{
            background: 'rgba(244, 63, 94, 0.08)',
            border: '1px solid rgba(244, 63, 94, 0.2)',
            borderRadius: '6px',
            padding: '3px 8px',
            fontSize: '0.7rem',
            color: '#fda4af',
            cursor: 'pointer',
            whiteSpace: 'nowrap',
          }}
        >
          [CRAG] Fallback retrieval
        </button>
      </div>

      {/* Linear Bottom Input Bar */}
      <form
        onSubmit={handleSendLinear}
        style={{
          padding: '12px 16px',
          background: 'rgba(10, 15, 28, 0.98)',
          borderTop: '1px solid var(--border-subtle)',
          display: 'flex',
          gap: '10px',
          alignItems: 'center',
          flexShrink: 0,
        }}
      >
        <div style={{ position: 'relative', flex: 1 }}>
          <input
            type="text"
            value={linearPrompt}
            onChange={(e) => setLinearPrompt(e.target.value)}
            disabled={isStreaming}
            placeholder={`Extend active branch (Parent: Node ${activeNodeId?.slice(-6) || 'current'})...`}
            style={{
              width: '100%',
              background: 'rgba(17, 26, 46, 0.8)',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              borderRadius: '8px',
              padding: '9px 12px',
              color: '#f8fafc',
              fontSize: '0.85rem',
              outline: 'none',
              fontFamily: 'inherit',
            }}
          />
        </div>

        <button
          type="submit"
          disabled={!linearPrompt.trim() || isStreaming}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            background: linearPrompt.trim() && !isStreaming
              ? 'linear-gradient(135deg, #0284c7, #2563eb)'
              : 'rgba(255, 255, 255, 0.08)',
            color: linearPrompt.trim() && !isStreaming ? '#ffffff' : '#64748b',
            border: 'none',
            borderRadius: '8px',
            padding: '9px 14px',
            fontSize: '0.825rem',
            fontWeight: 600,
            cursor: linearPrompt.trim() && !isStreaming ? 'pointer' : 'not-allowed',
            transition: 'all 0.15s ease',
            whiteSpace: 'nowrap',
          }}
        >
          {isStreaming ? (
            <Loader2 size={14} className="spin" style={{ animation: 'spin 1s linear infinite' }} />
          ) : (
            <Send size={14} />
          )}
          <span>Send</span>
        </button>
      </form>
    </div>
  );
};
