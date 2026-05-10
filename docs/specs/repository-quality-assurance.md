# Spec: Repository Quality Assurance

Feature ID: `repository-quality-assurance`
Status: Draft
Risk tier: Tier 2 (touches CI, lint, and test infrastructure across all
workspaces; no production runtime changes).
Related plan: `docs/current-plan.md`

## 1. Problem statement

The `typescript-blueprint` monorepo has the building blocks of a quality
pipeline (Turbo tasks, Husky hooks, commitlint, ESLint flat config, Vitest,
an AI tooling check) but lacks:

- An explicit Functional Core / Imperative Shell (FC/IS) classification per
  package, leading to ad-hoc placement of side-effecting code.
- A registered boundary parser map, so external inputs (HTTP requests,
  filesystem reads, env vars, MCP responses) are not uniformly parsed at the
  edge.
- Coverage thresholds and contract tests for boundaries.
- Consolidated CI, supply-chain, and pre-push gates.

Without these, regressions in correctness, type safety, and architectural
discipline are caught only at review time — or not at all.

## 2. Goals

- G1: Every external input is parsed exactly once at a registered boundary
  before reaching functional-core code.
- G2: Every workspace package declares its FC/IS layer split.
- G3: Every change is validated against a deterministic, cached gate set
  locally and in CI.
- G4: All gates are scriptable from a single root entrypoint
  (`pnpm verify`).

## 3. Non-goals

- Adopting a different test runner, package manager, or build tool.
- Adding production observability, tracing, or feature-flag systems.
- Changing the public API of `packages/shared` or any app.

## 4. Current state (audit)

