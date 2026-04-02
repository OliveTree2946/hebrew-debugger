/**
 * oshb-parser.ts
 * OSHB (Open Scriptures Hebrew Bible) morphhb 패키지 파서
 * 참조: DATA_PIPELINE.md Stage 1~4
 * 출처: Open Scriptures Hebrew Bible Project (CC BY 4.0)
 *
 * morphhb NPM 패키지 구조:
 * {
 *   "Genesis": [          // 책
 *     [                   // 1장
 *       [                 // 1절
 *         ["히브리어", "렘마(Strong번호)", "형태론코드"],  // 단어
 *         ...
 *       ]
 *     ]
 *   ]
 * }
 */

import {
  parseMorphCode,
  parseLemma,
  parseCompoundMorphCode,
  buildMorphParts,
  type ParseResult,
  type LemmaParts,
  type MorphPart,
  getPosColor,
} from './morph-codes';

// ─── 타입 정의 ──────────────────────────────────────────────────

/** OSHB 원본 단어 튜플: [히브리어, 렘마, 형태론코드] */
export type OshbWordTuple = [string, string, string];

/** OSHB 원본 절 배열 */
export type OshbVerse = OshbWordTuple[];

/** OSHB 원본 장 배열 */
export type OshbChapter = OshbVerse[];

/** OSHB 원본 책 배열 */
export type OshbBook = OshbChapter[];

/** OSHB 전체 데이터 */
export type OshbData = Record<string, OshbBook>;

/** 책 이름 영한 매핑 */
export const BOOK_NAMES_KO: Record<string, string> = {
  Genesis: '창세기', Exodus: '출애굽기', Leviticus: '레위기',
  Numbers: '민수기', Deuteronomy: '신명기', Joshua: '여호수아',
  Judges: '사사기', Ruth: '룻기', 'I Samuel': '사무엘상',
  'II Samuel': '사무엘하', 'I Kings': '열왕기상', 'II Kings': '열왕기하',
  'I Chronicles': '역대상', 'II Chronicles': '역대하', Ezra: '에스라',
  Nehemiah: '느헤미야', Esther: '에스더', Job: '욥기',
  Psalms: '시편', Proverbs: '잠언', Ecclesiastes: '전도서',
  'Song of Solomon': '아가', Isaiah: '이사야', Jeremiah: '예레미야',
  Lamentations: '예레미야애가', Ezekiel: '에스겔', Daniel: '다니엘',
  Hosea: '호세아', Joel: '요엘', Amos: '아모스',
  Obadiah: '오바댜', Jonah: '요나', Micah: '미가',
  Nahum: '나훔', Habakkuk: '하박국', Zephaniah: '스바냐',
  Haggai: '학개', Zechariah: '스가랴', Malachi: '말라기',
};

/** 구절 레퍼런스 파싱 결과 */
export interface PassageRef {
  book: string;       // 영어 책 이름 (OSHB 키)
  bookKo: string;     // 한국어 책 이름
  chapter: number;    // 1-indexed
  verseStart: number; // 1-indexed
  verseEnd?: number;  // 범위 구절 (선택)
  /** "Gen.1.1" 형식 ID */
  id: string;
}

/** 파싱된 단어 (DB words 테이블에 저장할 형태) */
export interface ParsedWord {
  wordOrder: number;
  hebrew: string;
  lemma: LemmaParts;
  morphCode: string;
  morph: ParseResult[];           // 복합 형태론 파싱 결과
  morphParts: MorphPart[];        // UI 표시용 형태소 파트
  posLabel: string;               // "동사 · 칼(Qal) · 완료형 · 3인칭 남성 단수"
  posColor: string;
  /** Strong번호 (접두어 제외, DB 조회용) */
  strongNumber: string;
  /** 접두어 설명 (접두어가 있는 경우) */
  prefixNote?: string;
}

