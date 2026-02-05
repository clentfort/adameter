# AGENTS.md - AdaMeter Agent Guide

This guide is for coding agents working in this repository. Use it as the
default source of truth for commands and conventions.

## External Agent Rule Files

- `.cursor/rules/`: not present
- `.cursorrules`: not present
- `.github/copilot-instructions.md`: not present
- Result: this file is the primary in-repo agent instruction set.

## Tech Stack

- Next.js 16 (App Router), React 19, TypeScript (`strict: true`)
- Tailwind CSS 4 + shadcn/ui primitives in `src/components/ui`
- State: Valtio + Yjs + PartyKit (`party/index.ts`)
- Testing: Vitest + Testing Library + jsdom
- i18n: `fbtee` with translation files in `translations/*.json`
- Package manager: `pnpm` (CI uses pnpm 10 and Node 24)

## Commands

Run from repo root: `/Users/lentfortc/Code/adameter`.

### Setup and Dev

- Install dependencies: `pnpm install`
- Full dev (Next + PartyKit): `pnpm dev`
- Next only: `pnpm dev:next`
- PartyKit only: `pnpm dev:partykit`
- `predev` runs `fbtee:collect` and `fbtee:translate` automatically
- `prebuild` runs the same i18n generation before `build`

### Build

- Production build: `pnpm build`
- Run production server: `pnpm start`

### Tests (Vitest)

- Watch mode: `pnpm test`
- Run once: `pnpm exec vitest run`
- Coverage: `pnpm exec vitest run --coverage`

Single-test execution (important):

- One file once: `pnpm test src/utils/date-to-date-input-value.test.ts --run`
- One test by name in one file:
  `pnpm test src/utils/date-to-date-input-value.test.ts -t "should format date" --run`
- Name filter across suite: `pnpm test -t "useSortedEvents" --run`
- Vitest config note: `vitest.config.mts` sets `test.root = './src'`; `src/...`
  paths are safest for single-file runs.

### Lint

- Defined script: `pnpm lint` (currently `next lint` in `package.json`)
- Current repo status:
  - `next lint` is unavailable in Next.js 16 CLI and fails
  - direct `eslint` invocation also fails here due config compatibility
  - if linting is requested, run and report the failure explicitly

### Format

- Format all: `pnpm exec prettier --write .`
- Format specific files:
  `pnpm exec prettier --write src/path/file.ts src/path/file.tsx`

### Typecheck

- `pnpm exec tsc --noEmit`

### Storybook

- Dev server: `pnpm storybook`
- Static build: `pnpm build-storybook`

### i18n

- Collect source strings: `pnpm run fbtee:collect`
- Compile translations: `pnpm run fbtee:translate`

## Code Style Guidelines

Derived from `.prettierrc`, `tsconfig.json`, `eslint.config.mjs`, and source
code.

### Imports

- Import sorting is automated by `@ianvs/prettier-plugin-sort-imports`
- Keep import groups in this order:
  1. type imports
  2. built-in modules
  3. third-party modules
  4. alias imports (`@/...`)
  5. relative imports
- Prefer `import type` for type-only imports
- Prefer alias imports (`@/*` -> `./src/*`) over deep `../../..` paths

### Formatting

- Tabs enabled (`useTabs: true`, width 2)
- Semicolons required
- Single quotes for TS/JS
- Trailing commas enabled
- Print width 80
- Run Prettier after each change set

### Types and Type Safety

- Keep TypeScript strict-clean
- Prefer explicit domain types from `src/types/*`
- Avoid `any`; use unions, generics, `unknown`, and narrowing
- Validate untrusted input at boundaries
- Keep exported API signatures precise

### Naming Conventions

- File names: prefer `kebab-case`
- Component identifiers: `PascalCase`
- Hooks: `useX` naming
- Variables/functions: `camelCase`
- Constants: `UPPER_SNAKE_CASE` only for true constants

### React and Next.js Conventions

- Follow App Router structure and colocate feature code near its route
- Use `'use client'` only where client behavior is required
- Prefer composition over large monolith components
- Do not move/rewrite shadcn primitives in `src/components/ui` unless asked

### Error Handling and Control Flow

- Prefer guard clauses and early returns over nested conditionals
- Validate form/input data before persisting state
- Do not silently swallow errors; handle intentionally or rethrow with context
- For async UI failures, surface clear user feedback

### i18n Conventions

- Wrap user-visible strings with `<fbt>` or `fbt()`
- Always provide meaningful translation descriptions (`desc`)
- Do not add new hardcoded user-facing strings without localization

### Testing Conventions

- Co-locate tests as `*.test.ts`/`*.test.tsx` near source files
- Prefer behavior-focused tests over implementation-detail tests
- Mock only hard external boundaries
- Keep tests deterministic (timezone is set to UTC in Vitest config)

### Storybook Conventions

- Add or update `*.stories.tsx` for reusable component changes
- `@storybook/test` is not installed; avoid `play` functions that require it

## Quick Pre-PR Checklist

- Prettier on touched files
- Targeted tests for changed behavior
- `pnpm exec tsc --noEmit` for TS-impacting changes
- `pnpm build` for routing/config/build-impacting changes
- Document lint-command limitations if encountered
