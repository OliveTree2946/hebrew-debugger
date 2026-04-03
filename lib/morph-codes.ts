/**
 * morph-codes.ts
 * OSHB 형태론 코드 → 한국어 변환 유틸리티
 * 참조: DATA_PIPELINE.md Stage 2
 * 출처: Open Scriptures Hebrew Bible (CC BY 4.0)
 */

import morphMap from '../data/morph-korean-map.json';

// ─── 타입 정의 ──────────────────────────────────────────────────

/** 품사 코드 */
export type PosCode = 'V' | 'N' | 'A' | 'P' | 'R' | 'C' | 'D' | 'T' | 'S' | 'E';

/** 빈야님(어간) 코드 */
export type BinyanCode = 'q' | 'N' | 'p' | 'P' | 'h' | 'H' | 't' | 'o' | 'O' | 'r' | 'm' | 'M' | string;

/** 시제/상 코드 */
export type TenseCode = 'p' | 'i' | 'w' | 'v' | 'a' | 's' | 'c' | 'x' | 'j' | 'h' | 'q';

/** 인칭 */
export type PersonCode = '1' | '2' | '3';

/** 성 */
export type GenderCode = 'm' | 'f' | 'c' | 'b';

/** 수 */
export type NumberCode = 's' | 'p' | 'd';

/** 명사 상태 */
export type NounStateCode = 'a' | 'c' | 'd';

/** 파싱 결과 — 동사 */
export interface ParsedVerb {
  type: 'verb';
  pos: string;           // 한국어 품사명
  binyan: string;        // 한국어 어간명
  binyanEn: string;      // 영어 어간명
  tense: string;         // 한국어 시제/상
  person: string;        // 한국어 인칭
  gender: string;        // 한국어 성
  number: string;        // 한국어 수
  suffix?: ParsedSuffix; // 접미 대명사 (있는 경우)
  color: string;
  /** 화면 표시용: "칼(Qal) · 완료형 · 3인칭 남성 단수" */
  label: string;
  raw: string;           // 원본 형태론 코드
}

/** 파싱 결과 — 명사 */
export interface ParsedNoun {
  type: 'noun';
  pos: string;
  nounType: string;
  gender: string;
  number: string;
  state: string;
  suffix?: ParsedSuffix;
  color: string;
  label: string;
  raw: string;
}

/** 파싱 결과 — 형용사 */
export interface ParsedAdjective {
  type: 'adjective';
  pos: string;
  gender: string;
  number: string;
  state: string;
  suffix?: ParsedSuffix;
  color: string;
  label: string;
  raw: string;
}

/** 파싱 결과 — 전치사 */
export interface ParsedPreposition {
  type: 'preposition';
  pos: string;
  suffix?: ParsedSuffix;
  color: string;
  label: string;
  raw: string;
}

/** 파싱 결과 — 접속사 */
export interface ParsedConjunction {
  type: 'conjunction';
  pos: string;
  suffix?: ParsedSuffix;
  color: string;
  label: string;
  raw: string;
}

/** 파싱 결과 — 관사/입자 */
export interface ParsedParticle {
  type: 'particle';
  pos: string;
  particleType: string;
  color: string;
  label: string;
  raw: string;
}

/** 파싱 결과 — 대명사 */
export interface ParsedPronoun {
  type: 'pronoun';
  pos: string;
  pronounType: string;
  person: string;
  gender: string;
  number: string;
  color: string;
  label: string;
  raw: string;
}

/** 파싱 결과 — 부사 */
export interface ParsedAdverb {
  type: 'adverb';
  pos: string;
  color: string;
  label: string;
  raw: string;
}

/** 접미 대명사 파싱 결과 */
export interface ParsedSuffix {
  person: string;
  gender: string;
  number: string;
  label: string; // "2인칭 남성 단수 접미대명사"
}

/** 파싱 결과 유니온 타입 */
export type ParsedMorph =
  | ParsedVerb
  | ParsedNoun
  | ParsedAdjective
  | ParsedPreposition
  | ParsedConjunction
  | ParsedParticle
  | ParsedPronoun
  | ParsedAdverb;

/** 파싱 실패 결과 */
export interface ParsedUnknown {
  type: 'unknown';
  pos: string;
  color: string;
  label: string;
  raw: string;
}

