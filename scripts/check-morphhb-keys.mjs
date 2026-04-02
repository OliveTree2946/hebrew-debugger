/**
 * check-morphhb-keys.mjs
 * morphhb 패키지의 실제 책 키 목록 출력
 * 실행: node scripts/check-morphhb-keys.mjs
 */
import morphhb from 'morphhb'

const keys = Object.keys(morphhb)
console.log(`\nmorphhb 책 키 목록 (총 ${keys.length}개):\n`)
keys.forEach((key, i) => {
  console.log(`  ${String(i + 1).padStart(2, '0')}. ${key}`)
})
