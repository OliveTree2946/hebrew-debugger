/**
 * app/api/parse/route.ts
 * POST /api/parse — OSHB 구절 파싱 및 Supabase 저장
 *
 * 요청: { ref: "Gen.1.1" }
 * 응답: { success: true, passage_id: string, word_count: number }
 */

import { NextRequest, NextResponse } from 'next/server'
// morphhb는 타입 선언이 없는 CJS 패키지 — unknown으로 단언 후 OshbData로 캐스팅
import morphhb from 'morphhb'
import {
  parseVerse,
  toDbRows,
  type OshbData,
} from '@/lib/oshb-parser'
import { supabase } from '@/lib/supabase'

// morphhb 데이터를 OshbData 타입으로 캐스팅
const oshbData = morphhb as unknown as OshbData

export async function POST(req: NextRequest): Promise<NextResponse> {
  // 요청 바디 파싱
  let ref: string
  try {
    const body = await req.json() as { ref?: string }
    if (!body.ref) {
      return NextResponse.json(
        { success: false, error: 'ref 필드가 필요합니다. 예: { "ref": "Gen.1.1" }' },
        { status: 400 },
      )
    }
    ref = body.ref
  } catch {
    return NextResponse.json(
      { success: false, error: '유효하지 않은 JSON 요청입니다.' },
      { status: 400 },
    )
  }

  // OSHB 파싱
  let verses: ReturnType<typeof parseVerse>
  try {
    verses = parseVerse(oshbData, ref)
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    return NextResponse.json(
      { success: false, error: `파싱 실패: ${message}` },
      { status: 400 },
    )
  }

  if (verses.length === 0) {
    return NextResponse.json(
      { success: false, error: '파싱된 구절이 없습니다.' },
      { status: 400 },
    )
  }

  // Supabase 저장 (중복 SKIP)
  let totalWordCount = 0
  for (const verse of verses) {
    const { passage, words } = toDbRows(verse)

    // 이미 존재하는 passage_id면 SKIP
    const { data: existing, error: selectErr } = await supabase
      .from('passages')
      .select('id')
      .eq('id', passage.id)
      .maybeSingle()

    if (selectErr) {
      return NextResponse.json(
        { success: false, error: `DB 조회 실패: ${selectErr.message}` },
        { status: 500 },
      )
    }

    if (existing) {
      // 이미 저장된 구절 — 단어 수만 집계
      totalWordCount += words.length
      continue
    }

    // passages 테이블 INSERT
    const { error: passageErr } = await supabase
      .from('passages')
      .insert(passage)

    if (passageErr) {
      return NextResponse.json(
        { success: false, error: `passages 저장 실패: ${passageErr.message}` },
        { status: 500 },
      )
    }

    // words 테이블 INSERT
    const { error: wordsErr } = await supabase
      .from('words')
      .insert(words)

    if (wordsErr) {
      return NextResponse.json(
        { success: false, error: `words 저장 실패: ${wordsErr.message}` },
        { status: 500 },
      )
    }

    totalWordCount += words.length
  }

  // 첫 번째 구절의 passage_id 반환
  const firstPassageId = toDbRows(verses[0]).passage.id

  return NextResponse.json({
    success: true,
    passage_id: firstPassageId,
    word_count: totalWordCount,
  })
}
