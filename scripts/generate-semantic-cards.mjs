/**
 * generate-semantic-cards.mjs
 * Stage 6: semantic_cards 테이블에 핵심 30단어 의미 카드 생성 (~90장)
 * 실행: node scripts/generate-semantic-cards.mjs
 *
 * 참조: SEMANTIC_CARDS_SPEC.md §2, §3
 * 설계 원칙:
 *   - 첫 번째 카드: 개역개정 번역 의미 (is_krv_anchor: true)
 *   - 해석 등급: mainstream / alternative / academic
 *   - 카드 수: 단어별 2~4장
 *   - reviewed: false (감수 대기)
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
// 핵심 30단어 목록 (SEMANTIC_CARDS_SPEC.md §3)
// ─────────────────────────────────────────

/**
 * 필드 설명:
 *   hebrew: 히브리어 단어
 *   strong: Strong 번호
 *   root: 어근
 *   krv_translation: 개역개정 대표 번역
 *   semantic_range_hint: 의미 범위 힌트 (Claude 가이드)
 *   card_count: 생성할 카드 수
 */
const CORE_30_WORDS = [
  { hebrew: 'בְּרֵאשִׁית', strong: '7225', root: 'ר-א-שׁ', krv_translation: '태초에', semantic_range_hint: '시작, 첫째, 으뜸, 처음 산물', card_count: 3 },
  { hebrew: 'אֱלֹהִים', strong: '430', root: 'א-ל-ה', krv_translation: '하나님', semantic_range_hint: '신들, 하나님, 재판관, 신성한 존재', card_count: 3 },
  { hebrew: 'בָּרָא', strong: '1254', root: 'ב-ר-א', krv_translation: '창조하다', semantic_range_hint: '무에서 창조, 형성하다, 선택하다', card_count: 3 },
  { hebrew: 'שָׁמַיִם', strong: '8064', root: 'שׁ-מ-י', krv_translation: '하늘', semantic_range_hint: '하늘, 천공, 거처, 우주', card_count: 2 },
  { hebrew: 'אֶרֶץ', strong: '776', root: 'א-ר-צ', krv_translation: '땅', semantic_range_hint: '땅, 지구, 나라, 영토, 흙', card_count: 3 },
  { hebrew: 'יְהוָה', strong: '3068', root: 'ה-י-ה', krv_translation: '여호와', semantic_range_hint: '존재하는 자, 언약의 하나님, 영원한 자', card_count: 3 },
  { hebrew: 'תּוֹרָה', strong: '8451', root: 'י-ר-ה', krv_translation: '율법', semantic_range_hint: '가르침, 지시, 율법, 모세오경', card_count: 3 },
  { hebrew: 'בְּרִית', strong: '1285', root: 'ב-ר-ת', krv_translation: '언약', semantic_range_hint: '계약, 의무, 언약, 동맹', card_count: 3 },
  { hebrew: 'חֶסֶד', strong: '2617', root: 'ח-ס-ד', krv_translation: '인자', semantic_range_hint: '언약적 사랑, 충성, 자비, 은혜', card_count: 4 },
  { hebrew: 'אֱמוּנָה', strong: '530', root: 'א-מ-נ', krv_translation: '성실', semantic_range_hint: '신실함, 믿음, 견고함, 확실성', card_count: 3 },
  { hebrew: 'צְדָקָה', strong: '6666', root: 'צ-ד-ק', krv_translation: '의', semantic_range_hint: '올바름, 의로움, 구원 행위, 자선', card_count: 3 },
  { hebrew: 'מִשְׁפָּט', strong: '4941', root: 'שׁ-פ-ט', krv_translation: '정의', semantic_range_hint: '판결, 정의, 관습, 권리', card_count: 3 },
  { hebrew: 'שָׁלוֹם', strong: '7965', root: 'שׁ-ל-מ', krv_translation: '평강', semantic_range_hint: '온전함, 평화, 번영, 안녕, 완성', card_count: 4 },
  { hebrew: 'נֶפֶשׁ', strong: '5315', root: 'נ-פ-שׁ', krv_translation: '영혼', semantic_range_hint: '목숨, 생명체, 사람, 욕구, 자아', card_count: 4 },
  { hebrew: 'רוּחַ', strong: '7307', root: 'ר-ו-ח', krv_translation: '영', semantic_range_hint: '바람, 숨, 영, 생명 원리', card_count: 4 },
  { hebrew: 'לֵב', strong: '3820', root: 'ל-ב-ב', krv_translation: '마음', semantic_range_hint: '마음, 이성, 의지, 내면, 중심', card_count: 3 },
  { hebrew: 'אַהֲבָה', strong: '160', root: 'א-ה-ב', krv_translation: '사랑', semantic_range_hint: '사랑, 애정, 헌신', card_count: 2 },
  { hebrew: 'יָרֵא', strong: '3372', root: 'י-ר-א', krv_translation: '두려워하다', semantic_range_hint: '두려워하다, 경외하다, 경배하다', card_count: 3 },
  { hebrew: 'שׁוּב', strong: '7725', root: 'שׁ-ו-ב', krv_translation: '돌아오다', semantic_range_hint: '돌이키다, 회개하다, 회복하다, 대답하다', card_count: 3 },
  { hebrew: 'עָשָׂה', strong: '6213', root: 'ע-שׂ-ה', krv_translation: '행하다', semantic_range_hint: '만들다, 하다, 행동하다, 성취하다', card_count: 2 },
  { hebrew: 'דָּבָר', strong: '1697', root: 'ד-ב-ר', krv_translation: '말씀', semantic_range_hint: '말, 사건, 일, 명령, 약속', card_count: 3 },
  { hebrew: 'קוֹל', strong: '6963', root: 'ק-ו-ל', krv_translation: '음성', semantic_range_hint: '소리, 목소리, 천둥, 명성', card_count: 2 },
  { hebrew: 'אוֹר', strong: '216', root: 'א-ו-ר', krv_translation: '빛', semantic_range_hint: '빛, 햇빛, 생명, 구원, 지혜', card_count: 3 },
  { hebrew: 'אֶחָד', strong: '259', root: 'א-ח-ד', krv_translation: '하나', semantic_range_hint: '하나, 첫째, 유일한, 연합', card_count: 3 },
  { hebrew: 'עָם', strong: '5971', root: 'ע-מ-מ', krv_translation: '백성', semantic_range_hint: '백성, 민족, 친족, 군대', card_count: 3 },
  { hebrew: 'מֶלֶךְ', strong: '4428', root: 'מ-ל-כ', krv_translation: '왕', semantic_range_hint: '왕, 통치자, 다스리다', card_count: 2 },
  { hebrew: 'עֶבֶד', strong: '5650', root: 'ע-ב-ד', krv_translation: '종', semantic_range_hint: '종, 신하, 예배자, 섬기는 자', card_count: 3 },
  { hebrew: 'נָבִיא', strong: '5030', root: 'נ-ב-א', krv_translation: '선지자', semantic_range_hint: '대언자, 선포자, 예언자', card_count: 2 },
  { hebrew: 'קָדוֹשׁ', strong: '6918', root: 'ק-ד-שׁ', krv_translation: '거룩한', semantic_range_hint: '거룩함, 분리됨, 헌신됨, 순결함', card_count: 3 },
  { hebrew: 'עוֹלָם', strong: '5769', root: 'ע-ל-מ', krv_translation: '영원', semantic_range_hint: '영원, 오랜 시간, 숨겨진 것, 세상', card_count: 3 },
]

