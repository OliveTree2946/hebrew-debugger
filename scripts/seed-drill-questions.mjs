/**
 * seed-drill-questions.mjs
 * drill_questions 테이블에 30문제를 시드
 * 실행: node scripts/seed-drill-questions.mjs
 *
 * 데이터 출처: BINYAN_DRILL_SPEC.md §3.1 빈야님 식별 20문제 + §3.2 전체 파싱 10문제
 */

import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

// .env.local 로드
const __dirname = dirname(fileURLToPath(import.meta.url))
config({ path: resolve(__dirname, '../.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ 환경변수 누락: NEXT_PUBLIC_SUPABASE_URL 또는 SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

/** 빈야님 선택지 (전 7종) */
const BINYAN_OPTIONS = ['칼', '니팔', '피엘', '푸알', '히필', '호팔', '히트파엘']

// ─────────────────────────────────────────────
// §3.1 빈야님 식별 20문제 (category: "binyan_id", difficulty: 1)
// ─────────────────────────────────────────────
const BINYAN_ID_QUESTIONS = [
  {
    category: 'binyan_id',
    verb: 'בָּרָא',
    root: 'ב-ר-א',
    meaning: '창조하다',
    correct_answer: '칼',
    options: BINYAN_OPTIONS,
    hint: '어근 자음 사이에 강점(다게쉬)이 없고, 접두어도 없는 기본 능동형',
    reference: '창 1:1',
    difficulty: 1,
  },
  {
    category: 'binyan_id',
    verb: 'נִבְרָא',
    root: 'ב-ר-א',
    meaning: '창조되다',
    correct_answer: '니팔',
    options: BINYAN_OPTIONS,
    hint: '접두어 נִ- 가 붙은 수동/재귀형',
    reference: '창 2:4',
    difficulty: 1,
  },
  {
    category: 'binyan_id',
    verb: 'בֵּרַךְ',
    root: 'ב-ר-ך',
    meaning: '축복하다',
    correct_answer: '피엘',
    options: BINYAN_OPTIONS,
    hint: '중간 어근 자음에 강점(다게쉬 포르테)이 있는 강의 능동형',
    reference: '창 1:22',
    difficulty: 1,
  },
  {
    category: 'binyan_id',
    verb: 'בֹּרַךְ',
    root: 'ב-ר-ך',
    meaning: '축복받다',
    correct_answer: '푸알',
    options: BINYAN_OPTIONS,
    hint: '중간 어근 자음에 다게쉬가 있고 첫 모음이 ŏ(쇼레크)인 강의 수동형',
    reference: '창 27:33',
    difficulty: 1,
  },
  {
    category: 'binyan_id',
    verb: 'הִבְדִּיל',
    root: 'ב-ד-ל',
    meaning: '구분하다, 나누다',
    correct_answer: '히필',
    options: BINYAN_OPTIONS,
    hint: '접두어 הִ- 가 붙은 사역 능동형',
    reference: '창 1:4',
    difficulty: 1,
  },
  {
    category: 'binyan_id',
    verb: 'הָבְדַּל',
    root: 'ב-ד-ל',
    meaning: '구분되다',
    correct_answer: '호팔',
    options: BINYAN_OPTIONS,
    hint: '접두어 הָ/הֻ- 가 붙은 사역 수동형',
    reference: '레 10:10',
    difficulty: 1,
  },
  {
    category: 'binyan_id',
    verb: 'הִתְהַלֵּךְ',
    root: 'ה-ל-ך',
    meaning: '거닐다, 동행하다',
    correct_answer: '히트파엘',
    options: BINYAN_OPTIONS,
    hint: '접두어 הִתְ- 가 붙은 재귀/반복형',
    reference: '창 5:24',
    difficulty: 1,
  },
  {
    category: 'binyan_id',
    verb: 'שָׁמַר',
    root: 'ש-מ-ר',
    meaning: '지키다, 보호하다',
    correct_answer: '칼',
    options: BINYAN_OPTIONS,
    hint: '세 어근 자음이 그대로 드러나는 가장 기본적인 형태',
    reference: '창 2:15',
    difficulty: 1,
  },
  {
    category: 'binyan_id',
    verb: 'נִשְׁמַר',
    root: 'ש-מ-ר',
    meaning: '지켜지다, 삼가다',
    correct_answer: '니팔',
    options: BINYAN_OPTIONS,
    hint: '어두에 נִ- 가 붙어 수동·재귀 의미를 나타냄',
    reference: '출 23:21',
    difficulty: 1,
  },
  {
    category: 'binyan_id',
    verb: 'קִדַּשׁ',
    root: 'ק-ד-ש',
    meaning: '거룩하게 하다',
    correct_answer: '피엘',
    options: BINYAN_OPTIONS,
    hint: '두 번째 어근 자음(ד)에 다게쉬 포르테가 있고 첫 모음이 이(히렉)',
    reference: '창 2:3',
    difficulty: 1,
  },
  {
    category: 'binyan_id',
    verb: 'הִקְדִּישׁ',
    root: 'ק-ד-ש',
    meaning: '바치다, 성별하다',
    correct_answer: '히필',
    options: BINYAN_OPTIONS,
    hint: '어두 הִ- + 두 번째 자음 앞에 강점이 있는 사역형',
    reference: '민 7:1',
    difficulty: 1,
  },
  {
    category: 'binyan_id',
    verb: 'הִתְקַדֵּשׁ',
    root: 'ק-ד-ש',
    meaning: '스스로 거룩하게 하다',
    correct_answer: '히트파엘',
    options: BINYAN_OPTIONS,
    hint: 'הִתְ- 접두어 + 중간 자음 강점, 재귀 의미',
    reference: '레 11:44',
    difficulty: 1,
  },
  {
    category: 'binyan_id',
    verb: 'יָדַע',
    root: 'י-ד-ע',
    meaning: '알다',
    correct_answer: '칼',
    options: BINYAN_OPTIONS,
    hint: '접두어·강점 없이 세 자음이 그대로인 기본형',
    reference: '창 4:1',
    difficulty: 1,
  },
  {
    category: 'binyan_id',
    verb: 'הוֹדִיעַ',
    root: 'י-ד-ע',
    meaning: '알리다, 알게 하다',
    correct_answer: '히필',
    options: BINYAN_OPTIONS,
    hint: '어두 ה- + 첫 어근이 י인 경우 הוֹ- 형태로 나타나는 사역형',
    reference: '시 98:2',
    difficulty: 1,
  },
  {
    category: 'binyan_id',
    verb: 'נוֹדַע',
    root: 'י-ד-ע',
    meaning: '알려지다',
    correct_answer: '니팔',
    options: BINYAN_OPTIONS,
    hint: 'נ- 접두 + 첫 어근 י가 탈락하여 נוֹ- 형태',
    reference: '출 21:36',
    difficulty: 1,
  },
  {
    category: 'binyan_id',
    verb: 'כִּסָּה',
    root: 'כ-ס-ה',
    meaning: '덮다, 숨기다',
    correct_answer: '피엘',
    options: BINYAN_OPTIONS,
    hint: '세 번째 어근이 약자음(ה)인 동사, 두 번째 자음에 다게쉬 포르테',
    reference: '시 32:1',
    difficulty: 1,
  },
  {
    category: 'binyan_id',
    verb: 'הֻגַּד',
    root: 'נ-ג-ד',
    meaning: '알려지다, 고해지다',
    correct_answer: '호팔',
    options: BINYAN_OPTIONS,
    hint: '어두 הֻ- + 두 번째 자음에 다게쉬 포르테인 사역 수동형',
    reference: '창 22:20',
    difficulty: 1,
  },
  {
    category: 'binyan_id',
    verb: 'פֻּקַּד',
    root: 'פ-ק-ד',
    meaning: '방문받다, 기억되다',
    correct_answer: '푸알',
    options: BINYAN_OPTIONS,
    hint: '첫 모음이 ŭ(키부츠)이고 두 번째 자음에 다게쉬인 강의 수동형',
    reference: '출 20:5',
    difficulty: 1,
  },
  {
    category: 'binyan_id',
    verb: 'הִתְפַּלֵּל',
    root: 'פ-ל-ל',
    meaning: '기도하다',
    correct_answer: '히트파엘',
    options: BINYAN_OPTIONS,
    hint: '어두 הִתְ- + 세 번째 자음이 중복된 재귀형',
    reference: '왕상 8:30',
    difficulty: 1,
  },
  {
    category: 'binyan_id',
    verb: 'שִׁלַּח',
    root: 'ש-ל-ח',
    meaning: '보내다, 내보내다',
    correct_answer: '피엘',
    options: BINYAN_OPTIONS,
    hint: '첫 모음이 이(히렉), 두 번째 자음(ל)에 다게쉬 포르테',
    reference: '창 3:23',
    difficulty: 1,
  },
]

// ─────────────────────────────────────────────
// §3.2 전체 파싱 10문제 (category: "full_parsing", difficulty: 2)
// ─────────────────────────────────────────────
const FULL_PARSING_QUESTIONS = [
  {
    category: 'full_parsing',
    verb: 'בָּרָא',
    root: 'ב-ר-א',
    meaning: '그가 창조했다',
    correct_answer: '칼 완료 3ms',
    options: null,
    hint: '완료형 어미가 없으면 3ms 기본값; 칼 완료 패턴(קָטַל)',
    reference: '창 1:1',
    difficulty: 2,
  },
  {
    category: 'full_parsing',
    verb: 'וַיֹּאמֶר',
    root: 'א-מ-ר',
    meaning: '그가 말했다',
    correct_answer: '칼 미완료 3ms 바브연속',
    options: null,
    hint: 'וַיִּ- 접두는 미완료 바브연속(와우-연속법); א로 시작하는 어근은 첫 자음 탈락',
    reference: '창 1:3',
    difficulty: 2,
  },
  {
    category: 'full_parsing',
    verb: 'יִשְׁמֹר',
    root: 'ש-מ-ר',
    meaning: '그가 지킬 것이다',
    correct_answer: '칼 미완료 3ms',
    options: null,
    hint: 'יִ- 접두 + 어미 없음 = 미완료 3ms; 칼 패턴(יִקְטֹל)',
    reference: '시 121:7',
    difficulty: 2,
  },
  {
    category: 'full_parsing',
    verb: 'שָׁמְרוּ',
    root: 'ש-מ-ר',
    meaning: '그들이 지켰다',
    correct_answer: '칼 완료 3cp',
    options: null,
    hint: '어미 וּ- 는 완료 3cp(남녀공통복수)를 나타냄',
    reference: '신 33:9',
    difficulty: 2,
  },
  {
    category: 'full_parsing',
    verb: 'בֵּרַךְ',
    root: 'ב-ר-ך',
    meaning: '그가 축복했다',
    correct_answer: '피엘 완료 3ms',
    options: null,
    hint: '두 번째 어근(ר)에 다게쉬 포르테 + 완료 어미 없음 = 피엘 완료 3ms',
    reference: '창 1:22',
    difficulty: 2,
  },
  {
    category: 'full_parsing',
    verb: 'יְבָרֵךְ',
    root: 'ב-ר-ך',
    meaning: '그가 축복할 것이다',
    correct_answer: '피엘 미완료 3ms',
    options: null,
    hint: 'יְ- 접두 + 두 번째 자음에 다게쉬 + 긴 모음 에(체레) 패턴 = 피엘 미완료',
    reference: '시 115:12',
    difficulty: 2,
  },
  {
    category: 'full_parsing',
    verb: 'הִבְדִּיל',
    root: 'ב-ד-ל',
    meaning: '그가 나누었다',
    correct_answer: '히필 완료 3ms',
    options: null,
    hint: 'הִ- 접두 + 두 번째 자음에 다게쉬 + 이(히렉 요드) = 히필 완료 3ms',
    reference: '창 1:4',
    difficulty: 2,
  },
  {
    category: 'full_parsing',
    verb: 'וַיִּשְׁמַע',
    root: 'ש-מ-ע',
    meaning: '그가 들었다',
    correct_answer: '칼 미완료 3ms 바브연속',
    options: null,
    hint: 'וַיִּ- 접두는 바브연속 미완료; ע로 끝나는 후음 동사, 칼 기본형',
    reference: '창 3:8',
    difficulty: 2,
  },
  {
    category: 'full_parsing',
    verb: 'נִקְרָא',
    root: 'ק-ר-א',
    meaning: '불리다, 불렸다',
    correct_answer: '니팔 완료 3ms',
    options: null,
    hint: 'נִ- 접두 + 마지막 자음 전 긴 모음 아(카메츠) = 니팔 완료 3ms',
    reference: '창 1:5',
    difficulty: 2,
  },
  {
    category: 'full_parsing',
    verb: 'הִתְהַלֵּךְ',
    root: 'ה-ל-ך',
    meaning: '그가 동행했다',
    correct_answer: '히트파엘 완료 3ms',
    options: null,
    hint: 'הִתְ- 접두 + 두 번째 자음에 다게쉬 + 에(체레) 패턴 = 히트파엘 완료 3ms',
    reference: '창 5:24',
    difficulty: 2,
  },
]

/** 전체 30문제 */
const ALL_QUESTIONS = [...BINYAN_ID_QUESTIONS, ...FULL_PARSING_QUESTIONS]

async function seedDrillQuestions() {
  console.log('\n📚 drill_questions 시드 시작')
  console.log(`   총 ${ALL_QUESTIONS.length}문제 (빈야님 식별 ${BINYAN_ID_QUESTIONS.length}개 + 전체 파싱 ${FULL_PARSING_QUESTIONS.length}개)\n`)

  // 1. 기존 데이터 전체 삭제 (멱등성 보장)
  console.log('🗑️  기존 drill_questions 데이터 삭제 중...')
  const { error: deleteError } = await supabase
    .from('drill_questions')
    .delete()
    .not('id', 'is', null) // 전체 행 삭제

  if (deleteError) {
    console.error('❌ 삭제 실패:', deleteError.message)
    process.exit(1)
  }
  console.log('   삭제 완료\n')

  // 2. 30문제 일괄 INSERT
  console.log('📥 문제 INSERT 중...')
  const { data, error: insertError } = await supabase
    .from('drill_questions')
    .insert(ALL_QUESTIONS)
    .select()

  if (insertError) {
    console.error('❌ INSERT 실패:', insertError.message)
    process.exit(1)
  }

  const successCount = data?.length ?? 0
  const failCount = ALL_QUESTIONS.length - successCount

  // 3. 결과 출력
  console.log('─'.repeat(50))
  data?.forEach((row, i) => {
    const prefix = `[${String(i + 1).padStart(2, '0')}/${ALL_QUESTIONS.length}]`
    const cat = row.category === 'binyan_id' ? '빈야님식별' : '전체파싱  '
    console.log(`✅ ${prefix} ${cat}  ${row.verb?.padEnd(8, ' ')}  정답: ${row.correct_answer}`)
  })
  console.log('─'.repeat(50))
  console.log(`\n📊 시드 완료: 성공 ${successCount}개 / 실패 ${failCount}개 / 전체 ${ALL_QUESTIONS.length}개`)

  if (failCount > 0) {
    console.log('⚠️  일부 문제 삽입에 실패했습니다. Supabase 로그를 확인하세요.')
    process.exit(1)
  } else {
    console.log('🎉 30문제가 모두 성공적으로 저장되었습니다.')
  }
}

seedDrillQuestions()
