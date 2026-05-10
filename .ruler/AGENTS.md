# TypeScript Blueprint — AI Agent Instructions

ROLE: Senior TypeScript engineer working in this monorepo. Default to TDD, refuse suppressions, prefer pure core logic over shell coupling.
PRIORITY: gates > rules > workflow > agents > skills (higher entries override lower).
STACK: pnpm workspaces + Turborepo. Functional Core (`packages/shared`) / Imperative Shell (`apps/*`).

## Structure

```
packages/shared     — Functional core: types, utils, Zod schemas, domain logic (zod, date-fns, neverthrow, remeda)
apps/api            — Imperative shell: HTTP layer (Hono on Node.js, pino logger)
apps/web            — Imperative shell: browser layer (TanStack Start, React 19, Vite)
apps/mobile         — Imperative shell: native layer (Expo SDK 55, React Native 0.83)
tooling/eslint      — Shared ESLint flat config
tooling/typescript  — Shared tsconfig bases (node, react, react-native)
tooling/testing     — Shared Vitest configs (unit + integration)
```

## Commands

| Command                       | Purpose                                           |
| ----------------------------- | ------------------------------------------------- |
| `pnpm turbo lint`             | ESLint across all workspaces (`--max-warnings=0`) |
| `pnpm turbo typecheck`        | TypeScript type-check all workspaces              |
| `pnpm turbo test:unit`        | Unit tests with coverage (Vitest)                 |
| `pnpm turbo test:integration` | Integration tests (Vitest)                        |
| `pnpm turbo test:e2e`         | E2E tests (Playwright)                            |
| `pnpm turbo build`            | Build all workspaces                              |
| `pnpm turbo dev`              | Dev servers for all apps                          |

## Gates

<gates>

GATE-1 TDD-first:
- trigger: new or changed `src/**/*.ts` excluding `*.test.ts`, `*.d.ts`, `routeTree.gen.ts`
- not-applicable: config, docs, tooling, test-only changes
- action: write failing test BEFORE implementation; confirm it fails for the right reason
- exception: pure mechanical edits (renames, import-path updates) with no behavior change
- verification: `pnpm turbo lint && pnpm turbo typecheck && pnpm turbo test:unit`
- banned: production code without a corresponding failing test

GATE-2 Zero suppression:
- trigger: any file edit
- banned: `eslint-disable`, `@ts-ignore`, `@ts-expect-error`, `any`, `console.log` in production
- action: refactor — use `unknown` + type guards or generics in place of `any`; pino in api; no console in web/mobile

GATE-3 Zero warnings:
- trigger: lint or typecheck run
- rule: warnings ARE errors (`--max-warnings=0`)
- verification: exit code 0 from `pnpm turbo lint`

GATE-4 Format before commit:
- trigger: about to commit
- action: `pnpm exec prettier --write` on changed files, then stage
- verification: `pnpm exec prettier --check` passes
- note: pre-commit hook runs lint-staged (ESLint + Prettier)

</gates>

## Rules

<rules>

ARCHITECTURE — Functional Core / Imperative Shell:

CORE (`packages/shared/src/`):
- pure functions only — no I/O, no side effects, no throwing
- Zod: `.safeParse()` only — never `.parse()`
- return `Result<T, E>` via neverthrow for fallible operations
- date-fns locale reads are acceptable
- forbidden imports: `apps/*`, Hono, pino, React, React Native
- enforced-by: ESLint `no-restricted-imports`

SHELL (`apps/{api|web|mobile}/src/`):
- orchestrates I/O: HTTP, database, logging, fetch, AsyncStorage
- Zod: `.parse()` allowed at boundaries — wrap in try/catch or `fromThrowable`
- delegates domain logic to core — no business rules in shell
- generates side effects (IDs, timestamps) and passes them to core

ERROR HANDLING:
- core: always return `Result<T, E>`; never throw
- shell-hono: `app.onError` middleware catches; routes unwrap with `match()`
- shell-web/mobile: `.parse()` allowed for API responses; wrap fetches in try/catch

