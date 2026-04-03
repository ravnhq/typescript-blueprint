# TypeScript Blueprint

Monorepo TypeScript blueprint for API, web, mobile, and AI-assisted development.

It includes a Hono API, TanStack Start web app, Expo mobile app, and a shared functional core for types, schemas, and domain logic. The repo is set up for strict TypeScript, zero-warning linting, automated verification, and generated AI agent configs.

## What’s Included

- `packages/shared`: pure domain logic, Zod schemas, shared types, and utilities
- `apps/api`: Hono API with config validation, request IDs, security headers, rate limiting, and persistent note storage
- `apps/web`: TanStack Start web app
- `apps/mobile`: Expo Router mobile app
- `tooling/*`: shared ESLint, TypeScript, and Vitest configuration

## Quick Start

```sh
pnpm install
pnpm turbo dev
```

## Common Commands

- `pnpm turbo lint`
- `pnpm turbo typecheck`
- `pnpm turbo test:unit`
- `pnpm turbo test:integration`
- `pnpm turbo test:e2e`
- `pnpm turbo build`
- `pnpm test:ai-tooling`

## Environment

### API

- `PORT`: defaults to `3001`
- `API_ALLOWED_ORIGINS`: comma-separated CORS allowlist
- `API_AUTH_TOKEN`: required in production, optional locally
- `API_RATE_LIMIT_WINDOW_MS`: rate-limit window in ms
- `API_RATE_LIMIT_MAX_REQUESTS`: requests allowed per window
- `NOTES_DATA_FILE`: path for persisted note storage

### Web

- `VITE_API_URL`: API base URL, defaults to `http://localhost:3001`
- `VITE_API_AUTH_TOKEN`: bearer token for authenticated API access (optional)

### Mobile

- `EXPO_PUBLIC_API_URL`: API base URL, defaults to emulator or localhost-safe fallback
- `EXPO_PUBLIC_API_AUTH_TOKEN`: bearer token for authenticated API access (optional)

## AI Tooling

`.ruler/AGENTS.md` is the source of truth for the repo’s agent setup. Run `pnpm exec ruler apply` to generate native configs for Claude Code, Codex CLI, Cursor, Copilot, Gemini CLI, and OpenCode.

### Agents

- `implementer`: writes code TDD-first and runs verification after changes
- `researcher`: gathers and cites external information without editing production code
- `reviewer`: performs read-only code review and reports findings by severity
- `verifier`: runs typecheck, lint, and tests without fixing anything

### MCP Servers

- `Exa`: web search, code-context lookup, and page crawling
- `Context7`: current library documentation lookup

### Hooks and Validation

- File edits trigger ESLint checks immediately
- Claude Code stop hooks run final lint and typecheck passes
- Post-merge hooks rerun `ruler apply` when `.ruler/` changes
- `pnpm test:ai-tooling` validates generated agent files, hook wiring, and MCP configs

### Skills

The repo ships shared skills through the `skills` CLI, including design, prompt engineering, PR workflow, Expo, and React Native guidance.

Example installs:

```sh
bunx skills add expo/skills -y
bunx skills add callstackincubator/agent-skills -y
bunx skills add ravnhq/ai-toolkit -s promptify
```

`skills-lock.json` pins versions. Run `bunx skills check` to inspect updates.

## Notes for Production

- Set `API_AUTH_TOKEN` and explicit `API_ALLOWED_ORIGINS`
- Replace the file-backed note store with a database adapter for multi-instance deployments
- Keep the E2E suite paired with a reachable API if you want passing `/notes` browser flows
