# AGENTS.md - AdaMeter Project Guide

Welcome, AI Agent! This document provides guidance for working effectively with the AdaMeter codebase. AdaMeter is a privacy-first application for tracking newborn baby development and routines.

## Core Technologies

The project is built with the following primary technologies:

-   **Frontend Framework**: [Next.js](https://nextjs.org/) (using the App Router) with [React](https://react.dev/) 19.
-   **Language**: [TypeScript](https://www.typescriptlang.org/).
-   **UI Components**: Primarily built using [shadcn/ui](https://ui.shadcn.com/). Components are added to `src/components/ui` via its CLI tool (`npx shadcn-ui@latest add ...`). This directory should be exclusively managed by `shadcn/ui`. Custom, non-`shadcn/ui` components should be placed in other locations within `src/components/` or feature-specific component folders.
-   **Styling**: [Tailwind CSS](https://tailwindcss.com/) (v4.x), configured via `tailwind.config.ts` and processed with PostCSS. Utility classes are composed using `clsx` and `tailwind-merge`.
-   **State Management**:
    -   [Valtio](https://valtio.pmnd.rs/) for local client-side state.
    -   [Yjs](https://yjs.dev/) for conflict-free replicated data types (CRDTs) enabling collaborative features.
    -   `valtio-yjs` to bridge Valtio stores with Yjs types.
-   **Real-time Collaboration Backend**: [PartyKit](https://www.partykit.io/) for synchronizing Yjs data across clients.
-   **Testing**: [Vitest](https://vitest.dev/) as the test runner, with [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/) for component testing and JSDOM for the test environment.
-   **Internationalization (i18n)**: [fbtee](https://github.com/nkzw-tech/fbtee) library for marking and collecting translatable strings, integrated with [Crowdin](https://crowdin.com/project/780494) for the translation process.
-   **Linting & Formatting**:
    -   [ESLint](https://eslint.org/) with custom configurations (see `eslint.config.mjs`).
    -   [Prettier](https://prettier.io/) for code formatting (see `.prettierrc`), including import sorting via `@ianvs/prettier-plugin-sort-imports`.
-   **Package Manager**: [pnpm](https://pnpm.io/) (version >=9 is enforced).

## File Naming Conventions

-   Prefer `kebab-case` for filenames (e.g., `my-module.ts`, `my-component.tsx`). This is the prevailing convention in the project.

## Project Structure Overview

-   `.github/workflows/`: GitHub Actions workflows for CI/CD (testing, PartyKit deployment, i18n string uploads).
-   `party/`: Contains the PartyKit server-side TypeScript code (`index.ts`) for real-time data synchronization.
-   `public/`: Static assets like favicons and manifest files.
-   `scripts/`: Contains utility shell scripts for various build, development, or operational tasks, including (but not limited to) i18n string management.
-   `src/`: Contains all the core application source code.
    -   `src/app/`: Next.js App Router. Each subdirectory (e.g., `diaper/`, `feeding/`, `growth/`) represents a major feature with its own `page.tsx` and `components/` subdirectory for feature-specific components.
    -   `src/components/`:
        -   `ui/`: Base UI components managed by `shadcn/ui` (see "Core Technologies" and `components.json` at the project root). **Do not manually add or modify files here unless it's part of the `shadcn/ui` tooling process.**
        -   Shared custom components (not from `shadcn/ui`) used across different features (e.g., `example-custom-component.tsx`, `history-list.tsx`).
        -   `root-layout/`: Contains components for the main site layout.
            -   `src/components/root-layout/index.tsx` is the main component responsible for rendering the overall site structure, including common elements like header, main content area, and navigation.
            -   Sub-components like `src/components/root-layout/navigation.tsx` are co-located here as they are specific to the root layout (see "Coding Conventions and Best Practices" on component co-location).
    -   `src/contexts/`: React contexts for managing global concerns like i18n (`i18n-context.tsx`), Yjs setup (`yjs-context.tsx`), and data synchronization logic (`data-synchronization-context.tsx`).
    -   `src/data/`: Modules responsible for defining and managing specific data types/stores (e.g., `diaper-changes.ts`, `feeding-sessions.ts`). These often interact with Valtio and Yjs.
    -   `src/hooks/`: Custom React hooks encapsulating business logic, data access patterns (e.g., `use-diaper-changes.ts`), and interactions with browser APIs or contexts. Existing hook filenames vary; new general files should prefer `kebab-case`.
    -   `src/i18n/`: Internationalization files, including `translations.json` (compiled translations) and potentially source string files.
    -   `src/lib/`: For general-purpose, reusable utility functions that are not specific to any single component, feature, or data type (e.g., `formatting-helpers.ts`, `constants.ts`). Avoid putting complex business logic or feature-specific code here.
    -   `src/types/`: TypeScript type definitions for data structures used throughout the application.
    -   `src/utils/`: Specific utility functions for tasks like cryptography (`crypto.ts`), CSV export (`csv-export.ts`), and date/time formatting. These might be more complex or have more dependencies than those in `src/lib/`.
-   `vitest.config.mts`: Configuration for the Vitest testing framework.
-   `pnpm-lock.yaml`: pnpm lockfile.
-   `components.json`: Configuration file for `shadcn/ui`.

## Development Workflow

1.  **Initial Setup**:
    -   Ensure you have Node.js and pnpm (version >=9) installed.
    -   Clone the repository.
    -   Install dependencies: `pnpm install`

2.  **Running the Development Server**:
    -   Execute `pnpm run dev`. This concurrently starts:
        -   The Next.js frontend development server.
        -   The PartyKit development server for real-time features.
    -   This command also runs `./scripts/download-translations.sh` first to fetch the latest translations.

3.  **Building for Production**:
    -   Execute `pnpm run build`. This also downloads translations before building.

4.  **Testing**:
    -   Run all tests: `pnpm run test`
    -   Test files (e.g., `*.test.ts`, `*.test.tsx`) are co-located with the code they test.
    -   `__mocks__` directories are strictly for mock implementations (e.g., of external modules or APIs), not for test files themselves.
    -   **Testing Philosophy**: Prefer integration tests that cover realistic user flows and component interactions over excessive unit tests with many mocks. Mocking should ideally occur only at the edges of the system (e.g., external network requests, browser APIs not adequately covered by JSDOM).
    -   Write new tests for any new functionality or bug fixes. Ensure they cover critical paths and edge cases.

5.  **Linting and Formatting**:
    -   Run linter: `pnpm run lint`
    -   It's highly recommended to integrate ESLint and Prettier into your IDE for real-time feedback and auto-formatting on save.
    -   Ensure code is formatted with Prettier before committing. The import sorter plugin will automatically organize import statements.

## Internationalization (i18n)

User-facing strings must be internationalized using the `fbtee` library.

-   **Marking Strings**:
    -   In React components (TSX): Use the `<fbt>` component. Example: `<fbt desc="Button text to confirm an action">Confirm</fbt>`
    -   In TypeScript/JavaScript code: Use the `fbt()` function. Example: `fbt('A simple message', 'Description for translators')`
    -   Provide clear and concise descriptions for translators within the `desc` prop or the second argument to `fbt()`.
    -   Commonly reused strings can be defined in `common_strings.json` and referenced.
-   **Workflow**:
    1.  After adding or modifying translatable strings, collect them by running:
        ```bash
        pnpm run fbtee:manifest
        pnpm run fbtee:collect
        ```
        This updates `.source_strings.json`.
    2.  The `.source_strings.json` file is uploaded to Crowdin (usually automated via GitHub Actions, see `.github/workflows/upload-source-strings.yaml`, or manually using `scripts/upload-source-strings.sh`).
    3.  Translations are contributed by translators on the Crowdin platform.
    4.  Translated strings are downloaded into the `translations/` directory (e.g., `translations/de_DE.json`) by the `./scripts/download-translations.sh` script (run automatically during `pnpm run dev` and `pnpm run build`).
    5.  These downloaded translations are compiled into `src/i18n/translations.json` by `pnpm run fbtee:translate`. This compiled file is what the application uses.
-   **Key Files**:
    -   `common_strings.json`: For shared, reusable translated strings.
    -   `.source_strings.json`: The collected source strings for translation (output of `fbtee:collect`).
    -   `translations/`: Directory containing downloaded translation files from Crowdin.
    -   `src/i18n/translations.json`: The compiled, runtime translations used by the app. **This file is auto-generated by `pnpm run fbtee:translate` and should not be manually edited.**
    -   `src/contexts/i18n-context.tsx`: Provides i18n functionality to the component tree.

## State Management and Data Synchronization

-   **Local State**: Valtio is used for managing reactive state within the client. Stores are typically defined in `src/data/` and consumed via custom hooks in `src/hooks/`.
-   **Collaborative State**: Yjs is used to create shared data structures that can be synchronized between multiple clients or devices.
    -   Yjs documents and types are often managed within Valtio proxies using `valtio-yjs`.
-   **Synchronization Backend**: PartyKit serves as the backend to relay Yjs updates between connected clients. The server logic is in `party/index.ts`.
-   **Encryption**:
    -   Data is encrypted locally before being persisted (e.g., to IndexedDB via `y-indexeddb`).
    -   If data sharing is enabled, it is designed to be end-to-end encrypted.
    -   Encryption logic is primarily handled in `src/utils/crypto.ts`, often involving passphrases managed via `src/data/passphrase.ts` and `src/hooks/use-encryption-key.ts`.
-   **Contexts**:
    -   `src/contexts/yjs-context.tsx`: Sets up the Yjs document, provider, and connection to PartyKit.
    -   `src/contexts/data-synchronization-context.tsx`: Manages higher-level logic for data sharing and synchronization status.

## Coding Conventions and Best Practices

-   **Follow Existing Style**: Adhere to the coding style, patterns, and conventions already present in the codebase. This includes file naming conventions (see above: prefer `kebab-case`).
-   **TypeScript**: Use TypeScript effectively. Provide types for all variables, function parameters, and return values. Leverage TypeScript's features for robust and maintainable code.
-   **Components**:
    -   Strive for reusable and well-encapsulated components.
    -   Place feature-specific components within the feature's directory in `src/app/`.
    -   Use `src/components/ui/` for `shadcn/ui` components only, added via its CLI. Other shared, custom components go into `src/components/` directly or other subdirectories as appropriate.
    -   **Co-locate sub-components**: If a component is only used by a single parent component, it's good practice to place it in the same directory as its parent. For example, `src/components/root-layout/navigation.tsx` is only used by `src/components/root-layout/index.tsx`, so it resides within the `src/components/root-layout/` directory rather than directly under `src/components/`.
-   **Hooks**: Encapsulate business logic, side effects, and stateful logic within custom hooks (`src/hooks/`).
-   **Immutability**: When working with state, especially Valtio stores, prefer immutable update patterns where possible, or use Valtio's proxy nature correctly to trigger updates.
-   **Error Handling**: Implement proper error handling, especially for async operations and user inputs.
-   **Accessibility (a11y)**: Keep accessibility in mind when creating UI components. Use semantic HTML and ARIA attributes where appropriate.
-   **Dependencies**:
    -   Add new dependencies using `pnpm add <package>` or `pnpm add -D <package>` for dev dependencies.
    -   Carefully consider the necessity and impact of adding new dependencies.
-   **Commits**: Write clear and descriptive commit messages.

## Programmatic Checks for Agents

To help ensure your changes align with project standards, you can run the following checks:

1.  **Lint and Format**:
    ```bash
    pnpm run lint
    # Ensure Prettier is run (often via IDE on save)
    ```
2.  **Run Tests**:
    ```bash
    pnpm run test
    ```
3.  **Check for i18n String Changes (if you added/modified user-facing text)**:
    ```bash
    pnpm run fbtee:manifest
    pnpm run fbtee:collect
    # Review the diff in .source_strings.json to ensure your strings were collected correctly.
    ```

By following these guidelines, you'll help maintain the quality, consistency, and stability of the AdaMeter project.
