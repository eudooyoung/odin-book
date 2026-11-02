# Odin Book — AI 세션 인수인계

최종 갱신: 2026-11-02

## 새 세션 시작 시

- 프로젝트: `odin-social-media` (The Odin Project — Odin Book)
- 과제: https://www.theodinproject.com/lessons/node-path-nodejs-odin-book
- 로컬 경로 (2026-10-29 MCP 허용 경로): `/home/eudooyoung/repos/courses/odin/full-stack-javascript/nodejs/odin-social-media`
- **GPT-Helper-MCP로 `docs/PLAN.md` 최신본을 먼저 읽을 것.** PLAN이 기준 문서(SSOT)이며 HANDOFF는 배경과 진행 맥락이다. 사용자가 파일을 직접 수정하므로 과거 대화 내용보다 현재 파일을 우선한다.
- 사전 계획(0~5장), **P0 Setup 및 개발·테스트 DB 분리 완료**. P0 Email authentication 중 **이메일 회원가입 성공/입력 검증/중복 이메일 처리를 구현**했고, 사용자가 단위 테스트 및 E2E 테스트 **전체 GREEN 확인**. 다음은 로그인 → 로그아웃. 최신 포맷·Lint·빌드 실행 결과는 별도 확인이 필요함.

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
- **Email Registration 정책 추가됨**: `PLAN.md`의 `#### Email Resgistraion`(현재 표제 철자 그대로) 아래에 이메일 형식 및 최대 254자, 비밀번호 15~128자(별도 문자 제한 없음), 이메일 고유성(`Email must be unique`) 기록. PLAN에는 규칙 중심으로 적고 HTTP 오류·Prisma 구현 세부사항은 기록하지 않음.

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
- 위 ERD는 **계획 단계의 목표 모델**이며 현재 구현된 Prisma Schema와 다르다. **사용자는 현재 P0 Email authentication 단계에는 Profile이 필요하지 않다고 판단하여 User만 먼저 구현**하기로 변경했다. Profile 모델과 1:1 관계는 뒤의 Profile 단계에서 추가한다. PLAN의 ERD는 아직 수정하지 않았으므로 이 차이를 오해하지 말 것. 기존 ERD의 '회원가입 시 프로필 동시 생성' 전제는 현재 구현 순서와 일치하지 않으며 후속 단계에서 정리해야 한다.
- Follow 관련 속성/관계는 P1, SocialAccount 및 계정 비활성화 상태는 P2에서 상세 모델링. 아직 전체 P1/P2 모델을 완성했다는 의미는 아님.
- **현재 Prisma Schema**: `User` (`id Int @id @default(autoincrement())`, `email String @unique`, `passwordHash String`, `createdAt DateTime @default(now())`)만 구현·마이그레이션. Profile/Post와 관련 제약은 후속 단계에서 구현.

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

## 구현 진행 현황 (2026-11-02, 회원가입 완료·로그인 예정)

