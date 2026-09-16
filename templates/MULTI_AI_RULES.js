const fs = require('fs');
const path = require('path');

const CLEAN_CODE_DIRECTIVE = `# Clean Code Directives

## Core Principle
Write pure, self-documenting, production-ready code. Do NOT add unnecessary, redundant, or explanatory comments inside code files.

## Strict Guidelines
1. **No Obvious Comments**: Never write comments that merely restate what the code is already doing (e.g. \`// calculate total\`, \`// import dependencies\`, \`// return response\`, \`// loop over array\`).
2. **No Redundant JSDoc / Type Annotations**: Avoid repetitive type docstrings when types are already self-evident or enforced by TypeScript / static type hints.
3. **No Dead or Commented-Out Code**: Never leave commented-out code blocks. If code is deprecated or obsolete, delete it; version control (Git) retains the history.
4. **Preserve Essential Directives Only**: Keep only strictly necessary compiler and linter directives (e.g. \`eslint-disable\`, \`@ts-expect-error\`, \`@ts-ignore\`, \`@license\`, shebang \`#!/usr/bin/env\`).
5. **Compact Line Spacing**: Avoid clusters of empty lines. Keep code readable with at most one empty line between logical blocks.
`;

const MDC_FRONTMATTER = `---
description: Enforce zero unnecessary comments and pure clean code
globs: *
alwaysApply: true
---
`;

function ensureFileWithDirective(filePath, content, appendHeader = 'Clean Code Directives') {
  try {
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    if (!fs.existsSync(filePath)) {
      fs.writeFileSync(filePath, content, 'utf8');
      return { status: 'created', file: path.basename(filePath), path: filePath };
    } else {
      const existing = fs.readFileSync(filePath, 'utf8');
      if (!existing.includes(appendHeader)) {
        fs.appendFileSync(filePath, '\n\n' + content, 'utf8');
        return { status: 'updated', file: path.basename(filePath), path: filePath };
      }
      return { status: 'already_present', file: path.basename(filePath), path: filePath };
    }
  } catch (err) {
    return { status: 'error', file: path.basename(filePath), error: err.message };
  }
}

function generateAllAiRules(targetDir) {
  const results = [];

  // 1. Antigravity & Gemini Code Assist (GEMINI.md)
  results.push(ensureFileWithDirective(path.join(targetDir, 'GEMINI.md'), CLEAN_CODE_DIRECTIVE));

  // 2. Cursor IDE (.cursorrules e .cursor/rules/clean-code.mdc)
  results.push(ensureFileWithDirective(path.join(targetDir, '.cursorrules'), CLEAN_CODE_DIRECTIVE));
  results.push(ensureFileWithDirective(
    path.join(targetDir, '.cursor', 'rules', 'clean-code.mdc'),
    MDC_FRONTMATTER + '\n' + CLEAN_CODE_DIRECTIVE
  ));

  // 3. Windsurf / Codeium (.windsurfrules)
  results.push(ensureFileWithDirective(path.join(targetDir, '.windsurfrules'), CLEAN_CODE_DIRECTIVE));

  // 4. GitHub Copilot (.github/copilot-instructions.md)
  results.push(ensureFileWithDirective(
    path.join(targetDir, '.github', 'copilot-instructions.md'),
    CLEAN_CODE_DIRECTIVE
  ));

  // 5. Claude Code (CLAUDE.md)
  results.push(ensureFileWithDirective(path.join(targetDir, 'CLAUDE.md'), CLEAN_CODE_DIRECTIVE));

  return results;
}

module.exports = {
  CLEAN_CODE_DIRECTIVE,
  generateAllAiRules,
  ensureFileWithDirective
};