export type ParseResult = ParsedMorph | ParsedUnknown;

// ─── 헬퍼 함수 ──────────────────────────────────────────────────

/** 품사 → 색상 */
export function getPosColor(posCode: string): string {
  return (morphMap.colors as Record<string, string>)[posCode] ?? '#E8DCC8';
}

/** 빈야님 → 색상 */
export function getBinyanColor(binyanCode: string): string {
  return (morphMap.binyan_colors as Record<string, string>)[binyanCode] ?? '#F67280';
}

/** 접미대명사 코드 파싱 (형태론 코드 문자열의 마지막 3자리: PGN) */
function parseSuffix(suffixCode: string): ParsedSuffix | undefined {
  if (!suffixCode || suffixCode.length < 1) return undefined;

  // 접미 대명사: SXYZ → S + person + gender + number
  const person = (morphMap.suffix_person as Record<string, string>)[suffixCode[0]] ?? '';
  const gender = (morphMap.suffix_gender as Record<string, string>)[suffixCode[1]] ?? '';
  const number = (morphMap.suffix_number as Record<string, string>)[suffixCode[2]] ?? '';

  if (!person) return undefined;

  return {
    person,
    gender,
    number,
    label: `${person} ${gender} ${number} 접미대명사`.trim(),
  };
}

// ─── 핵심 파서 함수 ──────────────────────────────────────────────

/**
 * OSHB 형태론 코드를 한국어 파싱 결과로 변환
 *
 * OSHB 코드 형식 예:
 *   HVqp3ms  → H(히브리어) V(동사) q(칼) p(완료) 3(인칭) m(성) s(수)
 *   HNcmsa   → H(히브리어) N(명사) c(보통) m(성) s(수) a(상태)
 *   HR       → H(히브리어) R(전치사)
 *   HTd      → H(히브리어) T(관사) d(정관사)
 *
 * @param morphCode - OSHB 형태론 코드 문자열 (예: "HVqp3ms")
 * @returns 한국어로 변환된 파싱 결과
 */
