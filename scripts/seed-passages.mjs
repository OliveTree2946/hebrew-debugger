/**
 * seed-passages.mjs
 * 핵심 30개 구절을 POST /api/parse로 순차 시드
 * 실행: node scripts/seed-passages.mjs
 */

const BASE_URL = 'http://localhost:3000'
const DELAY_MS = 500

/** 핵심 30 구절 (CORE_PASSAGES_30.md) */
const REFS = [
  'Gen.1.1', 'Gen.1.2', 'Gen.1.26', 'Gen.2.7', 'Gen.12.1',
  'Gen.15.6', 'Exod.3.14', 'Exod.20.2', 'Deut.6.4', 'Lev.19.18',
  'Josh.1.8', '1Sam.3.10', '2Sam.12.7', '1Kgs.19.11', 'Ruth.1.16',
  'Ps.1.1', 'Ps.23.1', 'Ps.51.3', 'Ps.119.105', 'Ps.139.1',
  'Isa.6.3', 'Isa.9.5', 'Isa.53.4', 'Jer.1.5', 'Ezek.37.4',
  'Jonah.1.1', 'Mic.6.8', 'Prov.3.5', 'Eccl.3.1', 'Job.1.21',
]

/** ms 대기 유틸 */
function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

async function seedAll() {
  console.log(`\n📖 핵심 30 구절 시드 시작 — ${BASE_URL}/api/parse`)
  console.log(`   총 ${REFS.length}개 구절, 구절 간 ${DELAY_MS}ms 대기\n`)

  let successCount = 0
  let failCount = 0

  for (let i = 0; i < REFS.length; i++) {
    const ref = REFS[i]
    const prefix = `[${String(i + 1).padStart(2, '0')}/${REFS.length}]`

    try {
      const res = await fetch(`${BASE_URL}/api/parse`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ref }),
      })

      const data = await res.json()

      if (data.success) {
        console.log(`✅ ${prefix} ${ref.padEnd(14)} → passage_id: ${data.passage_id} (단어 ${data.word_count}개)`)
        successCount++
      } else {
        console.error(`❌ ${prefix} ${ref.padEnd(14)} → 실패: ${data.error}`)
        failCount++
      }
    } catch (err) {
      console.error(`❌ ${prefix} ${ref.padEnd(14)} → 네트워크 오류: ${err.message}`)
      failCount++
    }

    // 마지막 구절이 아니면 대기
    if (i < REFS.length - 1) {
      await sleep(DELAY_MS)
    }
  }

  console.log(`\n${'─'.repeat(50)}`)
  console.log(`📊 시드 완료: 성공 ${successCount}개 / 실패 ${failCount}개 / 전체 ${REFS.length}개`)
  if (failCount > 0) {
    console.log('⚠️  실패한 구절은 서버 로그를 확인하세요.')
  } else {
    console.log('🎉 모든 구절이 성공적으로 저장되었습니다.')
  }
}

seedAll()
