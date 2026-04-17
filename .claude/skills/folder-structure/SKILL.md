---
name: folder-structure
description: tazagame-client 프론트엔드 폴더 구조 규칙(FSD - Feature-Sliced Design). 새 파일/컴포넌트를 만들 때, 파일 위치를 결정할 때, import 구조를 설계할 때, 다국어(i18n) 리소스를 배치할 때 자동 활성화.
---

# 폴더 구조 — Feature-Sliced Design (FSD)

이 프로젝트는 **FSD** 컨벤션을 따른다. 수직 계층(Layer) → 도메인 슬라이스(Slice) → 기술 세그먼트(Segment) 3단 구조다.

## 디렉토리 구조

```
src/
├── app/         # 앱 초기화 (providers, router, i18n init, 글로벌 스타일)
├── pages/       # 라우트 단위 페이지
├── widgets/     # 독립적인 큰 UI 블록 (헤더, 게임보드 등)
├── features/    # 사용자 상호작용 단위 기능 (유스케이스)
├── entities/    # 비즈니스 엔티티 (user, game, word 등)
└── shared/      # 도메인 지식 없는 완전 재사용 코드
    ├── ui/
    ├── lib/
    ├── api/
    ├── config/
    ├── i18n/
    └── assets/
```

## 계층(Layer) 의존 방향

```
app → pages → widgets → features → entities → shared
```

- **상위 계층만 하위 계층을 import**한다
- `shared`는 어디서나 import 가능
- `app`은 모든 것을 import 가능

## 슬라이스(Slice) 내부 구조 = 세그먼트(Segment)

`app`, `shared`를 제외한 각 계층은 슬라이스(도메인 폴더)로 나뉘고, 슬라이스 내부는 세그먼트로 나눈다.

```
features/typing-input/
├── ui/          # 컴포넌트
├── model/       # 상태, 훅, 비즈니스 로직
├── api/         # 이 슬라이스 전용 API 호출
├── lib/         # 이 슬라이스 전용 유틸
├── config/      # 이 슬라이스 전용 상수
├── i18n/        # 이 슬라이스 전용 번역 리소스 (ko.json, en.json)
└── index.ts     # public API — 외부는 이것만 import
```

필요한 세그먼트만 만든다. 모든 slice가 모든 segment를 가질 필요는 없다.

## 파일 배치 결정 플로우

1. **어디서 쓰이는가?**
   - 1~2곳에서만 쓰임 → 가장 가까운 slice 내부
   - 3곳 이상 + 도메인 지식 있음 → 상위 계층 (entities → features → widgets)
   - 3곳 이상 + 도메인 지식 없음 → `shared/`

2. **무엇인가?**
   - 라우트 페이지 → `pages/`
   - 큰 UI 블록 → `widgets/`
   - 사용자 상호작용/유스케이스 → `features/`
   - 도메인 모델 + 관련 UI/로직 → `entities/`
   - 범용 UI/유틸 → `shared/`

## 배치 예시

| 코드 | 배치 위치 |
|---|---|
| 타자 입력 처리 컴포넌트/훅 | `features/typing-input/` |
| 게임 보드 widget | `widgets/game-board/` |
| User 엔티티 타입 + 프로필 카드 UI | `entities/user/` |
| 범용 Button 컴포넌트 | `shared/ui/button/` |
| API 클라이언트 인스턴스 | `shared/api/` |
| 앱 전역 라우터/프로바이더 | `app/providers/` |
| 게임 페이지 전체 화면 | `pages/game/` |

## i18n 리소스 배치

- **슬라이스 전용 텍스트** → 해당 `<slice>/i18n/{lang}.json` (콜로케이션)
- **여러 슬라이스 공용 텍스트** → `shared/i18n/locales/{lang}/common.json`
- 초기화 및 i18next 인스턴스 → `shared/i18n/` 또는 `app/providers/i18n/`
- 네임스페이스 = 슬라이스 이름 (예: `typing-input`, `game`, `common`)
- **UI 문자열은 반드시 `t()`로 호출**, 컴포넌트 내 하드코딩 금지 (aria-label, placeholder, title 포함)
- 문자열 연결 금지 → interpolation(`{{var}}`) 사용

## 금지 사항

- ❌ 같은 계층의 다른 slice 직접 import (`features/A` → `features/B`)
- ❌ 하위 계층 → 상위 계층 import (`entities/*` → `features/*`, `shared/*` → `entities/*`)
- ❌ slice 외부에서 segment 파일 직접 import (`index.ts` 우회)
- ❌ 처음부터 `shared/`에 파일 생성 (먼저 slice 안에서 시작)
- ❌ 레거시 경로(`src/components/`, `src/domain/`) 사용
- ❌ 순환 참조
- ❌ UI/컴포넌트 내부에 하드코딩 문자열 (i18n 대상)

## 검증법

- 한 slice 폴더를 통째로 지워도 **다른 slice**가 깨지지 않아야 한다 (같은 계층 간 독립성)
- 한 계층(예: `features/`) 전체를 아래 계층만 아는 상태로 두고 타입 검사가 통과해야 한다
- `shared/` 내부 파일이 `features/`, `entities/` 등 상위를 전혀 참조하지 않아야 한다
- 코드에서 사용자에게 보이는 문자열을 전부 grep 했을 때 `t(` 호출 밖의 한글/영어 문장이 없어야 한다
