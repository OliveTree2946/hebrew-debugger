/**
 * seed-korean-text.mjs
 * passages 테이블의 korean_text 컬럼을 개역개정(KRV) 번역으로 업데이트
 * 실행: node scripts/seed-korean-text.mjs
 *
 * 참조: CORE_PASSAGES_30.md
 * 번역 출처: 개역개정판 (대한성서공회)
 * OSHB 히브리어 절 번호 기준 (Ps.51.3 = 한국어 성경 시편 51:1에 해당)
 */

import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
config({ path: join(__dirname, '../.env.local') })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

// ─────────────────────────────────────────
// passage_id → 개역개정 번역 매핑
// passage_id 규칙: {book 3자}_장_절 (예: gen_1_1)
// ─────────────────────────────────────────
const KOREAN_TEXTS = [
  {
    id: 'gen_1_1',
    korean: '태초에 하나님이 천지를 창조하시니라',
  },
  {
    id: 'gen_1_2',
    korean: '땅이 혼돈하고 공허하며 흑암이 깊음 위에 있고 하나님의 영은 수면 위에 운행하시니라',
  },
  {
    id: 'gen_1_26',
    korean: '하나님이 이르시되 우리의 형상을 따라 우리의 모양대로 우리가 사람을 만들고 그들로 바다의 물고기와 하늘의 새와 가축과 온 땅과 땅에 기는 모든 것을 다스리게 하자 하시고',
  },
  {
    id: 'gen_2_7',
    korean: '여호와 하나님이 땅의 흙으로 사람을 지으시고 생기를 그 코에 불어넣으시니 사람이 생령이 되니라',
  },
  {
    id: 'gen_12_1',
    korean: '여호와께서 아브람에게 이르시되 너는 너의 고향과 친척과 아버지의 집을 떠나 내가 네게 보여 줄 땅으로 가라',
  },
  {
    id: 'gen_15_6',
    korean: '아브람이 여호와를 믿으니 여호와께서 이를 그의 의로 여기시고',
  },
  {
    id: 'exo_3_14',
    korean: '하나님이 모세에게 이르시되 나는 스스로 있는 자이니라 또 이르시되 너는 이스라엘 자손에게 이같이 이르기를 스스로 있는 자가 나를 너희에게 보내셨다 하라',
  },
  {
    id: 'exo_20_2',
    korean: '나는 너를 애굽 땅, 종 되었던 집에서 인도하여 낸 네 하나님 여호와니라',
  },
  {
    id: 'lev_19_18',
    korean: '원수를 갚지 말며 동포를 원망하지 말며 네 이웃 사랑하기를 네 자신과 같이 사랑하라 나는 여호와이니라',
  },
  {
    id: 'deu_6_4',
    korean: '이스라엘아 들으라 우리 하나님 여호와는 오직 유일한 여호와이시니',
  },
  {
    id: 'jos_1_8',
    korean: '이 율법책을 네 입에서 떠나지 말게 하며 주야로 그것을 묵상하여 그 안에 기록된 대로 다 지켜 행하라 그리하면 네 길이 평탄하게 될 것이며 네가 형통하리라',
  },
  {
    id: 'rut_1_16',
    korean: '룻이 이르되 내게 어머니를 떠나며 어머니를 따르지 말고 돌아가라 강권하지 마옵소서 어머니께서 가시는 곳에 나도 가고 어머니께서 머무시는 곳에서 나도 머물겠나이다 어머니의 백성이 나의 백성이 되고 어머니의 하나님이 나의 하나님이 되시리니',
  },
  {
    id: '1sa_3_10',
    korean: '여호와께서 임하여 서서 전과 같이 사무엘아 사무엘아 부르시는지라 사무엘이 이르되 말씀하옵소서 주의 종이 듣겠나이다 하니',
  },
  {
    id: '2sa_12_7',
    korean: '나단이 다윗에게 이르되 당신이 그 사람이라 이스라엘의 하나님 여호와께서 이와 같이 이르시기를 내가 너를 이스라엘 왕으로 기름 붓기 위하여 너를 사울의 손에서 구원하고',
  },
  {
    id: '1ki_19_11',
    korean: '여호와께서 이르시되 너는 나가서 산 위 여호와 앞에 서라 하시더니 여호와께서 지나가시는데 여호와 앞에 크고 강한 바람이 산을 가르고 바위를 부수나 바람 가운데에 여호와께서 계시지 아니하며 바람 후에 지진이 있으나 지진 가운데에도 여호와께서 계시지 아니하며',
  },
  {
    id: 'psa_1_1',
    korean: '복 있는 사람은 악인들의 꾀를 따르지 아니하며 죄인들의 길에 서지 아니하며 오만한 자들의 자리에 앉지 아니하고',
  },
  {
    id: 'psa_23_1',
    korean: '여호와는 나의 목자시니 내게 부족함이 없으리로다',
  },
  {
    // 히브리어 절 번호: Ps.51.3 = 한국어 개역개정 시편 51편 1절
    // (히브리어 원문은 표제 2절이 앞에 있어 번호가 2 차이남)
    id: 'psa_51_3',
    korean: '하나님이여 주의 인자를 따라 내게 은혜를 베푸시며 주의 많은 긍휼을 따라 내 죄악을 지워 주소서',
  },
  {
    id: 'psa_119_105',
    korean: '주의 말씀은 내 발에 등이요 내 길에 빛이니이다',
  },
  {
    id: 'psa_139_1',
    korean: '여호와여 주께서 나를 살펴 보셨으므로 나를 아시나이다',
  },
  {
    id: 'isa_6_3',
    korean: '서로 불러 이르되 거룩하다 거룩하다 거룩하다 만군의 여호와여 그의 영광이 온 땅에 충만하도다 하더라',
  },
  {
    // 히브리어 절 번호: Isa.9.5 = 한국어 개역개정 이사야 9:6
    // (히브리어 9장 번호 체계가 한국어와 1절 차이남)
    id: 'isa_9_5',
    korean: '이는 한 아기가 우리에게 났고 한 아들을 우리에게 주신 바 되었는데 그의 어깨에는 정사를 메었고 그의 이름은 기묘자라, 모사라, 전능하신 하나님이라, 영존하시는 아버지라, 평강의 왕이라 할 것임이라',
  },
  {
    id: 'isa_53_4',
    korean: '그는 실로 우리의 질고를 지고 우리의 슬픔을 당하였거늘 우리는 생각하기를 그는 징벌을 받아 하나님께 맞으며 고난을 당한다 하였노라',
  },
  {
    id: 'jer_1_5',
    korean: '내가 너를 모태에 짓기 전에 너를 알았고 네가 배에서 나오기 전에 너를 성별하였고 너를 여러 나라의 선지자로 세웠노라 하시기로',
  },
  {
    id: 'eze_37_4',
    korean: '또 내게 이르시되 너는 이 모든 뼈에게 대언하여 이르기를 너희 마른 뼈들아 여호와의 말씀을 들을지어다',
  },
  {
    id: 'jon_1_1',
    korean: '여호와의 말씀이 아밋대의 아들 요나에게 임하니라 이르시되',
  },
  {
    id: 'mic_6_8',
    korean: '사람아 주께서 선한 것이 무엇임을 네게 보이셨나니 여호와께서 네게 구하시는 것은 오직 정의를 행하며 인자를 사랑하며 겸손하게 네 하나님과 함께 행하는 것이 아니냐',
  },
  {
    id: 'pro_3_5',
    korean: '너는 마음을 다하여 여호와를 신뢰하고 네 명철을 의지하지 말라',
  },
  {
    id: 'ecc_3_1',
    korean: '범사에 기한이 있고 천하 만사가 다 때가 있나니',
  },
  {
    id: 'job_1_21',
    korean: '이르되 내가 모태에서 알몸으로 나왔사온즉 또한 알몸이 그리로 돌아가올지라 주신 이도 여호와시요 거두신 이도 여호와시오니 여호와의 이름이 찬송을 받으실지니이다 하고',
  },
]