- 저장소: https://github.com/eudooyoung/odin-book — 초기 문서 작업 PR #1 병합 완료. Setup PR #2 브랜치명은 `chore/p0-setup`. 다음 기능용 명명으로 **`feat/p0-email-auth` 추천·합의**했으나 실제 현재 브랜치/커밋 상태는 새 세션에서 확인.
- 구조: 단일 저장소의 `backend/`, `frontend/` 독립 패키지 및 lockfile. npm workspaces 미사용.
- Backend: NestJS 12 + TypeScript 6 + ESM, Vitest 5/Supertest, Vite+ 1.4.0(Oxlint/Oxfmt). `@nestjs/mau` 제거, 사용자 보고상 Setup 단계 `npm audit` 취약점 0건. Frontend: React 19 + TypeScript 7 + Vite+ 1.4.0 기본 템플릿; TanStack Query/Tailwind/프론트 테스트는 아직 미설치.
- **Docker DB 분리 완료**: 루트 `compose.yaml`에 PostgreSQL 16 Alpine 서비스 `db`(127.0.0.1:5433→5432, `postgres_data`)와 `db-test`(127.0.0.1:5434→5432, `postgres_test_data`) 구성. 서로 다른 named volume과 `POSTGRES_DB` / `POSTGRES_DB_TEST`, 각각 해당 DB를 확인하는 healthcheck. 사용자 보고상 Compose 실행 완료. 루트 `.env`는 Compose 환경변수용.
- **NestJS DB 환경 분리 완료**: `backend/.env`와 `backend/.env.test`가 각각 자신에게 맞는 `DATABASE_URL` 사용. `AppModule`의 `ConfigModule.forRoot({ isGlobal: true, envFilePath: NODE_ENV === 'test' ? '.env.test' : '.env' })`로 파일 선택. `PrismaService`는 환경 분기를 몰라도 되며 `ConfigService.getOrThrow('DATABASE_URL')`만 사용. `PrismaPg`, lifecycle connect/disconnect는 기존대로. 이미 있는 `process.env` 값은 dotenv 파일보다 우선할 수 있음.
- **Prisma CLI**: `backend/prisma7.config.ts`는 `dotenv.config({ path: NODE_ENV === 'test' ? '.env.test' : '.env' })`로 해당 환경 파일을 로드하고 `datasource.url`은 `DATABASE_URL` 사용. NestJS ConfigModule과 Prisma CLI 설정은 별개.
- **Prisma 모델/마이그레이션**: `backend/prisma/schema.prisma`에는 현재 **User만** 존재(`id`, `email @unique`, `passwordHash`, `createdAt`). `backend/prisma/migrations/20261030080135_init/migration.sql` 존재. 개발 DB에 최초 마이그레이션 적용, 테스트 DB에도 사용자가 `NODE_ENV=test npx prisma migrate dev --name "test_db_init"`을 실행했을 때 **새 마이그레이션을 만들지 않고 기존 `20261030080135_init`을 적용**했다고 출력됨. DB별 별도 마이그레이션 파일 불필요. 기존 마이그레이션 적용만 할 때는 `migrate deploy` 사용 가능. **`prisma generate`로 Prisma Client 생성 완료**(사용자 확인).
- **테스트 환경 검증**: `backend/vite.config.ts`에서 `unit`(`**/*.spec.ts`), `e2e`(`**/*.e2e-spec.ts`) 프로젝트 구분, `fileParallelism: false`는 최상위 test 설정에 적용. `test/app.e2e-spec.ts`의 GET /, `SELECT 1`, `SELECT current_database()` 검증에서 테스트 DB 이름 `odin_book_test` 확인; 사용자가 테스트 통과 보고. 실제 DB를 사용하는 E2E는 Docker 테스트 DB 실행 필요.
- **Backend 스크립트 정리(로컬 `package.json` 확인)**: `dev: nest start --watch`, `debug: nest start --debug --watch`, `build: nest build`, `start: node dist/main`, `test: vp test run`(unit+e2e), `test:watch: vp test watch`, `test:debug`, `test:cov`, `lint`, `format`, `format:check`로 정리. `test:e2e`와 `test:e2e:watch` 별도 스크립트는 제거하고 필요 시 `npm test -- --project e2e`처럼 선택. **수정 완료(2026-11-02 로컬 확인)**: `test:debug`는 `vp test --inspect-brk --no-file-parallelism`, `test:cov`는 `vp test run --coverage`. 실행 결과는 별도 확인 필요. 사용자 요청 없이 수정하지 말 것.
- **회원가입 E2E 테스트(GREEN 확인)**: `backend/test/auth.e2e-spec.ts`에서 정상 `POST /auth/register` → `201`, 응답 `{ id: Number, email }` 및 실제 테스트 DB 저장 결과 비교. `Registration validation`의 `it.each`로 잘못된 이메일, 너무 긴 이메일, 15자 미만·128자 초과 비밀번호를 각각 HTTP 400 검증. 동일 이메일 두 번 가입 시 두 번째 요청 HTTP 409 검증. E2E 앱의 `beforeEach`에서 `StandardSchemaValidationPipe`를 직접 등록하고 `afterEach`에서 `prisma.user.deleteMany()` 및 `app.close()` 수행. **이전 지적 정정**: DNS 도메인 레이블 길이 제한과 `z.email()` 기본 형식 검증을 혼동해 이 데이터를 결함으로 지적했으나 잘못된 판단이었음. 같은 이유로 수정 요구하지 말 것.
- **회원가입 구현**: CLI로 `AuthModule`/`AuthController`/`AuthService` 생성 후 DI 연결 (`PrismaModule`/`PrismaService`). `@Post('register')`/`@Body({ schema: registerSchema })`로 요청 수신. `backend/src/auth/register.dto.ts`는 `email: z.email().max(254)`, `password: z.string().min(15).max(128)` 및 `z.infer` 타입 정의. `AuthService.register`는 `argon2.hash(password)` → Prisma `user.create({ data: { email, passwordHash }, select: { id: true, email: true } })`; Prisma `PrismaClientKnownRequestError`의 `P2002`를 Nest `ConflictException('Email already exists')`으로 전환해 HTTP 409 처리. `auth.controller.spec.ts`(자동 생성)는 삭제되어 현재 없음.
- **오류 전파 수정 완료**: `AuthService.register()`의 `catch`에서 `P2002` 외 오류에 대해 `throw error`를 수행하는 것을 2026-11-02 로컬 소스에서 확인. 같은 문제 재지적 불필요.
- **AuthService 단위 테스트(GREEN 확인)**: `backend/src/auth/auth.service.spec.ts`에서 `PrismaService.user.create`와 `argon2.hash` Mock. 정상 경로에서는 해싱·DB create 인자·`{ id, email }` 반환을 검증하며 `expect.objectContaining` 사용. 중복 이메일은 실제 `new PrismaClientKnownRequestError(..., { code: 'P2002', clientVersion: 'test' })` 객체를 Mock DB 메서드가 reject하게 해 `await expect(service.register(dto)).rejects.toThrow(ConflictException)`으로 확인. `beforeEach`에서 `vi.clearAllMocks()` 실행. 사용자 보고로 전체 GREEN.
- **검증 정책/실행 구조**: `src/main.ts`와 `test/auth.e2e-spec.ts`에서 각각 `StandardSchemaValidationPipe` 등록. E2E는 `main.ts`의 bootstrap을 호출하지 않아 Pipe 별도 적용이 필요함. 잘못된 입력은 400, 중복 이메일은 409. 비밀번호 공백·특수문자·한글 제한을 추가하지 않았으며 별도 특수 케이스 테스트는 필수로 보지 않음. 회원가입 입력에 `displayName`은 없음(Profile 단계로 분리).
- **아직 미구현**: 로그인·로그아웃, 인증·세션 전략. **검증 상태**: 회원가입 관련 단위/E2E GREEN은 사용자 확인. 최신 변경 전체에 대한 포맷 검사·Lint·빌드 최종 결과는 사용자가 별도 보고하지 않아 확인 필요.
- **Prisma 스킬 문서**: `backend/.agents/skills/`의 `prisma-cli`, `prisma-client-api`와 `references/`는 2026-10-29부터 있던 파일. 일부 reference의 2026-11-02 수정은 `npm run format`에 따른 포맷팅으로 추정되며 새로 설치되었다고 확인된 것은 아님. 현재 `backend/vite.config.ts`의 `fmt.ignorePatterns: ['.agents/**']` 반영을 확인했으며 실행 재검증은 별도. `AGENTS.md` 존재.

