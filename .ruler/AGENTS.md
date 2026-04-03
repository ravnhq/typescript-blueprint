# TypeScript Blueprint — AI Agent Instructions

# priority: gates > rules > workflow > agents > skills

## Overview

Monorepo TypeScript blueprint for AI-assisted development at Ravn. Uses pnpm workspaces + Turborepo.
Architecture: Functional Core (packages/shared) / Imperative Shell (apps/\*).

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
trigger: any production code change
action: write a failing test BEFORE implementing — confirm it fails for the right reason
verification: `pnpm turbo lint && pnpm turbo typecheck && pnpm turbo test:unit`
banned: production code without a corresponding failing test

GATE-2 Zero suppression:
trigger: editing any file
banned: - `eslint-disable` comments — refactor code to comply, never suppress - `@ts-ignore` or `@ts-expect-error` — fix the type error properly - `any` type — use `unknown` with type guards or proper generics - `console.log` in production — use `pino` logger in api; remove from web/mobile before commit
action: if tempted to suppress, refactor instead

GATE-3 Zero warnings:
trigger: lint or typecheck run
action: `--max-warnings=0` enforced everywhere — warnings ARE errors
verification: exit code 0 from `pnpm turbo lint`

GATE-4 Format before commit:
trigger: about to commit code
action: run `pnpm exec prettier --write` on all changed files before staging
verification: `pnpm exec prettier --check` passes on staged files

</gates>

<rules>

ARCHITECTURE:
trigger: designing modules, adding business logic, or creating new files
pattern: Functional Core / Imperative Shell
core:
location: packages/shared/src/
constraints: - pure functions only — no I/O, no side effects - return Result<T, E> via neverthrow for all fallible operations - Zod schemas for validation - NO imports from apps/\*, Hono, pino, React, or React Native
enforced-by: ESLint no-restricted-imports in tooling/eslint
shell:
location: apps/{api|web|mobile}/src/
constraints: - orchestrates I/O: HTTP, database, logging, fetch, AsyncStorage - generates side effects (IDs, timestamps) and passes them to core - calls core functions for domain logic — never contains business rules
boundary-test: core modules must have zero I/O-library imports

TESTING:
trigger: production code changed
action: corresponding test files MUST also be modified
structure: tests colocated with source code - `src/feature/feature.test.ts` — unit tests - `src/feature/feature.integration.test.ts` — integration tests - `tests/e2e/feature.e2e.test.ts` — E2E tests - `tests/fixtures/` — shared test fixtures - `tests/helpers/` — shared test helpers
thresholds: Lines 85% | Branches 80% | Functions 85% | Statements 85%

COMMITS:
trigger: creating a git commit
format: `type(scope): description`
types: feat, fix, docs, style, refactor, perf, test, build, ci, chore, revert
scopes: shared, api, web, mobile, eslint, typescript, testing, ci, deps, release, ruler
enforcement: commitlint + husky on every commit
pre-commit: lint-staged runs ESLint + Prettier on staged files

</rules>

## Development Workflow — TDD First

1. **Write a failing test** — describe the expected behavior
2. **Run the test** — confirm it fails for the right reason
3. **Implement** — minimum code to make the test pass
4. **Refactor** — clean up while keeping tests green
5. **Format** — run `pnpm exec prettier --write` on changed files
6. **Verify** — run `pnpm turbo lint && pnpm turbo typecheck && pnpm turbo test:unit`

## Tech Stack

- **TypeScript 6** with strict mode, `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`
- **ESLint 10** flat config with typescript-eslint, unicorn, sonarjs, security, promise, regexp plugins
- **Vitest 4** for unit + integration tests, Playwright for E2E
- **Hono** (api) — lightweight HTTP framework on Node.js
- **TanStack Start** (web) — full-stack React framework with Vite
- **Expo SDK 55** (mobile) — React Native with New Architecture
- **pnpm** workspaces + **Turborepo** for monorepo orchestration
- **Zod 4** for validation, **neverthrow** for error handling, **remeda** for utilities

## Agents

Four specialized agents with clear role boundaries:

AGENT: implementer
trigger: clear, well-specified implementation task
action: write minimum code to satisfy spec → run verification suite
verification: typecheck + lint + tests MANDATORY after every implementation
banned: restructuring working code, bonus features, extra refactoring
boundary: NEVER claim researcher/reviewer/verifier roles

AGENT: researcher
trigger: need for documentation, API lookup, or technical research
action: gather information → cite sources → cross-reference when findings conflict
boundary: NEVER write production code, NEVER fix bugs (only explain root cause)
max-sources: 5 per question

AGENT: reviewer
trigger: code review request or pre-merge check
action: report findings as `[SEVERITY] file_path:line_number`
priority: correctness > security > performance > api-contracts
boundary: read-only — NEVER edit code
skip: linter-handled issues, minor naming, missing comments

AGENT: verifier
trigger: post-implementation verification or pre-commit check
action: run checks in order (typecheck → lint → tests) → report PASS/FAIL/TIMEOUT per check
boundary: NEVER fix code, NEVER propose changes — only report results
verdict: ALL PASS | ISSUES FOUND | PARTIAL

## Skills

Bundled AI skills (distributed via `skills` CLI to all agents):

- **Design:** ui-ux-pro-max (67 UI styles, 161 color palettes, design system generator), interface-design (craft-focused dashboards/apps, persistent design memory)
- **AI Assistant:** ai-md (CLAUDE.md optimization), promptify (structured prompt engineering), grill-me (design stress-testing)
- **Development Workflow:** agent-pr-creator (PR automation from diffs), pr-comments-address (triage and fix review comments), rewrite-commit-history (clean conventional commits)
- **Expo & React Native:** building-native-ui, native-data-fetching, expo-api-routes, expo-dev-client, expo-module, expo-tailwind-setup, expo-cicd-workflows, expo-deployment, upgrading-expo, use-dom
- **React Native (Callstack):** react-native-best-practices, github, github-actions, upgrading-react-native, react-native-brownfield-migration, validate-skills
