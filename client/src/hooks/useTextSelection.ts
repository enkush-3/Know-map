import { useEffect, useRef } from 'react';
import { useWorkspaceStore } from '../store/useWorkspaceStore';

export function useTextSelection(containerRef: React.RefObject<HTMLDivElement | null>) {
  const setSelection = useWorkspaceStore((state) => state.setSelection);
  const clearSelection = useWorkspaceStore((state) => state.clearSelection);
  const debounceTimerRef = useRef<number | null>(null);

  useEffect(() => {
    const handleSelectionChange = () => {
      if (debounceTimerRef.current) {
        window.clearTimeout(debounceTimerRef.current);
      }

      debounceTimerRef.current = window.setTimeout(() => {
        const domSelection = window.getSelection();
        if (!domSelection || domSelection.isCollapsed || !domSelection.rangeCount) {
          return;
        }

        const range = domSelection.getRangeAt(0);
        const selectedText = domSelection.toString().trim();

        if (!selectedText || selectedText.length < 3) {
          return;
        }

        // Verify selection is within container
        const container = containerRef.current;
        if (!container || !container.contains(range.commonAncestorContainer)) {
          return;
        }

        // Check if within selectable message element
        const anchorNode = range.startContainer.nodeType === Node.ELEMENT_NODE
          ? (range.startContainer as HTMLElement)
          : range.startContainer.parentElement;

        const selectableElement = anchorNode?.closest('[data-selectable-message="true"]') as HTMLElement | null;
        if (!selectableElement) {
          return;
        }

        const messageId = selectableElement.getAttribute('data-message-id');
        if (!messageId) return;

        // Calculate normalized bounding rect relative to scroll container
        const rect = range.getBoundingClientRect();
        const containerRect = container.getBoundingClientRect();

        // Calculate character offsets within message text
        const fullMessageText = selectableElement.textContent || '';
        const startOffset = Math.max(0, fullMessageText.indexOf(selectedText));
        const endOffset = startOffset + selectedText.length;

        // Extract 32-char prefix/suffix
        const prefix = fullMessageText.slice(Math.max(0, startOffset - 32), startOffset);
        const suffix = fullMessageText.slice(endOffset, Math.min(fullMessageText.length, endOffset + 32));

        const relativeTop = rect.bottom - containerRect.top + container.scrollTop + 8;
        const popoverWidth = 320;
        const relativeLeft = Math.max(
          16,
          Math.min(
            rect.left - containerRect.left + rect.width / 2 - popoverWidth / 2,
            containerRect.width - popoverWidth - 16
          )
        );

        setSelection({
          isActive: true,
          messageId,
          selectedText,
          startOffset,
          endOffset,
          boundingRect: {
            top: relativeTop,
            left: relativeLeft,
            bottom: rect.bottom,
            right: rect.right,
            width: rect.width,
          },
        });
      }, 50);
    };

    document.addEventListener('selectionchange', handleSelectionChange);

    return () => {
      document.removeEventListener('selectionchange', handleSelectionChange);
      if (debounceTimerRef.current) {
        window.clearTimeout(debounceTimerRef.current);
      }
    };
  }, [containerRef, setSelection, clearSelection]);
}
