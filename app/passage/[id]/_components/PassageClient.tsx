'use client'

/**
 * PassageClient.tsx
 * 본문 분석 메인 클라이언트 컴포넌트
 * 단어 선택 상태를 관리하고, 히브리어 인터랙티브 뷰와 대조 뷰를 렌더링한다.
 */

import { useState } from 'react'
import Link from 'next/link'
import type { Passage, Word, SemanticCard } from '@/types/index'
import MorphModal from './MorphModal'
import SyntaxPanel from './SyntaxPanel'

// ─────────────────────────────────────────
// 색상 토큰 (UI_DESIGN_SYSTEM.md)
// ─────────────────────────────────────────

const COLOR = {
  gold: '#C4A46A',
  goldFaint: 'rgba(196, 164, 106, 0.5)',
  cardBg: '#1C1914',
  border: '#2A2420',
  borderHover: '#C4A46A',
  textPrimary: '#E8DCC8',
  textMuted: 'rgba(232, 220, 200, 0.55)',
  textFaint: 'rgba(232, 220, 200, 0.3)',
  tagBg: 'rgba(196, 164, 106, 0.15)',
}

// ─────────────────────────────────────────
// Props
// ─────────────────────────────────────────

interface PassageClientProps {
  passage: Passage
  words: Word[]
  semanticCards: SemanticCard[]
}

// ─────────────────────────────────────────
// 컴포넌트
// ─────────────────────────────────────────

