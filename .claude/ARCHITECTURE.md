# Architecture Template (Reusable)

이 문서는 특정 서비스/도메인에 종속되지 않는 공통 아키텍처 가이드입니다.
프로젝트별 이름, 기능명, 화면명은 제거하고 구조 원칙만 유지합니다.

---

## 1) 목표

- 일관된 폴더 구조와 의존 방향 유지
- 변경 영향 범위를 최소화하는 모듈 경계 설계
- 새 기능 추가 시 위치/책임 판단 기준 통일
- 다국어(i18n) 리소스 분리 전략 표준화

---

## 2) 기본 구조 (FSD)

```text
src/
├── app/         # 앱 초기화 (providers, router, global styles)
├── pages/       # 라우트 단위 화면
├── widgets/     # 독립 UI 블록
├── features/    # 사용자 상호작용/유스케이스
├── entities/    # 도메인 엔티티
└── shared/      # 범용 재사용 코드
```

의존 방향:

```text
app -> pages -> widgets -> features -> entities -> shared
```

핵심 원칙:

- 상위 계층만 하위 계층 import 가능
- 같은 계층의 다른 slice 직접 import 금지
- shared는 어디서나 import 가능

---

## 3) Slice/Segment 규칙

`app`, `shared`를 제외한 계층은 slice(도메인 폴더)로 구성합니다.

```text
<layer>/<slice>/
├── ui/
├── model/
├── api/
├── lib/
├── config/
├── i18n/
└── index.ts
```

규칙:

- 외부에서는 반드시 `index.ts`(public API)로만 접근
- segment는 필요한 것만 생성
- 관련 코드 우선 배치(콜로케이션), 조기 공용화 금지

---

## 4) 파일 배치 결정 기준

1. 사용처 1~2곳: 가장 가까운 slice 내부에 배치
2. 사용처 3곳 이상 + 도메인 지식 있음: 상위 계층으로 승격
3. 사용처 3곳 이상 + 도메인 지식 없음: shared로 이동

종류별 기본 배치:

- 라우트 화면: pages
- 큰 조합 UI: widgets
- 사용자 액션/유스케이스: features
- 도메인 모델/타입/엔티티 UI: entities
- 순수 유틸/공용 컴포넌트: shared

---

## 5) 금지 사항

- 하위 계층에서 상위 계층 import
- 같은 계층 slice 직접 참조
- slice 외부에서 내부 segment 직접 import
- 상대경로 깊은 참조(`../../..`) 남발
- UI 문자열 하드코딩(사용자 노출 텍스트)

---

## 6) i18n 전략

원칙:

- 사용자 노출 문자열은 모두 번역 키로 관리
- slice 전용 텍스트는 slice 내부 i18n에 보관
- 공용 텍스트만 shared/i18n으로 승격

예시 구조:

```text
shared/i18n/
├── config.ts
└── locales/
    ├── ko/common.json
    └── en/common.json

features/<slice>/i18n/
├── ko.json
└── en.json
```

---

## 7) 변경 절차(권장)

1. 요구사항을 기능 단위로 분해
2. 각 기능의 책임 계층 결정
3. slice 생성 또는 확장
4. public API(index.ts) 노출 정리
5. 테스트/검증 후 병합

---

## 8) 온보딩 체크리스트

- 현재 코드가 계층 의존 방향을 지키는가
- slice 외부 direct import가 없는가
- 신규 문자열이 i18n으로 분리되었는가
- 공용화 기준(3회 이상 재사용)이 지켜졌는가
- 변경 파일이 요청 범위 밖으로 확장되지 않았는가

---

## 9) 프로젝트별 커스터마이징 포인트

이 템플릿은 아래만 바꿔도 프로젝트에 맞출 수 있습니다.

- layer/slice 명명 규칙
- 공용 컴포넌트 기준(shared 승격 기준)
- i18n 네임스페이스 정책
- 테스트 전략(단위/통합/e2e 비중)
- 코드 소유권/리뷰 규칙

