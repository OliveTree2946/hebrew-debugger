'use client'

/**
 * SyntaxPanel.tsx
 * 통사 구조 패널 — 접기/펼치기 토글, syntax_diagram 렌더링
 */

import { useState } from 'react'
import type { SyntaxDiagramRow } from '@/types/index'

// ─────────────────────────────────────────
// 색상 토큰 (UI_DESIGN_SYSTEM.md)
// ─────────────────────────────────────────

const COLOR = {
  gold: '#C4A46A',
  cardBg: '#1C1914',
  border: '#2A2420',
  textPrimary: '#E8DCC8',
  textMuted: 'rgba(232, 220, 200, 0.55)',
  textFaint: 'rgba(232, 220, 200, 0.3)',
}

// ─────────────────────────────────────────
// Props
// ─────────────────────────────────────────

interface SyntaxPanelProps {
  syntaxDiagram: SyntaxDiagramRow[]
  syntaxNote: string | null
}

// ─────────────────────────────────────────
// 컴포넌트
// ─────────────────────────────────────────

export default function SyntaxPanel({ syntaxDiagram, syntaxNote }: SyntaxPanelProps) {
  const [expanded, setExpanded] = useState(false)

  // 다이어그램이 없고 노트도 없으면 패널을 숨김
  if (syntaxDiagram.length === 0 && !syntaxNote) return null

  return (
    <section
      style={{
        background: COLOR.cardBg,
        border: `1px solid ${COLOR.border}`,
        borderRadius: '10px',
        overflow: 'hidden',
      }}
    >
      {/* ── 헤더 (토글 버튼) ── */}
      <button
        onClick={() => setExpanded((prev) => !prev)}
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '16px 20px',
          background: 'transparent',
          border: 'none',
          cursor: 'pointer',
          color: COLOR.textPrimary,
        }}
      >
        <span
          style={{
            fontFamily: 'Noto Sans KR, sans-serif',
            fontSize: '12px',
            color: COLOR.gold,
            letterSpacing: '0.5px',
          }}
        >
          통사 구조
        </span>
        <span
          style={{
            fontSize: '11px',
            color: COLOR.textFaint,
            transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)',
            transition: 'transform 0.2s ease',
            display: 'inline-block',
          }}
        >
          ▾
        </span>
      </button>

      {/* ── 펼침 영역 ── */}
      {expanded && (
        <div
          style={{
            padding: '0 20px 20px',
            borderTop: `1px solid ${COLOR.border}`,
          }}
        >
          {/* 다이어그램 행 목록 */}
          {syntaxDiagram.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '16px' }}>
              {syntaxDiagram.map((row, i) => (
                <DiagramRow key={i} row={row} />
              ))}
            </div>
          )}

          {/* 통사 노트 */}
          {syntaxNote && (
            <p
              style={{
                fontFamily: 'Noto Sans KR, sans-serif',
                fontSize: '13px',
                color: COLOR.textMuted,
                lineHeight: 1.7,
                margin: syntaxDiagram.length > 0 ? '16px 0 0' : '16px 0 0',
                paddingTop: syntaxDiagram.length > 0 ? '12px' : '0',
                borderTop: syntaxDiagram.length > 0 ? `1px solid ${COLOR.border}` : 'none',
              }}
            >
              {syntaxNote}
            </p>
          )}
        </div>
      )}
    </section>
  )
}

// ─────────────────────────────────────────
// 다이어그램 단일 행
// ─────────────────────────────────────────

function DiagramRow({ row }: { row: SyntaxDiagramRow }) {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: '72px 1fr 1fr',
        alignItems: 'center',
        gap: '12px',
      }}
    >
      {/* 역할 레이블 (색상 표시) */}
      <span
        style={{
          fontFamily: 'Noto Sans KR, sans-serif',
          fontSize: '10px',
          letterSpacing: '0.3px',
          color: row.color || COLOR.gold,
          padding: '3px 8px',
          background: `${row.color || COLOR.gold}18`,
          borderRadius: '3px',
          textAlign: 'center',
          whiteSpace: 'nowrap',
        }}
      >
        {row.role}
      </span>

      {/* 히브리어 (RTL) */}
      <span
        style={{
          fontFamily: 'Noto Serif Hebrew, serif',
          fontSize: '17px',
          color: '#E8DCC8',
          direction: 'rtl',
          unicodeBidi: 'isolate',
          textAlign: 'right',
        }}
      >
        {row.words}
      </span>

      {/* 한국어 */}
      <span
        style={{
          fontFamily: 'Noto Sans KR, sans-serif',
          fontSize: '13px',
          color: 'rgba(232, 220, 200, 0.6)',
        }}
      >
        {row.korean}
      </span>
    </div>
  )
}
