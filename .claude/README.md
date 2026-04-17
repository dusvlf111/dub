# `.claude` 운영 가이드 (공통 템플릿)

이 문서는 Claude Code를 프로젝트에서 공통으로 운영하기 위한 `.claude` 디렉터리 사용 가이드입니다.
프로젝트 이름, 도메인, 기술 스택과 무관하게 재사용할 수 있도록 작성했습니다.

---

## 1) 디렉터리 구조

```text
.claude/
├── README.md
├── ARCHITECTURE.md
├── behavioral.md
├── settings.json
├── settings.local.json
├── agents/
├── roles/
├── skills/
├── docs/
├── hooks/
└── tasks/
```

---

## 2) 폴더별 역할

- `agents/`
  - 단일 세션에서 Task 도구로 호출할 서브에이전트 정의
  - 예: 문서 검색, 문서 업데이트, 구현 실행, 테스트 실행

- `roles/`
  - 멀티 세션(팀 실행) 역할 정의
  - 일반적으로 `coordinator`, `developer`, `tester` 구성

- `skills/`
  - 반복 작업용 스킬 정의
  - 규칙/체크리스트/자동화 스크립트/참고 문서 포함 가능

- `docs/`
  - 프로젝트 내부 운영 문서 및 외부 레퍼런스 문서 보관

- `hooks/`
  - 작업 전후 자동 실행 스크립트
  - 예: lint/format 자동 실행, task 문서 검증

- `tasks/`
  - PRD, 작업 분해 문서, 결과 보고서, 참고 이미지 보관

- `settings.json`
  - 팀 공통 Claude 실행 설정

- `settings.local.json`
  - 로컬 전용 설정 (개인/로컬 환경별 값)

---

## 3) tasks 운영 규칙

```text
tasks/
├── todo/
│   ├── prd-*.md
│   ├── task-YYYY-MM-DD.md
│   └── tasks-*-pushN.md
└── done/
    ├── tasks-*.md
    └── result-*.md
```

- `todo/`: 진행 예정 또는 진행 중 문서
- `done/`: 완료된 문서와 결과 보고서
- 파일명은 고정값이 아니라 패턴 기반으로 운영

---

## 4) 에이전트 운영 권장 흐름

1. `coordinator`가 요구사항을 분해
2. `developer`가 구현
3. `tester`가 타입/빌드/테스트 검증
4. 결과를 `tasks/done`으로 정리

단순 작업은 단일 에이전트로 실행하고, 복잡한 작업은 역할 분리(팀 실행)를 권장합니다.

---

## 5) 스킬 작성 원칙

- 스킬은 `SKILL.md`를 중심으로 작성
- 트리거 문구는 description에 명확히 포함
- 프로젝트 전용 규칙과 공통 규칙을 분리
- 스킬 없이도 수행 가능한 단순 작업은 문서화 과도화를 피함

---

## 6) 훅 운영 원칙

- 훅은 결정적이고 빠르게 실행되어야 함
- 실패 시 원인을 즉시 파악할 수 있는 메시지 제공
- 로컬 환경 의존성이 큰 동작은 `settings.local.json`으로 분리

---

## 7) 유지보수 체크리스트

- `.claude` 트리와 README 설명이 일치하는지 확인
- 더 이상 사용하지 않는 에이전트/스킬/훅 제거
- `tasks/todo` 장기 미완료 문서 정리
- 공통 가이드에 프로젝트 고유 정보가 섞이지 않았는지 점검

---

## 8) 커스터마이징 포인트

다음 항목만 프로젝트에 맞게 변경하면 됩니다.

- `agents/` 에이전트 종류
- `roles/` 팀 구성
- `skills/` 목록과 규칙
- `hooks/` 자동화 스크립트
- `tasks/` 파일명 패턴 및 운영 방식

