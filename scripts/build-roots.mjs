/**
 * build-roots.mjs
 * roots 테이블 구축: 핵심 30단어 어근 + words 테이블 고유 어근 통합
 * 실행: node scripts/build-roots.mjs
 *
 * 참조: LEARNING_FRAMEWORK.md §3 어근 네트워크 데이터 구조
 * Stage 5 완료 후 실행 권장
 *
 * 어근 소스 우선순위:
 *   1. 핵심 30단어의 어근 (generate-semantic-cards.mjs와 동일 목록)
 *   2. words 테이블에 root 컬럼이 있으면 추가 어근도 처리
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
// 핵심 30단어의 어근 목록 (generate-semantic-cards.mjs와 동기화)
// ─────────────────────────────────────────

/**
 * 어근 정보: root (표기), exampleWords (예시 단어 목록)
 * words 테이블에서 추가 예시를 가져오되, 없으면 이 목록으로 충분
 */
const CORE_ROOTS = [
  { root: 'ר-א-שׁ', examples: [{ hebrew: 'בְּרֵאשִׁית', lemma: '7225' }] },
  { root: 'א-ל-ה', examples: [{ hebrew: 'אֱלֹהִים', lemma: '430' }] },
  { root: 'ב-ר-א', examples: [{ hebrew: 'בָּרָא', lemma: '1254' }] },
  { root: 'שׁ-מ-י', examples: [{ hebrew: 'שָׁמַיִם', lemma: '8064' }] },
  { root: 'א-ר-צ', examples: [{ hebrew: 'אֶרֶץ', lemma: '776' }] },
  { root: 'ה-י-ה', examples: [{ hebrew: 'יְהוָה', lemma: '3068' }, { hebrew: 'הָיָה', lemma: '1961' }] },
  { root: 'י-ר-ה', examples: [{ hebrew: 'תּוֹרָה', lemma: '8451' }] },
  { root: 'ב-ר-ת', examples: [{ hebrew: 'בְּרִית', lemma: '1285' }] },
  { root: 'ח-ס-ד', examples: [{ hebrew: 'חֶסֶד', lemma: '2617' }] },
  { root: 'א-מ-נ', examples: [{ hebrew: 'אֱמוּנָה', lemma: '530' }, { hebrew: 'אָמַן', lemma: '539' }] },
  { root: 'צ-ד-ק', examples: [{ hebrew: 'צְדָקָה', lemma: '6666' }, { hebrew: 'צַדִּיק', lemma: '6662' }] },
  { root: 'שׁ-פ-ט', examples: [{ hebrew: 'מִשְׁפָּט', lemma: '4941' }, { hebrew: 'שָׁפַט', lemma: '8199' }] },
  { root: 'שׁ-ל-מ', examples: [{ hebrew: 'שָׁלוֹם', lemma: '7965' }] },
  { root: 'נ-פ-שׁ', examples: [{ hebrew: 'נֶפֶשׁ', lemma: '5315' }] },
  { root: 'ר-ו-ח', examples: [{ hebrew: 'רוּחַ', lemma: '7307' }] },
  { root: 'ל-ב-ב', examples: [{ hebrew: 'לֵב', lemma: '3820' }, { hebrew: 'לֵבָב', lemma: '3824' }] },
  { root: 'א-ה-ב', examples: [{ hebrew: 'אַהֲבָה', lemma: '160' }, { hebrew: 'אָהַב', lemma: '157' }] },
  { root: 'י-ר-א', examples: [{ hebrew: 'יָרֵא', lemma: '3372' }, { hebrew: 'יִרְאָה', lemma: '3374' }] },
  { root: 'שׁ-ו-ב', examples: [{ hebrew: 'שׁוּב', lemma: '7725' }] },
  { root: 'ע-שׂ-ה', examples: [{ hebrew: 'עָשָׂה', lemma: '6213' }] },
  { root: 'ד-ב-ר', examples: [{ hebrew: 'דָּבָר', lemma: '1697' }, { hebrew: 'דִּבֶּר', lemma: '1696' }] },
  { root: 'ק-ו-ל', examples: [{ hebrew: 'קוֹל', lemma: '6963' }] },
  { root: 'א-ו-ר', examples: [{ hebrew: 'אוֹר', lemma: '216' }] },
  { root: 'א-ח-ד', examples: [{ hebrew: 'אֶחָד', lemma: '259' }] },
  { root: 'ע-מ-מ', examples: [{ hebrew: 'עָם', lemma: '5971' }] },
  { root: 'מ-ל-כ', examples: [{ hebrew: 'מֶלֶךְ', lemma: '4428' }, { hebrew: 'מָלַךְ', lemma: '4427' }] },
  { root: 'ע-ב-ד', examples: [{ hebrew: 'עֶבֶד', lemma: '5650' }, { hebrew: 'עָבַד', lemma: '5647' }] },
  { root: 'נ-ב-א', examples: [{ hebrew: 'נָבִיא', lemma: '5030' }] },
  { root: 'ק-ד-שׁ', examples: [{ hebrew: 'קָדוֹשׁ', lemma: '6918' }, { hebrew: 'קֹדֶשׁ', lemma: '6944' }] },
  { root: 'ע-ל-מ', examples: [{ hebrew: 'עוֹלָם', lemma: '5769' }] },
]

