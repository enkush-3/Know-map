import React, { useState } from 'react';
import { ShieldCheck, AlertTriangle, Globe, ChevronDown, ChevronUp, FileText } from 'lucide-react';
import { RetrievalRecord } from '../../types';

interface Props {
  retrievalRecord: RetrievalRecord;
}

export const CragVerificationBadge: React.FC<Props> = ({ retrievalRecord }) => {
  const [isOpen, setIsOpen] = useState(false);

  const { evaluationStatus, evaluationScore, queryText, retrievalTrigger, refinedEvidence, fallbackSearchQuery } = retrievalRecord;

  let badgeColor = '#10b981';
  let badgeBg = 'rgba(16, 185, 129, 0.12)';
  let badgeBorder = 'rgba(16, 185, 129, 0.35)';
  let Icon = ShieldCheck;
  let label = `CRAG Verified (${Math.round(evaluationScore * 100)}%)`;

  if (evaluationStatus === 'ambiguous') {
    badgeColor = '#f59e0b';
    badgeBg = 'rgba(245, 158, 11, 0.12)';
    badgeBorder = 'rgba(245, 158, 11, 0.35)';
    Icon = AlertTriangle;
    label = `CRAG Dual Fusion (${Math.round(evaluationScore * 100)}%)`;
  } else if (evaluationStatus === 'incorrect') {
    badgeColor = '#f43f5e';
    badgeBg = 'rgba(244, 63, 94, 0.12)';
    badgeBorder = 'rgba(244, 63, 94, 0.35)';
    Icon = Globe;
    label = 'Web Fallback Triggered';
  }

  return (
    <div style={{ marginTop: '8px', marginBottom: '8px' }}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '6px',
          background: badgeBg,
          border: `1px solid ${badgeBorder}`,
          borderRadius: '9999px',
          padding: '3px 10px',
          color: badgeColor,
          fontSize: '0.725rem',
          fontWeight: 600,
          cursor: 'pointer',
          transition: 'all 0.15s ease',
        }}
      >
        <Icon size={13} />
        <span>{label}</span>
        <span style={{ color: '#64748b', fontSize: '0.65rem', marginLeft: '2px' }}>
          via {retrievalTrigger}
        </span>
        {isOpen ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
      </button>

      {isOpen && (
        <div
          style={{
            marginTop: '6px',
            background: 'rgba(15, 23, 42, 0.85)',
            border: `1px solid ${badgeBorder}`,
            borderRadius: '8px',
            padding: '10px 12px',
            fontSize: '0.785rem',
            lineHeight: 1.5,
            color: '#cbd5e1',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px', color: badgeColor, fontWeight: 600 }}>
            <FileText size={12} />
            <span>Retrieval Context & Evaluator Rationale:</span>
          </div>

          <div style={{ marginBottom: '6px', fontSize: '0.725rem', color: '#94a3b8' }}>
            <strong>Query:</strong> &ldquo;{queryText}&rdquo;
          </div>

          <div style={{ background: 'rgba(0, 0, 0, 0.3)', padding: '6px 8px', borderRadius: '4px', fontSize: '0.75rem', fontFamily: 'var(--font-mono)' }}>
            {refinedEvidence}
          </div>

          {fallbackSearchQuery && (
            <div style={{ marginTop: '6px', fontSize: '0.725rem', color: '#f43f5e' }}>
              <strong>External Search Fallback:</strong> {fallbackSearchQuery}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
