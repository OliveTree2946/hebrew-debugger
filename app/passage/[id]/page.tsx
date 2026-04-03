/**
 * app/passage/[id]/page.tsx
 * 본문 분석 페이지 — async Server Component
 * passages, words, semantic_cards 테이블을 fetch해 PassageClient에 전달한다.
 */

import { notFound } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import type { Passage, Word, SemanticCard } from '@/types/index'
import PassageClient from './_components/PassageClient'

// ─────────────────────────────────────────
// 페이지 컴포넌트
// ─────────────────────────────────────────

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function PassagePage({ params }: PageProps) {
  const { id } = await params

  // ── 1. passages 단일 행 fetch — 실제 DB 컬럼명 사용 ──
  const { data: passageData, error: passageError } = await supabase
    .from('passages')
    .select(
      'id, book_korean, chapter, verse_start, verse_end, korean_text, tags, difficulty, grammar_points, syntax_diagram, syntax_note'
    )
    .eq('id', id)
    .maybeSingle()

  // passage가 없으면 404
  if (passageError || !passageData) {
    notFound()
  }

  // DB 컬럼 → Passage 타입 매핑
  const p = passageData as Record<string, unknown>
  const passage: Passage = {
    id: p.id as string,
    ref: `${p.book_korean} ${p.chapter}:${p.verse_start}${p.verse_end ? `-${p.verse_end}` : ''}`,
    ref_heb: null,
    korean: (p.korean_text as string | null) ?? '',
    tags: (p.tags as string[] | null) ?? [],
    difficulty: p.difficulty === 'beginner' ? 1 : p.difficulty === 'intermediate' ? 3 : 5,
    grammar_points: (p.grammar_points as string[] | null) ?? null,
    syntax_diagram: (p.syntax_diagram as Passage['syntax_diagram']) ?? null,
    syntax_note: (p.syntax_note as string | null) ?? null,
  }

  // ── 2. words 목록 fetch (word_order 순) ──
  const { data: wordsData, error: wordsError } = await supabase
    .from('words')
    .select(
      `id, word_order, hebrew, transliteration, gloss,
       lemma, root, root_meaning, pos_korean, binyan, tense, pgn,
       morph_parts, learning_note, related_words, context_examples`
    )
    .eq('passage_id', id)
    .order('word_order')

  const words: Word[] = wordsError || !wordsData ? [] : (wordsData as Word[])

  // ── 3. roots 테이블로 words.root / root_meaning 보강 ──
  // words.root가 null인 경우 roots.derived_words[].strongs = words.lemma 숫자로 매핑
  const { data: rootsData } = await supabase
    .from('roots')
    .select('root, meaning_korean, derived_words')

  if (rootsData && rootsData.length > 0) {
    // Strong's 번호 → { root, meaning_korean } 역방향 맵 구축
    const rootByStrongs = new Map<string, { root: string; meaning: string }>()
    for (const r of rootsData) {
      const derived = r.derived_words as Array<{ strongs?: string }> | null
      if (!derived) continue
      for (const dw of derived) {
        if (dw.strongs && !rootByStrongs.has(dw.strongs)) {
          rootByStrongs.set(dw.strongs, {
            root: r.root as string,
            meaning: (r.meaning_korean as string) ?? '',
          })
        }
      }
    }

    // words.lemma에서 Strong's 번호 추출 후 root 데이터 주입
    for (const w of words) {
      if (w.root || w.root_meaning) continue  // 이미 채워진 경우 skip
      if (!w.lemma) continue
      // lemma 형식: "H1254", "Hb/H7225", "Hd/H8064" — 마지막 H 뒤 숫자가 Strong's 번호
      const lastH = w.lemma.lastIndexOf('H')
      if (lastH < 0) continue
      const strongs = w.lemma.slice(lastH + 1).match(/^\d+/)?.[0]
      if (!strongs) continue
      const rootInfo = rootByStrongs.get(strongs)
      if (!rootInfo) continue
      w.root = rootInfo.root
      w.root_meaning = rootInfo.meaning
    }
  }

  // ── 4. semantic_cards fetch (해당 passage의 lemma 집합으로 IN 쿼리) ──
  // words에서 null이 아닌 lemma만 추출 → 중복 제거 → Set → 배열
  const lemmaSet = Array.from(
    new Set(words.map((w) => w.lemma).filter((l): l is string => l !== null))
  )

  let semanticCards: SemanticCard[] = []
  if (lemmaSet.length > 0) {
    const { data: cardsData } = await supabase
      .from('semantic_cards')
      .select(
        'id, lemma, hebrew_word, meaning_label, description, interpretation_tier, is_krv_anchor, context_refs, sort_order'
      )
      .in('lemma', lemmaSet)
      .order('lemma')
      .order('sort_order')

    semanticCards = (cardsData ?? []) as SemanticCard[]
  }

  return (
    <PassageClient
      passage={passage}
      words={words}
      semanticCards={semanticCards}
    />
  )
}
