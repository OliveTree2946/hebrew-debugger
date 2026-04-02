/**
 * generate-learning-notes.mjs
 * Stage 5: words 테이블의 learning_note, pgn, related_words 컬럼 생성
 * 실행: node scripts/generate-learning-notes.mjs
 *
 * 처리 단위: 단어 3개씩 청크 분할 — 1 API 호출 = 3개 단어
 * (구절 단위 1회 호출 시 4096토큰 초과로 JSON 잘림 문제 해결)
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

/** ms 대기 유틸 */
function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

// ─────────────────────────────────────────
// 비용 사전 보고
// ─────────────────────────────────────────

console.log('\n📊 Stage 5 — 학습 노트 생성 비용 예측')
console.log('   모델: claude-sonnet-4-6')
console.log('   예상 호출: 최대 30회 (이미 처리된 구절 제외)')
console.log('   예상 비용: ~$0.10~$0.20 (Haiku 기준)')
console.log('   ⚡ 시작합니다...\n')

// ─────────────────────────────────────────
// 메인 로직
// ─────────────────────────────────────────

async function buildPrompt(passageRef, hebrewText, words) {
  /** Claude 프롬프트 조합 (DATA_PIPELINE.md §2 Stage 5) */
  const parsedWordsJson = words.map((w) => ({
    word_id: w.id,
    hebrew: w.hebrew,
    lemma: w.lemma,
    pos: w.pos_korean,
    morph_code: w.morph_code,
    root: w.root ?? null,
    binyan: w.binyan ?? null,
    tense: w.tense ?? null,
  }))

  return `당신은 한국 신대원에서 성서 히브리어를 가르치는 교수입니다.
다음 구절의 각 단어에 대해 MDiv 신학생을 위한 학습 노트를 작성하세요.

구절: ${passageRef}
히브리어: ${hebrewText}
각 단어 파싱: ${JSON.stringify(parsedWordsJson, null, 2)}

각 단어에 대해 다음을 포함하세요:
1. 형태론적 특이점 (불규칙 변화, 주의할 모음 변화, 후음자 영향 등)
2. 같은 어근의 다른 성경 용례 2~3개 (책명:장:절 형식)
3. 개역개정 번역과 원문의 뉘앙스 차이 (있는 경우)
4. 이 단어가 자주 혼동되는 다른 단어 (있는 경우)

다음 JSON 형식으로만 응답하세요. 다른 텍스트는 포함하지 마세요:
{
  "words": [
    {
      "word_id": <words 테이블 id>,
      "learning_note": "학습 노트 텍스트 (200자 이내)",
      "pgn": "인칭·성·수 설명 (예: '3인칭 · 남성 · 단수', 동사가 아니면 해당 항목만)",
      "related_words": [
        {"word": "히브리어", "meaning": "한국어 뜻"}
      ]
    }
  ]
}`
}

