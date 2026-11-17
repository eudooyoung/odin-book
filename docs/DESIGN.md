# Odin Book — 디자인 가이드

## 1. 디자인 방향

- **레퍼런스:** Threads의 미니멀한 텍스트 중심 UI + Bluesky처럼 명확한 내비게이션
- **앱 레이아웃:** 좌측 홈·검색·프로필 내비게이션, 중앙 콘텐츠, 우측 사이드바 없음
- **모바일:** 내비게이션을 하단으로 이동
- **인증 화면:** 중앙 정렬된 360~400px 내외의 폼. 흰색 카드, 은은한 테두리, 그림자 최소화. 폼 상단에 로고·제목 배치
- **테마:** 라이트 모드부터 구현, 다크 모드 보류
- **간격:** Tailwind 기본 spacing scale 활용. 별도 spacing 토큰 없음
- **공통 컴포넌트:** 필요할 때 추출하며 처음부터 전체 라이브러리를 만들지 않음

## 2. 색상

색상 토큰 원본: `frontend/src/theme.css` (Tailwind CSS v4 `@theme`).

### 확정 팔레트

- **Primary:** 저채도 딥 네이비 50~950. `primary-950` = `hsl(224 39.5% 14.9%)` (약 `#171F35`)
- **Neutral:** 채도를 낮춘 쿨 그레이 50~950
- **Success / Danger / Warning:** Tailwind 기본 Green / Red / Amber 팔레트 활용

### 라이트 모드 용도별 색상 — 초기 배정

실제 화면에서 조정할 수 있는 초안이야.

| 용도 | 토큰 | 현재 배정 |
| --- | --- | --- |
| 페이지 배경 | `page` | `#F8F9FB` |
| 카드·콘텐츠 배경 | `surface` | `#FFFFFF` |
| 기본 텍스트 | `text-primary` | `neutral-900` |
| 보조 텍스트 | `text-secondary` | `neutral-700` |
| 테두리·구분선 | `border` | `neutral-200` |
| 주요 버튼 | `action` | `primary-950` |
| 주요 버튼 Hover | `action-hover` | `primary-900` |

초기 디자인에서 고른 보조 텍스트 `#525D75`, 테두리 `#D8DCE5`는 참고용으로 남겨두고, 현재는 확정된 Neutral 팔레트 단계로 임시 배정했어.

## 3. 적용 상태 및 미결정 사항

- Primary·Neutral 팔레트와 용도별 초기 배정은 `frontend/src/theme.css`에 작성했어.
- **Tailwind CSS 4 설치 및 연동 완료.** `frontend/vite.config.ts`에 `@tailwindcss/vite` 플러그인을 등록했고, `frontend/src/index.css`에서 `@import "tailwindcss";` 다음에 `@import "./theme.css";`를 적용했어. 임시 배경색으로 Tailwind 동작을 확인했고, 설치·연동 후 빌드 통과도 확인했어.
- 실제 화면 구현 시 색상 대비·접근성, 포커스·비활성·오류 상태, 정확한 레이아웃 치수를 검증해.