export function parseMorphCode(morphCode: string): ParseResult {
  if (!morphCode || morphCode.length < 2) {
    return { type: 'unknown', pos: '불명', color: '#E8DCC8', label: '불명', raw: morphCode };
  }

  // OSHB 코드는 항상 언어 접두어로 시작
  // H = 히브리어, A = 아람어
  let idx = 0;
  if (morphCode[0] === 'H' || morphCode[0] === 'A') {
    idx = 1; // 언어 접두어 건너뜀
  }

  const posCode = morphCode[idx] as PosCode;
  const posKo = (morphMap.pos as Record<string, string>)[posCode] ?? '불명';
  const color = getPosColor(posCode);
  const rest = morphCode.slice(idx + 1);

  switch (posCode) {
    // ── 동사 ─────────────────────────────────────────────────────
    case 'V': {
      // 형식: V [빈얀] [시제] [인칭] [성] [수] [S접미PGN]
      const binyanCode = rest[0] as BinyanCode;
      const tenseCode = rest[1] as TenseCode;
      const personCode = rest[2] as PersonCode;
      const genderCode = rest[3] as GenderCode;
      const numberCode = rest[4] as NumberCode;
      const suffixCode = rest.slice(5); // 접미대명사 부분

      const binyanData = (morphMap.binyan as Record<string, { ko: string; en: string; meaning: string }>)[binyanCode];
      const tenseData = (morphMap.tense as Record<string, { ko: string; en: string; desc: string }>)[tenseCode];
      const person = (morphMap.person as Record<string, string>)[personCode] ?? '';
      const gender = (morphMap.gender as Record<string, string>)[genderCode] ?? '';
      const number = (morphMap.number as Record<string, string>)[numberCode] ?? '';

      const binyanKo = binyanData?.ko ?? binyanCode ?? '';
      const binyanEn = binyanData?.en ?? '';
      const tenseKo = tenseData?.ko ?? tenseCode ?? '';

      // 접미대명사 파싱 (S가 있는 경우)
      const suffix = suffixCode.startsWith('S')
        ? parseSuffix(suffixCode.slice(1))
        : undefined;

      // 표시 레이블: "칼(Qal) · 완료형 · 3인칭 남성 단수"
      const parts = [
        binyanKo && binyanEn ? `${binyanKo}(${binyanEn})` : binyanKo,
        tenseKo,
        [person, gender, number].filter(Boolean).join(' '),
      ].filter(Boolean);

      if (suffix) parts.push(suffix.label);

      return {
        type: 'verb',
        pos: posKo,
        binyan: binyanKo,
        binyanEn,
        tense: tenseKo,
        person,
        gender,
        number,
        suffix,
        color,
        label: `${posKo} · ${parts.join(' · ')}`,
        raw: morphCode,
      } as ParsedVerb;
    }

    // ── 명사 ─────────────────────────────────────────────────────
    case 'N': {
      // 형식: N [유형] [성] [수] [상태] [S접미PGN]
      const nounTypeCode = rest[0];
      const genderCode = rest[1] as GenderCode;
      const numberCode = rest[2] as NumberCode;
      const stateCode = rest[3] as NounStateCode;
      const suffixCode = rest.slice(4);

      const nounType = (morphMap.noun_type as Record<string, string>)[nounTypeCode] ?? '보통명사';
      const gender = (morphMap.gender as Record<string, string>)[genderCode] ?? '';
      const number = (morphMap.number as Record<string, string>)[numberCode] ?? '';
      const state = (morphMap.noun_state as Record<string, string>)[stateCode] ?? '';

      const suffix = suffixCode.startsWith('S') ? parseSuffix(suffixCode.slice(1)) : undefined;

      const parts = [
        nounType !== '보통명사' ? nounType : null,
        gender,
        number,
        state && state !== '절대형' ? state : null,
      ].filter(Boolean) as string[];

      if (suffix) parts.push(suffix.label);

      return {
        type: 'noun',
        pos: posKo,
        nounType,
        gender,
        number,
        state,
        suffix,
        color,
        label: `${posKo} · ${parts.join(' · ')}`,
        raw: morphCode,
      } as ParsedNoun;
    }

    // ── 형용사 ────────────────────────────────────────────────────
    case 'A': {
      // 형식: A [유형] [성] [수] [상태]
      const genderCode = rest[1] as GenderCode;
      const numberCode = rest[2] as NumberCode;
      const stateCode = rest[3] as NounStateCode;
      const suffixCode = rest.slice(4);

      const gender = (morphMap.gender as Record<string, string>)[genderCode] ?? '';
      const number = (morphMap.number as Record<string, string>)[numberCode] ?? '';
      const state = (morphMap.noun_state as Record<string, string>)[stateCode] ?? '';

      const suffix = suffixCode.startsWith('S') ? parseSuffix(suffixCode.slice(1)) : undefined;

      const parts = [gender, number, state && state !== '절대형' ? state : null].filter(Boolean) as string[];
      if (suffix) parts.push(suffix.label);

      return {
        type: 'adjective',
        pos: posKo,
        gender,
        number,
        state,
        suffix,
        color,
        label: `${posKo} · ${parts.join(' · ')}`,
        raw: morphCode,
      } as ParsedAdjective;
    }

    // ── 전치사 ────────────────────────────────────────────────────
    case 'R': {
      const suffixCode = rest;
      const suffix = suffixCode.startsWith('S') ? parseSuffix(suffixCode.slice(1)) : undefined;
      const label = suffix ? `${posKo} + ${suffix.label}` : posKo;

      return {
        type: 'preposition',
        pos: posKo,
        suffix,
        color,
        label,
        raw: morphCode,
      } as ParsedPreposition;
    }

    // ── 접속사 ────────────────────────────────────────────────────
    case 'C': {
      const suffixCode = rest;
      const suffix = suffixCode.startsWith('S') ? parseSuffix(suffixCode.slice(1)) : undefined;
      const label = suffix ? `${posKo} + ${suffix.label}` : posKo;

      return {
        type: 'conjunction',
        pos: posKo,
        suffix,
        color,
        label,
        raw: morphCode,
      } as ParsedConjunction;
    }

    // ── 관사/입자 ─────────────────────────────────────────────────
    case 'T': {
      const particleTypeCode = rest[0];
      const particleType = (morphMap.particle_type as Record<string, string>)[particleTypeCode] ?? posKo;

      // 직접 목적어 표지(אֵת)는 특별 레이블
      const label = particleTypeCode === 'o'
        ? '직접 목적어 표지 (אֵת)'
        : particleTypeCode === 'd'
          ? '정관사 (הַ)'
          : particleType;

      return {
        type: 'particle',
        pos: posKo,
        particleType,
        color,
        label,
        raw: morphCode,
      } as ParsedParticle;
    }

    // ── 대명사 ────────────────────────────────────────────────────
    case 'P': {
      const pronounTypeCode = rest[0];
      const personCode = rest[1] as PersonCode;
      const genderCode = rest[2] as GenderCode;
      const numberCode = rest[3] as NumberCode;

      const pronounType = (morphMap.pronoun_type as Record<string, string>)[pronounTypeCode] ?? '대명사';
      const person = (morphMap.person as Record<string, string>)[personCode] ?? '';
      const gender = (morphMap.gender as Record<string, string>)[genderCode] ?? '';
      const number = (morphMap.number as Record<string, string>)[numberCode] ?? '';

      const parts = [pronounType, person, gender, number].filter(Boolean);

      return {
        type: 'pronoun',
        pos: posKo,
        pronounType,
        person,
        gender,
        number,
        color,
        label: `${posKo} · ${parts.join(' · ')}`,
        raw: morphCode,
      } as ParsedPronoun;
    }

    // ── 부사 ─────────────────────────────────────────────────────
    case 'D': {
      return {
        type: 'adverb',
        pos: posKo,
        color,
        label: posKo,
        raw: morphCode,
      } as ParsedAdverb;
    }

    // ── 접미대명사 (독립형) ───────────────────────────────────────
    case 'S': {
      const suffix = parseSuffix(rest);
      return {
        type: 'pronoun',
        pos: '접미대명사',
        pronounType: '접미',
        person: suffix?.person ?? '',
        gender: suffix?.gender ?? '',
        number: suffix?.number ?? '',
        color,
        label: suffix?.label ?? '접미대명사',
        raw: morphCode,
      } as ParsedPronoun;
    }

    // ── 기타 ─────────────────────────────────────────────────────
    default:
      return {
        type: 'unknown',
        pos: posKo || posCode,
        color,
        label: posKo || posCode,
        raw: morphCode,
      } as ParsedUnknown;
  }
}

