# Odin Book — AI 세션 인수인계

최종 갱신: 2026-11-05

## 1. 세션 시작

- 프로젝트: The Odin Project — Odin Book (`odin-social-media`)
- 로컬 경로: `/home/eudooyoung/repos/courses/odin/full-stack-javascript/nodejs/odin-social-media`
- **GPT-Helper-MCP로 로컬 `docs/PLAN.md` → `docs/HANDOFF.md` → 필요한 소스 순서로 확인. GitHub부터 확인하지 말 것.**
- `PLAN.md`가 요구사항·우선순위의 SSOT. HANDOFF는 **현재 상태와 작업 재개에 필요한 맥락만 간결하게** 유지한다. 해결된 오류, 과거 논의 경과, 소스에서 바로 확인 가능한 구현 세부사항은 누적하지 않는다.

## 2. 프로젝트 및 개발 방식

- 목표: NestJS 학습을 중심으로 텍스트 SNS 구현. 스택: NestJS·TypeScript·Prisma·PostgreSQL, React, Vitest·Supertest. Docker Compose로 개발/테스트 DB 분리. 상세 목표와 단계는 PLAN 참조.
- P0 순서: Setup → Email authentication(회원가입·로그인·로그아웃) → Profile → User discovery → Post CRUD.
- **사용자가 직접 코딩·검증하며 GPT는 설명·코드 리뷰 위주. 명시적 요청 없이는 소스와 문서를 수정하지 말 것.**
- 기능 단위 TDD: 성공 E2E RED → 단위 테스트 RED → 구현 GREEN → 오류 케이스. API 계약이나 부가 정책을 앞서 과도하게 확정하지 않는다.
- 사용자의 의견에 자동 동의하거나 반론으로 해석하지 말 것. 판단 근거를 분명히 하고, 기술 설명에는 관련 공식 문서를 링크하며 실제 코드 예시는 명시 요청 시에만 제공.

## 3. 현재 상태

- **완료:** P0 Setup, 독립된 개발/테스트 PostgreSQL DB, 이메일 회원가입(성공·입력 검증·이메일 중복 처리).
- **회원가입 리팩터링 완료:** `AuthController → AuthService → UsersService → PrismaService`. `AuthService.register()`에서 비밀번호 해싱·P2002→409 변환, `UsersService.create()`에서 사용자 DB 생성 및 공개 정보 반환. 모듈 import/export 연결 완료.
- **검증:** 회원가입 관련 단위 테스트·E2E 테스트 GREEN은 사용자 확인. **전체 테스트 스위트 GREEN은 아님**(로그인 E2E는 의도된 RED). 최신 format/lint/build 검증은 미확인.
- **미완성:** 로그인·로그아웃. `UsersService.findByEmail()` 미구현; 로그인 단위 테스트는 주석 처리. `POST /auth/login` 엔드포인트 및 Passport/JWT/쿠키 처리는 미구현.
- 현재 Prisma에는 `User`만 구현. `Profile`은 이후 P0 단계에서 추가하며, PLAN의 ERD는 목표 모델이다.

## 4. 로그인 결정 사항

- **Passport LocalStrategy + JwtStrategy**, JWT Access/Refresh Token, **HttpOnly 쿠키** 사용하기로 결정.
- 로그인 성공 E2E(`backend/test/auth.e2e-spec.ts`)는 이미 작성되어 **RED 확인**. 회원가입 후 로그인하여 HTTP **204**, `accessToken`·`refreshToken` 쿠키 존재 및 `HttpOnly` 속성 검증.
- JWT 만료 시간·Payload·Refresh Token 저장/폐기 방식과 로그인 실패 정책은 아직 미결정. 필요한 구현 단계에서 논의한다.

## 5. 다음 작업

1. `UsersService.findByEmail()` 단위 테스트 RED → 구현 GREEN.
2. Passport LocalStrategy 흐름에 맞게 `AuthService` 사용자 검증 책임과 단위 테스트 정리.
3. JWT 발급·쿠키 설정 구현 → 기존 로그인 E2E GREEN 확인 → 로그인 오류 케이스, 이후 로그아웃.
4. **회원가입 리팩터링은 완료된 작업**으로 취급하고, 로그인 미구현 테스트를 회원가입 리팩터링의 결함으로 평가하지 않는다.

## 6. HANDOFF 유지 원칙

- 새 세션에 필요한 **진행 상태·확정된 결정·미결정 사항·바로 다음 작업·협업 규칙만** 기록한다.
- PLAN이나 소스와 중복되는 설명, 지나간 디버깅, 해결된 결함, 날짜별 작업 일지는 삭제하거나 넣지 않는다.
- 다음 갱신 때도 **분량을 늘리기보다 오래된 내용을 교체·삭제**하여 간결하게 유지한다.
