# Clean Code Directive

## Core Principle
Write pure, self-documenting, production-ready code. Do NOT add unnecessary, redundant, or explanatory comments inside code files.

## Strict Guidelines for AI & Developers
1. **No Obvious Comments**: Never write comments that merely restate what the code is already doing (e.g. `// calculate total`, `// import dependencies`, `// return response`, `// loop over array`).
2. **No Redundant JSDoc / Type Comments**: Avoid repetitive type docstrings when types are already self-evident or enforced by TypeScript / type hints.
3. **No Dead or Commented-Out Code**: Never leave commented-out code blocks. If code is deprecated or obsolete, delete it; version control (Git) retains the history.
4. **Preserve Essential Directives Only**: Keep only strictly necessary compiler and linter directives (e.g. `eslint-disable`, `@ts-expect-error`, `@ts-ignore`, `@license`, shebang `#!/usr/bin/env`).
5. **Compact Line Spacing**: Avoid clusters of empty lines. Keep code readable with at most one empty line between logical blocks.
6. **Zero Hardcoded Secrets & Credentials**: NEVER expose or hardcode API keys, secrets, access tokens, database URLs, Supabase keys, Firebase keys, Stripe keys, SSH private keys, or certificates in source code or public documentation. Always load secrets strictly from environment variables (`.env`, `process.env.*`, `os.getenv`, etc.). Always ensure `.env` and sensitive credential files are listed in `.gitignore`.
7. **No Scratch Test Files in Commits**: Temporary test scripts, scratch files (e.g. `test_*.js`, `teste_*.js`, `scratch.*`, `temp_*`), mock data dumps, or ad-hoc verification scripts created during tasks must NEVER be left in project roots or committed to version control. Always clean them up or ensure they are listed in `.gitignore`.
8. **Mandatory Skeleton Screens for Async Operations**: All processing, network requests, and visual loading states (charts, cards, tables, video players, analytics panels) MUST use responsive animated skeleton screens (shimmer/pulse) in both Light Mode and Dark Mode. Never show raw loading text ("Carregando...") or unstyled black empty boxes that compromise site responsiveness or visual cohesion.

