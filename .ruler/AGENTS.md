# TypeScript Blueprint — AI Agent Instructions

# priority: gates > rules > workflow > agents > skills

Monorepo TypeScript blueprint for AI-assisted development at Ravn. Uses pnpm workspaces + Turborepo.
Architecture: Functional Core (`packages/shared`) / Imperative Shell (`apps/*`).

## Structure

```
packages/shared     — Functional core: types, utils, Zod schemas, domain logic (zod, date-fns, neverthrow, remeda)
apps/api            — Imperative shell: HTTP layer (Hono on Node.js, pino logger)
apps/web            — Imperative shell: browser layer (TanStack Start, React 19, Vite)
apps/mobile         — Imperative shell: native layer (Expo SDK 55, React Native 0.83)
tooling/eslint      — Shared ESLint flat config (10+ plugins, zero warnings)
tooling/typescript  — Shared tsconfig bases (node, react, react-native)
tooling/testing     — Shared Vitest configs (unit + integration)
```

## Commands

| Command                       | What it does                                      |
| ----------------------------- | ------------------------------------------------- |
| `pnpm turbo lint`             | ESLint across all workspaces (`--max-warnings=0`) |
| `pnpm turbo typecheck`        | TypeScript type-check all workspaces              |
| `pnpm turbo test:unit`        | Unit tests with coverage (Vitest)                 |
| `pnpm turbo test:integration` | Integration tests (Vitest)                        |
| `pnpm turbo test:e2e`         | E2E tests (Playwright for web)                    |
| `pnpm turbo build`            | Build all workspaces                              |
| `pnpm turbo dev`              | Dev servers for all apps                          |

<gates>

GATE-1 TDD-first:
trigger: new or changed `src/**/*.ts` files excluding `*.test.ts`, `*.d.ts`, and generated files (`routeTree.gen.ts`)
does-not-apply: config files, documentation, tooling changes, test-only changes
action: write a failing test BEFORE implementing — confirm it fails for the right reason
exception: purely mechanical changes (renames, import path updates) that do not alter behavior
verification: `pnpm turbo lint && pnpm turbo typecheck && pnpm turbo test:unit`
banned: production code without a corresponding failing test

GATE-2 Zero suppression:
trigger: editing any file
banned: `eslint-disable` | `@ts-ignore` | `@ts-expect-error` | `any` type | `console.log` in production
action: refactor to comply — use `unknown` + type guards or generics instead of `any`, use pino logger in api, remove console from web/mobile

GATE-3 Zero warnings:
trigger: lint or typecheck run
action: `--max-warnings=0` enforced — warnings ARE errors
verification: exit code 0 from `pnpm turbo lint`

GATE-4 Format before commit:
trigger: about to commit code
action: run `pnpm exec prettier --write` on changed files, then stage
verification: `pnpm exec prettier --check` passes on staged files
note: pre-commit hook runs lint-staged (ESLint + Prettier) — they do not conflict when configured correctly

</gates>

<rules>