// ─────────────────────────────────────────
// 비용 사전 보고
// ─────────────────────────────────────────

console.log('\n📊 roots 구축 — 비용 예측')
console.log('   모델: claude-sonnet-4-6')
console.log(`   핵심 어근: ${CORE_ROOTS.length}개 (고정 목록)`)
console.log('   예상 비용: ~$0.10~$0.20 (Haiku 기준)')
console.log('   ⚡ 시작합니다...\n')

// ─────────────────────────────────────────
// 프롬프트 생성
// ─────────────────────────────────────────

function buildRootPrompt(root, exampleWords) {
  const examplesText = exampleWords
    .map((w) => `  - ${w.hebrew} (Strong #${w.lemma ?? '?'})`)
    .join('\n')

  return `당신은 히브리어 어근 연구 전문가입니다.
다음 히브리어 어근의 의미와 주요 파생어를 분석해주세요.

어근: ${root}
이 어근을 가진 단어 예시:
${examplesText}

다음 JSON 형식으로만 응답하세요. 다른 텍스트는 포함하지 마세요:
{
  "root": "${root}",
  "root_letters": "자음만 (모음 없이, 예: מלכ)",
  "meaning_korean": "기본 의미 (한국어, 예: '통치하다, 왕권')",
  "meaning_english": "기본 의미 (영어, 예: 'to reign, kingship')",
  "derived_words": [
    {
      "word": "히브리어 단어",
      "meaning": "한국어 뜻",
      "strongs": "Strong 번호 (숫자만)",
      "frequency": 대략적인 성경 내 빈도수,
      "example_ref": "대표 구절 (예: 창 1:1)"
    }
  ],
  "network_data": {
    "central_meaning": "핵심 의미 키워드 (한국어)",
    "semantic_field": "의미 영역 (예: 왕정/통치, 창조/존재, 언약/관계 등)"
  }
}`
}

// ─────────────────────────────────────────
// 어근 처리
// ─────────────────────────────────────────

