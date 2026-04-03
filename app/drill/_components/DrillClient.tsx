'use client'

/**
 * DrillClient.tsx
 * 빈야님 드릴 — 클라이언트 인터랙션 컴포넌트
 * 학습(learn) → 퀴즈(quiz) → 결과(result) 3단계 플로우
 */

import { useState } from 'react'
import Link from 'next/link'
import type { DrillQuestion } from '@/types/index'

// ─────────────────────────────────────────
// 색상 토큰 (UI_DESIGN_SYSTEM.md)
// ─────────────────────────────────────────
const C = {
  bg: '#12100D',
  gold: '#C4A46A',
  textPrimary: '#E8DCC8',
  textMuted: 'rgba(232,220,200,0.6)',
  textFaint: 'rgba(232,220,200,0.25)',
  border: 'rgba(196,164,106,0.15)',
  cardBg: 'rgba(255,255,255,0.03)',
  correct: 'rgba(133,205,202,0.15)',
  correctBorder: '#85CDCA',
  wrong: 'rgba(246,114,128,0.15)',
  wrongBorder: '#F67280',
}

// ─────────────────────────────────────────
// 7개 빈야님 정보 (하드코딩)
// ─────────────────────────────────────────
const BINYAN_INFO = [
  {
    name: '칼', heb: 'קַל', eng: 'Qal', meaning: '기본 능동',
    example: 'כָּתַב', exTr: '그가 썼다', color: '#F67280',
    marker: '기본형 (접두어/다게쉬 없음)',
  },
  {
    name: '니팔', heb: 'נִפְעַל', eng: 'Niphal', meaning: '수동/재귀',
    example: 'נִכְתַּב', exTr: '쓰여졌다', color: '#85CDCA',
    marker: '접두어 נִ',
  },
  {
    name: '피엘', heb: 'פִּעֵל', eng: 'Piel', meaning: '강의/사역',
    example: 'כִּתֵּב', exTr: '기록했다', color: '#C3B1E1',
    marker: '중간 자음 다게쉬(ּ)',
  },
  {
    name: '푸알', heb: 'פֻּעַל', eng: 'Pual', meaning: '피엘의 수동',
    example: 'כֻּתַּב', exTr: '기록되었다', color: '#A8D8EA',
    marker: '쿠부츠(ֻ) + 다게쉬',
  },
  {
    name: '히필', heb: 'הִפְעִיל', eng: 'Hiphil', meaning: '사역 능동',
    example: 'הִכְתִּיב', exTr: '쓰게 했다', color: '#E8A87C',
    marker: '접두어 הִ + 중간 ִי',
  },
  {
    name: '호팔', heb: 'הֻפְעַל', eng: 'Hophal', meaning: '사역 수동',
    example: 'הֻכְתַּב', exTr: '쓰게 되었다', color: '#FFD93D',
    marker: '접두어 הֻ',
  },
  {
    name: '히트파엘', heb: 'הִתְפַּעֵל', eng: 'Hitpael', meaning: '재귀/반복',
    example: 'הִתְכַּתֵּב', exTr: '서로 편지했다', color: '#FF9A9E',
    marker: '접두어 הִתְ',
  },
]

// ─────────────────────────────────────────
// 상태 타입
// ─────────────────────────────────────────
type Phase = 'learn' | 'quiz' | 'result'
type AnswerState = string | null

interface ResultItem {
  verb: string
  correct: boolean
  answer: string
  correctAnswer: string
  category: string
}

// ─────────────────────────────────────────
// Props
// ─────────────────────────────────────────
interface DrillClientProps {
  questions: DrillQuestion[]
}

