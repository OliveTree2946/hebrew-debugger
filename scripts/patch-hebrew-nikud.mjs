/**
 * patch-hebrew-nikud.mjs
 * morphhb wlc XML 원본에서 모음(니쿠드) 포함 히브리어를 읽어
 * words.hebrew 컬럼을 업데이트한다.
 *
 * 문제: morphhb npm index.js는 미리 컴파일된 JSON으로, 모음이 없음.
 * 해결: wlc/*.xml 원본에는 모음+칸틸레이션이 있음.
 *       칸틸레이션(U+0591–U+05AF)만 제거하고 모음은 유지한다.
 *
 * 실행: node scripts/patch-hebrew-nikud.mjs
 */

import { readFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'

const __dirname = dirname(fileURLToPath(import.meta.url))
config({ path: join(__dirname, '../.env.local') })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

const WLC_DIR = join(__dirname, '../node_modules/morphhb/wlc')

// ─────────────────────────────────────────
// passage_id → XML 파일명 + OSIS verse ID 매핑
// ─────────────────────────────────────────
const PASSAGE_MAP = [
  { id: 'gen_1_1',      xml: 'Gen.xml',   osisId: 'Gen.1.1'      },
  { id: 'gen_1_2',      xml: 'Gen.xml',   osisId: 'Gen.1.2'      },
  { id: 'gen_1_26',     xml: 'Gen.xml',   osisId: 'Gen.1.26'     },
  { id: 'gen_2_7',      xml: 'Gen.xml',   osisId: 'Gen.2.7'      },
  { id: 'gen_12_1',     xml: 'Gen.xml',   osisId: 'Gen.12.1'     },
  { id: 'gen_15_6',     xml: 'Gen.xml',   osisId: 'Gen.15.6'     },
  { id: 'exo_3_14',     xml: 'Exod.xml',  osisId: 'Exod.3.14'    },
  { id: 'exo_20_2',     xml: 'Exod.xml',  osisId: 'Exod.20.2'    },
  { id: 'lev_19_18',    xml: 'Lev.xml',   osisId: 'Lev.19.18'    },
  { id: 'deu_6_4',      xml: 'Deut.xml',  osisId: 'Deut.6.4'     },
  { id: 'jos_1_8',      xml: 'Josh.xml',  osisId: 'Josh.1.8'     },
  { id: 'rut_1_16',     xml: 'Ruth.xml',  osisId: 'Ruth.1.16'    },
  { id: '1sa_3_10',     xml: '1Sam.xml',  osisId: '1Sam.3.10'    },
  { id: '2sa_12_7',     xml: '2Sam.xml',  osisId: '2Sam.12.7'    },
  { id: '1ki_19_11',    xml: '1Kgs.xml',  osisId: '1Kgs.19.11'   },
  { id: 'psa_1_1',      xml: 'Ps.xml',    osisId: 'Ps.1.1'       },
  { id: 'psa_23_1',     xml: 'Ps.xml',    osisId: 'Ps.23.1'      },
  { id: 'psa_51_3',     xml: 'Ps.xml',    osisId: 'Ps.51.3'      },
  { id: 'psa_119_105',  xml: 'Ps.xml',    osisId: 'Ps.119.105'   },
  { id: 'psa_139_1',    xml: 'Ps.xml',    osisId: 'Ps.139.1'     },
  { id: 'isa_6_3',      xml: 'Isa.xml',   osisId: 'Isa.6.3'      },
  { id: 'isa_9_5',      xml: 'Isa.xml',   osisId: 'Isa.9.5'      },
  { id: 'isa_53_4',     xml: 'Isa.xml',   osisId: 'Isa.53.4'     },
  { id: 'jer_1_5',      xml: 'Jer.xml',   osisId: 'Jer.1.5'      },
  { id: 'eze_37_4',     xml: 'Ezek.xml',  osisId: 'Ezek.37.4'    },
  { id: 'jon_1_1',      xml: 'Jonah.xml', osisId: 'Jonah.1.1'    },
  { id: 'mic_6_8',      xml: 'Mic.xml',   osisId: 'Mic.6.8'      },
  { id: 'pro_3_5',      xml: 'Prov.xml',  osisId: 'Prov.3.5'     },
  { id: 'ecc_3_1',      xml: 'Eccl.xml',  osisId: 'Eccl.3.1'     },
  { id: 'job_1_21',     xml: 'Job.xml',   osisId: 'Job.1.21'     },
]

// ─────────────────────────────────────────
// XML 파일 캐시 (같은 파일 반복 로드 방지)
// ─────────────────────────────────────────
const xmlCache = new Map()

function getXmlContent(filename) {
  if (!xmlCache.has(filename)) {
    const content = readFileSync(join(WLC_DIR, filename), 'utf-8')
    xmlCache.set(filename, content)
  }
  return xmlCache.get(filename)
}

// ─────────────────────────────────────────
// 히브리어 텍스트 정제
// - '/' 접두어 구분자 제거
// - 칸틸레이션 마크 제거 (U+0591–U+05AF)
// - 기타 구두점 제거 (마카프 U+05BE, 파세크 U+05C0, 소프 파수크 U+05C3)
// - 모음(니쿠드 U+05B0–U+05C7) 및 다게시(U+05BC) 유지
// ─────────────────────────────────────────
function cleanHebrew(raw) {
  return raw
    .replace(/\//g, '')                         // 접두어 구분자
    .replace(/[\u0591-\u05AF]/g, '')            // 칸틸레이션 마크
    .replace(/[\u05BE\u05C0\u05C3\u05C6]/g, '') // 마카프, 파세크, 소프파수크, 눈하푸하
    .trim()
}

// ─────────────────────────────────────────
// XML에서 특정 osisID 절의 단어 텍스트 배열 추출
// ─────────────────────────────────────────
function extractVerseWords(xmlContent, osisId) {
  // osisId의 점(.)을 이스케이프하여 정규식 패턴 생성
  const escaped = osisId.replace(/\./g, '\\.')

  // <verse osisID="..."> ... </verse> 블록 추출
  const verseRegex = new RegExp(
    `<verse[^>]*osisID="${escaped}"[^>]*>([\\s\\S]*?)</verse>`
  )
  const verseMatch = xmlContent.match(verseRegex)
  if (!verseMatch) return null

  const verseContent = verseMatch[1]

  // <w ...>텍스트</w> 에서 텍스트만 추출 (칸틸레이션+슬래시 포함 원본)
  const wordRegex = /<w[^>]*>([^<]+)<\/w>/g
  const words = []
  let m
  while ((m = wordRegex.exec(verseContent)) !== null) {
    words.push(cleanHebrew(m[1]))
  }

  return words
}

// ─────────────────────────────────────────
// 메인 실행
// ─────────────────────────────────────────
async function patchNikud() {
  console.log('\n🔤 히브리어 모음(니쿠드) 패치 시작')
  console.log(`   대상: ${PASSAGE_MAP.length}개 구절\n`)

  let totalUpdated = 0
  let totalFailed = 0
  let totalSkipped = 0

  for (const { id, xml, osisId } of PASSAGE_MAP) {
    // 1. XML에서 모음 포함 단어 목록 추출
    let xmlContent
    try {
      xmlContent = getXmlContent(xml)
    } catch (e) {
      console.error(`❌ ${id} — XML 파일 읽기 실패: ${xml}`)
      totalFailed++
      continue
    }

    const voweledWords = extractVerseWords(xmlContent, osisId)
    if (!voweledWords || voweledWords.length === 0) {
      console.warn(`⚠️  ${id} — XML에서 절을 찾지 못함 (osisId: ${osisId})`)
      totalSkipped++
      continue
    }

    // 2. DB에서 해당 passage의 단어 목록 조회 (word_order 순)
    const { data: dbWords, error: fetchErr } = await supabase
      .from('words')
      .select('id, word_order, hebrew')
      .eq('passage_id', id)
      .order('word_order')

    if (fetchErr || !dbWords || dbWords.length === 0) {
      console.warn(`⚠️  ${id} — DB 단어 없음 (시드 안 됨)`)
      totalSkipped++
      continue
    }

    // 3. word_order 기준으로 XML 단어와 매핑 (1-indexed)
    if (voweledWords.length !== dbWords.length) {
      console.warn(
        `⚠️  ${id} — XML 단어 수(${voweledWords.length}) ≠ DB 단어 수(${dbWords.length}). 매핑 진행.`
      )
    }

    // 4. 각 단어 업데이트
    let passageUpdated = 0
    for (let i = 0; i < dbWords.length; i++) {
      const dbWord = dbWords[i]
      const voweledHebrew = voweledWords[i]

      if (!voweledHebrew) continue
      if (dbWord.hebrew === voweledHebrew) continue // 이미 같으면 스킵

      const { error: updateErr } = await supabase
        .from('words')
        .update({ hebrew: voweledHebrew })
        .eq('id', dbWord.id)

      if (updateErr) {
        console.error(`  ❌ word_order=${dbWord.word_order} 업데이트 실패: ${updateErr.message}`)
        totalFailed++
      } else {
        passageUpdated++
        totalUpdated++
      }
    }

    console.log(`✅ ${id.padEnd(16)} — ${passageUpdated}개 단어 업데이트 (XML: ${voweledWords[0]} ...)`)
  }

  console.log(`\n${'─'.repeat(50)}`)
  console.log(`📊 완료: 업데이트 ${totalUpdated}개 단어 / 건너뜀 ${totalSkipped}개 구절 / 실패 ${totalFailed}개`)
  if (totalSkipped > 0) {
    console.log('⚠️  건너뜀: 먼저 node scripts/seed-passages.mjs 실행 후 재시도')
  }
}

patchNikud()