## 개발 방식 논의 요약

- Repository 내 `PLAN.md`를 SSOT로 사용. GPT+개인 MCP로 설계·판단·문서 검토를 하고 Codex를 구현 보조 또는 주도 도구로 활용하는 방향.
- **Developer-led, agent-assisted**: 설계와 검증의 책임은 사용자에게 유지. 익숙한 반복 구현은 Codex에 더 많이 맡기되, NestJS처럼 새로운 학습 요소는 사용자가 직접 작성하거나 구현 내용을 면밀히 검토할 수 있음. 정확한 위임 비율은 고정하지 않았음.
- P0는 기능 단위 Vertical Slice로 진행. 현재 ERD/요구사항을 기준으로 필요한 세부 정책을 테스트 작성 시점에 구체화한다. 별도 사전 정책 설계 문서나 API 계약 초안을 AI가 먼저 만들지 않는다.
- TDD(성공 케이스 RED → GREEN, 이후 오류 케이스)·자동 테스트·코드 리뷰 유지. **현재는 사용자 직접 코딩, GPT는 설명·검토 우선**. Formal Verification·복잡한 멀티에이전트 자동화는 도입하지 않음.
- 사전 설계는 현재 수준으로 충분. 별도의 Business Rules 문서·테이블 정의서·전체 P1/P2 모델을 미리 만들지 않음.