// ─────────────────────────────────────────
// 비용 사전 보고
// ─────────────────────────────────────────

const totalCards = CORE_30_WORDS.reduce((sum, w) => sum + w.card_count, 0)
console.log('\n📊 Stage 6 — 의미 카드 생성 비용 예측')
console.log('   모델: claude-sonnet-4-6 (해석 등급 판단 정확도 필요)')
console.log(`   단어 수: ${CORE_30_WORDS.length}개`)
console.log(`   예상 카드 수: ~${totalCards}장`)
console.log('   예상 호출: 30회')
console.log('   예상 비용: ~$0.30~$0.50 (Sonnet 기준)')
console.log('   ⚡ 시작합니다...\n')

// ─────────────────────────────────────────
// 카드 생성 로직
// ─────────────────────────────────────────

function buildSemanticCardPrompt(wordDef) {
  return `당신은 히브리어 어휘의 의미 범위(semantic range)를 연구하는 구약학자입니다.
한국 신학생과 목회자를 위한 의미 카드 시스템을 구축하고 있습니다.

대상 단어: ${wordDef.hebrew} (Strong #${wordDef.strong})
어근: ${wordDef.root}
개역개정 번역: ${wordDef.krv_translation}
의미 범위 힌트: ${wordDef.semantic_range_hint}

이 단어에 대해 정확히 ${wordDef.card_count}장의 의미 카드를 생성하세요.

카드 생성 규칙:
1. 첫 번째 카드: 개역개정이 선택한 번역 의미 (is_krv_anchor: true)
2. 나머지 카드: 원어에 담긴 다른 중요 의미들 (is_krv_anchor: false)
3. 각 카드에 해석 등급 지정:
   - mainstream: 대다수 히브리어 학자들이 수용하는 의미
   - alternative: 유력한 소수 해석 또는 다른 번역본의 선택
   - academic: 학계에서 논의 중인 해석
4. 설명은 한국어, 200자 이내
5. context_refs는 성경 참조 2~3개 (한국어 책명, 예: "창 1:1")

다음 JSON 형식으로만 응답하세요. 다른 텍스트는 포함하지 마세요:
{
  "cards": [
    {
      "meaning_label": "의미 레이블 (한국어, 예: '언약적 충성')",
      "description": "이 의미에 대한 설명 (200자 이내)",
      "interpretation_tier": "mainstream|alternative|academic",
      "is_krv_anchor": true,
      "context_refs": ["창 1:1", "시 23:1"],
      "sort_order": 1
    }
  ]
}`
}

