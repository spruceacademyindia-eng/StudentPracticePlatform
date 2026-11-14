'use client';
import React, { useRef, useEffect } from 'react';
import { CheckCircle, FileText } from 'lucide-react';

interface ClinicalDocumentViewProps {
  content: string;
  charStates: ('idle' | 'correct' | 'wrong' | 'current')[];
  title?: string;
  studentName?: string;
  targetWPM?: number;
  mode?: 'PRACTICE' | 'CHALLENGE';
  containerRef?: React.RefObject<HTMLDivElement | null>;
  activeCharRef?: React.RefObject<HTMLSpanElement | null>;
  onContainerClick?: () => void;
  hospitalName?: string;
}

export default function ClinicalDocumentView({
  content,
  charStates,
  title = 'Clinical Discharge Summary',
  studentName = 'Candidate Student',
  targetWPM = 35,
  mode = 'PRACTICE',
  containerRef,
  activeCharRef,
  onContainerClick,
  hospitalName = 'Ace Discharge Summary',
}: ClinicalDocumentViewProps) {
  const currentDate = new Date().toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        backgroundColor: '#ffffff',
        borderRadius: 'var(--radius-md)',
        border: '1px solid #cbd5e1',
        boxShadow: '0 4px 18px rgba(0, 0, 0, 0.05)',
        overflow: 'hidden',
      }}
    >
      {/* Top Hospital Chart Header Bar */}
      <div
        style={{
          backgroundColor: '#f8fafc',
          borderBottom: '2px solid #044C94',
          padding: '0.65rem 1rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '0.5rem',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span
            style={{
              backgroundColor: '#044C94',
              color: '#ffffff',
              padding: '0.2rem 0.55rem',
              borderRadius: '4px',
              fontSize: '0.72rem',
              fontWeight: 800,
              letterSpacing: '0.05em',
              textTransform: 'uppercase',
            }}
          >
            EHR Clinical Record
          </span>
          <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#1e293b' }}>
            {title}
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span
            style={{
              fontSize: '0.75rem',
              color: '#64748b',
              fontWeight: 600,
            }}
          >
            Target: {targetWPM} WPM
          </span>
        </div>
      </div>


      {/* Scrollable Clinical Passage Typing Sheet */}
      <div
        ref={containerRef}
        onClick={onContainerClick}
        style={{
          flex: 1,
          fontFamily: 'Consolas, "Liberation Mono", "Courier New", Courier, monospace',
          fontSize: '1.08rem',
          lineHeight: 1.85,
          letterSpacing: '0.02em',
          padding: '1.25rem 1.5rem',
          backgroundColor: '#ffffff',
          color: '#334155',
          overflowY: 'auto',
          whiteSpace: 'pre-wrap',
          wordBreak: 'break-word',
          cursor: 'text',
          userSelect: 'none',
        }}
      >
        {content.split('').map((char, index) => {
          const state = charStates[index] || 'idle';
          let color = '#475569';
          let bg = 'transparent';
          let borderBottom = 'none';

          if (state === 'correct') {
            color = '#15803d';
            bg = '#dcfce7';
          } else if (state === 'wrong') {
            color = '#b91c1c';
            bg = '#fee2e2';
            borderBottom = '2px solid #ef4444';
          } else if (state === 'current') {
            color = '#ffffff';
            bg = 'var(--color-secondary, #044C94)';
          }

          return (
            <span
              key={index}
              ref={state === 'current' ? activeCharRef : undefined}
              style={{
                color,
                backgroundColor: bg,
                borderBottom,
                borderRadius: '2px',
                padding: '0 1px',
                boxShadow:
                  state === 'current' ? '0 0 0 2px rgba(4, 76, 148, 0.35)' : 'none',
              }}
            >
              {char}
            </span>
          );
        })}
      </div>

      {/* Authentic Bottom Hospital Footer (Dual Boxes: [Hospital Title] | [Patient Label]) */}
      <div
        style={{
          borderTop: '2px solid #0f172a',
          backgroundColor: '#f8fafc',
          display: 'grid',
          gridTemplateColumns: '1.2fr 1fr',
          minHeight: '80px',
        }}
      >
        {/* Left Box: Hospital / Document Title Box */}
        <div
          style={{
            borderRight: '2px solid #0f172a',
            padding: '0.65rem 1rem',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
          }}
        >
          <div
            style={{
              fontSize: '1.05rem',
              fontWeight: 800,
              color: '#0f172a',
              letterSpacing: '0.02em',
            }}
          >
            {hospitalName}
          </div>
          <div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: '0.15rem' }}>
            Official Medical Inpatient Record · Formal Clinical Documentation
          </div>
        </div>

        {/* Right Box: Patient Label Box */}
        <div
          style={{
            padding: '0.65rem 1rem',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            backgroundColor: '#ffffff',
            position: 'relative',
          }}
        >
          <div
            style={{
              fontSize: '0.65rem',
              fontWeight: 800,
              color: '#94a3b8',
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              marginBottom: '0.15rem',
            }}
          >
            Patient Label / Session ID
          </div>
          <div
            style={{
              fontSize: '0.85rem',
              fontWeight: 700,
              color: '#044C94',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <span>{studentName}</span>
            <span
              style={{
                fontSize: '0.7rem',
                backgroundColor: '#e0f2fe',
                color: '#0284c7',
                padding: '0.1rem 0.4rem',
                borderRadius: '3px',
                fontWeight: 600,
              }}
            >
              {mode}
            </span>
          </div>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              fontSize: '0.7rem',
              color: '#64748b',
              marginTop: '0.2rem',
            }}
          >
            <span>Date: {currentDate}</span>
            <span>Target: {targetWPM} WPM</span>
          </div>
        </div>
      </div>
    </div>
  );
}

