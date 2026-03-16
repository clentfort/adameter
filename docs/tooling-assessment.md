# Vite+ and Fastest Frontend Tooling Assessment

This document evaluates the feasibility and benefits of implementing [Vite+](https://viteplus.dev/) and the "Fastest Frontend Tooling" concepts (as discussed by Christoph Pojer) in the AdaMeter project.

## Current State of Tooling

The AdaMeter project already uses several modern, high-performance tools:
- **Vitest**: Used for unit testing (`vitest.config.mts`).
- **TypeScript**: Strict type checking.
- **pnpm**: Fast, disk-efficient package management.
- **Tailwind CSS 4**: Modern CSS processing.

However, the main application is built on **Next.js 16**, which uses its own build system (Webpack/Turbopack) and has specific requirements for features like Server Components and the App Router.

## Assessment of Vite+ Implementation

### 1. Unified Toolchain (`vp` CLI)
- **Feasibility**: Low for the main Next.js app; High for library packages.
- **Analysis**: Vite+ is primarily built on the Vite ecosystem. Next.js is not a Vite-based framework. Replacing `next dev/build` with `vp dev/build` would require migrating away from Next.js, which is not recommended given the project's reliance on Next.js 16 features.
- **Recommendation**: Adopt Vite+ for the `packages/` directory. These are standalone libraries where `vp pack` and `vp test` can provide significant performance gains and standardisation.

### 2. Oxlint & Oxfmt (Fast Linting/Formatting)
- **Feasibility**: High.
- **Analysis**: Oxlint is significantly faster than ESLint and catches many common errors. It can be used alongside ESLint (which is still needed for specialized rules like `fbtee` and Next.js specific lints).
- **Recommendation**: Integrate Oxlint into the local development workflow and CI as a "fast-path" linting step.

### 3. fbtee Compatibility (Critical Blocker)
- **Feasibility**: Medium-Low for Oxc/Rolldown.
- **Analysis**: `fbtee` relies on a custom Babel transformation (`@nkzw/babel-preset-fbtee`). Most "fast" tools like Oxc do not yet support complex Babel-style plugins natively. Migrating fully to a Rust-based toolchain would require an Oxc-compatible port of the `fbtee` transform.
- **Recommendation**: Continue using Babel/Next.js for the main build to ensure `fbtee` transformations are applied correctly, while using faster tools for non-transformative tasks like linting.

## Integration Roadmap

### Phase 1: Fast Feedback (Immediate)
- [x] Integrate **Oxlint** for near-instant linting in the root of the project.
- [ ] Add a `lint:fast` script to `package.json`.
- [ ] Use Oxlint in a pre-commit hook to catch simple errors before the slower ESLint runs.

### Phase 2: Library Standardisation
- [ ] Migrate `packages/*` to use Vite+ (`vp`) for development and building.
- [ ] Standardise library configs using `vp pack` (Rolldown-based).

### Phase 3: Continuous Monitoring
- [ ] Monitor the progress of **Rolldown** and **Oxc** for Next.js compatibility or plugin support for `fbtee`.
- [ ] Evaluate `tsgo` (VoidZero's fast type checker) once it reaches maturity to replace/augment `tsc`.

## Conclusion

While a full migration to Vite+ for the main Next.js application is currently impractical due to framework differences and `fbtee` requirements, we can immediately benefit from its components—specifically **Oxlint** and **Vitest**. The project is already on the right track by using Vitest, and adding Oxlint will further improve developer productivity.
