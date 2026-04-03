'use client'

/**
 * MorphModal.tsx
 * 형태론 정보 모달 — 탭: 형태 분석 | 어근 | 의미 카드
 * 배경 클릭 시 닫힘
 */

import { useState } from 'react'
import type { Word, SemanticCard, SyntaxDiagramRow } from '@/types/index'
import SemanticCardCarousel from './SemanticCardCarousel'

// ─────────────────────────────────────────
// 색상 토큰 (UI_DESIGN_SYSTEM.md)
// ─────────────────────────────────────────

const COLOR = {
  gold: '#C4A46A',
  verb: '#F67280',
  noun: '#85CDCA',
  preposition: '#E8A87C',
  article: '#FFD93D',
  cardBg: '#1C1914',
  modalBg: '#231F1A',
  border: '#2A2420',
  textPrimary: '#E8DCC8',
  textMuted: 'rgba(232, 220, 200, 0.6)',
  textFaint: 'rgba(232, 220, 200, 0.35)',
  tagBg: 'rgba(196, 164, 106, 0.12)',
  navActiveBg: 'rgba(196, 164, 106, 0.12)',
}

// ─────────────────────────────────────────
// 탭 타입
// ─────────────────────────────────────────

type TabId = 'morph' | 'syntax' | 'root' | 'cards'

// ─────────────────────────────────────────
// Props
// ─────────────────────────────────────────

interface MorphModalProps {
  word: Word
  semanticCards: SemanticCard[]
  syntaxDiagram: SyntaxDiagramRow[] | null
  onClose: () => void
}

// ─────────────────────────────────────────
// 컴포넌트
// ─────────────────────────────────────────

export default function MorphModal({ word, semanticCards, syntaxDiagram, onClose }: MorphModalProps) {
  const [activeTab, setActiveTab] = useState<TabId>('morph')

  return (
    // 배경 오버레이 — 클릭 시 닫힘
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0, 0, 0, 0.65)',
        display: 'flex',
        alignItems: 'flex-end',
        justifyContent: 'center',
        zIndex: 100,
        padding: '0 0 0 0',
      }}
    >
      {/* 모달 패널 — 클릭 이벤트 전파 차단 */}
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: '600px',
          background: COLOR.modalBg,
          border: `1px solid ${COLOR.border}`,
          borderBottom: 'none',
          borderRadius: '14px 14px 0 0',
          maxHeight: '82vh',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        {/* ── 모달 헤더 ── */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '20px 20px 16px',
            borderBottom: `1px solid ${COLOR.border}`,
            flexShrink: 0,
          }}
        >
          {/* 히브리어 단어 표시 */}
          <span
            style={{
              fontFamily: 'Noto Serif Hebrew, serif',
              fontSize: '26px',
              color: COLOR.textPrimary,
              direction: 'rtl',
              unicodeBidi: 'isolate',
            }}
          >
            {word.hebrew}
          </span>

          {/* 닫기 버튼 */}
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              fontSize: '18px',
              color: COLOR.textFaint,
              padding: '4px 8px',
              lineHeight: 1,
            }}
            aria-label="닫기"
          >
            ✕
          </button>
        </div>

        {/* ── 탭 네비게이션 ── */}
        <div
          style={{
            display: 'flex',
            borderBottom: `1px solid ${COLOR.border}`,
            flexShrink: 0,
          }}
        >
          {(
            [
              { id: 'morph' as TabId, label: '형태 분석' },
              { id: 'syntax' as TabId, label: '통사' },
              { id: 'root' as TabId, label: '어근' },
              { id: 'cards' as TabId, label: '의미 카드' },
            ] as { id: TabId; label: string }[]
          ).map(({ id, label }) => {
            const isActive = activeTab === id
            return (
              <button
                key={id}
                onClick={() => setActiveTab(id)}
                style={{
                  flex: 1,
                  padding: '12px 8px',
                  fontFamily: 'Noto Sans KR, sans-serif',
                  fontSize: '12px',
                  letterSpacing: '0.3px',
                  color: isActive ? COLOR.gold : COLOR.textFaint,
                  background: isActive ? COLOR.navActiveBg : 'transparent',
                  border: 'none',
                  borderBottom: isActive ? `2px solid ${COLOR.gold}` : '2px solid transparent',
                  marginBottom: '-1px',
                  cursor: 'pointer',
                  transition: 'color 0.12s ease',
                }}
              >
                {label}
              </button>
            )
          })}
        </div>

        {/* ── 탭 콘텐츠 ── */}
        <div
          style={{
            overflowY: 'auto',
            flex: 1,
            padding: '20px',
          }}
        >
          {activeTab === 'morph' && <MorphTab word={word} />}
          {activeTab === 'syntax' && <SyntaxTab word={word} syntaxDiagram={syntaxDiagram} />}
          {activeTab === 'root' && <RootTab word={word} />}
          {activeTab === 'cards' && <SemanticCardCarousel cards={semanticCards} />}
        </div>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────