export default function PassageClient({ passage, words, semanticCards }: PassageClientProps) {
  // 선택된 단어 — null이면 모달 닫힘
  const [selectedWord, setSelectedWord] = useState<Word | null>(null)

  return (
    <main
      style={{
        minHeight: '100vh',
        background: '#12100D',
        color: COLOR.textPrimary,
        fontFamily: 'Noto Sans KR, sans-serif',
        direction: 'ltr',
      }}
    >
      <div
        style={{
          maxWidth: '860px',
          margin: '0 auto',
          padding: '36px 20px 80px',
        }}
      >
        {/* ── 상단 헤더 ── */}
        <header style={{ marginBottom: '32px' }}>
          {/* 뒤로가기 버튼 */}
          <Link
            href="/"
            style={{
              display: 'inline-block',
              fontSize: '12px',
              fontFamily: 'Noto Sans KR, sans-serif',
              color: COLOR.textFaint,
              textDecoration: 'none',
              marginBottom: '20px',
              letterSpacing: '0.3px',
            }}
          >
            ← 목록
          </Link>

          {/* 구절 참조 (영문) */}
          <h1
            style={{
              fontFamily: 'Cormorant Garamond, serif',
              fontSize: '22px',
              fontWeight: 600,
              color: COLOR.gold,
              margin: '0 0 6px',
              lineHeight: 1.3,
            }}
          >
            {passage.ref}
          </h1>

          {/* 히브리어 참조 (RTL) */}
          {passage.ref_heb && (
            <p
              style={{
                fontFamily: 'Noto Serif Hebrew, serif',
                fontSize: '15px',
                color: COLOR.goldFaint,
                margin: '0 0 12px',
                direction: 'rtl',
                unicodeBidi: 'isolate',
              }}
            >
              {passage.ref_heb}
            </p>
          )}

          {/* 태그 뱃지 목록 */}
          {passage.tags && passage.tags.length > 0 && (
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
              {passage.tags.map((tag) => (
                <span
                  key={tag}
                  style={{
                    fontSize: '9px',
                    fontFamily: 'Noto Sans KR, sans-serif',
                    letterSpacing: '0.5px',
                    color: COLOR.gold,
                    background: COLOR.tagBg,
                    border: '1px solid rgba(196, 164, 106, 0.3)',
                    borderRadius: '3px',
                    padding: '2px 7px',
                  }}
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
        </header>

        {/* ── 히브리어 인터랙티브 뷰 ── */}
        <section
          style={{
            background: COLOR.cardBg,
            border: `1px solid ${COLOR.border}`,
            borderRadius: '10px',
            padding: '24px 20px',
            marginBottom: '16px',
          }}
        >
          {/* RTL flex-wrap: 히브리어는 오른쪽에서 왼쪽으로 */}
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              flexDirection: 'row',
              direction: 'rtl',
              unicodeBidi: 'isolate',
              gap: '6px 2px',
            }}
          >
            {words.map((word) => (
              <WordButton
                key={word.id}
                word={word}
                isSelected={selectedWord?.id === word.id}
                onClick={() => setSelectedWord(word)}
              />
            ))}
          </div>
        </section>

        {/* ── 개역개정 대조 뷰 ── */}
        <section
          style={{
            background: COLOR.cardBg,
            border: `1px solid ${COLOR.border}`,
            borderRadius: '10px',
            padding: '18px 20px',
            marginBottom: '24px',
          }}
        >
          <p
            style={{
              fontSize: '9px',
              fontFamily: 'Noto Sans KR, sans-serif',
              color: 'rgba(232, 220, 200, 0.2)',
              letterSpacing: '1px',
              margin: '0 0 8px',
              textTransform: 'uppercase',
            }}
          >
            개역개정
          </p>
          <p
            style={{
              fontFamily: 'Noto Sans KR, sans-serif',
              fontSize: '14px',
              color: COLOR.textMuted,
              lineHeight: 1.7,
              margin: 0,
            }}
          >
            {passage.korean}
          </p>
        </section>

        {/* ── 통사 구조 패널 ── */}
        <SyntaxPanel
          syntaxDiagram={passage.syntax_diagram ?? []}
          syntaxNote={passage.syntax_note ?? null}
        />
      </div>

      {/* ── 형태론 모달 ── */}
      {selectedWord && (
        <MorphModal
          word={selectedWord}
          semanticCards={semanticCards.filter((c) => c.lemma === selectedWord.lemma)}
          syntaxDiagram={passage.syntax_diagram ?? null}
          onClose={() => setSelectedWord(null)}
        />
      )}
    </main>
  )
}

// ─────────────────────────────────────────
// 단어 버튼 서브컴포넌트
// ─────────────────────────────────────────

function WordButton({
  word,
  isSelected,
  onClick,
}: {
  word: Word
  isSelected: boolean
  onClick: () => void
}) {
  const [hovered, setHovered] = useState(false)

  const active = hovered || isSelected

  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: 'inline-flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '4px',
        padding: '10px 8px 8px',
        background: active ? 'rgba(196, 164, 106, 0.08)' : 'transparent',
        border: `1px solid ${active ? COLOR.gold : 'transparent'}`,
        borderRadius: '6px',
        cursor: 'pointer',
        transform: active ? 'translateY(-2px)' : 'translateY(0)',
        transition: 'border-color 0.12s ease, transform 0.12s ease, background 0.12s ease',
        direction: 'rtl',
        unicodeBidi: 'isolate',
      }}
    >
      {/* 히브리어 — OSHB 원본의 접두어 구분자(/) 제거 */}
      <span
        style={{
          fontFamily: 'Noto Serif Hebrew, serif',
          fontSize: '21px',
          color: '#E8DCC8',
          lineHeight: 1.2,
          direction: 'rtl',
          unicodeBidi: 'isolate',
        }}
      >
        {word.hebrew.replace(/\//g, '')}
      </span>
      {/* 의미 (gloss) */}
      <span
        style={{
          fontFamily: 'Noto Sans KR, sans-serif',
          fontSize: '9px',
          color: 'rgba(255, 255, 255, 0.3)',
          lineHeight: 1,
          direction: 'ltr',
          unicodeBidi: 'isolate',
        }}
      >
        {word.gloss ?? ''}
      </span>
    </button>
  )
}
