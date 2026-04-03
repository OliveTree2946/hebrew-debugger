/**
 * types/index.ts
 * 본문 분석 뷰 공유 타입 정의
 * DB 스키마: passages, words, semantic_cards 테이블
 */

// ─────────────────────────────────────────
// UI 색상 포함 형태론 파트 (words.morph_parts 컬럼)
// ─────────────────────────────────────────

export interface MorphPartItem {
  text: string      // 히브리어 텍스트 (해당 부분)
  role: string      // 역할 한국어: "전치사", "접속사", "명사 어간" 등
  meaning: string   // 의미 한국어: "~에(in)", "그리고" 등
  color: string     // UI_DESIGN_SYSTEM.md 색상 코드
}

// ─────────────────────────────────────────
// 파생 단어 항목 (words.related_words 컬럼)
// ─────────────────────────────────────────

export interface RelatedWord {
  w: string   // 히브리어 단어
  m: string   // 의미 한국어
}

// ─────────────────────────────────────────
// 통사 구조 다이어그램 항목 (passages.syntax_diagram 컬럼)
// ─────────────────────────────────────────

export interface SyntaxDiagramRow {
  role: string    // 통사 역할: "주어", "술어", "목적어" 등
  words: string   // 해당 히브리어 단어(들)
  korean: string  // 한국어 번역
  color: string   // 표시 색상 코드
}

// ─────────────────────────────────────────
// passages 테이블 행 타입
// ─────────────────────────────────────────

export interface Passage {
  id: string
  ref: string
  ref_heb: string | null
  korean: string
  tags: string[]
  difficulty: number | null
  grammar_points: string[] | null
  syntax_diagram: SyntaxDiagramRow[] | null
  syntax_note: string | null
}

// ─────────────────────────────────────────
// words 테이블 행 타입
// ─────────────────────────────────────────

export interface Word {
  id: string
  word_order: number
  hebrew: string
  transliteration: string | null
  gloss: string | null
  lemma: string | null
  root: string | null
  root_meaning: string | null
  pos_korean: string | null
  binyan: string | null
  tense: string | null
  pgn: string | null
  morph_parts: MorphPartItem[] | null
  learning_note: string | null
  related_words: RelatedWord[] | null
  context_examples: string[] | null
}

// ─────────────────────────────────────────
// 의미 카드 해석 등급
// ─────────────────────────────────────────

export type InterpretationTier = 'mainstream' | 'alternative' | 'academic'

// ─────────────────────────────────────────
// semantic_cards 테이블 행 타입
// ─────────────────────────────────────────

export interface SemanticCard {
  id: string
  lemma: string
  hebrew_word: string | null
  meaning_label: string
  description: string | null
  interpretation_tier: InterpretationTier
  is_krv_anchor: boolean | null
  context_refs: string[] | null
  sort_order: number | null
}

// ─────────────────────────────────────────
// drill_questions 테이블 행 타입
// ─────────────────────────────────────────

export type DrillCategory = 'binyan_id' | 'full_parsing'

export interface DrillQuestion {
  id: string
  category: DrillCategory
  verb: string        // 히브리어 동사 형태
  root: string        // 어근 (예: "כ-ת-ב")
  meaning: string     // 어근 의미 한국어
  correct_answer: string
  options: string[]   // binyan_id: 7개 빈야님 이름, full_parsing: 사용 안 함
  hint: string
  reference: string   // 성경 구절 참조 (예: "창 1:1")
  difficulty: number  // 1–5
}
