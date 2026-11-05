# Odin Book — AI 세션 인수인계

최종 갱신: 2026-11-05

## 1. 세션 시작

- 프로젝트: The Odin Project — Odin Book (`odin-social-media`)
- 로컬 경로: `/home/eudooyoung/repos/courses/odin/full-stack-javascript/nodejs/odin-social-media`
- **GPT-Helper-MCP로 로컬 `docs/PLAN.md` → `docs/HANDOFF.md` → 필요한 소스 순서로 확인. GitHub부터 확인하지 말 것.**
- `PLAN.md`가 요구사항·우선순위의 SSOT. HANDOFF는 진행 상태와 다음 작업에 필요한 맥락만 유지한다.

## 2. 개발 방식

- NestJS·TypeScript·Prisma·PostgreSQL, React, Vitest·Supertest. Docker Compose로 개발/테스트 DB 분리.
- P0: Setup → Email authentication(회원가입·로그인·로그아웃) → Profile → User discovery → Post CRUD.
- **사용자가 직접 구현·검증, GPT는 공식 문서 안내·설명·리뷰 중심. 명시적으로 요청받기 전에는 실제 코드 예시를 작성하거나 소스·문서를 수정하지 말 것.**
- TDD: 성공 E2E RED → 단위 테스트 RED → GREEN → 실패 케이스. API 계약이나 부가 정책을 선제 확정하지 않는다.
- 판단 근거를 명확히 하고 자동 동의·과잉 제안을 피한다. 기술 설명에는 공식 문서 링크를 제공한다.

## 3. 현재 구현 및 검증

- **완료:** P0 Setup, 이메일 회원가입(검증·중복 409), `UsersService.findByEmail()`, `AuthService.validateUser()`.
- **인증 연결:** Passport `LocalStrategy`(`usernameField: "email"`)와 `AuthGuard("local")`로 `POST /auth/login` 검증. 기존 로그인 HTTP 204 확인은 사용자 보고.
- **로그인 서비스 단위 테스트 GREEN 완료(사용자 확인):** `AuthService.login()`이 `{ email, sub: id }`로 JWT AT 발급, `randomBytes(32).toString("base64url")`로 Opaque RT 생성, SHA-256 `hex` 해시를 `prisma.refreshSession.create()`로 저장한 다음 AT·RT 반환.
- 단위 테스트는 JWT·DB·난수 생성 호출을 Mocking하고, `Buffer.toString()`·`createHash()`는 실제 실행. 이 접근을 승인했으므로 이유 없이 해시 기대값을 하드코딩하도록 재제안하지 말 것.
- 비밀번호 불일치 테스트는 `findByEmail` 응답과 `verify.mockResolvedValue(false)`를 설정하도록 수정됨. `beforeEach`는 `vi.resetAllMocks()` 사용. 과거 Mock 누출 문제는 해결.
- Prisma `RefreshSession` 모델 존재: `id`, `tokenHash @unique`, `userId`, `User`와 관계(`onDelete: Cascade`). 실제 DB 마이그레이션 적용 여부는 새 세션에서 필요 시 확인.
- **아직 E2E 미완료:** `AuthController.login()`은 현재 `req.user`만 반환하고 `AuthService.login()`·쿠키 설정을 호출하지 않음. 로그인 성공 E2E에는 HTTP 204와 AT/RT HttpOnly 쿠키 검증이 작성되어 있으나 GREEN 미확인.
- `AuthModule`에 `JwtModule` 미등록, 서명 설정 미완료. 전체 lint/build/E2E GREEN도 미확인.

## 4. 인증 정책과 미결정 사항

- **선택:** 신규 `@nestjs/authentication` 대신 기존 Passport 유지 + 직접 구현. 기존 구현과 학습 목적에 적합.
- **확정:** AT는 JWT(사용자 ID `sub`, `email`), RT는 암호학적 난수 기반 Opaque Token(32바이트 → base64url). 서버에는 RT 원본 대신 SHA-256 해시 저장. 브라우저에는 HttpOnly 쿠키, 로그인 성공 HTTP 204.
- **향후 지향:** RT Rotation·폐기·재사용 감지 가능한 상태 기반 세션.
- **다음 결정 필요:** JWT 서명 알고리즘/Secret 관리/AT 유효 기간, RT 유효 기간 및 DB 만료 필드, 쿠키 속성·수명. 세션 절대 만료와 구체적인 Rotation·재사용 감지·폐기 규칙은 Refresh/Logout 구현 단계에서 논의 가능.
- 현재 `RefreshSession`에는 생성·만료 시간이 없음. 로그인 서비스 GREEN을 위해 추가하지 않았으며, RT 만료 검증 구현 전에 정책과 모델을 확정할 것.

## 5. 다음 작업

1. **로그인 E2E GREEN 진행:** 먼저 JWT 정책(서명 키·알고리즘·AT 만료)과 필요한 RT/쿠키 정책을 사용자와 논의·결정.
2. `JwtModule` 설정 및 `AuthController.login()`에 `AuthService.login()` 연결, AT/RT HttpOnly 쿠키 설정.
3. 기존 로그인 E2E(204·쿠키) 검증을 GREEN으로 만들고 RT 세션의 DB 저장 여부도 확인. 필요 시 개발·테스트 DB 마이그레이션 확인(실행 중인 Docker 컨테이너 재시작 불필요).
4. 이후 로그인 실패 케이스, Refresh/Logout, RT Rotation·폐기와 만료 정책을 순차적으로 다룬다.

## 6. HANDOFF 유지 원칙

- 결정·진행 상태·바로 다음 작업만 기록하며, 오래된 내용은 누적하지 말고 교체·삭제한다.
- PLAN/소스에서 바로 확인 가능한 세부사항이나 해결된 과거 논의는 반복하지 않는다.
