import React, { useState } from 'react';
import { 
  Network, 
  ChevronDown, 
  Download, 
  Upload, 
  HelpCircle, 
  Activity, 
  Layers, 
  Sparkles,
  Database,
  Cpu
} from 'lucide-react';
import { useWorkspaceStore } from '../../store/useWorkspaceStore';

export const WorkspaceHeader: React.FC = () => {
  const workspaces = useWorkspaceStore((state) => state.workspaces);
  const activeWorkspaceId = useWorkspaceStore((state) => state.activeWorkspaceId);
  const switchWorkspace = useWorkspaceStore((state) => state.switchWorkspace);
  const activeLineage = useWorkspaceStore((state) => state.activeLineage);
  const exportWorkspaceJSON = useWorkspaceStore((state) => state.exportWorkspaceJSON);
  const importWorkspaceJSON = useWorkspaceStore((state) => state.importWorkspaceJSON);

  const [showDomainDropdown, setShowDomainDropdown] = useState(false);
  const [showHelpModal, setShowHelpModal] = useState(false);

  const currentWorkspace = workspaces[activeWorkspaceId];

  // Calculate total tokens in active lineage
  const lineageTokens = activeLineage.reduce((sum, n) => sum + (n.tokenCount || 0), 0);

  const handleExport = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(exportWorkspaceJSON());
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `${currentWorkspace?.id || 'know-map'}-export.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handleImport = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'application/json';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (re) => {
          const content = re.target?.result as string;
          const success = importWorkspaceJSON(content);
          if (success) {
            alert('Workspace imported successfully!');
          } else {
            alert('Invalid Know map workspace file.');
          }
        };
        reader.readAsText(file);
      }
    };
    input.click();
  };

  return (
    <header
      style={{
        height: '56px',
        background: 'rgba(8, 12, 22, 0.98)',
        borderBottom: '1px solid var(--border-subtle)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 20px',
        flexShrink: 0,
        zIndex: 30,
      }}
    >
      {/* Brand & Domain Picker */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '9px' }}>
          <div
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '8px',
              background: 'linear-gradient(135deg, #0284c7, #6366f1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 0 15px rgba(56, 189, 248, 0.4)',
            }}
          >
            <Network size={18} color="#ffffff" />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '1rem', fontWeight: 800, letterSpacing: '-0.02em', color: '#ffffff' }}>
                Know<span style={{ color: '#38bdf8' }}> map</span>
              </span>
              <span
                style={{
                  fontSize: '0.625rem',
                  fontWeight: 700,
                  background: 'rgba(56, 189, 248, 0.15)',
                  color: '#38bdf8',
                  padding: '1px 5px',
                  borderRadius: '4px',
                  letterSpacing: '0.04em',
                }}
              >
                v2.0 DAG
              </span>
            </div>
          </div>
        </div>

        <div style={{ height: '22px', width: '1px', background: 'var(--border-subtle)' }} />

        {/* Domain Switcher */}
        <div style={{ position: 'relative' }}>
          <button
            onClick={() => setShowDomainDropdown(!showDomainDropdown)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              background: 'rgba(17, 26, 46, 0.8)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '8px',
              padding: '6px 12px',
              color: '#f8fafc',
              fontSize: '0.8rem',
              fontWeight: 500,
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
          >
            <Database size={13} style={{ color: '#38bdf8' }} />
            <span style={{ maxWidth: '260px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {currentWorkspace?.title || 'Select Domain'}
            </span>
            <ChevronDown size={13} style={{ color: '#94a3b8' }} />
          </button>

          {showDomainDropdown && (
            <div
              style={{
                position: 'absolute',
                top: 'calc(100% + 6px)',
                left: 0,
                width: '360px',
                background: 'rgba(11, 16, 30, 0.98)',
                backdropFilter: 'blur(20px)',
                border: '1px solid var(--border-card)',
                borderRadius: '10px',
                boxShadow: '0 10px 35px rgba(0, 0, 0, 0.7)',
                padding: '6px',
                zIndex: 60,
              }}
            >
              <div style={{ padding: '6px 8px', fontSize: '0.7rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>
                Pre-Loaded Research Domains
              </div>
              {Object.values(workspaces).map((ws) => (
                <div
                  key={ws.id}
                  onClick={() => {
                    switchWorkspace(ws.id);
                    setShowDomainDropdown(false);
                  }}
                  style={{
                    padding: '8px 10px',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    background: ws.id === activeWorkspaceId ? 'rgba(56, 189, 248, 0.12)' : 'transparent',
                    border: ws.id === activeWorkspaceId ? '1px solid rgba(56, 189, 248, 0.25)' : '1px solid transparent',
                    marginBottom: '4px',
                  }}
                >
                  <div style={{ fontSize: '0.8rem', fontWeight: 600, color: ws.id === activeWorkspaceId ? '#38bdf8' : '#f8fafc' }}>
                    {ws.title}
                  </div>
                  <div style={{ fontSize: '0.725rem', color: '#94a3b8', marginTop: '2px', lineHeight: 1.3 }}>
                    {ws.description}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Center Engine Badges */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '5px',
            background: 'rgba(16, 185, 129, 0.1)',
            border: '1px solid rgba(16, 185, 129, 0.25)',
            borderRadius: '6px',
            padding: '3px 8px',
            fontSize: '0.7rem',
            color: '#34d399',
            fontWeight: 500,
          }}
          title="Active retrieval & tool validation enabled"
        >
          <Activity size={11} />
          <span>FLARE & CRAG Online</span>
        </div>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '5px',
            background: 'rgba(56, 189, 248, 0.08)',
            border: '1px solid rgba(56, 189, 248, 0.2)',
            borderRadius: '6px',
            padding: '3px 8px',
            fontSize: '0.7rem',
            color: '#7dd3fc',
          }}
        >
          <Cpu size={11} />
          <span>Toolformer Autonomous</span>
        </div>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '5px',
            background: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid var(--border-subtle)',
            borderRadius: '6px',
            padding: '3px 8px',
            fontSize: '0.7rem',
            color: '#cbd5e1',
          }}
        >
          <Layers size={11} />
          <span>Lineage Tokens: <strong>{lineageTokens}</strong></span>
        </div>
      </div>

      {/* Header Actions */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <button
          onClick={handleExport}
          style={{
            background: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid var(--border-subtle)',
            borderRadius: '6px',
            padding: '6px 10px',
            color: '#cbd5e1',
            fontSize: '0.75rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
          }}
          title="Export workspace graph JSON"
        >
          <Download size={12} />
          <span>Export</span>
        </button>

        <button
          onClick={handleImport}
          style={{
            background: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid var(--border-subtle)',
            borderRadius: '6px',
            padding: '6px 10px',
            color: '#cbd5e1',
            fontSize: '0.75rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
          }}
          title="Import workspace graph JSON"
        >
          <Upload size={12} />
          <span>Import</span>
        </button>

        <button
          onClick={() => setShowHelpModal(true)}
          style={{
            background: 'rgba(56, 189, 248, 0.1)',
            border: '1px solid rgba(56, 189, 248, 0.3)',
            borderRadius: '6px',
            padding: '6px 10px',
            color: '#38bdf8',
            fontSize: '0.75rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            fontWeight: 500,
          }}
          title="Quick Guide & Key Interactions"
        >
          <HelpCircle size={13} />
          <span>Guide</span>
        </button>
      </div>

      {/* Help Modal */}
      {showHelpModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.75)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 100,
          }}
          onClick={() => setShowHelpModal(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: '560px',
              maxWidth: '92vw',
              background: '#0d1527',
              border: '1px solid rgba(56, 189, 248, 0.3)',
              borderRadius: '12px',
              boxShadow: '0 20px 60px rgba(0, 0, 0, 0.8), 0 0 30px rgba(56, 189, 248, 0.2)',
              padding: '24px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Sparkles size={18} style={{ color: '#38bdf8' }} />
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#f8fafc' }}>
                  Know map 2.0 Feature Guide
                </h3>
              </div>
              <button
                onClick={() => setShowHelpModal(false)}
                style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: '1.1rem' }}
              >
                ✕
              </button>
            </div>

            <div style={{ fontSize: '0.825rem', color: '#cbd5e1', lineHeight: 1.6 }}>
              <div style={{ marginBottom: '12px' }}>
                <strong style={{ color: '#38bdf8' }}>1. Inline Text Forking:</strong>
                <p>Highlight any phrase in an Assistant turn in the Chat pane. A floating popover appears right below the selection. Type your query and press <code>Enter</code> to fork a child branch.</p>
              </div>

              <div style={{ marginBottom: '12px' }}>
                <strong style={{ color: '#818cf8' }}>2. Context Hop & Camera Panning:</strong>
                <p>Click any node on the DAG canvas. The camera smoothly translates to that node (450ms) and the Chat view unmounts non-ancestor siblings, displaying strictly that node&apos;s lineage $P(N)$.</p>
              </div>

              <div style={{ marginBottom: '12px' }}>
                <strong style={{ color: '#f59e0b' }}>3. Cross-Branch Insights & Drawer:</strong>
                <p>Notice the dashed animated splines linking disparate branches. Click any badge (e.g. &ldquo;Contradiction&rdquo;) to open the comparison drawer and examine conflicting or synergistic claims side-by-side.</p>
              </div>

              <div style={{ marginBottom: '12px' }}>
                <strong style={{ color: '#a855f7' }}>4. AI Horizon Ghost Nodes:</strong>
                <p>To the right of assistant turns, semi-transparent dashed cards predict exploration vectors (Critical Counter, Mechanistic Deepdive, Adjacent Transfer). Click any ghost card to immediately materialize it.</p>
              </div>

              <div>
                <strong style={{ color: '#10b981' }}>5. Toolformer, FLARE & CRAG:</strong>
                <p>Inline token invocations (<code>[TOOL:algebra_eval]</code>, <code>[TOOL:python_sandbox]</code>) run deterministic computations in real-time, while CRAG grades retrieved evidence confidence and falls back to web queries if uncertain.</p>
              </div>
            </div>

            <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setShowHelpModal(false)}
                style={{
                  background: 'linear-gradient(135deg, #0284c7, #2563eb)',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '6px',
                  padding: '7px 16px',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Got it, Start Exploring
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