// 탭1: 형태 분석
// ─────────────────────────────────────────

function MorphTab({ word }: { word: Word }) {
  const hasVerbInfo = word.binyan || word.tense || word.pgn

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

      {/* morph_parts: 색상 분리 히브리어 파트 */}
      {word.morph_parts && word.morph_parts.length > 0 && (
        <div>
          <p
            style={{
              fontFamily: 'Noto Sans KR, sans-serif',
              fontSize: '10px',
              color: COLOR.textFaint,
              letterSpacing: '0.5px',
              margin: '0 0 12px',
              textTransform: 'uppercase',
            }}
          >
            형태 분해
          </p>
          <div
            style={{
              display: 'flex',
              flexDirection: 'row',
              flexWrap: 'wrap',
              gap: '8px',
              direction: 'rtl',
            }}
          >
            {word.morph_parts.map((part, i) => (
              <div
                key={i}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '4px',
                  padding: '10px 12px',
                  background: `${part.color}15`,
                  border: `1px solid ${part.color}40`,
                  borderRadius: '6px',
                  direction: 'rtl',
                  textAlign: 'center',
                }}
              >
                <span
                  style={{
                    fontFamily: 'Noto Serif Hebrew, serif',
                    fontSize: '20px',
                    color: part.color,
                    direction: 'rtl',
                    unicodeBidi: 'isolate',
                  }}
                >
                  {part.text}
                </span>
                <span
                  style={{
                    fontFamily: 'Noto Sans KR, sans-serif',
                    fontSize: '9px',
                    color: COLOR.textFaint,
                    direction: 'ltr',
                    unicodeBidi: 'isolate',
                    textAlign: 'center',
                  }}
                >
                  {part.role}
                </span>
                <span
                  style={{
                    fontFamily: 'Noto Sans KR, sans-serif',
                    fontSize: '10px',
                    color: COLOR.textMuted,
                    direction: 'ltr',
                    unicodeBidi: 'isolate',
                    textAlign: 'center',
                  }}
                >
                  {part.meaning}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 품사 분류 박스 */}
      {word.pos_korean && (
        <div>
          <p
            style={{
              fontFamily: 'Noto Sans KR, sans-serif',
              fontSize: '10px',
              color: COLOR.textFaint,
              letterSpacing: '0.5px',
              margin: '0 0 8px',
              textTransform: 'uppercase',
            }}
          >
            문법 분류
          </p>
          <div
            style={{
              display: 'inline-block',
              padding: '8px 16px',
              background: COLOR.tagBg,
              border: `1px solid rgba(196, 164, 106, 0.25)`,
              borderRadius: '6px',
              fontFamily: 'Noto Sans KR, sans-serif',
              fontSize: '13px',
              color: COLOR.gold,
              letterSpacing: '0.3px',
            }}
          >
            {word.pos_korean}
          </div>
        </div>
      )}

      {/* 동사 정보 3칸 그리드 (동사인 경우만) */}
      {hasVerbInfo && (
        <div>
          <p
            style={{
              fontFamily: 'Noto Sans KR, sans-serif',
              fontSize: '10px',
              color: COLOR.textFaint,
              letterSpacing: '0.5px',
              margin: '0 0 8px',
              textTransform: 'uppercase',
            }}
          >
            동사 활용
          </p>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: '8px',
            }}
          >
            <VerbInfoCell label="어간 (빈얀)" value={word.binyan} />
            <VerbInfoCell label="시제/상" value={word.tense} />
            <VerbInfoCell label="인칭·성·수" value={word.pgn} />
          </div>
        </div>
      )}

      {/* 학습 노트 */}
      {word.learning_note && (
        <div
          style={{
            padding: '14px 16px',
            background: 'rgba(196, 164, 106, 0.06)',
            border: `1px solid rgba(196, 164, 106, 0.18)`,
            borderRadius: '8px',
            borderLeft: `3px solid ${COLOR.gold}`,
          }}
        >
          <p
            style={{
              fontFamily: 'Noto Sans KR, sans-serif',
              fontSize: '10px',
              color: COLOR.gold,
              letterSpacing: '0.5px',
              margin: '0 0 8px',
              textTransform: 'uppercase',
            }}
          >
            학습 노트
          </p>
          <p
            style={{
              fontFamily: 'Noto Sans KR, sans-serif',
              fontSize: '13px',
              color: COLOR.textMuted,
              lineHeight: 1.7,
              margin: 0,
            }}
          >
            {word.learning_note}
          </p>
        </div>
      )}
    </div>
  )
}