/** 파싱된 구절 */
export interface ParsedVerse {
  ref: PassageRef;
  words: ParsedWord[];
  /** 구절 전체 히브리어 텍스트 (공백 구분) */
  hebrewText: string;
}

// ─── 레퍼런스 파싱 ───────────────────────────────────────────────

/**
 * "Gen.1.1" 형식의 레퍼런스를 PassageRef로 변환
 * 지원 형식:
 *   "Gen.1.1"      → 창세기 1:1
 *   "Ps.23.1"      → 시편 23:1
 *   "Jonah.1.1-2"  → 요나 1:1-2
 */
export function parseRef(ref: string): PassageRef {
  // 정규화: 점(.) 또는 공백으로 분리
  const normalized = ref.trim();
  // 레퍼런스 정규화: 콜론(:)도 점(.)으로 처리 (예: "Gen 1:1" → "Gen.1.1")
  const parts = normalized.replace(':', '.').split(/[.\s]+/);

  if (parts.length < 3) {
    throw new Error(`잘못된 레퍼런스 형식: "${ref}". 올바른 형식: "Gen.1.1"`);
  }

  const bookAbbr = parts[0];
  const chapter = parseInt(parts[1], 10);
  const verseStr = parts[2];

  // 절 범위 파싱 (예: "1-2")
  let verseStart: number;
  let verseEnd: number | undefined;
  if (verseStr.includes('-')) {
    const [start, end] = verseStr.split('-').map(v => parseInt(v, 10));
    verseStart = start;
    verseEnd = end;
  } else {
    verseStart = parseInt(verseStr, 10);
  }

  // 책 이름 풀네임 매칭
  const book = resolveBookName(bookAbbr);
  const bookKo = BOOK_NAMES_KO[book] ?? book;

  const id = `${bookAbbr}.${chapter}.${verseStart}`;

  return { book, bookKo, chapter, verseStart, verseEnd, id };
}

/**
 * 약어에서 OSHB 책 이름(키)으로 변환
 * 가장 일반적인 약어들을 지원
 */
function resolveBookName(abbr: string): string {
  const map: Record<string, string> = {
    // 모세오경
    Gen: 'Genesis', Exod: 'Exodus', Ex: 'Exodus', Lev: 'Leviticus',
    Num: 'Numbers', Deut: 'Deuteronomy', Dt: 'Deuteronomy',
    // 역사서
    Josh: 'Joshua', Judg: 'Judges', Jdg: 'Judges',
    Ruth: 'Ruth', '1Sam': 'I Samuel', '2Sam': 'II Samuel',
    '1Kgs': 'I Kings', '2Kgs': 'II Kings',
    '1Chr': 'I Chronicles', '2Chr': 'II Chronicles',
    Ezra: 'Ezra', Neh: 'Nehemiah', Esth: 'Esther',
    // 시가서
    Job: 'Job', Ps: 'Psalms', Pss: 'Psalms',
    Prov: 'Proverbs', Pr: 'Proverbs', Eccl: 'Ecclesiastes',
    Song: 'Song of Solomon', Cant: 'Song of Solomon',
    // 예언서
    Isa: 'Isaiah', Jer: 'Jeremiah', Lam: 'Lamentations',
    Ezek: 'Ezekiel', Ez: 'Ezekiel', Dan: 'Daniel',
    Hos: 'Hosea', Joel: 'Joel', Amos: 'Amos',
    Obad: 'Obadiah', Jonah: 'Jonah', Jon: 'Jonah',
    Mic: 'Micah', Nah: 'Nahum', Hab: 'Habakkuk',
    Zeph: 'Zephaniah', Hag: 'Haggai', Zech: 'Zechariah',
    Mal: 'Malachi',
  };

  // 이미 풀네임이면 그대로 반환
  if (BOOK_NAMES_KO[abbr]) return abbr;

  const resolved = map[abbr];
  if (!resolved) {
    throw new Error(`알 수 없는 책 이름: "${abbr}"`);
  }
  return resolved;
}

