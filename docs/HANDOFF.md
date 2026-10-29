# Odin Book — AI 세션 인수인계

최종 갱신: 2026-10-29

## 새 세션 시작 시

- 프로젝트: `odin-social-media` (The Odin Project — Odin Book)
- 과제: https://www.theodinproject.com/lessons/node-path-nodejs-odin-book
- 로컬 경로: `/home/eudooyoung/repos/odin/full-stack-javascript/nodejs/odin-social-media`
- **GPT-Helper-MCP로 `docs/PLAN.md` 최신본을 먼저 읽을 것.** PLAN이 기준 문서(SSOT)이며, HANDOFF는 배경과 진행 맥락이다. 사용자가 파일을 직접 수정하므로 과거 대화 내용보다 현재 파일을 우선한다.
- 사전 계획(0~5장)은 P0 착수에 필요한 수준으로 작성 완료. **NestJS/React 스캐폴딩과 Vite+ 도입까지 진행함. 다음 작업은 프론트엔드 검증 결과 확인 후 PostgreSQL Docker Compose 및 Prisma 연결이다.**

## 현재 PLAN 상태 (최신 파일 확인)

### 0. Overview
- 학습 목표: 텍스트 기반 SNS(X/Threads 유사) 구축, NestJS 학습, TanStack Query·Tailwind CSS 역량 향상, Docker 및 AWS 인프라 구축 학습.

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
- 위 분류는 개발 우선순위. P0 작업 순서는 현재 `5. Phases`에 개략적으로 정리되어 있으며, 세부 정책·완료 기준은 해당 기능을 구현할 때 결정한다.

### 3. Data Model (P0 모델링 완료)
- `PLAN.md`의 Mermaid `erDiagram`으로 작성. `classDiagram`으로 시작했으나 PK/FK/UK 표현과 관계 모델링에 ERD가 더 적합하다고 판단해 전환함.
- **User**: `id`(PK), `email`(UK), `passwordHash`, `createdAt`. 시스템의 사용자 식별 및 계정·인증 정보.
- **Profile**: `userId`(PK, FK), `handle`(UK), `imageAddress`, `displayName`, `bio`. 사용자에게 공개되는 프로필 정보. `handle`은 Profile에 두기로 판단함.
- **Post**: `id`(PK), `authorId`(FK), `content`, `createdAt`.
- **User–Profile**: 1:1 식별 관계 (`User ||--|| Profile`). Profile의 PK가 User의 PK를 참조하며 회원가입 시 프로필도 생성하는 전제.
- **User–Post**: 1:N 비식별 관계 (`User ||..o{ Post`). Post는 독립 PK를 가지며 사용자당 게시글 0개 이상.
- 최근 검토에서 위 P0 모델을 현재 계획 단계에 충분한 수준으로 판단함. **관계선도 이미 수정된 최신본을 확인함.**
- Follow 관련 속성/관계는 P1, SocialAccount 및 계정 비활성화 상태는 P2에서 상세 모델링. 아직 전체 P1/P2 모델을 완성했다는 의미는 아님.
- 구체적인 DB 타입, nullable, 추가 제약조건, 스키마 구현은 추후 해당 기능 구현 시 결정. 모델링 표기법의 PK/FK는 현재 설계 가정이지 확정된 DB 마이그레이션이 아님.

## 현재 기술·개발 방향 (PLAN 4~5장)

- **Backend**: NestJS + TypeScript. NestJS는 이번 프로젝트의 주요 학습 대상.
- **Database / ORM**: PostgreSQL + Prisma. TypeORM의 NestJS 통합성도 검토했으나, 이미 익숙한 Prisma를 사용해 NestJS 학습에 집중하기로 함.
- **Frontend**: React, TanStack Query, Tailwind CSS.
- **Testing**: Vitest + Supertest (NestJS에서 필요 시 `@nestjs/testing` 활용).
- **Repository**: 단일 Git 저장소에 `backend/`, `frontend/` 디렉터리를 두는 단순 모노레포. npm workspaces/Turborepo 등은 필수 아님. 서비스는 독립 빌드·배포 가능.
- **Docker**: 처음에는 Docker Compose로 로컬 PostgreSQL 실행, NestJS·React는 호스트에서 실행. 애플리케이션 Docker 이미지 빌드는 배포 시점에 학습.
- **AWS**: 배포·인프라 학습 목표. ECR/ECS 등은 후보일 뿐이며 실제 서비스 구성은 아직 확정하지 않음.
- **아키텍처**: NestJS의 Module/DI가 아직 익숙하지 않아 상세 구조를 미리 확정하지 않음. 첫 기능을 구현하면서 이해하고 결정.
- **P0 진행 순서**: Setup → Email authentication/login/logout → Profile view/update → User list/search → Post CRUD → Review.
- `PLAN.md`의 최종 표제는 `4. Technology Stacks`, `5. Phases`. 현재 4장은 기술 스택 목록, 5장은 P0 작업 순서만 간단히 기술한다. 문서 구조를 요청 없이 바꾸지 말 것.

## 구현 진행 현황 (2026-10-29)