ARCHITECTURE:
pattern: Functional Core / Imperative Shell
core:
  location: packages/shared/src/
  constraints:
  - pure functions only — no I/O, no side effects, no throwing
  - Zod: `.safeParse()` only — never `.parse()` (it throws)
  - return `Result<T, E>` via neverthrow for all fallible operations
  - date-fns locale reads are acceptable (not considered I/O)
  - NO imports from apps/*, Hono, pino, React, or React Native
  enforced-by: ESLint no-restricted-imports
shell:
  location: apps/{api|web|mobile}/src/
  constraints:
  - orchestrates I/O: HTTP, database, logging, fetch, AsyncStorage
  - Zod: `.parse()` allowed — wrap in try/catch or `fromThrowable` at boundaries
  - calls core functions for domain logic — never contains business rules
  - generates side effects (IDs, timestamps) and passes them to core
error-handling:
  core: always `Result<T, E>` — never throw
  shell-hono: `app.onError` middleware catches; routes unwrap Results with `match()`
  shell-web/mobile: `.parse()` allowed for API responses; wrap fetches in try/catch

FRAMEWORK PATTERNS:
hono (api):
  - routes in `src/<feature>/<feature>.routes.ts`, registered in `src/app.ts`
  - middleware for auth, CORS, error handling in `src/app.ts`
  - pino logger (`src/logger.ts`) — never `console.log`
  - config validated via Zod at startup (`src/config.ts`)
tanstack-start (web):
  - routes in `src/routes/`, components in `src/components/`
  - data loading via route loaders (`createFileRoute`)
  - no global state management — use route loader data
expo (mobile):
  - Expo Router file-based routing in `app/`
  - shared components in `src/components/`
  - no console in production — use error boundaries for crash reporting

DEPENDENCIES:
- prefer existing deps over new packages
- new packages require clear justification
- pin exact versions in apps, use ranges in packages/shared

ENVIRONMENT:
- env vars validated via Zod schema at app startup
- secrets never hardcoded — use `.env` files (gitignored)
- `.env.example` maintained with all required keys (no values)

TESTING:
trigger: production code changed (per GATE-1 scope)
action: corresponding test files MUST also be modified
exception: purely mechanical changes that do not alter behavior
structure: colocated — `src/feature/feature.test.ts` (unit), `src/feature/feature.integration.test.ts` (integration), `tests/e2e/` (E2E)
thresholds: Lines 85% | Branches 80% | Functions 85% | Statements 85%

COMMITS:
format: `type(scope): description`
types: feat, fix, docs, style, refactor, perf, test, build, ci, chore, revert
scopes: shared, api, web, mobile, eslint, typescript, testing, ci, deps, release, ruler
enforcement: commitlint + husky pre-commit (lint-staged runs ESLint + Prettier)

</rules>

## Development Workflow — TDD First

1. **Write a failing test** — describe the expected behavior
2. **Run the test** — confirm it fails for the right reason
3. **Implement** — minimum code to make the test pass
4. **Refactor** — clean up while keeping tests green
5. **Format** — `pnpm exec prettier --write` on changed files
6. **Verify** — `pnpm turbo lint && pnpm turbo typecheck && pnpm turbo test:unit`

## Tech Stack

- **TypeScript 6** strict mode, `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`
- **ESLint 10** flat config — typescript-eslint, unicorn, sonarjs, security, promise, regexp
- **Vitest 4** unit + integration, **Playwright** E2E
- **Hono** (api) — lightweight HTTP on Node.js
- **TanStack Start** (web) — full-stack React 19 + Vite
- **Expo SDK 55** (mobile) — React Native 0.83, New Architecture
- **Zod 4** validation, **neverthrow** error handling, **remeda** utilities
- **pnpm** workspaces + **Turborepo** orchestration

## Agents

AGENT: implementer
trigger: clear, well-specified implementation task
action: write minimum code to satisfy spec → run verification suite
verification: typecheck + lint + tests MANDATORY after every implementation
may: research APIs and run verification as sub-steps of implementation
banned: restructuring working code, bonus features, standalone research reports or code reviews

AGENT: researcher
trigger: documentation lookup, API research, or technical investigation
action: gather information → cite sources → flag conflicting sources with recency preference
boundary: read-only — NEVER write production code or fix bugs (explain root cause only)
max-sources: 5 per question

AGENT: reviewer
trigger: code review request or pre-merge check
action: report as `[SEVERITY] file_path:line_number — description`
priority: correctness > security > testing > performance > api-contracts
boundary: read-only — NEVER edit code
skip: linter-handled issues, minor naming, missing comments

AGENT: verifier
trigger: post-implementation verification or pre-commit check
action: run all checks in order (typecheck → lint → tests) regardless of earlier failures
boundary: NEVER fix code, NEVER propose changes — only report results
report: PASS/FAIL/TIMEOUT per check
verdict: ALL PASS (all green) | PARTIAL (mixed) | ISSUES FOUND (all failed)

## Skills

Bundled AI skills (38 total, distributed via `skills` CLI):

- **Design:** ui-ux-pro-max, interface-design, frontend-design, sleek-design-mobile-apps
- **AI/Prompt:** ai-md, promptify, grill-me
- **Dev Workflow:** agent-pr-creator, pr-comments-address, rewrite-commit-history
- **TypeScript:** typescript-advanced-types, vitest, playwright-best-practices, vite, turborepo
- **Node.js:** hono, nodejs-best-practices, nodejs-backend-patterns
- **React/Web:** vercel-react-best-practices, vercel-composition-patterns, seo, accessibility
- **Expo & React Native:** building-native-ui, native-data-fetching, expo-api-routes, expo-dev-client, expo-module, expo-tailwind-setup, expo-cicd-workflows, expo-deployment, upgrading-expo, use-dom
- **React Native (Callstack):** react-native-best-practices, github, github-actions, upgrading-react-native, react-native-brownfield-migration, validate-skills
