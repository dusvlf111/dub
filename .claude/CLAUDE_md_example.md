# .claude 전체 트리 구조

```text
.claude/  # Claude 운영 설정 루트
├── ARCHITECTURE.md  # 운영 아키텍처 메모
├── README.md  # .claude 사용 안내
├── behavioral.md  # 에이전트 동작 성향/행동 규칙
├── settings.json  # 공통 실행 설정
├── settings.local.json  # 로컬 전용 설정
├── agents/  # 서브에이전트 정의
│   ├── doc-finder.md  # 문서 검색 전담 에이전트
│   ├── doc-updater.md  # 문서 업데이트 전담 에이전트
│   ├── task-executor.md  # 구현 작업 실행 에이전트
│   └── test-runner.md  # 테스트 실행/검증 에이전트
├── docs/  # Claude 관련 참고 문서
│   └── claude_code_docs/  # 공식 문서 모음
│       ├── Automate workflows with hooks.md  # 훅 자동화 가이드
│       ├── Create custom subagents.md  # 서브에이전트 작성 가이드
│       ├── Extend Claude with skills.md  # 스킬 확장 가이드
│       └── Orchestrate teams of Claude Code sessions.md  # 팀 오케스트레이션 가이드
├── hooks/  # 작업 전후 자동 실행 스크립트
│   ├── check-tasks.sh  # 작업 문서 검증 훅
│   ├── inject-task-context.sh  # 컨텍스트 주입 훅
│   └── post-edit-lint.sh  # 편집 후 린트 훅
├── roles/  # 역할 기반 운영 문서
│   ├── README.md  # roles 개요
│   ├── USAGE.md  # roles 사용법
│   ├── coordinator.md  # 코디네이터 역할 정의
│   ├── developer.md  # 개발 역할 정의
│   └── tester.md  # 테스트 역할 정의
├── skills/  # 작업별 스킬 정의
│   ├── code-quality/  # 코드 품질 스킬
│   │   ├── SKILL.md  # 스킬 본문
│   │   └── references/  # 품질 기준 참고 문서
│   │       ├── cohesion.md  # 응집도 가이드
│   │       ├── coupling.md  # 결합도 가이드
│   │       ├── predictability.md  # 예측 가능성 가이드
│   │       ├── readability.md  # 가독성 가이드
│   │       └── tradeoffs.md  # 트레이드오프 가이드
│   ├── folder-structure/  # 폴더 구조 스킬
│   │   └── SKILL.md  # 스킬 본문
│   ├── seo/  # SEO 스킬
│   │   └── SKILL.md  # 스킬 본문
│   ├── skill-creator/  # 스킬 생성/평가 스킬
│   │   ├── SKILL.md  # 스킬 본문
│   │   ├── agents/  # 평가용 보조 에이전트
│   │   │   ├── analyzer.md  # 분석 에이전트
│   │   │   ├── comparator.md  # 비교 에이전트
│   │   │   └── grader.md  # 채점 에이전트
│   │   ├── assets/  # 평가 리소스
│   │   │   └── eval_review.html  # 리뷰 뷰 템플릿
│   │   ├── eval-viewer/  # 평가 결과 뷰어
│   │   │   ├── generate_review.py  # 리뷰 생성 스크립트
│   │   │   └── viewer.html  # 뷰어 페이지
│   │   ├── references/  # 스키마 참고 문서
│   │   │   └── schemas.md  # 평가 데이터 스키마
│   │   └── scripts/  # 자동화 스크립트
│   │       ├── __init__.py  # 패키지 초기화
│   │       ├── aggregate_benchmark.py  # 벤치마크 집계
│   │       ├── generate_report.py  # 리포트 생성
│   │       ├── improve_description.py  # 설명 개선
│   │       ├── package_skill.py  # 스킬 패키징
│   │       ├── quick_validate.py  # 빠른 검증
│   │       ├── run_eval.py  # 평가 실행
│   │       ├── run_loop.py  # 반복 실행
│   │       └── utils.py  # 공통 유틸
│   ├── task-cleaner/  # 작업 정리 스킬
│   │   └── SKILL.md  # 스킬 본문
│   ├── task-maker/  # 작업 분해 생성 스킬
│   │   └── SKILL.md  # 스킬 본문
│   ├── task-runner/  # 작업 실행 스킬
│   │   └── SKILL.md  # 스킬 본문
│   └── vercel-react-best-practices/  # React/Next 최적화 스킬
│       ├── AGENTS.md  # 전체 규칙 문서
│       ├── SKILL.md  # 스킬 본문
│       └── rules/  # 세부 규칙 문서 모음
│           ├── advanced-event-handler-refs.md  # 고급 이벤트 핸들러 refs
│           ├── advanced-use-latest.md  # useLatest 패턴
│           ├── async-api-routes.md  # API 라우트 비동기 규칙
│           ├── async-defer-await.md  # await 지연 규칙
│           ├── async-dependencies.md  # 의존 비동기 규칙
│           ├── async-parallel.md  # 병렬 비동기 규칙
│           ├── async-suspense-boundaries.md  # Suspense 경계 규칙
│           ├── bundle-barrel-imports.md  # 배럴 import 최적화
│           ├── bundle-conditional.md  # 조건부 번들 로딩
│           ├── bundle-defer-third-party.md  # 서드파티 지연 로딩
│           ├── bundle-dynamic-imports.md  # 동적 import 최적화
│           ├── bundle-preload.md  # 프리로드 규칙
│           ├── client-event-listeners.md  # 클라이언트 이벤트 리스너 규칙
│           ├── client-localstorage-schema.md  # localStorage 스키마 규칙
│           ├── client-passive-event-listeners.md  # passive 리스너 규칙
│           ├── client-swr-dedup.md  # SWR 중복 요청 제거 규칙
│           ├── js-batch-dom-css.md  # DOM/CSS 배치 처리 규칙
│           ├── js-cache-function-results.md  # 함수 결과 캐싱 규칙
│           ├── js-cache-property-access.md  # 프로퍼티 접근 캐싱 규칙
│           ├── js-cache-storage.md  # 스토리지 캐싱 규칙
│           ├── js-combine-iterations.md  # 반복 결합 규칙
│           ├── js-early-exit.md  # 조기 반환 규칙
│           ├── js-hoist-regexp.md  # 정규식 호이스팅 규칙
│           ├── js-index-maps.md  # 인덱스 맵 활용 규칙
│           ├── js-length-check-first.md  # 길이 선검사 규칙
│           ├── js-min-max-loop.md  # min/max 루프 규칙
│           ├── js-set-map-lookups.md  # Set/Map 조회 규칙
│           ├── js-tosorted-immutable.md  # toSorted 불변 규칙
│           ├── rendering-activity.md  # 렌더링 activity 규칙
│           ├── rendering-animate-svg-wrapper.md  # SVG 애니메이션 래퍼 규칙
│           ├── rendering-conditional-render.md  # 조건부 렌더 규칙
│           ├── rendering-content-visibility.md  # content-visibility 규칙
│           ├── rendering-hoist-jsx.md  # JSX 호이스팅 규칙
│           ├── rendering-hydration-no-flicker.md  # hydration 깜빡임 방지 규칙
│           ├── rendering-svg-precision.md  # SVG 정밀도 규칙
│           ├── rerender-defer-reads.md  # 리렌더 read 지연 규칙
│           ├── rerender-dependencies.md  # 의존성 리렌더 규칙
│           ├── rerender-derived-state.md  # 파생 상태 규칙
│           ├── rerender-functional-setstate.md  # 함수형 setState 규칙
│           ├── rerender-lazy-state-init.md  # 지연 초기화 규칙
│           ├── rerender-memo.md  # memo 리렌더 규칙
│           ├── rerender-transitions.md  # 전환 리렌더 규칙
│           ├── server-after-nonblocking.md  # non-blocking after 규칙
│           ├── server-cache-lru.md  # LRU 캐시 규칙
│           ├── server-cache-react.md  # React cache 규칙
│           ├── server-parallel-fetching.md  # 서버 병렬 fetch 규칙
│           └── server-serialization.md  # 서버 직렬화 규칙
└── tasks/  # 작업 산출물 및 참고 이미지
	├── count.png  # 참고 이미지 (예시)
	├── image copy.png  # 참고 이미지 (예시)
	├── image-1.png  # 참고 이미지 (예시)
	├── image-2.png  # 참고 이미지 (예시)
	├── image.png  # 참고 이미지 (예시)
	├── main.png  # 참고 이미지 (예시)
	├── prd.md  # 원본 PRD (예시)
	├── pvp_select.png  # PvP 참고 이미지 (예시)
	├── done/  # 완료 작업 보관 (내용 수시 변경)
	│   └── tasks-*.md / result-*.md  # 완료 문서 패턴 (예시)
	└── todo/  # 진행 예정 작업 보관 (내용 수시 변경)
		├── prd-*.md  # PRD 파일 패턴 (예시)
		├── task-YYYY-MM-DD.md  # 작업 인덱스 패턴 (예시)
		└── tasks-*-pushN.md  # Push 작업 문서 패턴 (예시)
```
