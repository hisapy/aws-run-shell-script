# # AWS Run Shell Script - Agent Instructions

This repository has been created from the template
[https://github.com/actions/typescript-action](https://github.com/actions/typescript-action)

This GitHub Action is written in TypeScript and transpiled to JavaScript. Both
the TypeScript sources and the **generated** JavaScript code are contained in
this repository. The TypeScript sources are contained in the `src` directory and
the JavaScript code is contained in the `dist` directory. A GitHub Actions
workflow checks that the JavaScript code in `dist` is up-to-date. Therefore, you
should not review any changes to the contents of the `dist` folder and it is
expected that the JavaScript code in `dist` closely mirrors the TypeScript code
it is generated from.

## Repository Structure

| Path                 | Description                                              |
| -------------------- | -------------------------------------------------------- |
| `__fixtures__/`      | Unit Test Fixtures                                       |
| `__tests__/`         | Unit Tests                                               |
| `.devcontainer/`     | Development Container Configuration                      |
| `.github/`           | GitHub Configuration                                     |
| `.licenses/`         | License Information                                      |
| `.vscode/`           | Visual Studio Code Configuration                         |
| `badges/`            | Badges for readme                                        |
| `dist/`              | Generated JavaScript Code                                |
| `src/`               | TypeScript Source Code                                   |
| `.env.example`       | Environment Variables Example for `@github/local-action` |
| `.licensed.yml`      | Licensed Configuration                                   |
| `.markdown-lint.yml` | Markdown Linter Configuration                            |
| `.node-version`      | Node.js Version Configuration                            |
| `.prettierrc.yml`    | Prettier Formatter Configuration                         |
| `.yaml-lint.yml`     | YAML Linter Configuration                                |
| `action.yml`         | GitHub Action Metadata                                   |
| `CODEOWNERS`         | Code Owners File                                         |
| `eslint.config.mjs`  | ESLint Configuration                                     |
| `jest.config.js`     | Jest Configuration                                       |
| `LICENSE`            | License File                                             |
| `package.json`       | NPM Package Configuration                                |
| `README.md`          | Project Documentation                                    |
| `rollup.config.ts`   | Rollup Bundler Configuration                             |
| `tsconfig.json`      | TypeScript Configuration                                 |

## Code Style

**Formatting & Linting:**

- [Prettier](.prettierrc.yml): 2-space indentation, 80-character line width, no
  semicolons, single quotes, LF line endings
- [ESLint](eslint.config.mjs): Flat config format using `@typescript-eslint`,
  Jest plugins, and integrated Prettier
- [TypeScript](tsconfig.json): Strict mode enabled (`noImplicitAny`,
  `strictNullChecks`), ECMAScript 2022 target/lib, inline type annotations

**Code Patterns:**

- JSDoc comments document _why_, not _what_—see [src/main.ts](src/main.ts#L5-L9)
  for examples
- Error handling checks `instanceof Error` before accessing message property
  (e.g., [src/main.ts](src/main.ts#L20))
- Use `/* istanbul ignore next */` to exclude uncoverable entrypoint code from
  coverage reports
- Imports use `.js` extensions despite TypeScript source files for proper ESM
  module resolution

## Architecture

**Module Structure:**

- [src/index.ts](src/index.ts): Minimal entrypoint—imports and executes `run()`
  immediately
- [src/main.ts](src/main.ts): Core action logic using `@actions/core` for
  inputs, outputs, and logging
- [src/wait.ts](src/wait.ts): Utility functions demonstrating async/Promise
  patterns with validation
- Single responsibility: one primary export per file

**Action Integration:**

- Inputs retrieved via `core.getInput(name)` (see [action.yml](action.yml) for
  metadata)
- Outputs set via `core.setOutput(name, value)` for workflow consumption
- Error handling wraps execution in try-catch, calls `core.setFailed(message)`
  on failure
- Debug logging via `core.debug(message)` only outputs when `ACTIONS_STEP_DEBUG`
  secret is enabled

## Environment Setup

Install dependencies by running:

```bash
npm install
```

For Node.js version requirement, see [.node-version](.node-version) (currently
Node 24+).

## Testing

Ensure all unit tests pass by running:

```bash
npm run test
```

**Test Structure:**

- Unit tests in [**tests**/](../__tests__/) directory, powered by `jest` with
  `ts-jest` preset
- Test fixtures in [**fixtures**/](../__fixtures__/) provide Jest mocks matching
  actual API signatures
- ESM support enabled via `extensionsToTreatAsEsm: ['.ts']` in
  [jest.config.js](jest.config.js)

**Mock & Fixture Pattern:**

- Fixtures export `jest.fn<typeof actualModule>()` matching real function
  signatures (see [**fixtures**/core.ts](__fixtures__/core.ts))
- Mocks instantiated before importing test module using
  `jest.unstable_mockModule()`
- Setup uses `.mockImplementation()`, teardown calls `jest.resetAllMocks()`
- Tests verify both success paths (output assertions) and error paths
  (rejection/failure status)
- Example: [**tests**/wait.test.ts](__tests__/wait.test.ts) validates timing
  behavior with delta assertions

**Coverage Requirements:**

- Coverage reports collected in `lcov` and `json-summary` formats
- Run `npm run test -- --coverage` to generate detailed coverage reports

## Bundling

Any time files in the `src` directory are changed, run:

```bash
npm run bundle
```

**Build Details:**

- [rollup.config.ts](rollup.config.ts) transpiles `src/index.ts` →
  `dist/index.js` using TypeScript plugin
- Output is ES module format with source maps enabled
- Node built-in resolution and CommonJS conversion plugins included
- The `dist/` directory is committed to the repository (pre-transpiled for
  GitHub Actions runtime)
- CI verifies `dist/` stays in-sync with `src/`; ensure you commit transpiled
  output

**Build Commands:**

- `npm run bundle`: Full build (format → lint → test → coverage → transpile)
- `npm run package`: Rollup bundling only
- `npm run package:watch`: Watch mode for development
- `npm run all`: Complete verification workflow

## General Coding Guidelines

- Follow standard TypeScript and JavaScript coding conventions and best
  practices
- Changes should maintain consistency with existing patterns and style
- Document changes clearly and thoroughly, including updates to existing
  comments when appropriate
- Do not include basic, unnecessary comments that simply restate what the code
  is doing (focus on explaining _why_, not _what_)
- Use consistent error handling patterns throughout the codebase
- Use TypeScript's type system to ensure type safety and clarity
- Keep functions focused and manageable
- Use descriptive variable and function names that clearly convey their purpose
- Use JSDoc comments to document functions, classes, and complex logic
- After doing any refactoring, ensure to run `npm run test` to ensure that all
  tests still pass and coverage requirements are met
- When suggesting code changes, always opt for the most maintainable approach.
  Try your best to keep the code clean and follow "Don't Repeat Yourself" (DRY)
  principles
- Avoid unnecessary complexity and always consider the long-term maintainability
  of the code
- When writing unit tests, try to consider edge cases as well as the main path
  of success. This will help ensure that the code is robust and can handle
  unexpected inputs or situations
- Use `@actions/core` for logging (`core.debug()`, `core.notice()`,
  `core.warning()`) instead of `console` to ensure compatibility with GitHub
  Actions logging features
- Always check `instanceof Error` before accessing `.message` property in error
  handlers

## Development Workflow

**Local Development:**

- Dev container ships with Node 20 in image but [.node-version](.node-version)
  specifies Node 24
- Test action locally using `npm run local-action` with `.env` configuration
  (see [.env.example](.env.example))
- Use `npm run ci-test` for CI-specific testing with experimental VM modules
  flag
- Enable format-on-save in Visual Studio Code for automatic Prettier formatting

**Workflow:**

1. Make changes in `src/` directory
1. Run tests: `npm run test`
1. Verify bundling: `npm run bundle`
1. Let CI check that `dist/` is up-to-date
1. Commit both `src/` changes AND transpiled `dist/` output

## Versioning

GitHub Actions are versioned using branch and tag names. Please ensure the
version in the project's `package.json` is updated to reflect the changes made
in the codebase. The version should follow
[Semantic Versioning](https://semver.org/) principles.

## Pull Request Guidelines

When creating a pull request (PR), please ensure that:

- Keep changes focused and minimal (avoid large changes, or consider breaking
  them into separate, smaller PRs)
- Formatting checks pass
- Linting checks pass
- Unit tests pass and coverage requirements are met
- The action has been transpiled to JavaScript and the `dist` directory is
  up-to-date with the latest changes in the `src` directory
- If necessary, the `README.md` file is updated to reflect any changes in
  functionality or usage

The body of the PR should include:

- A summary of the changes
- A special note of any changes to dependencies
- A link to any relevant issues or discussions
- Any additional context that may be helpful for reviewers

## Code Review Guidelines

When performing a code review, please follow these guidelines:

- If there are changes that modify the functionality/usage of the action,
  validate that there are changes in the `README.md` file that document the new
  or modified functionality
