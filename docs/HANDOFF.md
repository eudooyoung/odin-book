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

- **완료:** P0 Setup, 이메일 회원가입(검증·중복 409 포함), `UsersService.findByEmail()`, `AuthService.validateUser()`.
- **인증 연결:** Passport `LocalStrategy`(`usernameField: "email"`), `AuthGuard("local")` 적용한 `POST /auth/login`. `req.user`는 Express Request 확장 타입으로 지정.
- **로그인 HTTP 204 확인**(사용자 확인). 로그인 성공 E2E에는 204와 `accessToken`·`refreshToken` HttpOnly 쿠키 검증이 작성되어 있으나, **토큰 발급/쿠키 설정 미구현으로 전체 E2E는 아직 GREEN이 아님**.
- **미완성:** `AuthService.login()`, JWT/RT 발급, RT 저장소, 쿠키, `JwtStrategy`, 로그인 완료 후 로그아웃. 현재 Prisma 모델은 `User`만 있음.
- **테스트 주의:** 현재 `auth.service.spec.ts`의 비밀번호 불일치 케이스는 `verify.mockRejectedValue(false)`를 사용하고 `findByEmail` 반환값을 해당 테스트에서 설정하지 않음. `vi.clearAllMocks()`는 Mock 구현을 초기화하지 않아 직전 `null` 설정으로 **잘못된 경로에서 401이 나와도 GREEN이 될 가능성**이 있음. 다음 세션에서 실제 비밀번호 불일치 경로 검증하도록 수정·재확인 필요.
- 회원가입 테스트 GREEN은 사용자 확인. 전체 lint/build/테스트 GREEN은 확인되지 않음.

## 4. 인증 설계 현황

- **확정 방향:** AT는 JWT(`sub` 사용자 ID 및 이메일), RT는 Opaque(암호학적 난수)로 발급. RT를 일회성으로 관리하고 해시 저장·Rotation·폐기를 지원하는 상태 기반 방식 지향. 브라우저에는 HttpOnly 쿠키, 로그인 성공 응답은 204.
- **미결정:** `@nestjs/authentication` 패키지 도입 vs Passport 유지 + 직접 구현. **다음 세션에서 공식 문서를 확인하여 실제 지원 범위·버전 안정성·현재 Passport와의 통합 방식 비교 후 결정**. 기존 Passport 코드를 당장 교체하지 말 것.
- **추후 결정:** AT/RT 만료 시간, RT 저장 데이터 모델, 세션 절대 만료, 갱신·재사용 감지·폐기 정책, 쿠키 세부 속성.
- 현재 `AuthService.login()` 단위 테스트는 JWT 두 개를 가정한 미완성 초안만 있음. Opaque RT 결정과 인증 패키지 검토 결과에 맞춰 다시 설계할 것.

## 5. 다음 작업

1. `@nestjs/authentication`과 현재 Passport 방식의 역할·통합·학습 가치를 **공식 자료로 검증**한 뒤 채택 여부 논의.
2. 위 테스트 주의 사항을 수정하고 실패 케이스가 의도한 경로로 검증되는지 확인.
3. 선택한 설계에 맞춰 `AuthService.login()` TDD → AT/RT 발급·최소 저장 모델 → 쿠키 설정 → 기존 로그인 E2E GREEN.
4. 이후 Refresh/Logout의 Rotation·폐기 및 세션 만료 정책을 단계적으로 다룬다.

## 6. HANDOFF 유지 원칙

- 결정·진행 상태·바로 다음 작업만 기록하며, 오래된 내용은 누적하지 말고 교체·삭제한다.
- PLAN/소스에서 바로 확인 가능한 세부사항이나 해결된 과거 논의는 반복하지 않는다.
