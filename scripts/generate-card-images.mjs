/**
 * generate-card-images.mjs
 * Stage 7: semantic_cards 테이블의 각 카드에 gpt-image-1-mini 이미지 생성
 * 실행: node scripts/generate-card-images.mjs
 *
 * 참조: SEMANTIC_CARDS_SPEC.md §4 이미지 생성 전략
 *
 * 이미지 생성 흐름:
 *   1. Claude API로 이미지 프롬프트 생성 (의미 레이블 + 설명 → 영어 프롬프트)
 *   2. gpt-image-1-mini API로 이미지 생성 (base64 응답)
 *   3. base64 → Buffer → Supabase Storage('semantic-card-images') 업로드
 *   4. getPublicUrl()로 public URL 획득 → semantic_cards.image_url 저장
 */

import Anthropic from '@anthropic-ai/sdk'
import OpenAI from 'openai'
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

// Storage 업로드 전용 (service_role)
const adminSupabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

// ─────────────────────────────────────────
// 비용 확인 (실행 전 카드 수 체크)
// ─────────────────────────────────────────

async function checkAndConfirmCost() {
  const { count, error } = await supabase
    .from('semantic_cards')
    .select('*', { count: 'exact', head: true })
    .is('image_url', null)
    .eq('reviewed', false)

  if (error) {
    console.error('❌ 카드 수 조회 실패:', error.message)
    process.exit(1)
  }

  console.log('\n⚠️  Stage 7 — gpt-image-1-mini 이미지 생성 비용 경고')
  console.log(`   처리 대상 카드: ${count ?? 0}장`)
  console.log('   추가 비용: 이미지 프롬프트 생성 (Claude Sonnet) ~$0.05')
  console.log('')

  if (!count || count === 0) {
    console.log('✅ 처리할 카드가 없습니다. Stage 6를 먼저 실행하세요.')
    process.exit(0)
  }

  return count
}

// ─────────────────────────────────────────
// 스타일 정의 (단어 유형별)
// ─────────────────────────────────────────

const STYLES = {
  ABSTRACT:
    'Hebrew calligraphy as central visual element, large ancient script letterforms, surrounded by abstract golden light and texture, aged parchment background, no figurative elements, no latin text',
  CONCRETE:
    'classic biblical illustration style, warm watercolor line art, Annie Vallotton inspired, simple clean lines, earthy tones, no text',
}

// ─────────────────────────────────────────
// 이미지 프롬프트 생성 (Claude)
// ─────────────────────────────────────────

async function generateImagePrompt(card) {
  /**
   * Claude로 영어 이미지 프롬프트 생성
   * 단어 유형(추상/구체) 판단은 Claude에게 위임
   * SEMANTIC_CARDS_SPEC.md §4.2 템플릿 기준
   */
  const promptRequest = `You are creating a DALL-E image generation prompt for a Hebrew Bible vocabulary card.

Hebrew word: ${card.hebrew_word}
Meaning label: ${card.meaning_label}
Description: ${card.description}

Step 1 — Classify the Hebrew word as ABSTRACT or CONCRETE:
- ABSTRACT: divine names, spiritual/theological concepts, covenantal terms (e.g. אֱלֹהִים, יְהוָה, נֶפֶשׁ, רוּחַ, עוֹלָם, קָדוֹשׁ, אֱמוּנָה, בְּרִית, תּוֹרָה, אֶחָד)
- CONCRETE: everything else (people, animals, objects, places, physical actions)

Step 2 — Use the matching style:
- ABSTRACT style: ${STYLES.ABSTRACT}
- CONCRETE style: ${STYLES.CONCRETE}

Step 3 — Write the image generation prompt following these rules:
1. Describe a scene or symbol that evokes this meaning
2. Apply the chosen style exactly as written above
3. NO text in the image
4. NO specific ethnic/racial representations of people
5. NO explicit religious symbols (no crosses, tabernacles, etc.)
6. NO violent scenes
7. Mood: contemplative, soft lighting
8. Keep it under 150 words
9. Unique seed: ${Math.random().toString(36).slice(2)}

Respond in JSON with exactly two fields:
{ "styleKey": "ABSTRACT" or "CONCRETE", "prompt": "<English prompt text>" }`

  const message = await anthropic.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 512,
    messages: [{ role: 'user', content: promptRequest }],
  })

  const raw = message.content[0].text.trim()
  // JSON 파싱
  const jsonMatch = raw.match(/\{[\s\S]*\}/)
  if (!jsonMatch) throw new Error(`Claude 응답 JSON 파싱 실패: ${raw}`)
  const parsed = JSON.parse(jsonMatch[0])
  return { styleKey: parsed.styleKey, prompt: parsed.prompt.trim() }
}

