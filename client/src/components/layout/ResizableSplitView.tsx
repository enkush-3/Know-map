import React, { useState, useRef, useEffect, useCallback } from 'react';
import { GripVertical, PanelLeftClose, PanelLeftOpen } from 'lucide-react';
import { useWorkspaceStore } from '../../store/useWorkspaceStore';

interface Props {
  leftPane: React.ReactNode;
  rightPane: React.ReactNode;
}

export const ResizableSplitView: React.FC<Props> = ({ leftPane, rightPane }) => {
  const isCanvasFullscreen = useWorkspaceStore((state) => state.isCanvasFullscreen);
  const [leftWidthPercent, setLeftWidthPercent] = useState(42);
  const [isLeftCollapsed, setIsLeftCollapsed] = useState(false);
  const isDraggingRef = useRef(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    isDraggingRef.current = true;
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
  };

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDraggingRef.current || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const newWidth = ((e.clientX - rect.left) / rect.width) * 100;

    // Enforce limits (25% to 70%)
    if (newWidth >= 25 && newWidth <= 70) {
      setLeftWidthPercent(newWidth);
    }
  }, []);

  const handleMouseUp = useCallback(() => {
    if (isDraggingRef.current) {
      isDraggingRef.current = false;
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    }
  }, []);

  useEffect(() => {
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [handleMouseMove, handleMouseUp]);

  if (isCanvasFullscreen) {
    return (
      <div style={{ flex: 1, width: '100%', height: '100%', position: 'relative' }}>
        {rightPane}
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      style={{
        flex: 1,
        width: '100%',
        height: 'calc(100vh - 56px)',
        display: 'flex',
        overflow: 'hidden',
        position: 'relative',
      }}
    >
      {/* Left Pane (Chat Stream) */}
      {!isLeftCollapsed && (
        <div
          style={{
            width: `${leftWidthPercent}%`,
            minWidth: '320px',
            height: '100%',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            borderRight: '1px solid var(--border-subtle)',
          }}
        >
          {leftPane}
        </div>
      )}

      {/* Resizable Divider Handle */}
      {!isLeftCollapsed && (
        <div
          onMouseDown={handleMouseDown}
          style={{
            width: '8px',
            height: '100%',
            background: 'rgba(8, 12, 22, 0.9)',
            cursor: 'col-resize',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 25,
            transition: 'background 0.15s ease',
            userSelect: 'none',
          }}
          className="resize-divider"
        >
          <GripVertical size={12} style={{ color: '#475569' }} />
        </div>
      )}

      {/* Collapse Toggle Button */}
      <button
        onClick={() => setIsLeftCollapsed(!isLeftCollapsed)}
        style={{
          position: 'absolute',
          top: '12px',
          left: isLeftCollapsed ? '12px' : `calc(${leftWidthPercent}% + 12px)`,
          zIndex: 30,
          background: 'rgba(17, 26, 46, 0.9)',
          backdropFilter: 'blur(8px)',
          border: '1px solid var(--border-card)',
          borderRadius: '6px',
          padding: '5px',
          color: '#cbd5e1',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 4px 15px rgba(0, 0, 0, 0.5)',
          transition: 'left 0.15s ease',
        }}
        title={isLeftCollapsed ? 'Expand Chat Timeline' : 'Collapse Chat Timeline'}
      >
        {isLeftCollapsed ? <PanelLeftOpen size={14} /> : <PanelLeftClose size={14} />}
      </button>

      {/* Right Pane (Knowledge Graph Canvas) */}
      <div
        style={{
          flex: 1,
          height: '100%',
          overflow: 'hidden',
          position: 'relative',
        }}
      >
        {rightPane}
      </div>
    </div>
  );
};