// ─────────────────────────────────────────
// 메인 실행
// ─────────────────────────────────────────

async function seedKoreanText() {
  console.log('\n📖 korean_text 업데이트 시작')
  console.log(`   총 ${KOREAN_TEXTS.length}개 구절\n`)

  let successCount = 0
  let failCount = 0
  let skipCount = 0

  for (const { id, korean } of KOREAN_TEXTS) {
    // 존재하는지 먼저 확인
    const { data: existing, error: selectErr } = await supabase
      .from('passages')
      .select('id, korean_text')
      .eq('id', id)
      .maybeSingle()

    if (selectErr) {
      console.error(`❌ ${id} — 조회 실패: ${selectErr.message}`)
      failCount++
      continue
    }

    if (!existing) {
      console.warn(`⚠️  ${id} — DB에 없음 (시드 안 됨)`)
      skipCount++
      continue
    }

    // 업데이트
    const { error: updateErr } = await supabase
      .from('passages')
      .update({ korean_text: korean })
      .eq('id', id)

    if (updateErr) {
      console.error(`❌ ${id} — 업데이트 실패: ${updateErr.message}`)
      failCount++
    } else {
      console.log(`✅ ${id.padEnd(16)} — 업데이트 완료`)
      successCount++
    }
  }

  console.log(`\n${'─'.repeat(50)}`)
  console.log(`📊 완료: 성공 ${successCount} / 건너뜀 ${skipCount} / 실패 ${failCount}`)
  if (skipCount > 0) {
    console.log('⚠️  건너뜀 항목: 먼저 node scripts/seed-passages.mjs 실행 후 재시도')
  }
}

seedKoreanText()
