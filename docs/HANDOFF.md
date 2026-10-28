# Odin Book — AI 세션 인수인계

최종 확인: 2026-10-28

## 시작할 때 확인할 것

- 프로젝트: `odin-social-media` (The Odin Project — Odin Book)
- 과제 원문: https://www.theodinproject.com/lessons/node-path-nodejs-odin-book
- 로컬 경로: `/home/eudooyoung/repos/odin/full-stack-javascript/nodejs/odin-social-media`
- **반드시 GPT-Helper-MCP로 `docs/PLAN.md` 최신본부터 읽을 것.** PLAN이 기준 문서이고, HANDOFF는 논의 배경과 진행 상황을 전달한다.
- 아직 계획 단계이며 애플리케이션 구현은 시작하지 않았다.

## 현재 진행 상황

사용자가 `docs/PLAN.md`를 직접 작성하며 요구사항을 정리했다. **2장 Functional Requirements의 7개 영역에 PlantUML Use Case 다이어그램이 작성된 상태**다.

현재 PLAN 구성:
- `0. Overview`: X 또는 Threads와 유사한 텍스트 기반 SNS
- `1. Common Rules`: 비로그인 접근 제한, 로그인 사용자에게 프로필·게시글 공개
- `2. Functional Requirements`: Authentication, Profile, User Discovery, Follow, Post, Like, Comment
- `3. Business Rules`: Authentication 초안, Profile 작성 중. 나머지 규칙은 추후 구체화

중요 변경 사항:
- **기능 요구사항을 Use Case 다이어그램으로 대체하기로 결정했다.** 현재 2장에는 기존 영어 bullet 목록도 남아 있으나, 앞으로 UML에 표현한 기능을 기준으로 정리할 계획이다.
- **Feed를 독립 영역에서 제거**하고 `2.5 Post` 안에 `View Home Feed`를 추가했다. `View Home Feed`는 `View Posts`의 특수화(일반화 화살표)로 표현한다.
- `2.4 Follow`는 Outgoing / Incoming package로 분류했으며, Send·View Sent·Cancel / View Received·Accept·Reject, 별도의 Unfollow까지 총 7개 Use Case를 표현한다.
- `2.2 Profile`에는 `View Profile`의 특수화(`View My Profile`, `View Other Users' Profiles`)와 `Edit Profile`이 있다.
- `2.3 User Discovery`는 `View All Users`, `Search For Users`의 독립적인 Use Case로 정리했다.
- `2.6 Like`, `2.7 Comment`까지 다이어그램 작성했다.

## 문서 작성 방향과 결정 근거

기존 Entity/CRUD 중심 분류에서 **사용자의 목표 중심 Use Case 모델링**으로 방향을 바꿨다. 이 과정에서 중복과 기능의 개념적 경계가 명확해지는 효과를 확인했다.

현재 작업 기준:
1. **Functional Requirements:** Use Case 다이어그램으로 기능을 표현한다. 별도 서술 목록을 반드시 유지할 필요는 없다.
2. **Business Rules:** 입력값, 조회 조건, 권한, 상태·선행조건, 정책 같은 세부 사항을 설명한다. 다이어그램에 표현하지 않은 세부 조건이라고 해서 무조건 삭제하지 않는다.
3. **UML 관계:** `<<include>>`, `<<extend>>`, 일반화는 각각의 정확한 의미가 충족될 때만 사용한다. 기능 간 선후관계나 화면 이동만으로 `extend`를 강제하지 않는다.
4. 기능을 CRUD·데이터베이스·API 구조에 억지로 대응시키지 않는다. 문서는 가능한 한 간결하게 유지한다.
5. `PLAN.md`의 0부터 시작하는 번호는 사용자 작성 형식이다. 요청 없이 변경하지 않는다.

## 현재 합의된 서비스 범위와 유의점

- **접근:** 비로그인 사용자는 로그인·회원가입 페이지만 접근할 수 있고, 로그인 사용자에게 모든 프로필과 게시글이 공개된다.
- **인증:** 이메일 및 소셜 계정으로 가입·로그인, 소셜 계정 연결/해제, 로그아웃, 비활성화·재활성화 기능. 등록 시 기본 프로필을 생성한다는 이전 합의가 있다. 소셜 제공자와 상세 인증 정책은 별도 검토 필요.
- **프로필:** 본인·타인 프로필 조회, 본인 프로필 수정. Display Name, 고유 Profile ID, 프로필 이미지, bio 등 세부 필드는 Business Rules에서 정리한다.
- **탐색:** 전체 사용자 조회 및 검색.
- **팔로우:** 즉시 팔로우가 아니라 **요청·승인 방식**. 발신·수신 요청 처리와 언팔로우 지원.
- **게시글·피드:** 게시글 작성/조회/수정/삭제, 홈 피드 조회. 기존 합의상 홈 피드는 본인과 팔로잉 사용자의 글을 최신순으로 보여주며 Explore 피드는 범위 밖이다.
- **좋아요·댓글:** 게시글 좋아요/취소, 댓글 작성/조회/수정/삭제. 댓글 좋아요·대댓글은 보류.

## 아직 결정하거나 문서화해야 할 사항

- **계획서 전체 구조 검토:** 다음 논의의 우선 주제. 2장 Use Case와 3장 Business Rules 외에 어떤 장이 필요할지, 작성 순서와 상세 수준을 검토한다.
- **Business Rules 구체화:** 계정 비활성화·재활성화의 정책, 회원가입/프로필 ID 규칙, 로그인 수단 보장, 팔로우 관계·요청 상태, 글/댓글/좋아요 제약, 홈 피드 조회·정렬 조건 등. 현재 PLAN의 3장은 미완성이다.
- **비기능 요구사항 및 구현/배포 계획:** 과제의 배포 요구사항을 포함해 계획서 구조 논의 과정에서 범위를 결정한다.
- PLAN에 남아 있는 서술형 기능 bullet의 정리 여부 및 다이어그램의 상세 수준은 이후 검토한다.

## 다음 세션에서 할 일 — 사용자 지정

1. **프로젝트 계획서의 전체 구조를 점검한다.** 당장 다음 Use Case나 Business Rules를 작성하기보다, 어떤 항목과 단계가 필요한지 먼저 논의한다.
2. **이전에 작성한 Matching Bot 발표 PPT를 참고 자료로 활용하는 방향을 검토한다.** PPT가 현재 접근 가능한 자료로 확인되지 않으면 **사용자가 직접 업로드할 수 있다.** 자료를 읽지 않고 내용을 추정하지 말 것.
3. 자료와 현재 PLAN을 비교하여 계획서 목차·구조를 평가하고, 사용자와 논의해 개편 방향을 결정한다.

**위 논의가 다음 우선 작업이다.** 사용자 요청 없이 PLAN을 수정하거나 후속 개발 단계로 진행하지 않는다.

## 협업 방식

- 사용자가 `PLAN.md`를 직접 작성한다. **명시적 요청이 없으면 PLAN 수정 금지.**
- 피드백은 짧고 구체적으로, 오류·타당성·선택적 개선을 구분한다.
- **사용자 의견에 맞춰 결론을 바꾸지 말 것.** 질문은 반론이나 수정 요구가 아닐 수 있다. 판단 근거를 먼저 설명하고, 새로운 근거가 있을 때만 변경 이유를 밝힌다.
- 미결정 정책은 사용자의 생각과 근거를 먼저 묻고 독립적으로 검토한다.
- 영어 표현 피드백은 짧게 한국어로 제공한다.
- 기능 요구사항, Business Rules, UML의 의미, 기술 설계를 구분한다.
