# Current Plan: Improve Repository Quality Assurance

Status: Draft (planner phase)
Owner: Repository maintainers
Date: 2026-05-08
Spec: `docs/specs/repository-quality-assurance.md`

## 1. Objective

Raise the structural and runtime quality assurance (QA) guarantees of the
`typescript-blueprint` monorepo so that any change — human or agent-driven —
is automatically validated against a uniform set of correctness, style,
security, and architectural gates before merge.

The work is scoped to QA infrastructure only. It does not modify product
behavior in `apps/api`, `apps/web`, `apps/mobile`, or `packages/shared`.

## 2. Success Criteria (acceptance)

A change is "ready to ship" only when all of the following hold:

1. `pnpm lint`, `pnpm typecheck`, `pnpm test:unit`, `pnpm test:integration`,
   and (where present) `pnpm test:e2e` succeed via Turbo on CI and locally.
2. `pnpm test:ai-tooling` (already wired) passes and is enforced by CI.
3. Coverage thresholds are enforced per workspace via Vitest config (initial
   floor: 70% lines / 60% branches; raised over time).
4. Commit messages pass `commitlint` (already wired via Husky `commit-msg`).
5. `pre-commit` runs `lint-staged` against staged files only (already wired);
   no full-repo work is forced into pre-commit.
6. CI runs on every PR using a single matrix (`ci.yml`), with caching keyed on
   pnpm lockfile + Turbo remote cache (or local cache artifact).
7. Dependency, license, and basic SAST scans run on PRs and report findings as
   GitHub annotations (no merge block in v1; advisory in v1, blocking in v2).
8. A documented FC/IS classification exists for every workspace package, and
   every boundary parser is registered in the boundary parser map (see spec).

## 3. Workstreams

### W1 — Gate inventory and gap analysis (read-only)
Catalogue current QA assets and surface gaps. Output: spec section
"Current State" with file references.

### W2 — Static analysis hardening
- Pin `eslint.config.mjs` rules for `no-floating-promises`,
  `consistent-type-imports`, `no-explicit-any` (warn -> error in stages).
- Verify `tsconfig.base.json` has `strict`, `noUncheckedIndexedAccess`,
  `exactOptionalPropertyTypes`, `noImplicitOverride`.
- Add `prettier --check` as a Turbo `format:check` task (parallel to lint).

### W3 — Test infrastructure
- Standardize on Vitest via `tooling/testing/vitest.config.base.ts`.
- Add `coverage` block with v8 provider and shared thresholds.
- Add a `test:contract` task for boundary parser contract tests (see W6).

### W4 — CI consolidation
- Single `.github/workflows/ci.yml` job graph: install -> lint -> typecheck
  -> test:unit -> test:integration -> test:e2e (conditional) -> ai-tooling.
- Use `actions/setup-node@v4` with corepack + pnpm cache.
- Add Turbo summary upload as artifact.

### W5 — Supply chain & secrets
- `pnpm audit --prod` as advisory CI step.
- `gitleaks` action as advisory CI step.
- `actions/dependency-review-action` on PRs targeting `main`.

### W6 — FC/IS architecture enforcement
- Document FC/IS classification per package (spec section 6).
- Register every boundary parser (see spec section 7) and add contract tests
  asserting parse-at-boundary invariants (no `any` escape, total parsing,
  typed error channel).
- Add an ESLint boundary rule (custom, or `eslint-plugin-boundaries`) that
  forbids importing functional-core modules from imperative-shell-only paths
  without going through a registered parser.

### W7 — Developer ergonomics
- Document local QA flow in `README.md` (already partially present): one
  command `pnpm verify` aggregates lint + typecheck + unit + ai-tooling.
- Husky `pre-push` (new) runs the same `verify` script on the changed graph
  via `turbo run ... --filter=...[origin/main]`.

## 4. Sequencing

1. W1 (read-only audit) — no risk.
2. W2 + W3 in parallel — low risk, additive.
3. W4 — folds W2/W3 into CI.
4. W6 — depends on W3 (contract test harness).
5. W5 — independent, can land anytime after W4.
6. W7 — last, builds on stabilized scripts.

## 5. Risk register

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Coverage thresholds break existing PRs | Med | Med | Land thresholds at current baseline + 0; ratchet over time |
| ESLint boundary rule has false positives | Med | Low | Ship as `warn` for two weeks before promoting to `error` |
| CI runtime regression | Low | Med | Keep Turbo cache + pnpm store cache; matrix only where needed |
| Husky `pre-push` slows iteration | Med | Low | Scope to `--filter=...[origin/main]` and allow `--no-verify` |

## 6. Out of scope

- Rewriting application logic in `apps/*`.
- Introducing new runtime frameworks.
- Performance benchmarking infrastructure (separate plan).
- Release automation / changesets (separate plan).

## 7. Deliverables

- `docs/specs/repository-quality-assurance.md` (this plan's spec).
- Updated `tooling/eslint/eslint.config.mjs`, `tooling/testing/*`,
  `.github/workflows/ci.yml`, `.husky/pre-push`.
- New `scripts/verify.mjs` (aggregator) — optional, may be a `package.json`
  composite script.
- Boundary parser map kept under `docs/specs/repository-quality-assurance.md`
  section 7 and referenced from each package's `README.md`.