// ─────────────────────────────────────────
// 메인 컴포넌트
// ─────────────────────────────────────────
export default function DrillClient({ questions }: DrillClientProps) {
  const [phase, setPhase] = useState<Phase>('learn')
  const [qIdx, setQIdx] = useState<number>(0)
  const [score, setScore] = useState<number>(0)
  const [answered, setAnswered] = useState<AnswerState>(null)
  const [showHint, setShowHint] = useState<boolean>(false)
  const [textInput, setTextInput] = useState<string>('')
  const [results, setResults] = useState<ResultItem[]>([])

  // 모든 상태 초기화
  const resetAll = () => {
    setPhase('learn')
    setQIdx(0)
    setScore(0)
    setAnswered(null)
    setShowHint(false)
    setTextInput('')
    setResults([])
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        background: C.bg,
        color: C.textPrimary,
        fontFamily: "'Noto Sans KR', sans-serif",
        padding: '0 16px',
        maxWidth: 700,
        margin: '0 auto',
      }}
    >
      {/* 상단 네비게이션 */}
      <nav style={{ paddingTop: 24, paddingBottom: 8, display: 'flex', alignItems: 'center', gap: 12 }}>
        <Link
          href="/"
          style={{
            color: C.textMuted,
            textDecoration: 'none',
            fontSize: 14,
            display: 'flex',
            alignItems: 'center',
            gap: 4,
          }}
        >
          ← 본문 분석
        </Link>
        <span style={{ color: C.textFaint, fontSize: 14 }}>/</span>
        <span style={{ color: C.gold, fontSize: 14 }}>빈야님 드릴</span>
      </nav>

      {/* 페이지 제목 */}
      <header style={{ marginBottom: 32, paddingTop: 16 }}>
        <p style={{ color: C.textFaint, fontSize: 11, letterSpacing: '0.12em', marginBottom: 6 }}>
          SEED STUDIO · BIBLICAL HEBREW
        </p>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: C.textPrimary, margin: 0 }}>
          빈야님 드릴
        </h1>
        <p style={{ color: C.textMuted, fontSize: 13, marginTop: 4 }}>
          히브리어 동사 형태 식별 훈련
        </p>
      </header>

      {/* 페이즈별 렌더링 */}
      {phase === 'learn' && (
        <LearnPhase onStart={() => setPhase('quiz')} />
      )}
      {phase === 'quiz' && questions.length > 0 && (
        <QuizPhase
          questions={questions}
          qIdx={qIdx}
          score={score}
          answered={answered}
          showHint={showHint}
          textInput={textInput}
          setAnswered={setAnswered}
          setShowHint={setShowHint}
          setTextInput={setTextInput}
          onAnswer={(isCorrect: boolean, chosen: string) => {
            const q = questions[qIdx]
            setResults((prev) => [
              ...prev,
              {
                verb: q.verb,
                correct: isCorrect,
                answer: chosen,
                correctAnswer: q.correct_answer,
                category: q.category,
              },
            ])
            if (isCorrect) setScore((s) => s + 1)
          }}
          onNext={() => {
            setAnswered(null)
            setShowHint(false)
            setTextInput('')
            if (qIdx + 1 >= questions.length) {
              setPhase('result')
            } else {
              setQIdx((i) => i + 1)
            }
          }}
        />
      )}
      {phase === 'quiz' && questions.length === 0 && (
        <div style={{ textAlign: 'center', padding: '60px 0', color: C.textMuted }}>
          등록된 문제가 없습니다.
        </div>
      )}
      {phase === 'result' && (
        <ResultPhase
          score={score}
          results={results}
          onReset={resetAll}
        />
      )}
    </div>
  )
}