// ─── 렘마에서 접두어/어근 분리 ───────────────────────────────────

/**
 * 렘마 필드(Strong번호)에서 접두어와 핵심 Strong번호를 분리
 * 예) "b/7225" → { prefixes: ["b"], strongNumber: "7225" }
 * 예) "c/m/6529" → { prefixes: ["c", "m"], strongNumber: "6529" }
 *
 * 접두어 코드:
 *   b = ב (전치사: ~에, ~로)
 *   c = ו (접속사: 그리고)
 *   d = ה (정관사)
 *   i = ה (의문사)
 *   k = כ (전치사: ~처럼)
 *   l = ל (전치사: ~에게, ~위해)
 *   m = מ (전치사: ~에서, ~로부터)
 *   s = שׁ (관계사)
 */
export interface LemmaParts {
  prefixes: PrefixInfo[];
  strongNumber: string;
  /** 원본 렘마 문자열 */
  raw: string;
}

export interface PrefixInfo {
  code: string;
  hebrew: string;
  meaning: string;
  color: string;
  role: string;
}

const PREFIX_MAP: Record<string, PrefixInfo> = {
  b: { code: 'b', hebrew: 'בְּ', meaning: '~에, ~로, ~와 함께', color: '#E8A87C', role: '전치사' },
  c: { code: 'c', hebrew: 'וְ', meaning: '그리고', color: '#E8A87C', role: '접속사' },
  d: { code: 'd', hebrew: 'הַ', meaning: '정관사', color: '#FFD93D', role: '정관사' },
  i: { code: 'i', hebrew: 'הֲ', meaning: '의문사', color: '#FFD93D', role: '의문사' },
  k: { code: 'k', hebrew: 'כְּ', meaning: '~처럼, ~같이', color: '#E8A87C', role: '전치사' },
  l: { code: 'l', hebrew: 'לְ', meaning: '~에게, ~위해', color: '#E8A87C', role: '전치사' },
  m: { code: 'm', hebrew: 'מִ', meaning: '~에서, ~로부터', color: '#E8A87C', role: '전치사' },
  s: { code: 's', hebrew: 'שֶׁ', meaning: '~인(관계사)', color: '#A8D8EA', role: '관계사' },
  v: { code: 'v', hebrew: 'וַ', meaning: '와우 계속법', color: '#E8A87C', role: '와우계속법' },
};

