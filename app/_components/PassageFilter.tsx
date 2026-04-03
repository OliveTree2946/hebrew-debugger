'use client'

/**
 * PassageFilter.tsx
 * 태그 필터 + 구절 카드 그리드 — Client Component
 * 태그 클릭으로 activeTag를 관리하고, 해당 태그 구절만 표시한다.
 */

import { useState } from 'react'
import Link from 'next/link'

// ─────────────────────────────────────────
// 타입
// ─────────────────────────────────────────

export interface PassageRow {
  id: string
  ref: string
  ref_heb: string | null
  korean: string
  tags: string[]
  difficulty: number | null
  grammar_points: string[] | null
}

interface PassageFilterProps {
  passages: PassageRow[]
}

// ─────────────────────────────────────────
// 색상 토큰 (UI_DESIGN_SYSTEM.md)
// ─────────────────────────────────────────

const COLOR = {
  gold: '#C4A46A',
  cardBg: '#1C1914',
  border: '#2A2420',
  borderHover: '#C4A46A',
  textPrimary: '#E8DCC8',
  textMuted: 'rgba(232, 220, 200, 0.6)',
  textFaint: 'rgba(232, 220, 200, 0.3)',
  tagBg: 'rgba(196, 164, 106, 0.15)',
}

// ─────────────────────────────────────────
// 컴포넌트
// ─────────────────────────────────────────

export default function PassageFilter({ passages }: PassageFilterProps) {
  const [activeTag, setActiveTag] = useState<string>('전체')

  // passages의 tags 배열에서 unique 태그 추출
  const allTags = ['전체', ...Array.from(
    new Set(passages.flatMap((p) => p.tags ?? []))
  )]

  // 태그 필터 적용
  const filtered =
    activeTag === '전체'
      ? passages
      : passages.filter((p) => (p.tags ?? []).includes(activeTag))

  return (
    <div>
      {/* 태그 필터 버튼 */}
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '28px' }}>
        {allTags.map((tag) => {
          const isActive = tag === activeTag
          return (
            <button
              key={tag}
              onClick={() => setActiveTag(tag)}
              style={{
                padding: '6px 14px',
                fontSize: '12px',
                fontFamily: 'Noto Sans KR, sans-serif',
                letterSpacing: '0.5px',
                background: isActive ? COLOR.tagBg : 'transparent',
                color: isActive ? COLOR.gold : COLOR.textMuted,
                border: `1px solid ${isActive ? COLOR.gold : COLOR.border}`,
                borderRadius: '4px',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              {tag}
            </button>
          )
        })}
      </div>

      {/* 구절 카드 그리드 */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 340px), 1fr))',
          gap: '16px',
        }}
      >
        {filtered.map((passage) => (
          <PassageCard key={passage.id} passage={passage} />
        ))}
      </div>
    </div>
  )
}

// ─────────────────────────────────────────
// 구절 카드
// ─────────────────────────────────────────

function PassageCard({ passage }: { passage: PassageRow }) {
  const [hovered, setHovered] = useState(false)

  const grammarPreview = (passage.grammar_points ?? []).slice(0, 2)

  return (
    <Link
      href={`/passage/${passage.id}`}
      style={{ textDecoration: 'none' }}
    >
      <div
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={{
          background: COLOR.cardBg,
          border: `1px solid ${hovered ? COLOR.borderHover : COLOR.border}`,
          borderRadius: '8px',
          padding: '18px 20px',
          cursor: 'pointer',
          transform: hovered ? 'translateY(-2px)' : 'translateY(0)',
          transition: 'border-color 0.15s ease, transform 0.15s ease',
          display: 'flex',
          flexDirection: 'column',
          gap: '10px',
        }}
      >
        {/* 상단: ref + 태그 뱃지 */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <span
            style={{
              fontFamily: 'Noto Sans KR, sans-serif',
              fontSize: '13px',
              color: COLOR.gold,
              fontWeight: 500,
            }}
          >
            {passage.ref}
          </span>
          {(passage.tags ?? []).map((tag) => (
            <span
              key={tag}
              style={{
                fontSize: '9px',
                fontFamily: 'Noto Sans KR, sans-serif',
                letterSpacing: '0.5px',
                color: COLOR.gold,
                background: COLOR.tagBg,
                border: `1px solid rgba(196, 164, 106, 0.3)`,
                borderRadius: '3px',
                padding: '2px 6px',
              }}
            >
              {tag}
            </span>
          ))}
        </div>

        {/* 중간: 한국어 번역 (2줄 클램프) */}
        <p
          style={{
            fontFamily: 'Noto Sans KR, sans-serif',
            fontSize: '14px',
            color: COLOR.textMuted,
            lineHeight: '1.6',
            margin: 0,
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          }}
        >
          {passage.korean}
        </p>

        {/* 하단: grammar_points 첫 2개 */}
        {grammarPreview.length > 0 && (
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
            {grammarPreview.map((gp, i) => (
              <span
                key={i}
                style={{
                  fontSize: '9px',
                  fontFamily: 'Noto Sans KR, sans-serif',
                  color: COLOR.textFaint,
                  letterSpacing: '0.3px',
                }}
              >
                {i > 0 ? '· ' : ''}{gp}
              </span>
            ))}
          </div>
        )}
      </div>
    </Link>
  )
}