// ─────────────────────────────────────────
// Phase 1: 학습 화면
// ─────────────────────────────────────────
function LearnPhase({ onStart }: { onStart: () => void }) {
  return (
    <div>
      {/* 안내 텍스트 */}
      <div
        style={{
          background: 'rgba(196,164,106,0.07)',
          border: `1px solid ${C.border}`,
          borderRadius: 10,
          padding: '16px 20px',
          marginBottom: 28,
        }}
      >
        <p style={{ color: C.textMuted, fontSize: 13, margin: 0, lineHeight: 1.7 }}>
          히브리어 동사는 어근(3자음)에 빈야님(stem) 패턴을 입혀 의미를 변형합니다.
          어근{' '}
          <span
            style={{
              fontFamily: "'Noto Serif Hebrew', serif",
              direction: 'rtl',
              unicodeBidi: 'isolate',
              color: C.gold,
              fontSize: 15,
            }}
          >
            כ-ת-ב
          </span>{' '}
          (쓰다)를 예시로 7가지 빈야님을 학습하세요.
        </p>
      </div>

      {/* 빈야님 카드 목록 */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 36 }}>
        {BINYAN_INFO.map((b) => (
          <BinyanCard key={b.name} info={b} />
        ))}
      </div>

      {/* 드릴 시작 버튼 */}
      <div style={{ textAlign: 'center', paddingBottom: 48 }}>
        <button
          onClick={onStart}
          style={{
            background: C.gold,
            color: '#12100D',
            border: 'none',
            borderRadius: 8,
            padding: '14px 36px',
            fontSize: 15,
            fontWeight: 700,
            cursor: 'pointer',
            fontFamily: "'Noto Sans KR', sans-serif",
          }}
        >
          드릴 시작하기 →
        </button>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────
// 빈야님 카드 (학습 화면용)
// ─────────────────────────────────────────
interface BinyanInfo {
  name: string
  heb: string
  eng: string
  meaning: string
  example: string
  exTr: string
  color: string
  marker: string
}

function BinyanCard({ info }: { info: BinyanInfo }) {
  return (
    <div
      style={{
        background: C.cardBg,
        border: `1px solid ${C.border}`,
        borderLeft: `3px solid ${info.color}`,
        borderRadius: 8,
        padding: '14px 18px',
        display: 'grid',
        gridTemplateColumns: '1fr auto',
        gap: '8px 16px',
        alignItems: 'start',
      }}
    >
      {/* 왼쪽: 이름 + 의미 + 표지 */}
      <div>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 4 }}>
          <span style={{ color: info.color, fontWeight: 700, fontSize: 15 }}>{info.name}</span>
          <span style={{ color: C.textFaint, fontSize: 12 }}>{info.eng}</span>
          <span style={{ color: C.textMuted, fontSize: 13 }}>— {info.meaning}</span>
        </div>
        <p style={{ color: C.textFaint, fontSize: 12, margin: 0 }}>식별: {info.marker}</p>
      </div>

      {/* 오른쪽: 히브리어 예시 */}
      <div style={{ textAlign: 'right' }}>
        <span
          style={{
            fontFamily: "'Noto Serif Hebrew', serif",
            direction: 'rtl',
            unicodeBidi: 'isolate',
            fontSize: 22,
            color: C.textPrimary,
            display: 'block',
          }}
        >
          {info.example}
        </span>
        <span style={{ fontSize: 11, color: C.textFaint }}>{info.exTr}</span>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────
// Phase 2: 퀴즈 화면
// ─────────────────────────────────────────
interface QuizPhaseProps {
  questions: DrillQuestion[]
  qIdx: number
  score: number
  answered: AnswerState
  showHint: boolean
  textInput: string
  setAnswered: (v: AnswerState) => void
  setShowHint: (v: boolean) => void
  setTextInput: (v: string) => void
  onAnswer: (isCorrect: boolean, chosen: string) => void
  onNext: () => void
}

function QuizPhase({
  questions,
  qIdx,
  score,
  answered,
  showHint,
  textInput,
  setAnswered,
  setShowHint,
  setTextInput,
  onAnswer,
  onNext,
}: QuizPhaseProps) {
  const q = questions[qIdx]
  const total = questions.length
  const isLast = qIdx + 1 >= total

  const handleSelect = (option: string) => {
    if (answered !== null) return
    const isCorrect = option === q.correct_answer
    setAnswered(option)
    onAnswer(isCorrect, option)
  }

  const handleTextSubmit = () => {
    if (answered !== null) return
    const trimmed = textInput.trim()
    const isCorrect = trimmed === q.correct_answer.trim()
    setAnswered(trimmed)
    onAnswer(isCorrect, trimmed)
  }

  return (
    <div style={{ paddingBottom: 48 }}>
      {/* 진행 표시 + 점수 */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 20,
        }}
      >
        <span style={{ color: C.textMuted, fontSize: 13 }}>
          문제 {qIdx + 1} / {total}
        </span>
        <span style={{ color: C.gold, fontSize: 13 }}>점수: {score}</span>
      </div>

      {/* 진행률 바 */}
      <div
        style={{
          height: 3,
          background: 'rgba(255,255,255,0.06)',
          borderRadius: 2,
          marginBottom: 28,
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            height: '100%',
            width: `${((qIdx + 1) / total) * 100}%`,
            background: C.gold,
            borderRadius: 2,
            transition: 'width 0.3s ease',
          }}
        />
      </div>

      {/* 문제 카드 */}
      <div
        style={{
          background: C.cardBg,
          border: `1px solid ${C.border}`,
          borderRadius: 12,
          padding: '28px 24px',
          marginBottom: 20,
          textAlign: 'center',
        }}
      >
        <p style={{ color: C.textFaint, fontSize: 12, marginBottom: 16 }}>
          이 동사의 빈얀은?
        </p>
        {/* 히브리어 동사 */}
        <div
          style={{
            fontFamily: "'Noto Serif Hebrew', serif",
            direction: 'rtl',
            unicodeBidi: 'isolate',
            fontSize: 40,
            color: C.gold,
            marginBottom: 12,
            lineHeight: 1.4,
          }}
        >
          {q.verb}
        </div>
        {/* 어근 · 의미 */}
        <p style={{ color: 'rgba(232,220,200,0.5)', fontSize: 13, margin: '0 0 6px' }}>
          어근:{' '}
          <span
            style={{
              fontFamily: "'Noto Serif Hebrew', serif",
              direction: 'rtl',
              unicodeBidi: 'isolate',
            }}
          >
            {q.root}
          </span>{' '}
          · {q.meaning}
        </p>
        {/* 참조 */}
        <p style={{ color: 'rgba(232,220,200,0.25)', fontSize: 11, margin: 0 }}>
          {q.reference}
        </p>
      </div>

      {/* 힌트 버튼 */}
      {!answered && (
        <div style={{ textAlign: 'center', marginBottom: 20 }}>
          <button
            onClick={() => setShowHint(true)}
            style={{
              background: 'transparent',
              border: `1px solid ${C.border}`,
              borderRadius: 6,
              padding: '6px 16px',
              color: C.textFaint,
              fontSize: 12,
              cursor: 'pointer',
              fontFamily: "'Noto Sans KR', sans-serif",
            }}
          >
            {showHint ? q.hint : '힌트 보기'}
          </button>
        </div>
      )}

      {/* 선택지: binyan_id → 버튼 그리드, full_parsing → 텍스트 입력 */}
      {q.category === 'binyan_id' ? (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: 10,
            marginBottom: 20,
          }}
        >
          {q.options.map((opt) => {
            const isSelected = answered === opt
            const isCorrectOpt = opt === q.correct_answer
            let bg = 'rgba(255,255,255,0.04)'
            let border = 'rgba(255,255,255,0.08)'
            let textColor = C.textPrimary

            if (answered !== null) {
              if (isCorrectOpt) {
                bg = C.correct
                border = C.correctBorder
                textColor = C.correctBorder
              } else if (isSelected && !isCorrectOpt) {
                bg = C.wrong
                border = C.wrongBorder
                textColor = C.wrongBorder
              }
            }

            return (
              <button
                key={opt}
                onClick={() => handleSelect(opt)}
                disabled={answered !== null}
                style={{
                  background: bg,
                  border: `1px solid ${border}`,
                  borderRadius: 8,
                  padding: '12px 8px',
                  color: textColor,
                  fontSize: 14,
                  cursor: answered !== null ? 'default' : 'pointer',
                  fontFamily: "'Noto Sans KR', sans-serif",
                  transition: 'all 0.15s ease',
                }}
              >
                {opt}
              </button>
            )
          })}
        </div>
      ) : (
        /* full_parsing: 텍스트 입력 필드 */
        <div style={{ marginBottom: 20 }}>
          <input
            type="text"
            value={textInput}
            onChange={(e) => setTextInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && answered === null) handleTextSubmit()
            }}
            disabled={answered !== null}
            placeholder="파싱 정보를 입력하세요 (예: 칼 완료 3남단)"
            style={{
              width: '100%',
              background: 'rgba(255,255,255,0.04)',
              border: `1px solid ${answered === null ? 'rgba(255,255,255,0.12)' : answered.trim() === q.correct_answer.trim() ? C.correctBorder : C.wrongBorder}`,
              borderRadius: 8,
              padding: '12px 14px',
              color: C.textPrimary,
              fontSize: 14,
              fontFamily: "'Noto Sans KR', sans-serif",
              outline: 'none',
              boxSizing: 'border-box',
            }}
          />
          {answered === null && (
            <button
              onClick={handleTextSubmit}
              style={{
                marginTop: 10,
                background: C.gold,
                color: '#12100D',
                border: 'none',
                borderRadius: 8,
                padding: '10px 24px',
                fontSize: 14,
                fontWeight: 700,
                cursor: 'pointer',
                fontFamily: "'Noto Sans KR', sans-serif",
              }}
            >
              제출
            </button>
          )}
        </div>
      )}

      {/* 정답/오답 피드백 */}
      {answered !== null && (
        <FeedbackBox
          isCorrect={answered === q.correct_answer || answered.trim() === q.correct_answer.trim()}
          correctAnswer={q.correct_answer}
          hint={q.hint}
          isLast={isLast}
          onNext={onNext}
        />
      )}
    </div>
  )
}

