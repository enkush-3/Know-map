import React, { useState, useEffect, useRef } from 'react';
import { GitBranch, CornerDownLeft, X, Sparkles } from 'lucide-react';
import { useWorkspaceStore } from '../../store/useWorkspaceStore';

export const InlinePromptPopover: React.FC = () => {
  const selection = useWorkspaceStore((state) => state.selection);
  const clearSelection = useWorkspaceStore((state) => state.clearSelection);
  const submitInlineFork = useWorkspaceStore((state) => state.submitInlineFork);

  const [prompt, setPrompt] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  useEffect(() => {
    if (selection.isActive && textareaRef.current) {
      textareaRef.current.focus();
      setPrompt('');
    }
  }, [selection.isActive, selection.selectedText]);

  if (!selection.isActive || !selection.boundingRect || !selection.messageId) {
    return null;
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      clearSelection();
    } else if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleSubmit = async () => {
    if (!prompt.trim() || !selection.messageId) return;

    const anchorPayload = {
      parentNodeId: selection.messageId,
      selectedText: selection.selectedText,
      startOffset: selection.startOffset,
      endOffset: selection.endOffset,
      contextSnippet: {
        prefix: '',
        suffix: '',
      },
    };

    const userPrompt = prompt.trim();
    setPrompt('');
    await submitInlineFork(selection.messageId, userPrompt, anchorPayload);
  };

  return (
    <div
      className="selection-popover-enter"
      style={{
        position: 'absolute',
        top: `${selection.boundingRect.top}px`,
        left: `${selection.boundingRect.left}px`,
        width: '340px',
        zIndex: 50,
      }}
    >
      <div
        style={{
          background: 'rgba(15, 23, 42, 0.96)',
          backdropFilter: 'blur(16px)',
          border: '1px solid rgba(56, 189, 248, 0.4)',
          boxShadow: '0 12px 36px rgba(0, 0, 0, 0.7), 0 0 24px rgba(56, 189, 248, 0.25)',
          borderRadius: '12px',
          padding: '12px',
        }}
      >
        {/* Quote preview pill */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '8px',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '0.75rem',
              color: '#38bdf8',
              background: 'rgba(56, 189, 248, 0.1)',
              padding: '3px 8px',
              borderRadius: '6px',
              maxWidth: '280px',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            <GitBranch size={12} style={{ flexShrink: 0 }} />
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>
              &ldquo;{selection.selectedText}&rdquo;
            </span>
          </div>

          <button
            onClick={clearSelection}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#94a3b8',
              cursor: 'pointer',
              padding: '2px',
              display: 'flex',
              alignItems: 'center',
            }}
            title="Cancel (Esc)"
          >
            <X size={14} />
          </button>
        </div>

        {/* Dynamic auto-growing textarea */}
        <div style={{ position: 'relative' }}>
          <textarea
            ref={textareaRef}
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Fork inquiry from this highlight... (e.g. explain failure modes, verify proof)"
            rows={2}
            style={{
              width: '100%',
              background: 'rgba(2, 6, 23, 0.7)',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              borderRadius: '8px',
              padding: '8px 10px',
              color: '#f8fafc',
              fontSize: '0.85rem',
              fontFamily: 'inherit',
              resize: 'none',
              outline: 'none',
              lineHeight: 1.4,
            }}
          />
        </div>

        {/* Footer actions */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginTop: '8px',
            paddingTop: '4px',
          }}
        >
          <span style={{ fontSize: '0.7rem', color: '#64748b' }}>
            Enter ↵ to fork • Esc to cancel
          </span>

          <button
            onClick={handleSubmit}
            disabled={!prompt.trim()}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '5px',
              background: prompt.trim()
                ? 'linear-gradient(135deg, #0284c7, #2563eb)'
                : 'rgba(255, 255, 255, 0.08)',
              color: prompt.trim() ? '#ffffff' : '#64748b',
              border: 'none',
              borderRadius: '6px',
              padding: '5px 10px',
              fontSize: '0.75rem',
              fontWeight: 500,
              cursor: prompt.trim() ? 'pointer' : 'not-allowed',
              transition: 'all 0.15s ease',
            }}
          >
            <Sparkles size={12} />
            Fork Branch
            <CornerDownLeft size={10} />
          </button>
        </div>
      </div>
    </div>
  );
};