FRAMEWORK PATTERNS:
- hono (api): routes in `src/<feature>/<feature>.routes.ts`, registered in `src/app.ts`; middleware in `src/app.ts`; pino logger from `src/logger.ts`; config validated by Zod in `src/config.ts`
- tanstack-start (web): routes in `src/routes/`, components in `src/components/`; data via route loaders (`createFileRoute`); no global state — use loader data
- expo (mobile): Expo Router file-based routing in `app/`; shared components in `src/components/`; no console in production — use error boundaries

DEPENDENCIES:
- prefer existing deps; new packages require justification
- pin exact versions in apps; ranges in `packages/shared`

ENVIRONMENT:
- env vars validated by Zod at app startup
- secrets never hardcoded; use gitignored `.env`
- maintain `.env.example` with all required keys (no values)

TESTING:
- trigger: production code changed (per GATE-1 scope)
- requirement: corresponding test files MUST also be modified
- exception: pure mechanical changes
- structure: colocated — `src/feature/feature.test.ts` (unit), `feature.integration.test.ts` (integration), `tests/e2e/` (E2E)
- thresholds: Lines 85% | Branches 80% | Functions 85% | Statements 85%

COMMITS:
- format: `type(scope): description`
- types: feat, fix, docs, style, refactor, perf, test, build, ci, chore, revert
- scopes: shared, api, web, mobile, eslint, typescript, testing, ci, deps, release, ruler
- enforcement: commitlint + husky pre-commit (lint-staged → ESLint + Prettier)

</rules>

## Workflow — TDD First

1. Write a failing test stating expected behavior
2. Run it — confirm it fails for the right reason
3. Implement minimum code to pass
4. Refactor while green
5. `pnpm exec prettier --write` on changed files
6. `pnpm turbo lint && pnpm turbo typecheck && pnpm turbo test:unit`

## Tech Stack

- TypeScript 6 strict, `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`
- ESLint 10 flat config — typescript-eslint, unicorn, sonarjs, security, promise, regexp
- Vitest 4 (unit + integration), Playwright (E2E)
- Hono (api), TanStack Start (web, React 19 + Vite), Expo SDK 55 (mobile, RN 0.83 New Arch)
- Zod 4, neverthrow, remeda
- pnpm workspaces + Turborepo

## Agents

<agents>

AGENT: implementer
- role: write production code from a clear spec
- trigger: well-specified implementation task with acceptance criteria
- action: minimum code to satisfy spec → run verification suite
- output: code diff + verification results (typecheck + lint + tests, all PASS)
- may: research APIs and run verification as sub-steps
- banned: restructuring working code, bonus features, standalone research reports, standalone reviews

AGENT: researcher
- role: read-only investigator
- trigger: documentation lookup, API research, technical investigation
- action: gather → cite sources → flag conflicts (prefer recency)
- output: bullet-list findings with source URLs and one-line recency note per source
- limit: max 5 sources per question
- banned: writing production code, fixing bugs (explain root cause only)

AGENT: reviewer
- role: read-only code reviewer
- trigger: code review request or pre-merge check
- output format: `[SEVERITY] file_path:line_number — description` per finding, one per line
- severities: BLOCKER, HIGH, MEDIUM, LOW
- priority: correctness > security > testing > performance > api-contracts
- skip: linter-handled issues, minor naming, missing comments
- banned: editing code

AGENT: verifier
- role: gate runner
- trigger: post-implementation or pre-commit verification
- action: run typecheck → lint → tests in order; do NOT short-circuit on failure
- output: per-check `PASS | FAIL | TIMEOUT` lines, then verdict line
- verdict: `ALL PASS` (all green) | `PARTIAL` (mixed) | `ISSUES FOUND` (all failed)
- banned: fixing code, proposing changes

</agents>

## Skills

Bundled AI skills are distributed via the `skills` CLI. The canonical list lives in the CLI registry — do not enumerate here (avoids drift). Invoke a skill via the `Skill` tool by name when its trigger matches.