// ─────────────────────────────────────────
// 카드 이미지 처리
// ─────────────────────────────────────────

async function processCard(card, index, total) {
  const prefix = `[${String(index + 1).padStart(2, '0')}/${total}]`

  // 이미지 프롬프트 생성 (Claude가 스타일 판단)
  let imagePrompt = ''
  let styleKey = ''
  try {
    const result = await generateImagePrompt(card)
    imagePrompt = result.prompt
    styleKey = result.styleKey
  } catch (promptErr) {
    console.error(`❌ ${prefix} ${card.hebrew_word} / ${card.meaning_label} — 프롬프트 생성 실패: ${promptErr.message}`)
    return { success: false }
  }

  const label = `${card.hebrew_word} / ${card.meaning_label} [${styleKey}]`
  console.log(`   스타일 선택: ${styleKey} (${card.hebrew_word})`)

  // gpt-image-1-mini 이미지 생성 (base64 응답)
  let imageBase64 = ''
  try {
    const response = await openai.images.generate({
      model: 'gpt-image-1-mini',
      prompt: imagePrompt,
      size: '1024x1024',
      quality: 'medium',
      n: 1,
    })
    imageBase64 = response.data[0].b64_json
  } catch (imgErr) {
    console.error(`❌ ${prefix} ${label} — 이미지 생성 실패: ${imgErr.message}`)
    return { success: false }
  }

  // base64 → Buffer → Supabase Storage 업로드
  const imageBuffer = Buffer.from(imageBase64, 'base64')
  const storagePath = `cards/${card.id}_${Date.now()}.png`

  const { error: uploadErr } = await adminSupabase.storage
    .from('semantic-card-images')
    .upload(storagePath, imageBuffer, {
      contentType: 'image/png',
      upsert: true,
    })

  if (uploadErr) {
    console.error(`❌ ${prefix} ${label} — Storage 업로드 실패: ${uploadErr.message}`)
    return { success: false }
  }

  // public URL 획득
  const { data: urlData } = adminSupabase.storage
    .from('semantic-card-images')
    .getPublicUrl(storagePath)

  const imageUrl = urlData.publicUrl

  // Supabase 업데이트
  const { error: updateErr } = await supabase
    .from('semantic_cards')
    .update({
      image_url: imageUrl,
      image_prompt: imagePrompt,
    })
    .eq('id', card.id)

  if (updateErr) {
    console.error(`❌ ${prefix} ${label} — 업데이트 실패: ${updateErr.message}`)
    return { success: false }
  }

  console.log(`✅ ${prefix} ${label}`)
  return { success: true }
}

// ─────────────────────────────────────────
// 메인
// ─────────────────────────────────────────

async function main() {
  await checkAndConfirmCost()

  // 미검수 카드 전체 조회 (image_url 유무 무관하게 덮어씀)
  const { data: cards, error: cardsErr } = await supabase
    .from('semantic_cards')
    .select('id, lemma, hebrew_word, meaning_label, description')
    .eq('reviewed', false)
    .order('id')

  if (cardsErr) {
    console.error('❌ 카드 조회 실패:', cardsErr.message)
    process.exit(1)
  }

  console.log(`🖼  ${cards.length}장 이미지 생성 시작\n`)
  console.log('─'.repeat(60))

  let successCount = 0
  let failCount = 0

  for (let i = 0; i < cards.length; i++) {
    const result = await processCard(cards[i], i, cards.length)

    if (result.success) {
      successCount++
    } else {
      failCount++
    }

    // DALL-E Rate Limit 대응 — 10초 대기
    if (i < cards.length - 1) {
      await sleep(10000)
    }
  }

  console.log('\n' + '─'.repeat(60))
  console.log('📊 Stage 7 완료')
  console.log(`   성공: ${successCount}장`)
  console.log(`   실패: ${failCount}장`)
  console.log(`   Storage 경로: semantic-card-images/cards/<id>.png`)
  console.log('\n📋 검증 쿼리:')
  console.log('   SELECT id, hebrew_word, image_url FROM semantic_cards WHERE reviewed = false ORDER BY id;')
}

main()