// ─── 핵심 파서 ──────────────────────────────────────────────────

/**
 * OSHB 단어 튜플을 파싱된 단어 객체로 변환
 * DATA_PIPELINE.md Stage 1~4 구현
 */
export function parseOshbWord(
  tuple: OshbWordTuple,
  wordOrder: number,
): ParsedWord {
  const [hebrew, lemma, morphCode] = tuple;

  // Stage 3: Strong번호 + 접두어 분리
  const lemmaParts = parseLemma(lemma);

  // Stage 2: 형태론 코드 → 한국어 변환
  // 복합 형태론 코드 처리 (예: "HR/Ncfsa" → 전치사 + 명사)
  const morphResults = parseCompoundMorphCode(morphCode);

  // Stage 4: UI용 형태소 파트 배열
  const morphParts = buildMorphParts(hebrew, lemma, morphCode);

  // 대표 파싱 결과 (마지막 = 핵심 형태소)
  const primaryMorph = morphResults[morphResults.length - 1];
  const posLabel = primaryMorph && 'label' in primaryMorph
    ? primaryMorph.label
    : primaryMorph?.pos ?? '불명';

  // 접두어 설명 생성
  const prefixNote = lemmaParts.prefixes.length > 0
    ? lemmaParts.prefixes.map(p => `${p.hebrew}(${p.meaning})`).join(' + ')
    : undefined;

  return {
    wordOrder,
    hebrew,
    lemma: lemmaParts,
    morphCode,
    morph: morphResults,
    morphParts,
    posLabel,
    posColor: primaryMorph?.color ?? '#E8DCC8',
    strongNumber: lemmaParts.strongNumber,
    prefixNote,
  };
}

/**
 * OSHB 데이터에서 특정 절(들)을 추출하여 파싱
 *
 * @param oshbData - morphhb 패키지에서 가져온 전체 데이터
 * @param ref - 레퍼런스 문자열 (예: "Gen.1.1", "Ps.23.1-3")
 * @returns 파싱된 구절 배열 (범위 구절이면 여러 개)
 */
export function parseVerse(oshbData: OshbData, ref: string): ParsedVerse[] {
  const passageRef = parseRef(ref);
  const { book, chapter, verseStart, verseEnd } = passageRef;

  // OSHB 데이터 접근 (0-indexed)
  const bookData = oshbData[book];
  if (!bookData) {
    throw new Error(`OSHB 데이터에서 책을 찾을 수 없음: ${book}`);
  }

  const chapterData = bookData[chapter - 1];
  if (!chapterData) {
    throw new Error(`${book} ${chapter}장이 없음`);
  }

  // 절 범위 결정
  const endVerse = verseEnd ?? verseStart;
  const results: ParsedVerse[] = [];

  for (let v = verseStart; v <= endVerse; v++) {
    const verseData = chapterData[v - 1];
    if (!verseData) {
      console.warn(`경고: ${book} ${chapter}:${v}가 없음. 건너뜀.`);
      continue;
    }

    // 각 단어 파싱
    const words = verseData.map((tuple, idx) =>
      parseOshbWord(tuple as OshbWordTuple, idx + 1)
    );

    // 구절 전체 히브리어 텍스트 (공백 구분, RTL 순서)
    const hebrewText = words.map(w => w.hebrew).join(' ');

    const verseRef: PassageRef = {
      ...passageRef,
      verseStart: v,
      verseEnd: undefined,
      id: `${passageRef.id.split('.').slice(0, 2).join('.')}.${v}`,
    };

    results.push({ ref: verseRef, words, hebrewText });
  }

  return results;
}

// ─── DB 저장 형태 변환 ───────────────────────────────────────────

/**
 * 파싱된 구절을 Supabase DB 저장 형태로 변환
 * DATA_PIPELINE.md DB 스키마 참조
 */
