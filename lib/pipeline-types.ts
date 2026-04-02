/**
 * pipeline-types.ts
 * 히브리어 디버거 데이터 파이프라인 공유 타입 정의
 * 참조: DATA_PIPELINE.md §1.2~1.3, §4 DB 스키마
 */

// ─────────────────────────────────────────
// OSHB 원본 데이터 타입
// ─────────────────────────────────────────

/** morphhb NPM 패키지에서 반환되는 단어 튜플 */
export type OshbWordTuple = [
  hebrew: string,   // 히브리어 문자열 (모음 부호 포함)
  lemma: string,    // Strong번호 (슬래시로 접두어 구분: "b/7225")
  morph: string,    // OSHB 형태론 코드 (예: "HR/Ncfsa")
];

/** morphhb 패키지 전체 구조: 책 → 장 배열 → 절 배열 → 단어 튜플 배열 */
export type OshbBook = OshbWordTuple[][][];

// ─────────────────────────────────────────
// 형태론 파싱 결과 타입
// ─────────────────────────────────────────

/** 품사 코드 (DATA_PIPELINE.md §1.3) */
export type PosCode = "V" | "N" | "A" | "P" | "R" | "C" | "D" | "T" | "S";

/** 동사 어간 코드 */
export type BinyanCode = "q" | "N" | "p" | "P" | "h" | "H" | "t";

/** 동사 시제/상 코드 */
export type TenseCode = "p" | "i" | "w" | "v" | "a" | "s" | "c" | "x";

/** 성(gender) 코드 */
export type GenderCode = "m" | "f" | "c";

/** 수(number) 코드 */
export type NumberCode = "s" | "p" | "d";

/** 인칭(person) 코드 */
export type PersonCode = "1" | "2" | "3";

/** 명사 상태(state) 코드 */
export type StateCode = "a" | "c" | "d";

/** 명사 유형 코드 */
export type NounTypeCode = "c" | "p" | "g";

/**
 * 동사 파싱 결과
 * 코드 예시: HVqp3ms → H(히브리어) + V(동사) + q(칼) + p(완료) + 3 + m + s
 */
export interface VerbParsed {
  pos: "V";
  posKorean: string;          // "동사"
  binyan: BinyanCode;
  binyanKorean: string;       // "칼(Qal)"
  tense: TenseCode;
  tenseKorean: string;        // "완료형(Perfect)"
  person?: PersonCode;
  personKorean?: string;      // "3인칭"
  gender?: GenderCode;
  genderKorean?: string;      // "남성"
  number?: NumberCode;
  numberKorean?: string;      // "단수"
  /** UI 표시용 조합 문자열: "동사 · 칼(Qal) · 완료형 · 3남단" */
  posKoreanFull: string;
}

/**
 * 명사/형용사 파싱 결과
 * 코드 예시: HNcmsa → H + N(명사) + c(보통) + m + s + a(절대형)
 */
export interface NounParsed {
  pos: "N" | "A";
  posKorean: string;          // "명사" | "형용사"
  nounType?: NounTypeCode;
  nounTypeKorean?: string;    // "보통명사" | "고유명사" | "지명"
  gender?: GenderCode;
  genderKorean?: string;
  number?: NumberCode;
  numberKorean?: string;
  state?: StateCode;
  stateKorean?: string;       // "절대형" | "연계형" | "한정형"
  posKoreanFull: string;
}

/** 기능어(전치사, 접속사, 관사, 대명사 등) 파싱 결과 */
export interface FunctionWordParsed {
  pos: Exclude<PosCode, "V" | "N" | "A">;
  posKorean: string;
  subType?: string;           // "Td" → "정관사", "To" → "목적어표지"
  subTypeKorean?: string;
  posKoreanFull: string;
}

export type MorphParsed = VerbParsed | NounParsed | FunctionWordParsed;

// ─────────────────────────────────────────
// 접두어 분해 타입 (Stage 4)
// ─────────────────────────────────────────

/** 렘마 필드의 접두어 코드 */
export type PrefixCode = "b" | "c" | "d" | "i" | "k" | "l" | "m" | "r" | "s";

/** UI 색상 표시용 형태론 파트 (morph_parts 컬럼) */
export interface MorphPart {
  text: string;       // 히브리어 텍스트 (해당 부분)
  role: string;       // 역할 한국어: "전치사", "접속사", "명사 어간" 등
  meaning: string;    // 의미 한국어: "~에(in)", "그리고" 등
  color: string;      // UI_DESIGN_SYSTEM.md 색상 코드
}

// ─────────────────────────────────────────
// 파이프라인 처리 결과 타입
// ─────────────────────────────────────────

/** Strong번호에서 분리된 접두어 정보 */
export interface ParsedPrefix {
  code: PrefixCode;
  korean: string;     // "전치사 בְּ"
  meaning: string;    // "~에, ~로"
  color: string;
}

/** Stage 1~4 통합 처리 결과: 단어 1개 */
export interface ParsedWord {
  /** 원본 OSHB 데이터 */
  raw: OshbWordTuple;

  /** 위치 정보 */
  wordOrder: number;

  /** 히브리어 표기 */
  hebrew: string;

  /** Strong번호 (접두어 제거 후 순수 번호) */
  lemma: string;

  /** 원본 형태론 코드 (H 접두어 제거 후) */
  morphCode: string;

  /** 접두어 목록 (렘마 필드 슬래시 분리) */
  prefixes: ParsedPrefix[];

  /** 형태론 파싱 결과 */
  morph: MorphParsed | null;

  /** UI 색상 포함 형태론 파트 배열 (morph_parts 컬럼) */
  morphParts: MorphPart[];

  /** DB words 테이블 호환 필드 (Stage 5 이전 채울 수 있는 것들) */
  posKorean: string;
  binyan: string | null;
  tense: string | null;
  pgn: string | null;        // "3인칭 · 남성 · 단수"
}

/** Stage 1~4 통합 처리 결과: 절 1개 */
export interface ParsedVerse {
  /** 구절 참조 (예: "Gen.1.1") */
  ref: string;

  /** 파싱된 책 이름 */
  book: string;
  bookKorean: string;
  chapter: number;
  verseStart: number;

  /** 히브리어 전체 텍스트 (단어를 공백으로 연결) */
  hebrewText: string;

  /** 처리된 단어 목록 */
  words: ParsedWord[];
}

// ─────────────────────────────────────────
// 구절 참조 파싱 유틸리티 타입
// ─────────────────────────────────────────

/** "Gen.1.1" 형태의 구절 참조 파싱 결과 */
export interface VerseRef {
  bookKey: string;      // morphhb 패키지 키: "Genesis"
  bookKorean: string;   // "창세기"
  chapter: number;      // 1-indexed
  verse: number;        // 1-indexed
  id: string;           // DB용 ID: "gen_1_1"
}
