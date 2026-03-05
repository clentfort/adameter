# Testing Structure Improvement Plan

## Goals

- Reduce repeated setup and shared flow duplication in Playwright tests.
- Improve test resilience by preferring stable selectors and event-based waits.
- Reduce fixture boilerplate in unit/component tests with shared data factories.
- Standardize test infrastructure so future tests are shorter and easier to
  review.

## Detailed TODO

### Phase 1: Foundation (quick wins)

- [x] Add a shared Playwright fixture that automatically skips profile setup.
- [x] Add reusable Playwright helper modules for room and feeding workflows.
- [x] Add a global RTL cleanup hook in Vitest setup.
- [x] Refactor Playwright specs to remove repeated skip-profile setup blocks.
- [x] Replace fixed sleeps (`waitForTimeout`) with deterministic assertions.

### Phase 2: Structural deduplication

- [x] Add shared test data factories for feeding sessions and diaper changes.
- [x] Refactor statistics component tests to consume shared data factories.
- [x] Replace brittle style/class selectors in e2e tests with explicit test ids.

### Phase 3: Hardening

- [ ] Split oversized test files into focused suites by behavior.
- [ ] Add additional helper assertions for card value extraction in stats tests.
- [ ] Introduce e2e room-sync page object for multi-context synchronization
      flows.

## Executed Scope In This Iteration

- Consolidated Playwright setup via `tests/fixtures/test.ts` and removed
  repeated local-storage bootstraps.
- Added shared e2e helpers for room and feeding workflows in `tests/helpers`.
- Replaced brittle profile color and room-name selectors with explicit
  `data-testid` hooks.
- Introduced shared fixture factories for feeding and diaper domain objects.
- Refactored the statistics component test suite to consume shared factories and
  reduced local test boilerplate.