async function processPassage(passage, index, total) {
  const prefix = `[${String(index + 1).padStart(2, '0')}/${total}]`
  // reference 문자열 생성 (예: "창세기 1:1")
  passage.reference = `${passage.book_korean} ${passage.chapter}:${passage.verse_start}`

  // 해당 구절의 단어 조회
  const { data: words, error: wordsErr } = await supabase
    .from('words')
    .select('id, hebrew, lemma, pos_korean, morph_code, root, binyan, tense, learning_note')
    .eq('passage_id', passage.id)
    .order('word_order')

  if (wordsErr) {
    console.error(`❌ ${prefix} ${passage.reference} — 단어 조회 실패: ${wordsErr.message}`)
    return { success: false }
  }

  if (!words || words.length === 0) {
    console.log(`⏭  ${prefix} ${passage.reference} — 단어 없음, 건너뜀`)
    return { success: true, skipped: true }
  }

  // 단어 단위 skip 판정: learning_note가 NULL인 단어가 하나라도 있으면 재처리
  const unprocessed = words.filter((w) => w.learning_note === null)
  if (unprocessed.length === 0) {
    console.log(`⏭  ${prefix} ${passage.reference} — 전체 단어 처리 완료 (${words.length}개), 건너뜀`)
    return { success: true, skipped: true }
  }

  // 단어 3개씩 청크 분할 후 청크별 API 호출
  const CHUNK_SIZE = 3
  const chunks = []
  for (let i = 0; i < unprocessed.length; i += CHUNK_SIZE) {
    chunks.push(unprocessed.slice(i, i + CHUNK_SIZE))
  }

  /** 전체 청크에서 합산된 결과 */
  const allItems = []
  let chunkFail = 0

  for (let c = 0; c < chunks.length; c++) {
    const chunk = chunks[c]
    const prompt = await buildPrompt(passage.reference, passage.hebrew_text, chunk)

    let responseText = ''
    try {
      const message = await anthropic.messages.create({
        model: 'claude-sonnet-4-6',
        max_tokens: 4096,
        messages: [{ role: 'user', content: prompt }],
      })
      responseText = message.content[0].text
    } catch (apiErr) {
      console.error(`❌ ${prefix} ${passage.reference} 청크${c + 1} — API 오류: ${apiErr.message}`)
      chunkFail++
      continue
    }

    try {
      const clean = responseText.replace(/```json\n?|\n?```/g, '').trim()
      const parsed = JSON.parse(clean)
      if (parsed.words && Array.isArray(parsed.words)) {
        allItems.push(...parsed.words)
      } else {
        console.error(`❌ ${prefix} ${passage.reference} 청크${c + 1} — 응답 형식 오류`)
        chunkFail++
      }
    } catch (parseErr) {
      console.error(`❌ ${prefix} ${passage.reference} 청크${c + 1} — JSON 파싱 실패`)
      console.error('   응답 미리보기:', responseText.slice(0, 200))
      chunkFail++
    }

    // 청크 간 대기 (마지막 청크 제외)
    if (c < chunks.length - 1) {
      await sleep(2000)
    }
  }

  if (allItems.length === 0) {
    console.error(`❌ ${prefix} ${passage.reference} — 모든 청크 실패`)
    return { success: false }
  }

  // Supabase 업데이트 (합산된 결과, 실패 시 최대 3회 재시도)
  let updateCount = 0
  for (const item of allItems) {
    if (!item.word_id) continue

    let lastErr = null
    for (let attempt = 1; attempt <= 3; attempt++) {
      const { error: updateErr } = await supabase
        .from('words')
        .update({
          learning_note: item.learning_note ?? null,
          pgn: item.pgn ?? null,
          related_words: item.related_words ?? null,
        })
        .eq('id', item.word_id)

      if (!updateErr) {
        updateCount++
        lastErr = null
        break
      }
      lastErr = updateErr
    }
    if (lastErr) {
      console.error(`   ⚠️  word_id ${item.word_id} 업데이트 실패 (3회 시도): ${lastErr.message}`)
    }
  }

  const chunkInfo = chunkFail > 0 ? ` (청크 실패 ${chunkFail}개)` : ''
  console.log(`✅ ${prefix} ${passage.reference.padEnd(20)} — 단어 ${updateCount}/${unprocessed.length}개 업데이트${chunkInfo}`)
  return { success: true, count: updateCount }
}

async function main() {
  // 모든 passage 조회 (reference 컬럼 없음 — book_korean + chapter + verse_start 조합)
  const { data: passages, error: passErr } = await supabase
    .from('passages')
    .select('id, book_korean, chapter, verse_start, hebrew_text')
    .order('id')

  if (passErr) {
    console.error('❌ passages 조회 실패:', passErr.message)
    process.exit(1)
  }

  console.log(`📖 총 ${passages.length}개 구절 처리 시작\n`)
  console.log('─'.repeat(60))

  let successCount = 0
  let skipCount = 0
  let failCount = 0
  let totalWords = 0

  for (let i = 0; i < passages.length; i++) {
    const result = await processPassage(passages[i], i, passages.length)

    if (result.success && result.skipped) {
      skipCount++
    } else if (result.success) {
      successCount++
      totalWords += result.count ?? 0
    } else {
      failCount++
    }

    // 마지막 구절이 아니고 실제 API 호출한 경우만 대기
    if (i < passages.length - 1 && result.success && !result.skipped) {
      await sleep(10000) // Rate limit 대응: 10초 대기 (Sonnet 4.6 분당 50회, 구절당 최대 3회)
    }
  }

  console.log('\n' + '─'.repeat(60))
  console.log('📊 Stage 5 완료')
  console.log(`   성공: ${successCount}개 구절 (단어 ${totalWords}개 업데이트)`)
  console.log(`   건너뜀: ${skipCount}개 구절 (이미 처리됨)`)
  console.log(`   실패: ${failCount}개 구절`)
  if (failCount > 0) {
    console.log('⚠️  실패한 구절은 다시 실행하면 재처리됩니다.')
  } else {
    console.log('🎉 모든 구절 학습 노트 생성 완료!')
  }
  console.log('\n📋 검증 쿼리:')
  console.log('   SELECT COUNT(*) FROM words WHERE learning_note IS NOT NULL;')
  console.log('   -- 기대값: ~380')
}

main()