async function processWord(wordDef, index, total) {
  const prefix = `[${String(index + 1).padStart(2, '0')}/${total}]`

  // 이미 처리된 단어 건너뜀 (lemma 기준)
  const { data: existing } = await supabase
    .from('semantic_cards')
    .select('id')
    .eq('lemma', wordDef.strong)
    .limit(1)

  if (existing && existing.length > 0) {
    console.log(`⏭  ${prefix} ${wordDef.hebrew.padEnd(12)} (${wordDef.krv_translation}) — 이미 처리됨`)
    return { success: true, skipped: true }
  }

  const prompt = buildSemanticCardPrompt(wordDef)

  let responseText = ''
  try {
    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 2048,
      messages: [{ role: 'user', content: prompt }],
    })
    responseText = message.content[0].text
  } catch (apiErr) {
    console.error(`❌ ${prefix} ${wordDef.hebrew} — API 오류: ${apiErr.message}`)
    return { success: false }
  }

  // JSON 파싱
  let parsed
  try {
    const clean = responseText.replace(/```json\n?|\n?```/g, '').trim()
    parsed = JSON.parse(clean)
  } catch (parseErr) {
    console.error(`❌ ${prefix} ${wordDef.hebrew} — JSON 파싱 실패`)
    console.error('   응답 미리보기:', responseText.slice(0, 150))
    return { success: false }
  }

  if (!parsed.cards || !Array.isArray(parsed.cards)) {
    console.error(`❌ ${prefix} ${wordDef.hebrew} — 응답 형식 오류 (cards 배열 없음)`)
    return { success: false }
  }

  // 검증: KRV 앵커가 정확히 1개인지 확인
  const krvAnchors = parsed.cards.filter((c) => c.is_krv_anchor)
  if (krvAnchors.length !== 1) {
    console.error(`⚠️  ${prefix} ${wordDef.hebrew} — KRV 앵커 ${krvAnchors.length}개 (기대: 1개), 보정 중...`)
    // 첫 번째 카드에만 앵커 설정
    parsed.cards.forEach((c, i) => { c.is_krv_anchor = i === 0 })
  }

  // semantic_cards 테이블 INSERT (실제 스키마 기준)
  // 컬럼: id, lemma, hebrew_word, meaning_label, description,
  //       image_url, image_prompt, interpretation_tier, is_krv_anchor,
  //       context_refs, sort_order, reviewed
  const rows = parsed.cards.map((card) => ({
    lemma: wordDef.strong,
    hebrew_word: wordDef.hebrew,
    meaning_label: card.meaning_label ?? '',
    description: card.description ?? '',
    interpretation_tier: card.interpretation_tier ?? 'mainstream',
    is_krv_anchor: card.is_krv_anchor ?? false,
    context_refs: card.context_refs ?? [],
    sort_order: card.sort_order ?? 1,
    image_url: null,        // Stage 7에서 채움
    image_prompt: null,     // Stage 7에서 채움
    reviewed: false,        // 감수 대기
  }))

  const { error: insertErr } = await supabase.from('semantic_cards').insert(rows)

  if (insertErr) {
    console.error(`❌ ${prefix} ${wordDef.hebrew} — INSERT 실패: ${insertErr.message}`)
    return { success: false }
  }

  const tierSummary = parsed.cards.map((c) => c.interpretation_tier[0].toUpperCase()).join('')
  console.log(
    `✅ ${prefix} ${wordDef.hebrew.padEnd(12)} (${wordDef.krv_translation.padEnd(8)}) — ` +
    `${parsed.cards.length}장 [${tierSummary}]`
  )
  return { success: true, count: parsed.cards.length }
}