- 저장소: https://github.com/eudooyoung/odin-book — `main`에 초기 문서 작업 PR #1 병합 완료. 로컬에서는 P0 Setup 작업 진행 중. 현재 Git 브랜치·커밋 여부는 새 세션에서 확인할 것.
- 디렉터리: 루트에 `.git/`, `docs/`, `backend/`, `frontend/`. **npm workspaces를 도입하지 않고**, 백엔드·프론트엔드에서 각각 `package.json`, `package-lock.json`, `node_modules`를 관리하기로 최종 결정함.
- Backend: NestJS 12, TypeScript 6, ESM, Supertest. `backend/`에 Nest CLI로 스캐폴딩 완료. 빌드/단위 테스트/E2E/Lint는 사용자 보고상 통과함(기본 생성 직후 및 Vite+ 마이그레이션 직후). 이후 테스트 설정 통합에 대한 재실행 결과는 아직 확인하지 않음.
- Frontend: React 19 + TypeScript 7 + Vite+ 1.4.0 `react-ts` 템플릿으로 생성. 실제 `src/App.tsx`, `src/main.tsx`, `@vitejs/plugin-react` 및 React 의존성을 로컬 MCP로 확인. **최초 시도는 Vanilla TypeScript였으나 React 템플릿으로 다시 생성하여 교체 완료.**
- Vite+: 양쪽 프로젝트에서 사용. 백엔드는 기존 Oxlint·Vitest·Prettier 구성을 Vite+의 Oxlint·Vitest 5·Oxfmt로 전환. `backend/vite.config.ts`에 단위(`unit`)·E2E(`e2e`) 테스트 프로젝트, Lint, Format 설정 통합. 기존 `vitest.config.ts`, `vitest.config.e2e.ts`는 삭제됨. NestJS의 빌드/실행은 Nest CLI 유지.
- Frontend 설정: `frontend/vite.config.ts`에 React 플러그인과 Lint/Format 포함. `package.json`에 `dev`, `build`, `lint`, `format` (`vp fmt src/`), `format:check` (`vp fmt --check`), `preview` 스크립트가 있음. 프론트엔드는 아직 템플릿 그대로이며 TanStack Query, Tailwind CSS, 테스트 환경은 미설치.
- **검증 상태:** 프론트엔드 파일 구조 및 설정은 정적으로 검토했으며 특이 문제 없음. 실제 `npm run build`, `npm run lint`, `npm run format:check`, `npm run dev` 실행 결과는 아직 사용자에게서 확인하지 못함. 명령 실행 없이 통과했다고 단정하지 말 것.
- PostgreSQL Docker Compose, Prisma 연결 및 DB 검증은 아직 착수하지 않음. 애플리케이션 기능 구현도 아직 시작하지 않음.

## 개발 방식 논의 요약

- Repository 내 `PLAN.md`를 SSOT로 사용. GPT+개인 MCP로 설계·판단·문서 검토를 하고 Codex를 구현 보조 또는 주도 도구로 활용하는 방향.
- **Developer-led, agent-assisted**: 설계와 검증의 책임은 사용자에게 유지. 익숙한 반복 구현은 Codex에 더 많이 맡기되, NestJS처럼 새로운 학습 요소는 사용자가 직접 작성하거나 구현 내용을 면밀히 검토할 수 있음. 정확한 위임 비율은 고정하지 않았음.
- P0는 기능 단위 Vertical Slice로 진행. 모든 API·DB 세부사항을 사전에 확정하지 않고 기능별로 요구사항·정책 검토 → 계획 → 테스트/구현 → 검증을 반복.
- TDD와 자동 테스트·코드 리뷰를 유지하되 각 작업에서 누가 어떤 코드를 직접 작성할지는 유연하게 정함. Formal Verification·복잡한 멀티에이전트 자동화는 현재 도입하지 않음.
- 사전 설계는 현재 수준으로 충분. 별도의 Business Rules 문서·테이블 정의서·전체 P1/P2 모델을 미리 만들지 않음.

## 다음 세션의 최우선 작업: P0 Setup 이어서

1. GPT-Helper-MCP로 `docs/PLAN.md`와 `docs/HANDOFF.md` 최신본 및 로컬 소스 구조를 확인한다. PLAN이 SSOT.
2. 프론트엔드의 `npm run build`, `npm run lint`, `npm run format:check`, `npm run dev` 결과를 확인한다. 필요하면 백엔드의 테스트 설정 통합 후 빌드·단위·E2E 테스트를 재검증한다.
3. 로컬 PostgreSQL을 위한 Docker Compose 구성 후 DB 기동과 접속을 확인한다.
4. NestJS 백엔드에 Prisma를 연결하고 최소한의 DB 접속·테스트 검증까지 진행한다. ORM/DB 스키마 세부사항은 첫 기능 구현에 필요한 범위로 다룬다.
5. Setup이 끝나면 P0 Email authentication으로 이동. 정책과 API 계약은 해당 기능 착수 시 결정하고, 사용자와 학습 범위·Codex 위임 범위를 조율한다.
6. **`PLAN.md`와 `HANDOFF.md`는 사용자가 명시적으로 요청할 때만 수정**한다.

## 협업 주의사항

- 사용자는 논리적 일관성과 독립적인 평가를 강하게 요구한다. **질문이나 이의를 제기했다는 이유만으로 권고를 바꾸지 말 것.** 변경에는 새로운 근거 및 기존 판단의 오류 설명이 필요하다.
- 이전 세션에서 어시스턴트가 근거 없이 계획 구조와 권고를 반복 변경해 신뢰가 손상됐다. 현재 선택한 구조를 유지하고, 불필요하게 새 문서를 제안하지 말 것.
- 사용자의 초안에 없는 정책을 이전에 합의됐다고 추정하지 않는다. 과거 논의와 현재 문서에 확정된 내용을 구분한다.
- 짧고 구체적인 한국어로 설명하고, 오류·합리적인 선택·선택적 개선을 구분한다.
- UML의 사용자 목표와 데이터 모델·API·CRUD를 억지로 1:1 대응시키지 않는다.
- 파일 접근은 GPT-Helper-MCP를 사용하며, 사용자 요청 없이는 쓰기 작업을 하지 않는다.
