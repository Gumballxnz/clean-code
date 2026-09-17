# Clean Code Directives

## Core Principle
Write pure, self-documenting, production-ready code. Do NOT add unnecessary, redundant, or explanatory comments inside code files.

## Strict Guidelines for AI Models & Developers
1. **Zero Obvious Comments**: Never write comments that merely restate what the code is doing (e.g. `// calculate total`, `// import dependencies`, `// return response`, `// loop over array`).
2. **No Redundant JSDoc / Type Annotations**: Avoid repetitive type docstrings when types are already self-evident or enforced by TypeScript, Go, Rust, Java or type hints.
3. **No Dead or Commented-Out Code**: Never leave commented-out code blocks. If code is deprecated or obsolete, delete it; version control (Git) retains the history.
4. **Preserve Essential Directives Only**: Keep only strictly necessary compiler and linter directives (e.g. `eslint-disable`, `@ts-expect-error`, `@ts-ignore`, `@license`, shebang `#!/usr/bin/env`, `//go:build`).
5. **Compact Line Spacing**: Avoid clusters of empty lines. Keep code readable with at most one empty line between logical blocks.
