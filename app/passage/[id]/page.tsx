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

  // ── 3. semantic_cards fetch (해당 passage의 lemma 집합으로 IN 쿼리) ──
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
