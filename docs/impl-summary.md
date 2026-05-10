# Implementation Summary: Repository Quality Assurance

Date: 2026-05-08
Spec: `docs/specs/repository-quality-assurance.md`
Plan: `docs/current-plan.md`

## What was implemented

This summary covers the changes made during the `implementer` agent run.
Scope is limited to FC/IS enforcement and parse-at-boundary infrastructure
(plan workstreams W2 partial, W3, W6 partial, W7 partial).

---

## 1. FC/IS boundary enforcement (W6)

### New boundary parsers — `packages/shared/src/boundary/dto/note.ts`

Two typed boundary parsers implemented per spec section 7.4 and invariants I1–I5:

| Parser | Input type | Output type | Failure mode |
|---|---|---|---|
| `parseNote` | `unknown` | `ParseResult<Note>` | `{ ok: false, error: ParseError[] }` |
| `parseCreateNoteInput` | `unknown` | `ParseResult<CreateNoteInput>` | `{ ok: false, error: ParseError[] }` |

Return type is a discriminated union `{ ok: true; value: T } | { ok: false; error: ParseError[] }` — no `throw` on expected malformed input (I1). No I/O dependencies (I2). Output is the domain type, not the raw carrier (I3).

### Exported from package root

`packages/shared/src/boundary/index.ts` re-exports both parsers.
`packages/shared/src/index.ts` now includes `export * from './boundary/index.js'`.

### ESLint FC/IS boundary rule

Already present in `tooling/eslint/eslint.config.mjs`:
`no-restricted-imports` on `packages/shared/src/**` forbids importing from IS packages (api, web, mobile, hono, pino, react, react-native). No changes were needed here; the rule is active and clean.

### TypeScript strict flags

All required flags already present in `tooling/typescript/tsconfig.base.json`:
`strict`, `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`,
`noImplicitOverride`. No changes needed.

---

## 2. Boundary contract tests (W3 / W6)

### New file: `packages/shared/src/boundary/dto/__contracts__/note.test.ts`

Contract tests implement all four invariants from spec section 8.2:

| Test | Invariant |
|---|---|
| Accepts valid carrier, returns `{ ok: true, value }` | C1 (positive) |
| Rejects malformed carriers, returns `{ ok: false, error }` with stable shape | C2 (negative) |
| `parse(parse(x).value)` deep-equals `parse(x).value` | C3 (idempotence) |
| Does not throw on `null`, `undefined`, numbers, strings, arrays, empty objects | C4 (no-throw) |

All 53 tests pass. Coverage on `boundary/dto/note.ts` is 100% lines/branches/functions/statements.

---

## 3. `test:contract` task (W3)

### `packages/shared/package.json`

Added `"test:contract"` script that runs Vitest against `src/boundary` only:
```
vitest run --config vitest.config.ts --reporter=verbose src/boundary
```

### `turbo.json`

Added `"test:contract"` task with the same dependency shape as `test:unit`.

---

## 4. `format:check` Turbo task (W2)

### `turbo.json`

Added `"format:check"` task (no `dependsOn`, outputs: `[]`) so each package can
run `prettier --check` in parallel with lint.

### Package `format:check` scripts added

| Package | Command |
|---|---|
| `packages/shared` | `prettier --check "src/**/*.{ts,tsx}"` |
| `apps/web` | `prettier --check "src/**/*.{ts,tsx}"` |
| `apps/mobile` | `prettier --check "src/**/*.{ts,tsx}" "app/**/*.{ts,tsx}"` |

---

## 5. `pnpm verify` aggregator script (W7)

### `package.json` (root)

Two new scripts:
```json
"verify": "turbo run lint typecheck test:unit format:check && node scripts/check-ai-tooling.mjs",
"format:check": "prettier --check \"**/*.{ts,tsx,mts,cts,js,mjs,cjs}\" --ignore-path .gitignore"
```

Satisfies spec requirement F1: runs lint, typecheck, unit tests, format:check,
and ai-tooling check via Turbo in topological order.

---

## 6. CI consolidation (W4 partial)

### `.github/workflows/ci.yml`

Two new jobs added:

**`test-contract`** — runs `pnpm turbo test:contract`, depends on `lint`, feeds
into `build` (alongside `test-unit` and `test-integration`).

**`supply-chain`** — runs `pnpm audit --prod` (advisory, `|| true`), and
`actions/dependency-review-action@v4` on PRs targeting `main` (high severity
threshold). Satisfies spec W5 advisory requirements for v1.

---

## 7. `pre-push` Husky hook (W7)

Writing `.husky/pre-push` was blocked by the sandbox (persistent execution
boundary). The hook content is:

```sh
turbo run lint typecheck test:unit --filter=...[origin/main]
```

This needs to be created manually or by a user with the appropriate permission.

---

## FC/IS classification per package (spec section 6.1, documented)

| Workspace | Layer | FC location | IS location | Boundary location |
|---|---|---|---|---|
| `packages/shared` | FC-heavy library | `src/domain/**`, `src/validation/**`, `src/api/**`, `src/utils/**`, `src/types/**` | (none — consumers own IS) | `src/boundary/**` (this PR) |
| `apps/web` | IS-heavy | `src/lib/domain/**`, `src/lib/format/**` | `src/app/**`, `src/lib/api/**` | `src/lib/boundary/**` (future) |
| `apps/mobile` | IS-heavy | `src/domain/**`, `src/format/**` | `src/screens/**`, `src/services/**` | `src/boundary/**` (future) |
| `tooling/eslint` | IS (build-time) | n/a | the config itself | n/a |
| `tooling/testing` | IS (build-time) | n/a | `vitest.config.*.ts` | n/a |
| `tooling/typescript` | config-only | n/a | n/a | n/a |

---

## Verification results

```
Test Files  6 passed (6)
     Tests  53 passed (53)

Coverage: boundary/dto/note.ts — 100% stmts / 100% branch / 100% funcs / 100% lines
ESLint: 0 errors, 0 warnings
TypeScript: 0 errors
```

---

## Gaps remaining (out of scope for this run)

- `apps/web/src/lib/boundary/` — API response and form parsers not yet created.
- `apps/mobile/src/boundary/` — API response and storage parsers not yet created.
- `apps/api/src/boundary/` — HTTP request and DB row parsers not yet created.
- `eslint-plugin-boundaries` — full boundary element-type configuration not wired.
- `.husky/pre-push` — requires user to create manually (sandbox restriction).
- Turbo remote cache configuration (deferred per spec Q1).
- `gitleaks` advisory step in CI (deferred).