## 다음 세션의 최우선 작업: 로그인

1. **반드시 GPT-Helper-MCP로 로컬 최신 `docs/PLAN.md` → `docs/HANDOFF.md` → 필요한 실제 소스 순서로 읽기. GitHub부터 보지 말 것.** PLAN이 SSOT. Profile은 별도 P0 단계로 분리한 최신 결정을 존중.
2. **회원가입은 입력 검증·중복 이메일 포함 테스트 전체 GREEN 확인 완료**. DB 분리·마이그레이션·회원가입 성공/오류 케이스를 처음부터 반복하지 말 것.
3. 이전에 발견한 `auth.service.ts`의 예외 전파 누락과 `package.json`의 `test:debug`/`test:cov` 공백 누락은 **수정 후 로컬 확인 완료**. 이메일 길이 테스트의 도메인 레이블 관련 지적은 **철회된 오판**이므로 다시 문제 삼지 말 것. 스킬 reference 문서 포맷팅은 재설치와 구분하고, 현재 `.agents/**` 포맷 제외 설정 확인됨.
4. 필요 시 포맷 검사·Lint·빌드 결과 확인한 뒤 **로그인 정책(인증·세션 방식, 오류 응답 등)을 기능 단위로 결정**하고 성공 E2E RED → 서비스 단위 RED → GREEN 순으로 구현. API 계약을 선제적으로 장황하게 확정하지 말 것. 이후 로그아웃 진행.
5. **명시적 요청 없이 어떠한 파일도 수정하지 말 것.** 사용자가 직접 작성하고 GPT는 MCP 읽기·설명·검토 우선. 문서 수정도 요청받은 경우에만.

## 협업 주의사항

- 사용자는 논리적 일관성과 독립적인 평가를 강하게 요구한다. **질문이나 이의를 제기했다는 이유만으로 권고를 바꾸지 말 것.** 변경에는 새로운 근거 및 기존 판단의 오류 설명이 필요하다.
- 이전 세션에서 어시스턴트가 근거 없이 계획 구조와 권고를 반복 변경해 신뢰가 손상됐다. 현재 선택한 구조를 유지하고, 불필요하게 새 문서를 제안하지 말 것.
- 사용자의 초안에 없는 정책을 이전에 합의됐다고 추정하지 않는다. 과거 논의와 현재 문서에 확정된 내용을 구분한다.
- **검증되지 않은 결함을 단정하거나 HANDOFF에 기록하지 말 것.** 이번 세션에서 Zod의 기본 이메일 검증과 DNS 레이블 제한을 혼동하여 잘못 지적한 사례가 있었음. 확인된 사실과 추정을 구분할 것.
- 짧고 구체적인 한국어로 설명하고, 오류·합리적인 선택·선택적 개선을 구분한다. 사용자가 의견을 제시할 때마다 이전 권고를 번복하지 말고 판단 근거를 명확히 할 것. '단/다만'을 필수 선행 작업 설명에 남용하지 말 것.
- 개발 설명에는 가급적 공식 문서 링크를 첨부한다. 코드 작성 요청이 없다면 코드를 먼저 제시하지 않는다. 의사코드를 요청하면 **실제 문법이 아닌 추상적 처리 흐름**으로 설명한다.
- UML의 사용자 목표와 데이터 모델·API·CRUD를 억지로 1:1 대응시키지 않는다.
- **2026-10-30 사고**: GPT가 사용자 동의 없이 MCP로 `vite.config.ts`, `.env.example`, 신규 `test/setup-e2e.ts`를 수정/작성했고 사용자 지적으로 중단. 기존 파일 2개는 GPT가 복구했고 신규 파일은 당시 MCP 삭제 기능이 없어 사용자에게 삭제 안내. 현재 `backend/test/` 목록에 신규 파일은 없음. **이후 사용자는 직접 코딩·AI의 설명/검토만 원한다고 명확히 지시.** 승인 없는 쓰기를 재발시키지 말 것.
- 파일 접근은 GPT-Helper-MCP를 사용하며, 사용자 요청 없이는 쓰기 작업을 하지 않는다.
