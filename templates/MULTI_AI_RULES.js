const fs = require('fs');
const path = require('path');

const CLEAN_CODE_DIRECTIVE = `# Clean Code Directives

## Core Principle
Write pure, self-documenting, production-ready code. Do NOT add unnecessary, redundant, or explanatory comments inside code files.

## Strict Guidelines for AI Models & Developers
1. **Zero Obvious Comments**: Never write comments that merely restate what the code is doing (e.g. \`// calculate total\`, \`// import dependencies\`, \`// return response\`, \`// loop over array\`).
2. **No Redundant JSDoc / Type Annotations**: Avoid repetitive type docstrings when types are already self-evident or enforced by TypeScript, Go, Rust, Java or type hints.
3. **No Dead or Commented-Out Code**: Never leave commented-out code blocks. If code is deprecated or obsolete, delete it; version control (Git) retains the history.
4. **Preserve Essential Directives Only**: Keep only strictly necessary compiler and linter directives (e.g. \`eslint-disable\`, \`@ts-expect-error\`, \`@ts-ignore\`, \`@license\`, shebang \`#!/usr/bin/env\`, \`//go:build\`).
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
      return { status: 'created', file: path.relative(process.cwd(), filePath) || path.basename(filePath), path: filePath };
    } else {
      const existing = fs.readFileSync(filePath, 'utf8');
      if (!existing.includes(appendHeader)) {
        fs.appendFileSync(filePath, '\n\n' + content, 'utf8');
        return { status: 'updated', file: path.relative(process.cwd(), filePath) || path.basename(filePath), path: filePath };
      }
      return { status: 'already_present', file: path.relative(process.cwd(), filePath) || path.basename(filePath), path: filePath };
    }
  } catch (err) {
    return { status: 'error', file: path.basename(filePath), error: err.message };
  }
}

// Registro extensível de IAs e IDEs
const AI_PROVIDERS = [
  {
    id: 'antigravity',
    name: 'Google Antigravity & Gemini Code Assist',
    detect: (targetDir, env) => {
      const hasEnv = !!(env.ANTIGRAVITY_APP || env.GEMINI_CLI || (env._ && env._.includes('antigravity')));
      const hasFiles = fs.existsSync(path.join(targetDir, 'GEMINI.md')) ||
                       fs.existsSync(path.join(targetDir, '.agents')) ||
                       fs.existsSync(path.join(targetDir, '.gemini'));
      return hasEnv || hasFiles;
    },
    getRules: (targetDir) => [
      { path: path.join(targetDir, 'GEMINI.md'), content: CLEAN_CODE_DIRECTIVE },
      { path: path.join(targetDir, 'AGENTS.md'), content: CLEAN_CODE_DIRECTIVE }
    ]
  },
  {
    id: 'cursor',
    name: 'Cursor IDE',
    detect: (targetDir, env) => {
      const hasEnv = !!(env.CURSOR_VERSION || env.CURSOR_APP || env.CURSOR_AGENT);
      const hasFiles = fs.existsSync(path.join(targetDir, '.cursor')) ||
                       fs.existsSync(path.join(targetDir, '.cursorrules'));
      return hasEnv || hasFiles;
    },
    getRules: (targetDir) => [
      { path: path.join(targetDir, '.cursorrules'), content: CLEAN_CODE_DIRECTIVE },
      { path: path.join(targetDir, '.cursor', 'rules', 'clean-code.mdc'), content: MDC_FRONTMATTER + '\n' + CLEAN_CODE_DIRECTIVE }
    ]
  },
  {
    id: 'claude',
    name: 'Claude Code & Anthropic Extension',
    detect: (targetDir, env) => {
      const hasEnv = !!(env.CLAUDE_CODE || env.CLAUDE_CLI || env.ANTHROPIC_API_KEY);
      const hasFiles = fs.existsSync(path.join(targetDir, 'CLAUDE.md')) ||
                       fs.existsSync(path.join(targetDir, '.claude'));
      return hasEnv || hasFiles;
    },
    getRules: (targetDir) => [
      { path: path.join(targetDir, 'CLAUDE.md'), content: CLEAN_CODE_DIRECTIVE }
    ]
  },
  {
    id: 'windsurf',
    name: 'Windsurf / Codeium IDE',
    detect: (targetDir, env) => {
      const hasEnv = !!(env.WINDSURF_VERSION || env.WINDSURF_APP);
      const hasFiles = fs.existsSync(path.join(targetDir, '.windsurf')) ||
                       fs.existsSync(path.join(targetDir, '.windsurfrules'));
      return hasEnv || hasFiles;
    },
    getRules: (targetDir) => [
      { path: path.join(targetDir, '.windsurfrules'), content: CLEAN_CODE_DIRECTIVE },
      { path: path.join(targetDir, '.windsurf', 'rules', 'clean-code.md'), content: CLEAN_CODE_DIRECTIVE }
    ]
  },
  {
    id: 'copilot',
    name: 'GitHub Copilot',
    detect: (targetDir, env) => {
      const hasEnv = !!(env.GITHUB_COPILOT_ENABLED);
      const hasFiles = fs.existsSync(path.join(targetDir, '.github', 'copilot-instructions.md'));
      const hasGithubDir = fs.existsSync(path.join(targetDir, '.github'));
      return hasEnv || hasFiles || hasGithubDir;
    },
    getRules: (targetDir) => [
      { path: path.join(targetDir, '.github', 'copilot-instructions.md'), content: CLEAN_CODE_DIRECTIVE }
    ]
  },
  {
    id: 'cline',
    name: 'Cline & Roo Code',
    detect: (targetDir, env) => {
      const hasEnv = !!(env.CLINE_VERSION || env.ROO_MODE);
      const hasFiles = fs.existsSync(path.join(targetDir, '.clinerules')) ||
                       fs.existsSync(path.join(targetDir, '.roomodes'));
      return hasEnv || hasFiles;
    },
    getRules: (targetDir) => [
      { path: path.join(targetDir, '.clinerules'), content: CLEAN_CODE_DIRECTIVE },
      { path: path.join(targetDir, '.roomodes', 'rules.md'), content: CLEAN_CODE_DIRECTIVE }
    ]
  },
  {
    id: 'continue',
    name: 'Continue.dev',
    detect: (targetDir, env) => {
      const hasFiles = fs.existsSync(path.join(targetDir, '.continue'));
      return hasFiles;
    },
    getRules: (targetDir) => [
      { path: path.join(targetDir, '.continue', 'rules', 'clean-code.md'), content: CLEAN_CODE_DIRECTIVE }
    ]
  },
  {
    id: 'aider',
    name: 'Aider AI Pair Programmer',
    detect: (targetDir, env) => {
      const hasFiles = fs.existsSync(path.join(targetDir, '.aider.conf.yml')) ||
                       fs.existsSync(path.join(targetDir, 'CONVENTIONS.md'));
      return hasFiles;
    },
    getRules: (targetDir) => [
      { path: path.join(targetDir, 'CONVENTIONS.md'), content: CLEAN_CODE_DIRECTIVE }
    ]
  },
  {
    id: 'codex',
    name: 'OpenAI Codex & ChatGPT',
    detect: (targetDir, env) => {
      const hasEnv = !!(env.OPENAI_API_KEY || env.CODEX_CLI || env.OPENAI_MODEL || env.CHATGPT_ENV);
      const hasFiles = fs.existsSync(path.join(targetDir, 'CODEX.md')) ||
                       fs.existsSync(path.join(targetDir, '.openai')) ||
                       fs.existsSync(path.join(targetDir, '.codex'));
      return hasEnv || hasFiles;
    },
    getRules: (targetDir) => [
      { path: path.join(targetDir, 'CODEX.md'), content: CLEAN_CODE_DIRECTIVE }
    ]
  },
  {
    id: 'amazonq',
    name: 'Amazon Q Developer',
    detect: (targetDir, env) => {
      const hasEnv = !!(env.AWS_Q_ENABLED);
      const hasFiles = fs.existsSync(path.join(targetDir, '.aws', 'q-rules.md')) ||
                       fs.existsSync(path.join(targetDir, '.amazonq'));
      return hasEnv || hasFiles;
    },
    getRules: (targetDir) => [
      { path: path.join(targetDir, '.aws', 'q-rules.md'), content: CLEAN_CODE_DIRECTIVE }
    ]
  }
];

function detectActiveAiEnvironments(targetDir, env = process.env) {
  const detected = [];

  for (const provider of AI_PROVIDERS) {
    try {
      if (provider.detect(targetDir, env)) {
        detected.push(provider);
      }
    } catch (_) {}
  }

  return detected;
}

function syncAiRules(targetDir, options = { allRules: false, env: process.env }) {
  const results = [];
  const detectedProviders = detectActiveAiEnvironments(targetDir, options.env);

  let targetProviders = [];

  if (options.allRules) {
    targetProviders = AI_PROVIDERS;
  } else if (detectedProviders.length > 0) {
    targetProviders = detectedProviders;
    // Sempre garante o padrão aberto Antigravity/AGENTS.md se não foi detectado nenhum
    if (!targetProviders.some(p => p.id === 'antigravity')) {
      const antigravityProvider = AI_PROVIDERS.find(p => p.id === 'antigravity');
      if (antigravityProvider) targetProviders.push(antigravityProvider);
    }
  } else {
    // Modo padrão inteligente se não detectou nenhum indicador específico:
    // Configura Antigravity / Gemini (GEMINI.md e AGENTS.md)
    const defaultProvider = AI_PROVIDERS.find(p => p.id === 'antigravity');
    if (defaultProvider) targetProviders.push(defaultProvider);
  }

  for (const provider of targetProviders) {
    const rules = provider.getRules(targetDir);
    for (const rule of rules) {
      const res = ensureFileWithDirective(rule.path, rule.content);
      res.providerName = provider.name;
      results.push(res);
    }
  }

  return {
    detected: detectedProviders.map(p => p.name),
    configured: results
  };
}

function generateAllAiRules(targetDir) {
  return syncAiRules(targetDir, { allRules: true }).configured;
}

module.exports = {
  CLEAN_CODE_DIRECTIVE,
  AI_PROVIDERS,
  detectActiveAiEnvironments,
  syncAiRules,
  generateAllAiRules,
  ensureFileWithDirective
};
