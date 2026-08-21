## Tech Stack

- Next.js 16 (App Router), React 19, TypeScript (`strict: true`)
- Tailwind CSS 4 + shadcn/ui primitives in `src/components/ui`
- State: TinyBase + PartyKit (`party/tinybase.ts`) with IndexedDB persistence
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

## Quick Pre-PR Checklist

- Prettier on touched files
- Targeted tests for changed behavior
- `pnpm exec tsc --noEmit` for TS-impacting changes
- `pnpm build` for routing/config/build-impacting changes

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may
all differ from your training data. Read the relevant guide in
`node_modules/next/dist/docs/` (resolved from this file's directory; in
monorepos the `next` package may not be visible from the repo root) before
writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at
`node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a
diff only re-creates the uncommitted change; committing it with your work keeps
the tree clean.

<!-- END:nextjs-agent-rules -->