| Concern | Asset | Path | Status |
|---|---|---|---|
| Package manager | pnpm 10 | `package.json` `engines`, `packageManager` | OK |
| Workspaces | apps/*, packages/*, tooling/* | `pnpm-workspace.yaml` | OK |
| Task graph | Turbo | `turbo.json` | OK; `format:check` missing |
| Lint | ESLint flat | `eslint.config.mjs`, `tooling/eslint/*` | OK; rule audit pending |
| Typecheck | tsc per package | `tooling/typescript/tsconfig.base.json` | Audit `strict*` flags |
| Unit tests | Vitest | `tooling/testing/vitest.config.base.ts` | No coverage thresholds |
| Integration tests | Vitest | `tooling/testing/vitest.integration.config.base.ts` | No coverage thresholds |
| E2E | Turbo `test:e2e` | `turbo.json` | App-level, no global gate |
| Commit lint | commitlint conventional | `commitlint.config.ts`, `.husky/commit-msg` | OK |
| Pre-commit | lint-staged | `.husky/pre-commit`, `package.json` | OK |
| Pre-push | (none) | — | Gap |
| AI tooling check | node script | `scripts/check-ai-tooling.mjs` | OK |
| CI | GitHub Actions | `.github/workflows/ci.yml` | Needs consolidation |
| Supply chain | (none) | — | Gap |
| FC/IS docs | (none) | — | Gap (this spec) |
| Boundary parser map | (none) | — | Gap (section 7) |

## 5. Requirements

### Functional
- F1: `pnpm verify` runs lint, typecheck, unit tests, ai-tooling check, and
  format:check, in topological order via Turbo, and exits non-zero on any
  failure.
- F2: Vitest configs export coverage thresholds (lines >= 70, branches >= 60,
  functions >= 70, statements >= 70) by default, overridable per package.
- F3: A boundary contract test suite (`test:contract`) executes for every
  package that registers a boundary parser.
- F4: CI runs `pnpm verify` plus `test:integration`, `test:e2e` (conditional),
  `pnpm audit --prod`, and dependency review.
- F5: Husky `pre-push` runs `pnpm verify` filtered to the changed graph
  (`--filter=...[origin/main]`).

### Non-functional
- N1: Local `pnpm verify` cold completes in < 90s on a 10-core machine
  (warm cache < 15s) for the current workspace size.
- N2: CI cold run completes in < 8 minutes.
- N3: All gates are deterministic — no network access in unit/contract tests.

## 6. FC/IS classification

Functional Core (FC) = pure, deterministic, no I/O, no globals, no clocks,
no randomness without injection. All values flowing in are already typed
domain values produced by a boundary parser.

Imperative Shell (IS) = orchestrates I/O (HTTP, FS, DB, network, process,
clock, RNG, env). Does not contain branching business rules; delegates to
FC. Calls boundary parsers on every external input before invoking FC.

Boundary (B) = the thin layer where untrusted/unstructured input crosses
into the system. Contains only the parser and the typed error channel.

### 6.1 Per-package classification

| Workspace | Layer mix | FC location | IS location | Boundary location |
|---|---|---|---|---|
| `apps/api` | IS-heavy | `src/domain/**`, `src/usecases/**` (pure) | `src/server/**` (HTTP handlers, DB clients) | `src/boundary/**` (request schemas, env loader, DB row parsers) |
| `apps/web` | IS-heavy | `src/lib/domain/**`, `src/lib/format/**` | `src/app/**` route handlers, `src/lib/api/**` fetchers | `src/lib/boundary/**` (response parsers, env loader, form parsers) |
| `apps/mobile` | IS-heavy | `src/domain/**`, `src/format/**` | `src/screens/**`, `src/services/**` | `src/boundary/**` (API response parsers, storage parsers) |
| `packages/shared` | FC-heavy | `src/**` excluding `src/boundary/**` | (none — library; consumers own IS) | `src/boundary/**` (shared schemas re-exported) |
| `tooling/eslint` | IS (build-time tool) | n/a | the config itself | n/a |
| `tooling/testing` | IS (build-time tool) | helpers in `src/pure/**` | `vitest.config.*.ts` | n/a |
| `tooling/typescript` | n/a (config-only) | n/a | n/a | n/a |

### 6.2 Rules
- R1: Files under `**/boundary/**` MUST NOT import from `**/server/**`,
  `**/screens/**`, or any IS module.
- R2: Files under FC paths MUST NOT import `node:fs`, `node:net`,
  `node:child_process`, `node:os` (except `os.EOL`), `node:crypto` (except
  via injected port), `process.env`, `Date.now`, `Math.random`,
  `fetch`, or any DB client.
- R3: IS modules MUST call a registered boundary parser before passing data
  to FC. Direct `as T` casts at the boundary are forbidden.
- R4: Every boundary parser MUST return a discriminated union
  `{ ok: true; value: T } | { ok: false; error: ParseError }` (or an
  equivalent `Result`/`Effect` type used consistently within the package).

### 6.3 Enforcement
- ESLint rule: `eslint-plugin-boundaries` (or equivalent) configured in
  `tooling/eslint/eslint.config.mjs` with element types `fc`, `is`,
  `boundary`, `tooling`.
- TypeScript: `strict`, `noUncheckedIndexedAccess`,
  `exactOptionalPropertyTypes`, `noImplicitOverride`,
  `useUnknownInCatchVariables` (default in TS >= 4.4).
- Contract tests: see section 8.

## 7. Boundary parser map (strict)

Every external input must appear here. Adding an input without registering
a parser is a review-blocking issue.

### 7.1 `apps/api`

| Input source | Carrier type | Parser symbol | Parser location | Output type | Failure mode |
|---|---|---|---|---|---|
| HTTP request body (POST /v1/...) | `unknown` (JSON) | `parseRequest<RouteName>` | `src/boundary/http/<route>.ts` | `Validated<RouteName>Body` | `{ ok:false, error: HttpParseError }` -> 400 |
| HTTP query string | `Record<string,string\|string[]>` | `parseQuery<RouteName>` | `src/boundary/http/<route>.ts` | `Validated<RouteName>Query` | `{ ok:false }` -> 400 |
| HTTP headers (auth) | `Headers` | `parseAuthHeader` | `src/boundary/http/auth.ts` | `AuthContext` | `{ ok:false }` -> 401 |
| Environment variables | `NodeJS.ProcessEnv` | `parseEnv` | `src/boundary/env.ts` | `AppConfig` | throw at startup |
| Database row | `unknown` (driver row) | `parse<Entity>Row` | `src/boundary/db/<entity>.ts` | `<Entity>` | `{ ok:false }` -> 500 |
| External API response | `unknown` (JSON) | `parse<Service>Response` | `src/boundary/clients/<service>.ts` | `<Service>Result` | typed error |
| Filesystem config | `string` (file contents) | `parseFileConfig` | `src/boundary/fs/config.ts` | `FileConfig` | throw at startup |

### 7.2 `apps/web`

| Input source | Carrier type | Parser symbol | Parser location | Output type | Failure mode |
|---|---|---|---|---|---|
| API fetch response | `unknown` | `parse<Endpoint>Response` | `src/lib/boundary/api/<endpoint>.ts` | `<Endpoint>Data` | typed error -> UI error state |
| Form submission | `FormData` | `parse<Form>Submission` | `src/lib/boundary/forms/<form>.ts` | `<Form>Input` | field-level errors |
| URL search params | `URLSearchParams` | `parse<Page>SearchParams` | `src/lib/boundary/routing/<page>.ts` | `<Page>Params` | redirect to default |
| `window.localStorage` value | `string \| null` | `parseStoredValue` | `src/lib/boundary/storage.ts` | `T \| null` | drop and re-init |
| `process.env` (build/server) | `NodeJS.ProcessEnv` | `parsePublicEnv` | `src/lib/boundary/env.ts` | `WebConfig` | throw at build |

### 7.3 `apps/mobile`

| Input source | Carrier type | Parser symbol | Parser location | Output type | Failure mode |
|---|---|---|---|---|---|
| API response | `unknown` | `parse<Endpoint>Response` | `src/boundary/api/<endpoint>.ts` | `<Endpoint>Data` | typed error |
| Async storage value | `string \| null` | `parseStoredValue` | `src/boundary/storage.ts` | `T \| null` | drop and re-init |
| Deep link URL | `string` | `parseDeepLink` | `src/boundary/links.ts` | `Route` | navigate to home |
| Push notification payload | `unknown` | `parsePushPayload` | `src/boundary/push.ts` | `PushEvent` | drop, log |

### 7.4 `packages/shared`

| Input source | Carrier type | Parser symbol | Parser location | Output type | Failure mode |
|---|---|---|---|---|---|
| Shared DTO (consumed by apps) | `unknown` | `parse<DtoName>` | `src/boundary/dto/<name>.ts` | `<DtoName>` | `Result<DtoName, ParseError>` |

### 7.5 Tooling boundaries

| Input source | Carrier type | Parser symbol | Parser location | Output type | Failure mode |
|---|---|---|---|---|---|
| `.ruler/ruler.toml` | `string` | `parseRulerConfig` | `scripts/check-ai-tooling.mjs` (existing checks) | structural assertions | throw |
| `.claude/settings.json` | `string` | `parseClaudeSettings` | `scripts/check-ai-tooling.mjs` | structural assertions | throw |
| `skills-lock.json` | `string` | `parseSkillsLock` | `scripts/check-ai-tooling.mjs` | structural assertions | throw |

### 7.6 Parser invariants (apply to every entry above)
- I1: Parser is total — no `throw` for *expected* malformed input; uses
  `Result` / discriminated union. Throws only for invariants that should
  abort the process (e.g. missing required env at startup).
- I2: Parser depends on no I/O.
- I3: Parser output type is a *domain* type, not the raw carrier type.
- I4: Parser is exercised by at least one positive and one negative
  contract test (see section 8).
- I5: Library: prefer `zod` (or already-in-tree validator) for schema
  authoring; the parser symbol is the wrapper, not the raw schema.

## 8. Test strategy

### 8.1 Unit tests (FC)
- Location: co-located `*.test.ts` next to FC modules.
- Constraints: no I/O, no fakes for I/O (because FC has none), property
  tests encouraged via `fast-check`.

### 8.2 Contract tests (Boundary)
- Location: `**/boundary/**/__contracts__/*.test.ts`.
- Each parser has:
  - C1: positive — accepts a representative valid carrier, returns
    `{ ok: true, value }` matching domain type.
  - C2: negative — rejects malformed carrier with `{ ok: false, error }`,
    error has stable shape.
  - C3: idempotence — `parse(parse(x).value-as-carrier).value` deep-equals
    `parse(x).value` (where round-trippable).
  - C4: no-throw — parser does not throw on arbitrary `unknown` input
    (fuzzed via `fast-check`), except where I1 allows.

### 8.3 Integration tests (IS)
- Location: `tooling/testing/vitest.integration.config.base.ts`-driven.
- Use real adapters where cheap (in-memory DB, MSW for HTTP), exercise
  IS -> Boundary -> FC paths end-to-end within a process.

### 8.4 E2E
- Existing per-app `test:e2e` task; gated in CI when an app changes.

### 8.5 Coverage
- v8 provider, thresholds in `vitest.config.base.ts`:
  `lines: 70, branches: 60, functions: 70, statements: 70`.
- Boundary directories: 100% lines/branches required (small surface,
  high leverage).

## 9. CI design

`.github/workflows/ci.yml` jobs (single workflow, parallel where safe):

1. `setup` — checkout, corepack, pnpm install (cached on lockfile hash).
2. `verify` — `pnpm verify` (lint, typecheck, unit, format:check,
   ai-tooling).
3. `integration` — `pnpm test:integration`.
4. `e2e` — conditional on changed paths in `apps/*`.
5. `supply-chain` — `pnpm audit --prod` (advisory),
   `actions/dependency-review-action` (PRs to `main`),
   `gitleaks-action` (advisory).
6. `summary` — uploads Turbo run summary artifact.

Concurrency: cancel in-progress runs on the same ref.

## 10. Local developer flow

- `pnpm install` — already triggers `husky` + `ruler apply` via `prepare`.
- `pnpm dev` — Turbo persistent dev tasks.
- `pnpm verify` — new aggregator: `turbo run lint typecheck test:unit
  format:check && pnpm test:ai-tooling`.
- Husky:
  - `commit-msg` — commitlint (existing).
  - `pre-commit` — lint-staged (existing).
  - `pre-push` (new) — `turbo run lint typecheck test:unit
    --filter=...[origin/main]`.

## 11. Migration / rollout

1. Land FC/IS docs and boundary parser map (this spec) — no code change.
2. Add coverage thresholds at observed baseline; ratchet weekly.
3. Add `format:check` Turbo task and root `verify` script.
4. Land `eslint-plugin-boundaries` configuration as `warn` for two weeks,
   then promote to `error`.
5. Land `pre-push` Husky hook with `--filter=...[origin/main]`.
6. Consolidate CI; add advisory supply-chain steps.
7. Add boundary contract tests per package, starting with `apps/api`
   (highest-risk surface).

## 12. Rollback plan

Each workstream is an independent PR. Reverting any single PR restores the
previous gate behavior. Coverage thresholds are revertible by editing the
shared Vitest config; ESLint boundary rules are revertible by removing the
plugin block. No data migrations or runtime changes are involved.

## 13. Open questions

- Q1: Do we want Turbo Remote Cache (vendor) or self-hosted (`turbo-cache`)?
  Decision: defer; local + Actions cache suffices for v1.
- Q2: Adopt `zod` repo-wide, or allow `valibot`/`@sinclair/typebox` per
  package? Decision: standardize on one in a follow-up; spec is library-
  agnostic.
- Q3: Should the boundary ESLint rule be a custom rule or a third-party
  plugin? Decision: start with `eslint-plugin-boundaries`; revisit if
  expressivity is insufficient.

## 14. Acceptance checklist

- [ ] `docs/current-plan.md` references this spec.
- [ ] FC/IS table in section 6.1 covers every workspace.
- [ ] Boundary parser map in section 7 covers every external input the
      codebase actually consumes (verified by grep audit during W1).
- [ ] `pnpm verify` script exists and is green on `main`.
- [ ] CI workflow has `verify`, `integration`, supply-chain jobs.
- [ ] Each app has at least one boundary contract test landed.
- [ ] ESLint boundary rule is at least `warn` on `main`.
