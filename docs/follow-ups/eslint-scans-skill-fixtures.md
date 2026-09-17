# `bun run lint`가 스킬 eval 픽스처까지 검사해 실패한다

## 증상

`bun run lint`가 제품 코드와 무관한 18건의 오류로 실패합니다. 모두
`@typescript-eslint/no-require-imports`이고, 설치된 스킬이 함께 가져온 eval 픽스처
파일에서 납니다.

```
.agents/skills/babysit-specs/evals/fixtures/queued-specs/server.js
.agents/skills/shape-idea/evals/fixtures/notification-preview/server.js
.agents/skills/shape-idea/evals/fixtures/notification-settings/server.js
.claude/skills/babysit-specs/evals/fixtures/queued-specs/server.js
.claude/skills/shape-idea/evals/fixtures/notification-preview/server.js
.claude/skills/shape-idea/evals/fixtures/notification-settings/server.js
```

각 파일에서 1:14, 2:12, 3:14 세 줄입니다.

## 근거

초기 커밋(`f847a0f`)부터 있던 문제입니다. `git cat-file -e
HEAD:.claude/skills/shape-idea/evals/fixtures/notification-preview/server.js`로
확인했습니다. 어떤 제품 코드 변경과도 무관합니다.

## 짐작되는 원인

`eslint.config.mjs`가 `eslint-config-next`의 기본 ignore 목록을 `globalIgnores`로
덮어쓰면서 `.next/**`, `out/**`, `build/**`, `next-env.d.ts`만 남겼습니다. 스킬이
설치되는 `.agents/**`와 `.claude/**`가 빠져 있어 그 안의 JavaScript 픽스처까지
검사 대상이 됩니다. 이 디렉터리는 사람이 고칠 코드가 아니라 스킬이 관리하는
내용이고, 스킬을 갱신하면 다시 덮어써집니다.

## 시도한 것

`docs/specs/morning-log-and-trend/` 구현에서 나온 제품 코드 오류 두 건
(`app/page.tsx`, `app/trend/page.tsx`의 `react-hooks/set-state-in-effect`)은
`useSyncExternalStore`로 바꿔 해결했습니다. 픽스처 쪽 18건은 범위 밖이라 손대지
않았습니다.

## 다음 단계로 제안하는 것

`eslint.config.mjs`의 `globalIgnores`에 `.agents/**`와 `.claude/**`를 더합니다.
저장소 전체의 lint 경계를 바꾸는 일이라 제품 작업에 끼워 넣지 않고 따로 결정하는
편이 낫습니다.
