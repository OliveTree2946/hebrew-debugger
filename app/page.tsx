/**
 * page.tsx
 * 메인 페이지 — 구절 선택 화면 (Server Component)
 * Supabase passages 테이블에서 데이터를 fetch해 PassageFilter에 전달한다.
 */

import { supabase } from '@/lib/supabase'
import PassageFilter, { PassageRow } from './_components/PassageFilter'
import Link from 'next/link'

// ─────────────────────────────────────────
// 색상 토큰 (UI_DESIGN_SYSTEM.md)
// ─────────────────────────────────────────

const COLOR = {
  gold: '#C4A46A',
  textPrimary: '#E8DCC8',
  textMuted: 'rgba(232, 220, 200, 0.6)',
  textFaint: 'rgba(232, 220, 200, 0.35)',
  border: '#2A2420',
  navActiveBg: 'rgba(196, 164, 106, 0.12)',
}

// ─────────────────────────────────────────
// 서버 컴포넌트
// ─────────────────────────────────────────

export default async function HomePage() {
  // passages 테이블 SELECT — 실제 DB 컬럼명 사용
  const { data, error } = await supabase
    .from('passages')
    .select('id, book_korean, chapter, verse_start, verse_end, korean_text, tags, difficulty, grammar_points')
    .order('id')

  // DB 컬럼 → PassageRow 타입 매핑
  const passages: PassageRow[] = (data ?? []).map((p: Record<string, unknown>) => ({
    id: p.id as string,
    ref: `${p.book_korean} ${p.chapter}:${p.verse_start}${p.verse_end ? `-${p.verse_end}` : ''}`,
    ref_heb: null,
    korean: (p.korean_text as string | null) ?? '',
    tags: (p.tags as string[] | null) ?? [],
    difficulty: p.difficulty === 'beginner' ? 1 : p.difficulty === 'intermediate' ? 3 : 5,
    grammar_points: (p.grammar_points as string[] | null) ?? null,
  }))

  // 임시 디버그: 에러 메시지 표시
  const dbError = error ? `[DB 오류] ${error.message} (code: ${error.code})` : null

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
          maxWidth: '900px',
          margin: '0 auto',
          padding: '40px 20px 80px',
        }}
      >
        {/* ── 헤더 ── */}
        <header style={{ marginBottom: '36px' }}>
          {/* 브랜드 레이블 */}
          <p
            style={{
              fontSize: '10px',
              fontFamily: 'Noto Sans KR, sans-serif',
              color: COLOR.gold,
              letterSpacing: '3px',
              textTransform: 'uppercase',
              margin: '0 0 12px',
            }}
          >
            SEED STUDIO · BIBLICAL HEBREW
          </p>

          {/* 제목 */}
          <h1
            style={{
              fontFamily: 'Cormorant Garamond, serif',
              fontSize: '26px',
              fontWeight: 600,
              color: COLOR.textPrimary,
              margin: '0 0 8px',
              lineHeight: 1.3,
            }}
          >
            성서 히브리어 디버거
          </h1>

          {/* 부제 */}
          <p
            style={{
              fontSize: '13px',
              color: COLOR.textFaint,
              margin: 0,
              lineHeight: 1.5,
            }}
          >
            단어를 탭하여 파싱, 어근, 의미를 탐색하세요
          </p>
        </header>

        {/* ── 네비게이션 탭 ── */}
        <nav
          style={{
            display: 'flex',
            gap: '4px',
            borderBottom: `1px solid ${COLOR.border}`,
            marginBottom: '32px',
          }}
        >
          {/* 현재 페이지 — 활성 */}
          <NavTab href="/" label="📖 본문 분석" active />
          <NavTab href="/drill" label="⚡ 빈야님 드릴" active={false} />
        </nav>

        {/* ── 임시 디버그 에러 표시 ── */}
        {dbError && (
          <div style={{
            background: 'rgba(246,114,128,0.1)',
            border: '1px solid #F67280',
            borderRadius: '6px',
            padding: '12px 16px',
            marginBottom: '20px',
            fontSize: '12px',
            color: '#F67280',
            fontFamily: 'monospace',
          }}>
            {dbError}
          </div>
        )}

        {/* ── 태그 필터 + 카드 그리드 (Client Component) ── */}
        <PassageFilter passages={passages} />

        {/* ── 통계 바 ── */}
        <footer
          style={{
            marginTop: '56px',
            paddingTop: '20px',
            borderTop: `1px solid ${COLOR.border}`,
            textAlign: 'center',
            fontSize: '12px',
            color: COLOR.textFaint,
            letterSpacing: '0.5px',
            fontFamily: 'Noto Sans KR, sans-serif',
          }}
        >
          본문 30개 · 단어 383개 · 의미 카드 88장
        </footer>
      </div>
    </main>
  )
}

// ─────────────────────────────────────────
// 네비게이션 탭 서브컴포넌트
// ─────────────────────────────────────────

function NavTab({
  href,
  label,
  active,
}: {
  href: string
  label: string
  active: boolean
}) {
  return (
    <Link
      href={href}
      style={{
        display: 'inline-block',
        padding: '10px 18px',
        fontSize: '13px',
        fontFamily: 'Noto Sans KR, sans-serif',
        color: active ? COLOR.gold : COLOR.textFaint,
        background: active ? COLOR.navActiveBg : 'transparent',
        borderBottom: active ? `2px solid ${COLOR.gold}` : '2px solid transparent',
        marginBottom: '-1px',
        textDecoration: 'none',
        transition: 'color 0.15s ease',
      }}
    >
      {label}
    </Link>
  )
}