// ─────────────────────────────────────────
// 피드백 박스 (정답/오답 후 표시)
// ─────────────────────────────────────────
interface FeedbackBoxProps {
  isCorrect: boolean
  correctAnswer: string
  hint: string
  isLast: boolean
  onNext: () => void
}

function FeedbackBox({ isCorrect, correctAnswer, hint, isLast, onNext }: FeedbackBoxProps) {
  return (
    <div
      style={{
        background: isCorrect ? C.correct : C.wrong,
        border: `1px solid ${isCorrect ? C.correctBorder : C.wrongBorder}`,
        borderRadius: 10,
        padding: '16px 18px',
        marginBottom: 20,
      }}
    >
      <p
        style={{
          color: isCorrect ? C.correctBorder : C.wrongBorder,
          fontWeight: 700,
          fontSize: 14,
          margin: '0 0 6px',
        }}
      >
        {isCorrect ? '✓ 정답입니다!' : `✗ 오답 — 정답: ${correctAnswer}`}
      </p>
      <p style={{ color: C.textMuted, fontSize: 13, margin: '0 0 14px' }}>{hint}</p>
      <button
        onClick={onNext}
        style={{
          background: C.gold,
          color: '#12100D',
          border: 'none',
          borderRadius: 8,
          padding: '10px 24px',
          fontSize: 14,
          fontWeight: 700,
          cursor: 'pointer',
          fontFamily: "'Noto Sans KR', sans-serif",
        }}
      >
        {isLast ? '결과 보기' : '다음 문제 →'}
      </button>
    </div>
  )
}

