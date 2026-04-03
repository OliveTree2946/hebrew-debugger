/**
 * generate-syntax-diagrams.mjs
 * passages 테이블 30구절에 통사 구조 분석(syntax_diagram) 생성
 * 실행: node scripts/generate-syntax-diagrams.mjs
 *
 * 업데이트 컬럼:
 *   - syntax_structure: 문장 구조 유형 (VSO, SVO, 명사문 등)
 *   - syntax_note:      통사 구조 설명 (한국어 2-3문장)
 *   - syntax_diagram:   문장 성분 배열 (JSONB)
 */

import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import { dirname, resolve } from 'path'

const __dirname = dirname(fileURLToPath(import.meta.url))
dotenv.config({ path: resolve(__dirname, '../.env.local') })

// ─────────────────────────────────────────
// 클라이언트 초기화
// ─────────────────────────────────────────

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

// ─────────────────────────────────────────
// 프롬프트 생성
// ─────────────────────────────────────────

function buildSyntaxPrompt(passage) {
  return `당신은 성서 히브리어 문법 전문가입니다.
다음 히브리어 구절의 통사 구조를 분석해주세요.

구절: ${passage.book_korean} ${passage.chapter}:${passage.verse_start}
히브리어: ${passage.hebrew_text}
한국어(개역개정): ${passage.korean_text}

각 단어/구를 문장 성분으로 분류하여 아래 JSON 형식으로만 응답하세요.
다른 텍스트 없이 JSON만 출력하세요.

{
  "structure": "VSO" | "SVO" | "명사문" | "와우계속법" 등,
  "note": "이 구절의 통사 구조 설명 (2-3문장, 한국어)",
  "diagram": [
    {
      "role": "동사(V)" | "주어(S)" | "목적어(O)" | "시간부사구" | "전치사구" | "접속사" 등,
      "words": "해당 히브리어 단어들",
      "korean": "한국어 뜻",
      "color": "#F67280"
    }
  ]
}

색상 가이드:
- 동사: "#F67280"
- 주어: "#C3B1E1"
- 목적어: "#85CDCA"
- 부사구/전치사구: "#E8A87C"
- 접속사/관사/표지: "#FFD93D"
- 기타: "#C4A46A"`
}

// ─────────────────────────────────────────
// 구절별 처리
// ─────────────────────────────────────────

async function processPassage(passage, index, total) {
  const ref = `${passage.book_korean} ${passage.chapter}:${passage.verse_start}`
  const prefix = `[${String(index + 1).padStart(2, '0')}/${total}]`

  // 이미 처리된 구절 건너뜀
  if (passage.syntax_diagram && Array.isArray(passage.syntax_diagram) && passage.syntax_diagram.length > 0) {
    console.log(`⏭  ${prefix} ${ref.padEnd(16)} — 이미 처리됨`)
    return { success: true, skipped: true }
  }

  const prompt = buildSyntaxPrompt(passage)

  let responseText = ''
  try {
    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 2048,
      messages: [{ role: 'user', content: prompt }],
    })
    responseText = message.content[0].text
  } catch (apiErr) {
    console.error(`❌ ${prefix} ${ref} — API 오류: ${apiErr.message}`)
    return { success: false }
  }

  // JSON 파싱
  let parsed
  try {
    const clean = responseText.replace(/```json\n?|\n?```/g, '').trim()
    parsed = JSON.parse(clean)
  } catch (parseErr) {
    console.error(`❌ ${prefix} ${ref} — JSON 파싱 실패`)
    console.error('   응답 미리보기:', responseText.slice(0, 200))
    return { success: false }
  }

  if (!parsed.diagram || !Array.isArray(parsed.diagram)) {
    console.error(`❌ ${prefix} ${ref} — 응답 형식 오류 (diagram 배열 없음)`)
    return { success: false }
  }

  // Supabase UPDATE
  const { error: updateErr } = await supabase
    .from('passages')
    .update({
      syntax_structure: parsed.structure ?? null,
      syntax_note: parsed.note ?? null,
      syntax_diagram: parsed.diagram,
    })
    .eq('id', passage.id)

  if (updateErr) {
    console.error(`❌ ${prefix} ${ref} — UPDATE 실패: ${updateErr.message}`)
    return { success: false }
  }

  const diagramCount = parsed.diagram.length
  console.log(
    `✅ ${prefix} ${ref.padEnd(16)} — [${parsed.structure ?? '?'}] 성분 ${diagramCount}개`
  )
  return { success: true, diagramCount }
}

// ─────────────────────────────────────────
// 메인
// ─────────────────────────────────────────

async function main() {
  console.log('\n📊 generate-syntax-diagrams — 통사 구조 분석 시작')
  console.log('   모델: claude-sonnet-4-6')
  console.log('   예상 호출: 최대 30회')
  console.log('   예상 비용: ~$0.15~$0.30\n')

  // passages 30개 조회
  const { data: passages, error: fetchErr } = await supabase
    .from('passages')
    .select('id, hebrew_text, korean_text, book_korean, chapter, verse_start, syntax_diagram')
    .order('id')

  if (fetchErr) {
    console.error('❌ passages 조회 실패:', fetchErr.message)
    process.exit(1)
  }

  if (!passages || passages.length === 0) {
    console.error('❌ passages 테이블이 비어 있습니다. seed-passages.mjs를 먼저 실행하세요.')
    process.exit(1)
  }

  console.log(`📖 총 ${passages.length}개 구절 조회됨\n`)
  console.log('─'.repeat(60))

  let successCount = 0
  let skipCount = 0
  let failCount = 0

  for (let i = 0; i < passages.length; i++) {
    const result = await processPassage(passages[i], i, passages.length)

    if (result.success && result.skipped) {
      skipCount++
    } else if (result.success) {
      successCount++
    } else {
      failCount++
    }

    // API 호출한 경우만 1초 대기
    if (i < passages.length - 1 && result.success && !result.skipped) {
      await sleep(1000)
    }
  }

  console.log('\n' + '─'.repeat(60))
  console.log('📊 완료')
  console.log(`   성공: ${successCount}개`)
  console.log(`   건너뜀: ${skipCount}개 (이미 처리됨)`)
  console.log(`   실패: ${failCount}개`)
  console.log('\n📋 검증 쿼리:')
  console.log("   SELECT id, book_korean, chapter, verse_start, syntax_structure,")
  console.log("          jsonb_array_length(syntax_diagram) AS diagram_count")
  console.log("   FROM passages ORDER BY id;")
}

main()
