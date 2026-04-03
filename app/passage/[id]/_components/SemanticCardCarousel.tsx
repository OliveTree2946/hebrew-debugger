'use client'

/**
 * SemanticCardCarousel.tsx
 * 의미 카드 가로 스크롤 캐러셀 — 탭3 (의미 카드) 내부 컴포넌트
 * 카드 없음 안내 메시지 포함
 */

import type { SemanticCard, InterpretationTier } from '@/types/index'

// ─────────────────────────────────────────
// 색상 토큰 (UI_DESIGN_SYSTEM.md)
// ─────────────────────────────────────────

const COLOR = {
  gold: '#C4A46A',
  textPrimary: '#E8DCC8',
  textMuted: 'rgba(232, 220, 200, 0.6)',
  textFaint: 'rgba(232, 220, 200, 0.35)',
}

// ─────────────────────────────────────────
// 해석 등급별 스타일 정의
// ─────────────────────────────────────────

const TIER_STYLE: Record<
  InterpretationTier,
  { label: string; labelColor: string; cardBg: string; labelPrefix: string }
> = {
  mainstream: {
    label: '주류 해석',
    labelPrefix: '★',
    labelColor: '#C4A46A',
    cardBg: 'rgba(196, 164, 106, 0.10)',
  },
  alternative: {
    label: '대안적 읽기',
    labelPrefix: '○',
    labelColor: '#A0A0A0',
    cardBg: 'rgba(160, 160, 160, 0.07)',
  },
  academic: {
    label: '학술적 논의',
    labelPrefix: '△',
    labelColor: '#707070',
    cardBg: 'rgba(112, 112, 112, 0.07)',
  },
}

// ─────────────────────────────────────────
// Props
// ─────────────────────────────────────────

interface SemanticCardCarouselProps {
  cards: SemanticCard[]
}

// ─────────────────────────────────────────
// 컴포넌트
// ─────────────────────────────────────────

export default function SemanticCardCarousel({ cards }: SemanticCardCarouselProps) {
  // 카드가 없을 때 안내 메시지
  if (cards.length === 0) {
    return (
      <div
        style={{
          textAlign: 'center',
          padding: '32px 0',
          fontFamily: 'Noto Sans KR, sans-serif',
          fontSize: '13px',
          color: COLOR.textFaint,
          lineHeight: 1.6,
        }}
      >
        이 단어의 의미 카드가 준비 중입니다
      </div>
    )
  }

  // is_krv_anchor: true 카드를 앞으로 정렬
  const sorted = [...cards].sort((a, b) => {
    if (a.is_krv_anchor && !b.is_krv_anchor) return -1
    if (!a.is_krv_anchor && b.is_krv_anchor) return 1
    return (a.sort_order ?? 99) - (b.sort_order ?? 99)
  })

  return (
    // 가로 스크롤 컨테이너
    <div
      style={{
        display: 'flex',
        flexDirection: 'row',
        gap: '12px',
        overflowX: 'auto',
        paddingBottom: '8px',
        // 스크롤바 스타일링 (webkit)
        scrollbarWidth: 'thin',
        scrollbarColor: 'rgba(196,164,106,0.3) transparent',
      }}
    >
      {sorted.map((card) => (
        <SemanticCardItem key={card.id} card={card} />
      ))}
    </div>
  )
}

// ─────────────────────────────────────────
// 단일 의미 카드
// ─────────────────────────────────────────

function SemanticCardItem({ card }: { card: SemanticCard }) {
  const tier = TIER_STYLE[card.interpretation_tier] ?? TIER_STYLE.mainstream

  return (
    <div
      style={{
        width: '240px',
        flexShrink: 0,
        background: tier.cardBg,
        border: `1px solid ${tier.labelColor}30`,
        borderRadius: '8px',
        padding: '16px',
        display: 'flex',
        flexDirection: 'column',
        gap: '10px',
      }}
    >
      {/* 상단: 해석 등급 뱃지 + 개역개정 레이블 */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
        <span
          style={{
            fontFamily: 'Noto Sans KR, sans-serif',
            fontSize: '10px',
            color: tier.labelColor,
            letterSpacing: '0.3px',
          }}
        >
          {tier.labelPrefix} {tier.label}
        </span>
        {card.is_krv_anchor && (
          <span
            style={{
              fontFamily: 'Noto Sans KR, sans-serif',
              fontSize: '9px',
              color: COLOR.gold,
              background: 'rgba(196, 164, 106, 0.12)',
              border: '1px solid rgba(196, 164, 106, 0.3)',
              borderRadius: '3px',
              padding: '2px 6px',
              letterSpacing: '0.2px',
            }}
          >
            개역개정이 선택한 의미
          </span>
        )}
      </div>

      {/* 중앙: 의미 레이블 */}
      <p
        style={{
          fontFamily: 'Noto Sans KR, sans-serif',
          fontSize: '18px',
          fontWeight: 700,
          color: COLOR.textPrimary,
          margin: 0,
          lineHeight: 1.3,
        }}
      >
        {card.meaning_label}
      </p>

      {/* 설명 텍스트 (최대 4줄) */}
      {card.description && (
        <p
          style={{
            fontFamily: 'Noto Sans KR, sans-serif',
            fontSize: '12px',
            color: COLOR.textMuted,
            margin: 0,
            lineHeight: 1.6,
            display: '-webkit-box',
            WebkitLineClamp: 4,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          }}
        >
          {card.description}
        </p>
      )}

      {/* 관련 구절 태그 */}
      {card.context_refs && card.context_refs.length > 0 && (
        <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap', marginTop: 'auto' }}>
          {card.context_refs.map((ref) => (
            <span
              key={ref}
              style={{
                fontFamily: 'Noto Sans KR, sans-serif',
                fontSize: '9px',
                color: COLOR.textFaint,
                background: 'rgba(232, 220, 200, 0.06)',
                border: '1px solid rgba(232, 220, 200, 0.12)',
                borderRadius: '3px',
                padding: '2px 6px',
              }}
            >
              {ref}
            </span>
          ))}
        </div>
      )}
    </div>
  )
}