export interface DbPassageRow {
  id: string;                     // "gen_1_1"
  book: string;                   // "Genesis"
  book_korean: string;            // "창세기"
  chapter: number;
  verse_start: number;
  verse_end?: number;
  hebrew_text: string;
  reviewed: boolean;
}

export interface DbWordRow {
  passage_id: string;
  word_order: number;
  hebrew: string;
  lemma: string;                  // Strong번호 (원본)
  morph_code: string;             // OSHB 형태론 코드 원본
  pos_korean: string;             // "동사 · 칼(Qal) · 완료형 · 3인칭 남성 단수"
  morph_parts: MorphPart[];       // JSONB
  reviewed: boolean;
}

export function toDbRows(verse: ParsedVerse): {
  passage: DbPassageRow;
  words: DbWordRow[];
} {
  const { ref, words, hebrewText } = verse;

  // 책 이름에서 DB ID 생성 (예: "Genesis" → "gen", "I Samuel" → "1sa")
  const bookAbbr = ref.book
    .toLowerCase()
    .replace(/^ii\s+/, '2')       // "II Samuel" → "2samuel"
    .replace(/^i\s+/, '1')        // "I Samuel" → "1samuel"
    .replace(/\s+/g, '')          // 공백 제거 ("Song of Solomon" → "songofsolomon")
    .slice(0, 3);                 // 최대 3자

  const id = `${bookAbbr}_${ref.chapter}_${ref.verseStart}`;

  const passage: DbPassageRow = {
    id,
    book: ref.book,
    book_korean: ref.bookKo,
    chapter: ref.chapter,
    verse_start: ref.verseStart,
    verse_end: ref.verseEnd,
    hebrew_text: hebrewText,
    reviewed: false,
  };

  const dbWords: DbWordRow[] = words.map(w => ({
    passage_id: id,
    word_order: w.wordOrder,
    hebrew: w.hebrew,
    lemma: w.lemma.raw,
    morph_code: w.morphCode,
    pos_korean: w.posLabel,
    morph_parts: w.morphParts,
    reviewed: false,
  }));

  return { passage, words: dbWords };
}

// ─── 배치 처리 유틸 ──────────────────────────────────────────────

/**
 * 핵심 30 구절 일괄 처리
 * CORE_PASSAGES_30.md의 구절 목록을 한 번에 파싱
 */
export async function parseCorePassages(
  oshbData: OshbData,
  refs: string[],
  onProgress?: (current: number, total: number, ref: string) => void,
): Promise<ParsedVerse[]> {
  const results: ParsedVerse[] = [];

  for (let i = 0; i < refs.length; i++) {
    const ref = refs[i];
    onProgress?.(i + 1, refs.length, ref);

    try {
      const verses = parseVerse(oshbData, ref);
      results.push(...verses);
    } catch (err) {
      console.error(`파싱 실패 (${ref}):`, err);
    }
  }

  return results;
}

// ─── 디버그 유틸 ────────────────────────────────────────────────

/**
 * 파싱 결과를 읽기 쉬운 형태로 출력 (개발/디버깅용)
 */
export function formatParsedVerse(verse: ParsedVerse): string {
  const { ref, words } = verse;
  const lines: string[] = [
    `\n═══ ${ref.bookKo} ${ref.chapter}:${ref.verseStart} ═══`,
    `히브리어: ${verse.hebrewText}`,
    '',
  ];

  words.forEach(w => {
    lines.push(`[${w.wordOrder}] ${w.hebrew}`);
    lines.push(`    Strong: ${w.strongNumber}`);
    lines.push(`    형태론: ${w.morphCode}`);
    lines.push(`    한국어: ${w.posLabel}`);
    if (w.prefixNote) {
      lines.push(`    접두어: ${w.prefixNote}`);
    }
    if (w.morphParts.length > 0) {
      const partsStr = w.morphParts.map(p => `${p.text}(${p.role})`).join(' + ');
      lines.push(`    파트:   ${partsStr}`);
    }
    lines.push('');
  });

  return lines.join('\n');
}