// 동사 정보 셀 서브컴포넌트
function VerbInfoCell({ label, value }: { label: string; value: string | null }) {
  return (
    <div
      style={{
        padding: '10px 12px',
        background: COLOR.cardBg,
        border: `1px solid ${COLOR.border}`,
        borderRadius: '6px',
        display: 'flex',
        flexDirection: 'column',
        gap: '4px',
      }}
    >
      <span
        style={{
          fontFamily: 'Noto Sans KR, sans-serif',
          fontSize: '9px',
          color: COLOR.textFaint,
          letterSpacing: '0.3px',
        }}
      >
        {label}
      </span>
      <span
        style={{
          fontFamily: 'Noto Sans KR, sans-serif',
          fontSize: '12px',
          color: value ? COLOR.textPrimary : COLOR.textFaint,
        }}
      >
        {value ?? '—'}
      </span>
    </div>
  )
}

// ─────────────────────────────────────────
// 탭2: 통사
// ─────────────────────────────────────────

function SyntaxTab({
  word,
  syntaxDiagram,
}: {
  word: Word
  syntaxDiagram: SyntaxDiagramRow[] | null
}) {
  // syntax_diagram 데이터가 없으면 준비 중 메시지
  if (!syntaxDiagram || syntaxDiagram.length === 0) {
    return (
      <p
        style={{
          fontFamily: 'Noto Sans KR, sans-serif',
          fontSize: '13px',
          color: COLOR.textFaint,
          textAlign: 'center',
          padding: '32px 0',
        }}
      >
        통사 정보가 준비 중입니다.
      </p>
    )
  }

  // 단어가 속한 통사 성분 찾기 — hebrew에서 / 제거 후 words 문자열과 비교
  const cleanHebrew = word.hebrew.replace(/\//g, '')
  const matchedRow = syntaxDiagram.find(
    (row) =>
      row.words.includes(cleanHebrew) || row.words.includes(word.hebrew)
  )

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* 문법 분류 (품사) */}
      {word.pos_korean && (
        <div>
          <p
            style={{
              fontFamily: 'Noto Sans KR, sans-serif',
              fontSize: '10px',
              color: COLOR.textFaint,
              letterSpacing: '0.5px',
              margin: '0 0 8px',
              textTransform: 'uppercase',
            }}
          >
            문법 분류
          </p>
          <div
            style={{
              display: 'inline-block',
              padding: '8px 16px',
              background: COLOR.tagBg,
              border: `1px solid rgba(196, 164, 106, 0.25)`,
              borderRadius: '6px',
              fontFamily: 'Noto Sans KR, sans-serif',
              fontSize: '13px',
              color: COLOR.gold,
              letterSpacing: '0.3px',
            }}
          >
            {word.pos_korean}
          </div>
        </div>
      )}

      {/* 문장 내 통사 역할 */}
      <div>
        <p
          style={{
            fontFamily: 'Noto Sans KR, sans-serif',
            fontSize: '10px',
            color: COLOR.textFaint,
            letterSpacing: '0.5px',
            margin: '0 0 12px',
            textTransform: 'uppercase',
          }}
        >
          문장 내 역할
        </p>
        {matchedRow ? (
          <div
            style={{
              padding: '14px 16px',
              background: `${matchedRow.color}12`,
              border: `1px solid ${matchedRow.color}40`,
              borderLeft: `3px solid ${matchedRow.color}`,
              borderRadius: '8px',
              display: 'flex',
              flexDirection: 'column',
              gap: '10px',
            }}
          >
            {/* 통사 역할 레이블 */}
            <span
              style={{
                fontFamily: 'Noto Sans KR, sans-serif',
                fontSize: '15px',
                fontWeight: 700,
                color: matchedRow.color,
                letterSpacing: '0.3px',
              }}
            >
              {matchedRow.role}
            </span>
            {/* 해당 성분 히브리어 */}
            <span
              style={{
                fontFamily: 'Noto Serif Hebrew, serif',
                fontSize: '18px',
                color: COLOR.textPrimary,
                direction: 'rtl',
                unicodeBidi: 'isolate',
              }}
            >
              {matchedRow.words}
            </span>
            {/* 한국어 번역 */}
            <span
              style={{
                fontFamily: 'Noto Sans KR, sans-serif',
                fontSize: '12px',
                color: COLOR.textMuted,
              }}
            >
              {matchedRow.korean}
            </span>
          </div>
        ) : (
          <p
            style={{
              fontFamily: 'Noto Sans KR, sans-serif',
              fontSize: '13px',
              color: COLOR.textFaint,
              padding: '12px 0',
            }}
          >
            이 단어의 통사 역할 정보를 찾을 수 없습니다.
          </p>
        )}
      </div>

      {/* 전체 통사 구조 요약 */}
      <div>
        <p
          style={{
            fontFamily: 'Noto Sans KR, sans-serif',
            fontSize: '10px',
            color: COLOR.textFaint,
            letterSpacing: '0.5px',
            margin: '0 0 10px',
            textTransform: 'uppercase',
          }}
        >
          문장 구조
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          {syntaxDiagram.map((row, i) => (
            <div
              key={i}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '8px 12px',
                background:
                  row === matchedRow
                    ? `${row.color}18`
                    : COLOR.cardBg,
                border: `1px solid ${row === matchedRow ? `${row.color}50` : COLOR.border}`,
                borderRadius: '6px',
              }}
            >
              <span
                style={{
                  fontFamily: 'Noto Sans KR, sans-serif',
                  fontSize: '10px',
                  color: row.color,
                  minWidth: '48px',
                  letterSpacing: '0.2px',
                }}
              >
                {row.role}
              </span>
              <span
                style={{
                  fontFamily: 'Noto Serif Hebrew, serif',
                  fontSize: '15px',
                  color: COLOR.textMuted,
                  direction: 'rtl',
                  unicodeBidi: 'isolate',
                  flex: 1,
                  textAlign: 'right',
                }}
              >
                {row.words}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────
// 탭3: 어근
// ─────────────────────────────────────────

function RootTab({ word }: { word: Word }) {
  const hasRoot = word.root || word.root_meaning

  if (!hasRoot) {
    return (
      <p
        style={{
          fontFamily: 'Noto Sans KR, sans-serif',
          fontSize: '13px',
          color: COLOR.textFaint,
          textAlign: 'center',
          padding: '32px 0',
        }}
      >
        어근 정보가 없습니다
      </p>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* 어근 히브리어 */}
      {word.root && (
        <div style={{ textAlign: 'center', padding: '16px 0' }}>
          <span
            style={{
              fontFamily: 'Noto Serif Hebrew, serif',
              fontSize: '34px',
              color: COLOR.gold,
              direction: 'rtl',
              unicodeBidi: 'isolate',
              letterSpacing: '8px',
              display: 'block',
            }}
          >
            {word.root}
          </span>
          {word.root_meaning && (
            <span
              style={{
                fontFamily: 'Noto Sans KR, sans-serif',
                fontSize: '14px',
                color: COLOR.textMuted,
                display: 'block',
                marginTop: '12px',
              }}
            >
              {word.root_meaning}
            </span>
          )}
        </div>
      )}

      {/* 파생 단어 목록 */}
      {word.related_words && word.related_words.length > 0 && (
        <div>
          <p
            style={{
              fontFamily: 'Noto Sans KR, sans-serif',
              fontSize: '10px',
              color: COLOR.textFaint,
              letterSpacing: '0.5px',
              margin: '0 0 12px',
              textTransform: 'uppercase',
            }}
          >
            파생 단어
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {word.related_words.map((rw, i) => (
              <div
                key={i}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '10px 14px',
                  background: COLOR.cardBg,
                  border: `1px solid ${COLOR.border}`,
                  borderRadius: '6px',
                }}
              >
                <span
                  style={{
                    fontFamily: 'Noto Serif Hebrew, serif',
                    fontSize: '18px',
                    color: COLOR.textPrimary,
                    direction: 'rtl',
                    unicodeBidi: 'isolate',
                  }}
                >
                  {rw.w}
                </span>
                <span
                  style={{
                    fontFamily: 'Noto Sans KR, sans-serif',
                    fontSize: '12px',
                    color: COLOR.textMuted,
                  }}
                >
                  {rw.m}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
