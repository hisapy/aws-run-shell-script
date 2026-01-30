# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with
code in this repository.

## Common Commands

- **Build**: `npm run bundle` (Packages TypeScript for distribution)
- **Lint**: Implicit in CI/CD workflows (via CodeQL analysis)
- **Test**:
  ```bash
  npm test
  # Example output:
  # PASS  ./index.test.js
  #   ✓ throws invalid number (3ms)
  #   ✓ wait 500 ms (504ms)
  #   ✓ test runs (95ms)
  ```

## High-Level Architecture

1. **AWS SSM Integration**: Uses AWS Systems Manager (SSM) SendCommand with the
   "AWS-RunShellScript" document
2. **Execution Flow**:
   - GitHub Action triggers workflow
   - Calls AWS SSM to execute shell script on EC2 instances
   - Captures and returns execution results
3. **AMI Compatibility**: Specifically tested with Amazon Linux 2023 AMI

## Development Workflow

1. **Setup**:
   ```bash
   npm install          # Install dependencies
   npm run bundle       # Package TypeScript
   ```
2. **Development**:
   - Modify `src/` directory contents
   - Add tests to `__tests__/`
3. **Validation**:
   ```bash
   npm run all          # Format, test, and build
   # Includes rollup bundling for production
   ```
4. **Local Testing**:
   ```bash
   npx @github/local-action . src/main.ts .env
   # Requires .env file for environment variables
   ```

## CI/CD Integration

1. **Workflow Automation**:
   - Linter: `linter.yml` (Code quality checks)
   - CI: `ci.yml` (Basic execution validation)
   - CodeQL: `codeql-analysis.yml` (Security analysis)
   - Coverage: `check-dist.yml` (Distribution validation)
2. **Release Process**:
   - Use `script/release` helper for:
     1. Tagging new releases
     2. Syncing major tags (e.g., v1 → v1.0.0)
     3. Pushing to remote repository
   - Manual step: Create GitHub release for new tags
3. **License Compliance**:
   - `licensed.yml` workflow checks for:
     - Missing licenses
     - Non-compliant licenses
   - Run with:
     ```bash
     licensed cache     # Update license database
     licensed status    # Check cached licenses
     ```

Key components from README.md:

- AWS SSM integration with specific AMI compatibility
- Detailed release management process
- License compliance workflow
- Explicit test output examples
- Production bundling requirements
