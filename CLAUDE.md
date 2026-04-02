# CLAUDE.md
# 성서 히브리어 디버거 — 코딩 에이전트 지침

## 역할
너는 SEED Studio의 성서 히브리어 디버거 웹앱을 구현하는 코딩 에이전트다.

## 문서 우선순위 (반드시 숙지)
모든 구현은 아래 문서를 단일 진실의 원천으로 삼는다.
문서 간 충돌 시 MASTER_ARCHITECTURE.md 우선.

| 문서 | 담당 영역 |
|------|-----------|
| MASTER_ARCHITECTURE.md | 전체 구조, 스택, 로드맵 |
| UI_DESIGN_SYSTEM.md | 색상, 타이포, 컴포넌트 규격 |
| DATA_PIPELINE.md | OSHB 파싱, DB 스키마 |
| BINYAN_DRILL_SPEC.md | 드릴 로직, SRS |
| SEMANTIC_CARDS_SPEC.md | 의미 카드 시스템 |
| CORE_PASSAGES_30.md | 핵심 본문 30개 |

## 기술 스택
- Next.js 15 (App Router) + React 19 + TypeScript
- Tailwind CSS
- Supabase (PostgreSQL)
- next-pwa (PWA)
- 폰트: Noto Serif Hebrew, Noto Sans KR, Cormorant Garamond

## 히브리어 RTL 필수 규칙
- 히브리어 컨테이너: direction: rtl + unicode-bidi: isolate
- 전체 레이아웃: direction: ltr (한국어 기준 유지)
- NFC 정규화 사용 금지 (OSHB 호환성)
- 폰트: Noto Serif Hebrew 필수

## 디자인 토큰 (변경 금지)
- 배경: #12100D
- 주 강조색: #C4A46A (금색)
- 동사 색상: #F67280
- 명사 색상: #85CDCA
- 전치사/접속사: #E8A87C
- 관사/표지: #FFD93D
→ 전체 토큰은 UI_DESIGN_SYSTEM.md 참조

## lib/ 디렉토리 주의
아래 파일은 기획/운영 에이전트가 이미 완성한 파일이다.
수정 전 반드시 확인 요청할 것.
- lib/oshb-parser.ts
- lib/morph-codes.ts
- lib/pipeline-types.ts
- data/morph-korean-map.json

## 현재 Phase
Phase 1 — 데이터 파이프라인
완료: lib/ 파일 4종
다음: Supabase 스키마 적용, API Route 구현

## 구현 원칙
- 컴포넌트 주석은 한국어로 작성
- 감수 전 데이터는 reviewed: false로 저장
- 모든 Claude API 호출은 app/api/ 라우트를 통할 것
- 하드코딩 금지 — 색상/문자열은 상수 또는 토큰 참조