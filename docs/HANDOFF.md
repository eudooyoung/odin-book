# Odin Book — AI 세션 인수인계

최종 갱신: 2026-10-28

## 새 세션 시작 시

- 프로젝트: `odin-social-media` (The Odin Project — Odin Book)
- 과제: https://www.theodinproject.com/lessons/node-path-nodejs-odin-book
- 로컬 경로: `/home/eudooyoung/repos/odin/full-stack-javascript/nodejs/odin-social-media`
- **GPT-Helper-MCP로 `docs/PLAN.md` 최신본을 먼저 읽을 것.** PLAN이 기준 문서(SSOT)이며, HANDOFF는 배경과 진행 맥락이다. 사용자가 파일을 직접 수정하므로 과거 대화 내용보다 현재 파일을 우선한다.
- 아직 계획 단계. 애플리케이션 구현은 시작하지 않았다.

## 현재 PLAN 상태 (최신 파일 확인)

### 0. Overview
- 학습 목표: 텍스트 기반 SNS(X/Threads 유사) 구축, NestJS 학습, TanStack Query·Tailwind CSS 역량 향상, AWS 인프라 구축 학습.

### 1. Functional Requirements
- 7개 영역: Authentication, Profile, User Discovery, Follow, Post, Like, Comment.
- **각 영역의 영어 기능 목록과 PlantUML Use Case 다이어그램을 모두 유지하기로 결정.** 목록은 요구사항, 다이어그램은 개념과 관계를 명료화하는 보조 수단이다. 사용자 요청 없이 어느 쪽도 삭제하지 말 것.
- 다이어그램은 현재 `PLAN.md`의 `plantuml` 코드 블록에 인라인으로 들어 있다. 가로 2열 배치용 HTML/CSS 실험은 했으나 현재 최신 파일에는 남아 있지 않다. 사용자는 CSS 작업이나 파일 분리를 원하지 않아 현재 방식 유지.
- Follow: 요청 발신/조회/취소, 수신/조회/수락/거절, 언팔로우. 즉시 팔로우가 아닌 **요청·승인** 방식.
- Post: 일반 게시글 조회와 홈 피드 조회가 구분되어 있으며, 홈 피드는 View Posts의 특수화로 표시.
- 인증: 이메일·소셜 가입 및 로그인, 소셜 계정 연결·해제, 로그아웃, 계정 비활성화·재활성화가 기능 범위에 포함.

### 2. Priorities
- **P0: Very Basic** — Email authentication, Profile, User discovery, Post CRUD.
- **P1: Make SNS** — Follow, Home feed, Like, Comment.
- **P2: Advanced Account Management** — Social authentication, Social account connection management, Deactivate/reactivate user account.
- 위 분류는 단계적인 개발 우선순위. 실제 작업 순서·테스트·완료 조건은 추후 Implementation Plan에서 다룬다.

## 앞으로 따를 계획서 구조 (사용자가 선택한 권장안)

- `0. Overview` — 완료
- `1. Functional Requirements` — 기능 목록·Use Case 작성
- `2. Priorities` — P0/P1/P2 작성
- **`3. Data Model` — 바로 다음 작업**
- `4. Technical Decisions` — 주요 기술적 선택과 근거
- `5. Implementation Plan` — 개발 단계·순서·검증 기준
- 그 후 기능 단위로 설계 → 구현 → 테스트를 반복.

**방향:** 초기 계획서는 구현에 필요한 수준으로만 만든다. 사전에 모든 Business Rules를 확정하거나 별도의 테이블 정의서를 작성하지 않는다. 필요할 때 해당 기능의 정책·제약조건을 정하고, 상세 DB 스키마는 구현 단계에서 작성한다. 이전 Matching Bot 발표 자료의 구성에 얽매이지 않는다.

## 다음 세션의 최우선 작업: Data Model

1. 먼저 필요한 **도메인 엔티티와 관계를 개념적으로 파악**한다.
2. 필요하면 관계를 확인하기 위한 **간략한 ERD**를 사용한다.
3. 모델링에 직접 영향을 주는 핵심 정책만 논의한다. 아직 미결정인 정책을 과거 합의라는 이유로 확정 사실처럼 말하지 않는다.
4. **바로 Prisma 스키마·테이블 정의서·API 설계로 진입하지 않는다.**
5. 사용자가 직접 PLAN을 작성하므로 **명시적인 요청 없이는 `PLAN.md` 수정 금지.**

특히 모델링 시 검토 대상: User/Profile의 분리 여부, 이메일/소셜 인증 수단의 연결 구조, Follow Request와 실제 Follow 관계의 구분, Post/Comment/Like의 연결. 이는 검토 대상이지 미리 확정한 엔티티 목록이 아니다.

## 협업 주의사항

- 사용자는 논리적 일관성과 독립적인 평가를 강하게 요구한다. **질문이나 이의를 제기했다는 이유만으로 권고를 바꾸지 말 것.** 변경에는 새로운 근거 및 기존 판단의 오류 설명이 필요하다.
- 이전 세션에서 어시스턴트가 근거 없이 계획 구조와 권고를 반복 변경해 신뢰가 손상됐다. 현재 선택한 구조를 유지하고, 불필요하게 새 문서를 제안하지 말 것.
- 사용자의 초안에 없는 정책을 이전에 합의됐다고 추정하지 않는다. 과거 논의와 현재 문서에 확정된 내용을 구분한다.
- 짧고 구체적인 한국어로 설명하고, 오류·합리적인 선택·선택적 개선을 구분한다.
- UML의 사용자 목표와 데이터 모델·API·CRUD를 억지로 1:1 대응시키지 않는다.
- 파일 접근은 GPT-Helper-MCP를 사용하며, 사용자 요청 없이는 쓰기 작업을 하지 않는다.