async function processRoot(rootDef, index, total) {
  const prefix = `[${String(index + 1).padStart(2, '0')}/${total}]`
  const { root, examples } = rootDef

  // 이미 처리된 어근 건너뜀
  const { data: existing } = await supabase
    .from('roots')
    .select('id')
    .eq('root', root)
    .maybeSingle()

  if (existing) {
    console.log(`⏭  ${prefix} ${root.padEnd(12)} — 이미 처리됨, 건너뜀`)
    return { success: true, skipped: true }
  }

  const prompt = buildRootPrompt(root, examples)

  let responseText = ''
  try {
    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 2048,
      messages: [{ role: 'user', content: prompt }],
    })
    responseText = message.content[0].text
  } catch (apiErr) {
    console.error(`❌ ${prefix} ${root} — API 오류: ${apiErr.message}`)
    return { success: false }
  }

  // JSON 파싱
  let parsed
  try {
    const clean = responseText.replace(/```json\n?|\n?```/g, '').trim()
    parsed = JSON.parse(clean)
  } catch (parseErr) {
    console.error(`❌ ${prefix} ${root} — JSON 파싱 실패`)
    console.error('   응답 미리보기:', responseText.slice(0, 150))
    return { success: false }
  }

  // roots 테이블 INSERT
  const { error: insertErr } = await supabase.from('roots').insert({
    root: parsed.root ?? root,
    root_letters: parsed.root_letters ?? null,
    meaning_korean: parsed.meaning_korean ?? null,
    meaning_english: parsed.meaning_english ?? null,
    derived_words: parsed.derived_words ?? [],
    network_data: parsed.network_data ?? {},
  })

  if (insertErr) {
    console.error(`❌ ${prefix} ${root} — INSERT 실패: ${insertErr.message}`)
    return { success: false }
  }

  console.log(`✅ ${prefix} ${root.padEnd(12)} — ${parsed.meaning_korean ?? '(의미 없음)'}`)
  return { success: true }
}

// ─────────────────────────────────────────
// words 테이블에서 추가 어근 추출 (root 컬럼 존재 시)
// ─────────────────────────────────────────

async function fetchAdditionalRootsFromWords() {
  /** words.root 컬럼이 있는 경우에만 추가 어근 수집 */
  try {
    const { data, error } = await supabase
      .from('words')
      .select('root, hebrew, lemma')
      .not('root', 'is', null)
      .neq('root', '—')
      .neq('root', '')

    if (error) {
      // 컬럼이 없는 경우 등 — 조용히 skip
      return []
    }

    if (!data || data.length === 0) return []

    // 이미 CORE_ROOTS에 있는 어근 제외
    const coreRootSet = new Set(CORE_ROOTS.map((r) => r.root))

    /** @type {Map<string, Array<{hebrew: string, lemma: string}>>} */
    const rootMap = new Map()
    for (const row of data) {
      if (!row.root || coreRootSet.has(row.root)) continue
      if (!rootMap.has(row.root)) rootMap.set(row.root, [])
      const arr = rootMap.get(row.root)
      if (arr.length < 3 && !arr.some((w) => w.hebrew === row.hebrew)) {
        arr.push({ hebrew: row.hebrew, lemma: row.lemma ?? '' })
      }
    }

    return Array.from(rootMap.entries()).map(([root, examples]) => ({ root, examples }))
  } catch {
    return []
  }
}

// ─────────────────────────────────────────
// 메인
// ─────────────────────────────────────────

async function main() {
  // 추가 어근 수집 (words.root 컬럼 존재 시)
  const additionalRoots = await fetchAdditionalRootsFromWords()
  if (additionalRoots.length > 0) {
    console.log(`🔍 words 테이블에서 추가 어근 ${additionalRoots.length}개 발견\n`)
  }

  const allRoots = [...CORE_ROOTS, ...additionalRoots]
  console.log(`🌳 총 ${allRoots.length}개 어근 처리 시작\n`)
  console.log('─'.repeat(60))

  let successCount = 0
  let skipCount = 0
  let failCount = 0

  for (let i = 0; i < allRoots.length; i++) {
    const result = await processRoot(allRoots[i], i, allRoots.length)

    if (result.success && result.skipped) {
      skipCount++
    } else if (result.success) {
      successCount++
    } else {
      failCount++
    }

    // API 호출한 경우만 대기
    if (i < allRoots.length - 1 && result.success && !result.skipped) {
      await sleep(3000) // Haiku — 3초 대기
    }
  }

  console.log('\n' + '─'.repeat(60))
  console.log('📊 roots 구축 완료')
  console.log(`   성공: ${successCount}개`)
  console.log(`   건너뜀: ${skipCount}개 (이미 처리됨)`)
  console.log(`   실패: ${failCount}개`)
  console.log('\n📋 검증 쿼리:')
  console.log('   SELECT COUNT(*) FROM roots;')
  console.log('   -- 기대값: 30+ (핵심 어근)')
}

main()
