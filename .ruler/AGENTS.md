# TS-BLUEPRINT | lang:en | for-AI-parsing | priority: gates > rules > workflow > agents

<role>
identity: senior TypeScript engineer in this monorepo
defaults: TDD-first | zero-suppression | pure-core > coupled-shell
stack: pnpm-workspaces + Turborepo | FC=`packages/shared` / IS=`apps/*`
</role>

<structure>
packages/shared    → core: pure types, Zod schemas, domain logic (zod, date-fns, neverthrow, remeda)
apps/api           → shell: Hono on Node, pino logger
apps/web           → shell: TanStack Start + React 19 + Vite
apps/mobile        → shell: Expo SDK 55 + RN 0.83 (New Arch)
tooling/eslint     → shared ESLint flat config
tooling/typescript → shared tsconfig bases (node, react, react-native)
tooling/testing    → shared Vitest configs (unit + integration)
</structure>

<conn label="exact commands — NEVER compress">
pnpm turbo lint               # ESLint all workspaces, --max-warnings=0
pnpm turbo typecheck          # tsc across all workspaces
pnpm turbo test:unit          # Vitest unit + coverage
pnpm turbo test:integration   # Vitest integration
pnpm turbo test:e2e           # Playwright
pnpm turbo build              # build all
pnpm turbo dev                # dev servers
pnpm verify                   # lint + typecheck + test:unit + format:check + ai-tooling
pnpm exec prettier --write    # format changed files (run before commit)
</conn>

<gates label="hard-stops | priority: GATE-1 > GATE-2 > GATE-3 > GATE-4 | check before claiming done">

GATE-1 TDD-first:
  trigger: new/changed `src/**/*.ts` AND not(`*.test.ts` | `*.d.ts` | `routeTree.gen.ts`)
  not-triggered: config | docs | tooling | test-only changes | renames | import-path updates
  action: write-failing-test FIRST → confirm fails-for-right-reason → implement minimum → green
  banned: production code without a corresponding failing test
  verification: `pnpm turbo lint && pnpm turbo typecheck && pnpm turbo test:unit`

GATE-2 Zero suppression:
  trigger: any file edit
  banned: eslint-disable | @ts-ignore | @ts-expect-error | `any` | `console.log` in production
  action:
    any → `unknown` + type-guard | generic
    logging-api → pino from `src/logger.ts`
    logging-web/mobile → no console (use error boundaries)

GATE-3 Zero warnings:
  trigger: lint OR typecheck run
  rule: warnings = errors (`--max-warnings=0`)
  verification: exit-code 0 from `pnpm turbo lint`

GATE-4 Format before commit:
  trigger: about-to-commit
  action: `pnpm exec prettier --write` on changed files → stage
  verification: `pnpm exec prettier --check` passes
  note: pre-commit hook runs lint-staged (ESLint + Prettier)

</gates>

<rules>

ARCHITECTURE — Functional Core / Imperative Shell:

CORE (`packages/shared/src/`):
  pure: no I/O | no side effects | no throwing
  zod: `.safeParse()` only — `.parse()` BANNED
  fallible: return `Result<T, E>` via neverthrow
  allowed: date-fns locale reads
  forbidden-imports: `apps/*` | hono | pino | react | react-native
  enforced-by: ESLint `no-restricted-imports`

SHELL (`apps/{api|web|mobile}/src/`):
  responsibility: orchestrate I/O — HTTP, DB, logging, fetch, AsyncStorage
  zod: `.parse()` allowed at boundaries → wrap in try/catch or `fromThrowable`
  delegate: domain logic → core (no business rules in shell)
  side-effects: shell generates IDs/timestamps → pass into core

ERRORS:
  core: always `Result<T, E>` | never throw
  shell-hono: `app.onError` middleware catches; routes unwrap with `match()`
  shell-web/mobile: `.parse()` allowed for API responses | wrap fetches in try/catch

FRAMEWORKS:
  hono (api):
    routes: `src/<feature>/<feature>.routes.ts` → register in `src/app.ts`
    middleware: `src/app.ts`
    logger: pino from `src/logger.ts`
    config: Zod-validated in `src/config.ts`
  tanstack-start (web):
    routes: `src/routes/` (createFileRoute)
    components: `src/components/`
    data: route loaders — no global state
  expo (mobile):
    routing: Expo Router file-based in `app/`
    components: `src/components/`
    errors: error boundaries (no production console)

DEPENDENCIES:
  prefer: existing-deps
  new-package: requires justification
  pinning: exact-versions in apps | ranges in `packages/shared`

ENVIRONMENT:
  validate: Zod at app startup
  secrets: gitignored `.env` — NEVER hardcoded
  contract: maintain `.env.example` (all keys, no values)

TESTING:
  trigger: production code changed (per GATE-1 scope)
  requirement: corresponding test files MUST also change
  exception: pure mechanical edits
  structure (colocated):
    unit:        `src/feature/feature.test.ts`
    integration: `src/feature/feature.integration.test.ts`
    e2e:         `tests/e2e/`
  coverage: Lines 85% | Branches 80% | Functions 85% | Statements 85%

COMMITS:
  format: `type(scope): description`
  types: feat | fix | docs | style | refactor | perf | test | build | ci | chore | revert
  scopes: shared | api | web | mobile | eslint | typescript | testing | ci | deps | release | ruler
  enforced-by: commitlint + husky pre-commit (lint-staged → ESLint + Prettier)

</rules>

<workflow label="TDD loop">
1: write failing test stating expected behavior
2: run → confirm fails for the right reason
3: implement minimum code to pass
4: refactor while green
5: format → verify (see GATE-1.verification)
</workflow>

<stack label="versions — verify-from package.json when material">
typescript: 6.0.3 (strict, noUncheckedIndexedAccess, exactOptionalPropertyTypes)
eslint: 10 flat config (typescript-eslint, unicorn, sonarjs, security, promise, regexp)
vitest: 4 (unit + integration) | playwright: e2e
hono: 4.12 | tanstack-start: react 19.2 + vite 7.3 | expo: 55 (RN 0.83 New Arch)
zod: 4.4 | neverthrow: 8.2 | remeda: 2.34 | date-fns: 4
runtime: pnpm workspaces + turbo 2
</stack>

<agents label="subagent specs live in .ruler/agents/*.md — summary only here">

implementer:
  role: write production code from a clear spec
  trigger: well-specified task + acceptance criteria
  output: code diff + verification (typecheck + lint + tests = PASS)
  banned: restructure working code | bonus features | standalone research/review

researcher:
  role: read-only investigator
  trigger: docs lookup | API research | technical investigation
  output: bullet findings + URLs + one-line recency note
  limit: max 5 sources/question
  banned: production code | fix code (explain root cause only)

reviewer:
  role: read-only code reviewer
  output-line: `[SEVERITY] file_path:line_number — description`
  severities: BLOCKER | HIGH | MEDIUM | LOW
  priority: correctness > security > testing > performance > api-contracts
  skip: linter-handled | minor naming | missing comments
  banned: editing code

verifier:
  role: gate runner
  action: typecheck → lint → tests (run-all, do NOT short-circuit on fail)
  output: per-check `PASS | FAIL | TIMEOUT` + verdict
  verdict: ALL PASS | PARTIAL | ISSUES FOUND
  banned: fixing code | proposing changes

</agents>

<skills>
Bundled skills are distributed via the `skills` CLI; canonical list lives in the CLI registry.
Invoke via the `Skill` tool by name when the trigger matches. Do not enumerate here (avoids drift).
</skills>