// ─────────────────────────────────────────
// 메인
// ─────────────────────────────────────────

async function main() {
  console.log(`📚 핵심 ${CORE_30_WORDS.length}단어 의미 카드 생성 시작\n`)
  console.log('─'.repeat(60))

  let successCount = 0
  let skipCount = 0
  let failCount = 0
  let totalInserted = 0

  for (let i = 0; i < CORE_30_WORDS.length; i++) {
    const result = await processWord(CORE_30_WORDS[i], i, CORE_30_WORDS.length)

    if (result.success && result.skipped) {
      skipCount++
    } else if (result.success) {
      successCount++
      totalInserted += result.count ?? 0
    } else {
      failCount++
    }

    // API 호출한 경우만 대기
    if (i < CORE_30_WORDS.length - 1 && result.success && !result.skipped) {
      await sleep(3000) // Sonnet rate limit 대응
    }
  }

  console.log('\n' + '─'.repeat(60))
  console.log('📊 Stage 6 완료')
  console.log(`   성공: ${successCount}개 단어 (카드 ${totalInserted}장 생성)`)
  console.log(`   건너뜀: ${skipCount}개 단어 (이미 처리됨)`)
  console.log(`   실패: ${failCount}개 단어`)
  console.log('\n📋 검증 쿼리:')
  console.log('   SELECT COUNT(*), COUNT(CASE WHEN is_krv_anchor THEN 1 END) as anchors FROM semantic_cards;')
  console.log(`   -- 기대값: ~${totalCards}장, anchors = ${CORE_30_WORDS.length}`)
  console.log('\n⚠️  Stage 7 (이미지 생성) 실행 전 Joseph 승인 필요!')
  console.log('   예상 비용: 약 $3.6 (DALL-E 3 기준)')
}

main()