export function parseLemma(lemma: string): LemmaParts {
  if (!lemma) return { prefixes: [], strongNumber: '', raw: lemma };

  // morphhb 실제 형식: "Hb/H7225", "Hd/H8064"
  // Strong번호 정규화: "H7225" → "7225" (언어코드 H/A 제거)
  const normalizeStrong = (s: string) => s.replace(/^[HA]/, '').trim();

  if (!lemma.includes('/')) {
    return { prefixes: [], strongNumber: normalizeStrong(lemma), raw: lemma };
  }

  const parts = lemma.split('/');
  const rawStrong = parts[parts.length - 1].trim();
  const strongNumber = normalizeStrong(rawStrong);

  // 첫 번째 파트("Hb")에서 언어코드(H/A) 제거 후 접두어 코드 추출
  const prefixCodes: string[] = [];
  parts.slice(0, -1).forEach((part, i) => {
    const code = i === 0 ? part.replace(/^[HA]/, '') : part.trim();
    if (code) prefixCodes.push(code);
  });

  const prefixes = prefixCodes
    .map(code => PREFIX_MAP[code.trim()])
    .filter((p): p is PrefixInfo => p !== undefined);

  return { prefixes, strongNumber, raw: lemma };
}

// ─── 복합 단어 형태 파싱 ─────────────────────────────────────────

/**
 * 복합 형태론 코드 파싱 (여러 형태소가 '/'로 연결된 경우)
 * 예) "HR/Ncfsa" → [전치사 파싱, 명사 파싱]
 */
export function parseCompoundMorphCode(morphCode: string): ParseResult[] {
  if (!morphCode.includes('/')) {
    return [parseMorphCode(morphCode)];
  }

  return morphCode.split('/').map(code => parseMorphCode(code.trim()));
}

// ─── 화면 표시용 형태소 파트 배열 생성 ──────────────────────────

/**
 * 단어를 형태소 파트 배열로 변환 (형태론 디버거 UI용)
 * DATA_PIPELINE.md Stage 4의 morph_parts 배열과 동일한 형태
 */
export interface MorphPart {
  text: string;   // 히브리어 텍스트 (접두어/어근/접미어)
  role: string;   // 역할 (전치사, 명사, 접미대명사 등)
  meaning: string;
  color: string;
}

/**
 * 렘마와 형태론 코드에서 morph_parts 배열 생성
 * @param hebrewText - 히브리어 단어 원문
 * @param lemma - 렘마 (Strong번호, 접두어 포함 가능)
 * @param morphCode - 형태론 코드
 */
export function buildMorphParts(
  hebrewText: string,
  lemma: string,
  morphCode: string,
): MorphPart[] {
  const lemmaParts = parseLemma(lemma);
  const morphResults = parseCompoundMorphCode(morphCode);
  const parts: MorphPart[] = [];

  // 접두어가 있는 경우
  if (lemmaParts.prefixes.length > 0) {
    lemmaParts.prefixes.forEach(prefix => {
      parts.push({
        text: prefix.hebrew,
        role: prefix.role,
        meaning: prefix.meaning,
        color: prefix.color,
      });
    });
  }

  // 메인 어근/단어
  // 접두어가 있으면 접두어 길이만큼 제거하여 어근만 표시
  // (실제 히브리어 분리는 복잡하므로 전체 텍스트를 사용)
  const mainResult = morphResults[morphResults.length - 1];
  if (mainResult) {
    const mainText = lemmaParts.prefixes.length > 0
      ? hebrewText // 접두어 분리는 음절 경계가 필요하므로 전체 표시
      : hebrewText;

    parts.push({
      text: mainText,
      role: mainResult.pos,
      meaning: mainResult.label.split(' · ')[0],
      color: mainResult.color,
    });
  }

  return parts;
}
