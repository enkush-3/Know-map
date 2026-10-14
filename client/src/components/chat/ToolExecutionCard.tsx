import React, { useState } from 'react';
import { Terminal, CheckCircle2, XCircle, Loader2, ChevronDown, ChevronUp } from 'lucide-react';
import { ToolInvocation } from '../../types';

interface Props {
  invocation: ToolInvocation;
}

export const ToolExecutionCard: React.FC<Props> = ({ invocation }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const { toolName, parameters, executionResult, status, executionDurationMs } = invocation;

  return (
    <div
      style={{
        margin: '8px 0',
        background: 'rgba(8, 12, 22, 0.75)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        borderRadius: '8px',
        overflow: 'hidden',
      }}
    >
      <div
        onClick={() => setIsExpanded(!isExpanded)}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '6px 10px',
          background: 'rgba(255, 255, 255, 0.03)',
          cursor: 'pointer',
          userSelect: 'none',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Terminal size={13} style={{ color: '#38bdf8' }} />
          <span style={{ fontSize: '0.785rem', fontFamily: 'var(--font-mono)', fontWeight: 600, color: '#f8fafc' }}>
            [TOOL: {toolName}]
          </span>

          {status === 'running' && (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: '#38bdf8', fontSize: '0.7rem' }}>
              <Loader2 size={11} className="spin" style={{ animation: 'spin 1s linear infinite' }} />
              Executing...
            </span>
          )}

          {status === 'success' && (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: '#10b981', fontSize: '0.7rem' }}>
              <CheckCircle2 size={11} />
              Success {executionDurationMs ? `(${executionDurationMs}ms)` : ''}
            </span>
          )}

          {status === 'failed' && (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: '#f43f5e', fontSize: '0.7rem' }}>
              <XCircle size={11} />
              Failed
            </span>
          )}
        </div>

        <div style={{ color: '#64748b', display: 'flex', alignItems: 'center' }}>
          {isExpanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
        </div>
      </div>

      {isExpanded && (
        <div style={{ padding: '8px 10px', fontSize: '0.75rem', borderTop: '1px solid rgba(255, 255, 255, 0.06)' }}>
          <div style={{ marginBottom: '4px', color: '#94a3b8' }}>
            <strong>Parameters:</strong>
          </div>
          <pre
            style={{
              background: '#040711',
              padding: '6px',
              borderRadius: '4px',
              fontSize: '0.725rem',
              color: '#38bdf8',
              overflowX: 'auto',
              marginBottom: '6px',
            }}
          >
            {JSON.stringify(parameters, null, 2)}
          </pre>

          {executionResult && (
            <>
              <div style={{ marginBottom: '4px', color: '#94a3b8' }}>
                <strong>Execution Result:</strong>
              </div>
              <pre
                style={{
                  background: '#040711',
                  padding: '6px',
                  borderRadius: '4px',
                  fontSize: '0.725rem',
                  color: '#4ade80',
                  overflowX: 'auto',
                }}
              >
                {executionResult}
              </pre>
            </>
          )}
        </div>
      )}
    </div>
  );
};