// ─────────────────────────────────────────
// Phase 3: 결과 화면
// ─────────────────────────────────────────
interface ResultPhaseProps {
  score: number
  results: ResultItem[]
  onReset: () => void
}

function ResultPhase({ score, results, onReset }: ResultPhaseProps) {
  const total = results.length
  const ratio = total > 0 ? score / total : 0
  const emoji = ratio >= 0.8 ? '🎉' : ratio >= 0.5 ? '💪' : '📖'
  const message =
    ratio >= 0.8
      ? '훌륭합니다! 빈야님 식별 실력이 뛰어납니다.'
      : ratio >= 0.5
      ? '잘 하고 있습니다. 조금 더 연습해 보세요.'
      : '다시 학습 자료를 복습하고 도전해 보세요.'

  return (
    <div style={{ paddingBottom: 48 }}>
      {/* 결과 요약 */}
      <div
        style={{
          background: C.cardBg,
          border: `1px solid ${C.border}`,
          borderRadius: 12,
          padding: '32px 24px',
          textAlign: 'center',
          marginBottom: 28,
        }}
      >
        <div style={{ fontSize: 40, marginBottom: 12 }}>{emoji}</div>
        <div
          style={{
            fontFamily: "'Cormorant Garamond', serif",
            fontSize: 28,
            color: C.gold,
            marginBottom: 8,
          }}
        >
          {score} / {total}
        </div>
        <p style={{ color: C.textMuted, fontSize: 14, margin: 0 }}>{message}</p>
      </div>

      {/* 문제별 정오답 리스트 */}
      <div style={{ marginBottom: 28 }}>
        <h2 style={{ color: C.textMuted, fontSize: 13, fontWeight: 600, marginBottom: 12 }}>
          문제별 결과
        </h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {results.map((r, i) => (
            <div
              key={i}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                background: C.cardBg,
                border: `1px solid ${C.border}`,
                borderLeft: `3px solid ${r.correct ? C.correctBorder : C.wrongBorder}`,
                borderRadius: 8,
                padding: '10px 14px',
              }}
            >
              {/* 정오답 아이콘 */}
              <span
                style={{
                  color: r.correct ? C.correctBorder : C.wrongBorder,
                  fontSize: 16,
                  flexShrink: 0,
                }}
              >
                {r.correct ? '✓' : '✗'}
              </span>

              {/* 히브리어 동사 */}
              <span
                style={{
                  fontFamily: "'Noto Serif Hebrew', serif",
                  direction: 'rtl',
                  unicodeBidi: 'isolate',
                  fontSize: 18,
                  color: C.gold,
                  flexShrink: 0,
                  minWidth: 60,
                }}
              >
                {r.verb}
              </span>

              {/* 정답 */}
              <div style={{ flex: 1 }}>
                <span style={{ color: C.textPrimary, fontSize: 13 }}>정답: {r.correctAnswer}</span>
                {!r.correct && (
                  <span style={{ color: C.wrongBorder, fontSize: 12, marginLeft: 8 }}>
                    (선택: {r.answer || '미입력'})
                  </span>
                )}
              </div>

              {/* 카테고리 */}
              <span style={{ color: C.textFaint, fontSize: 11, flexShrink: 0 }}>
                {r.category === 'binyan_id' ? '빈야님' : '전체파싱'}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* 다시 학습하기 버튼 */}
      <div style={{ textAlign: 'center' }}>
        <button
          onClick={onReset}
          style={{
            background: 'transparent',
            border: `1px solid ${C.gold}`,
            borderRadius: 8,
            padding: '12px 32px',
            color: C.gold,
            fontSize: 14,
            fontWeight: 600,
            cursor: 'pointer',
            fontFamily: "'Noto Sans KR', sans-serif",
          }}
        >
          다시 학습하기
        </button>
      </div>
    </div>
  )
}
