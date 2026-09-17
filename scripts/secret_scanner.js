const fs = require('fs');
const path = require('path');

const FALSE_POSITIVES = new Set([
  'your_api_key_here',
  'your_secret_key_here',
  'your_token_here',
  'your_key_here',
  'placeholder',
  'insert_here',
  'paste_here',
  ['sk_proj', 'x'.repeat(32)].join('-'),
  ['sk', 'x'.repeat(32)].join('-'),
  ['pk_test', 'x'.repeat(24)].join('_'),
  ['sk_test', 'x'.repeat(24)].join('_'),
  ['akiaiosfodnn7', 'example'].join(''),
  'dummy',
  'undefined',
  'null',
  'test',
  'secret',
  'password'
]);

const SECRET_RULES = [
  {
    id: 'SUPABASE_URL',
    name: 'Supabase URL',
    pattern: /https:\/\/[a-z0-9]{20}\.supabase\.co/g,
    varPrefix: 'SUPABASE_URL',
    placeholder: 'https://your-project.supabase.co'
  },
  {
    id: 'SUPABASE_ANON_KEY',
    name: 'Supabase JWT / Anon Key',
    pattern: /eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9\.[a-zA-Z0-9_-]{20,}\.[a-zA-Z0-9_-]{20,}/g,
    varPrefix: 'SUPABASE_ANON_KEY',
    placeholder: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
  },
  {
    id: 'ANTHROPIC_API_KEY',
    name: 'Anthropic API Key',
    pattern: /sk-ant-(?:api[0-9]{2}-)?[a-zA-Z0-9_-]{32,}/g,
    varPrefix: 'ANTHROPIC_API_KEY',
    placeholder: 'sk-ant-api03-your_anthropic_api_key'
  },
  {
    id: 'OPENAI_API_KEY',
    name: 'OpenAI API Key',
    pattern: /sk-(?!ant-)(?:proj-|svcacct-)?[a-zA-Z0-9_-]{32,}/g,
    varPrefix: 'OPENAI_API_KEY',
    placeholder: 'sk-proj-your_openai_api_key'
  },
  {
    id: 'FIREBASE_API_KEY',
    name: 'Firebase / Google API Key',
    pattern: /AIza[0-9A-Za-z-_]{30,40}/g,
    varPrefix: 'FIREBASE_API_KEY',
    placeholder: 'AIzaSyYourFirebaseApiKeyHere'
  },
  {
    id: 'STRIPE_SECRET_KEY',
    name: 'Stripe Secret Key',
    pattern: /(?:sk|rk)_(?:live|test)_[0-9a-zA-Z]{24,}/g,
    varPrefix: 'STRIPE_SECRET_KEY',
    placeholder: 'sk_test_your_stripe_secret_key'
  },
  {
    id: 'STRIPE_PUBLISHABLE_KEY',
    name: 'Stripe Publishable Key',
    pattern: /pk_(?:live|test)_[0-9a-zA-Z]{24,}/g,
    varPrefix: 'STRIPE_PUBLISHABLE_KEY',
    placeholder: 'pk_test_your_stripe_publishable_key'
  },
  {
    id: 'AWS_ACCESS_KEY_ID',
    name: 'AWS Access Key ID',
    pattern: /(?:AKIA|ASIA)[0-9A-Z]{16}/g,
    varPrefix: 'AWS_ACCESS_KEY_ID',
    placeholder: 'AKIAIOSFODNN7EXAMPLE'
  },
  {
    id: 'GITHUB_TOKEN',
    name: 'GitHub Personal Token',
    pattern: /(?:ghp|gho|ghu|ghs|ghr)_[a-zA-Z0-9]{36}|github_pat_[a-zA-Z0-9_]{82}/g,
    varPrefix: 'GITHUB_TOKEN',
    placeholder: 'ghp_your_github_token_here'
  },
  {
    id: 'SLACK_TOKEN',
    name: 'Slack Token',
    pattern: /xox[baprs]-[0-9a-zA-Z]{10,48}/g,
    varPrefix: 'SLACK_TOKEN',
    placeholder: 'xoxb-your_slack_token'
  }
];

function isFalsePositive(value) {
  if (!value || typeof value !== 'string') return true;
  const lower = value.toLowerCase();
  if (FALSE_POSITIVES.has(lower)) return true;
  if (/^(?:x{10,}|test|dummy|placeholder)$/i.test(value)) return true;
  return false;
}

function detectFramework(targetDir) {
  const pkgPath = path.join(targetDir, 'package.json');
  let hasVite = false;
  let hasNext = false;

  if (fs.existsSync(pkgPath)) {
    try {
      const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
      const deps = { ...(pkg.dependencies || {}), ...(pkg.devDependencies || {}) };
      if (deps['vite'] || fs.existsSync(path.join(targetDir, 'vite.config.js')) || fs.existsSync(path.join(targetDir, 'vite.config.ts'))) {
        hasVite = true;
      }
      if (deps['next'] || fs.existsSync(path.join(targetDir, 'next.config.js')) || fs.existsSync(path.join(targetDir, 'next.config.mjs'))) {
        hasNext = true;
      }
    } catch (_) {}
  }

  return { hasVite, hasNext };
}

function formatEnvExpression(varName, ext, framework, isClientFile = false) {
  let targetVar = varName;

  if (framework && framework.hasVite) {
    if (!targetVar.startsWith('VITE_')) {
      targetVar = `VITE_${targetVar}`;
    }
    return { expr: `import.meta.env.${targetVar}`, varName: targetVar };
  }

  if (framework && framework.hasNext && isClientFile) {
    if (!targetVar.startsWith('NEXT_PUBLIC_')) {
      targetVar = `NEXT_PUBLIC_${targetVar}`;
    }
    return { expr: `process.env.${targetVar}`, varName: targetVar };
  }

  if (['.js', '.ts', '.jsx', '.tsx', '.mjs', '.cjs'].includes(ext)) {
    return { expr: `process.env.${targetVar}`, varName: targetVar };
  }

  if (['.py'].includes(ext)) {
    return { expr: `os.getenv("${targetVar}")`, varName: targetVar };
  }

  if (['.php'].includes(ext)) {
    return { expr: `getenv('${targetVar}')`, varName: targetVar };
  }

  if (['.go'].includes(ext)) {
    return { expr: `os.Getenv("${targetVar}")`, varName: targetVar };
  }

  if (['.md', '.markdown'].includes(ext)) {
    return { expr: `process.env.${targetVar}`, varName: targetVar };
  }

  return { expr: `process.env.${targetVar}`, varName: targetVar };
}

function parseEnvFile(filePath) {
  const map = new Map();
  if (!fs.existsSync(filePath)) return map;
  const lines = fs.readFileSync(filePath, 'utf8').split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx !== -1) {
      const k = trimmed.slice(0, eqIdx).trim();
      let v = trimmed.slice(eqIdx + 1).trim();
      if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
        v = v.slice(1, -1);
      }
      map.set(k, v);
    }
  }
  return map;
}

const SENSITIVE_KEY_PATTERNS = [
  /^id_rsa(?:\.pub)?$/i,
  /^id_ed25519(?:\.pub)?$/i,
  /^id_ecdsa(?:\.pub)?$/i,
  /^id_dsa(?:\.pub)?$/i,
  /\.(?:pem|key|pkcs12|pfx|p12|jks|keystore)$/i,
  /(?:service[-_]?account|credentials|client_secret|firebase[-_]?admin).*\.json$/i
];

const SCRATCH_TEST_PATTERNS = [
  /^(?:teste?[-_]?(?:app|api|supabase|firebase|debug|scratch|tmp|temp)|scratch|debug)\.(?:js|ts|py|sh|json)$/i,
  /^temp_test.*$/i,
  /^test_temp.*$/i,
  /^(?:test|teste)[0-9]*\.(?:js|ts|py)$/i
];

function scanDirectoryForSensitiveFiles(targetDir, ignoredDirs = new Set(['node_modules', '.git'])) {
  const sensitiveKeys = [];
  const scratchTests = [];

  const officialScripts = new Set();
  try {
    const pkgPath = path.join(targetDir, 'package.json');
    if (fs.existsSync(pkgPath)) {
      const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
      if (pkg.scripts) {
        const scriptsStr = Object.values(pkg.scripts).join(' ');
        for (const token of scriptsStr.split(/\s+/)) {
          const clean = token.replace(/^[./\\]+/, '').replace(/\\/g, '/');
          if (clean) {
            officialScripts.add(path.basename(clean));
            officialScripts.add(clean);
          }
        }
      }
    }
  } catch (_) {}

  function walk(dir) {
    let entries = [];
    try {
      entries = fs.readdirSync(dir, { withFileTypes: true });
    } catch (_) {
      return;
    }

    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        if (!ignoredDirs.has(entry.name)) {
          walk(fullPath);
        }
        continue;
      }

      const fileName = entry.name;
      const relPath = path.relative(targetDir, fullPath).replace(/\\/g, '/');
      const isOfficialScript = officialScripts.has(fileName) || officialScripts.has(relPath);
      const isKeyName = SENSITIVE_KEY_PATTERNS.some(pat => pat.test(fileName));
      const isScratchTest = !isOfficialScript && SCRATCH_TEST_PATTERNS.some(pat => pat.test(fileName));
      let isKeyContent = false;

      if (!isKeyName && !isScratchTest && (entry.name.endsWith('.txt') || !entry.name.includes('.'))) {
        try {
          const sample = fs.readFileSync(fullPath, 'utf8').slice(0, 150);
          if (sample.includes('PRIVATE KEY-----') || sample.startsWith('ssh-rsa ') || sample.startsWith('ssh-ed25519 ')) {
            isKeyContent = true;
          }
        } catch (_) {}
      }

      let statSize = 0;
      try {
        statSize = fs.statSync(fullPath).size;
      } catch (_) {}

      const fileObj = {
        fullPath,
        relativePath: path.relative(targetDir, fullPath).replace(/\\/g, '/'),
        fileName,
        sizeBytes: statSize
      };

      if (isKeyName || isKeyContent) {
        sensitiveKeys.push(fileObj);
      } else if (isScratchTest) {
        scratchTests.push(fileObj);
      }
    }
  }

  walk(targetDir);
  const all = [...sensitiveKeys, ...scratchTests];
  all.sensitiveKeys = sensitiveKeys;
  all.scratchTests = scratchTests;
  return all;
}

function ensureGitIgnoreSafety(targetDir, sensitiveFiles = [], dryRun = false) {
  const gitIgnorePath = path.join(targetDir, '.gitignore');
  let content = '';
  if (fs.existsSync(gitIgnorePath)) {
    content = fs.readFileSync(gitIgnorePath, 'utf8');
  }

  const existingLines = new Set(content.split(/\r?\n/).map(l => l.trim()));
  const toAdd = [];

  const baseEntries = [
    '.env',
    '.env.local',
    '.env.*.local',
    '*.pem',
    '*.key',
    'id_rsa',
    'id_rsa.pub',
    'id_ed25519',
    'id_ed25519.pub',
    '*.pfx',
    '*.p12',
    '*serviceAccount*.json',
    '*credentials*.json',
    'temp_*',
    'tmp_*',
    '*scratch*',
    'test_temp*',
    'teste_temp*',
    '*.dump.sql'
  ];

  for (const item of baseEntries) {
    if (!existingLines.has(item)) {
      toAdd.push(item);
      existingLines.add(item);
    }
  }

  for (const sf of sensitiveFiles) {
    const rel = sf.relativePath;
    const base = sf.fileName;
    if (!existingLines.has(rel) && !existingLines.has(base)) {
      toAdd.push(rel);
      existingLines.add(rel);
    }
  }

  if (toAdd.length > 0) {
    if (!dryRun) {
      const prefix = content.length > 0 && !content.endsWith('\n') ? '\n' : '';
      const block = `${prefix}\n# Blindagem de Segredos e Chaves SSH (Clean Code)\n${toAdd.join('\n')}\n`;
      fs.appendFileSync(gitIgnorePath, block, 'utf8');
    }
    return { updated: true, added: toAdd };
  }

  return { updated: false, added: [] };
}

function ensureGitIgnoreHasEnv(targetDir, dryRun = false) {
  const res = ensureGitIgnoreSafety(targetDir, [], dryRun);
  return res.updated;
}

function updateEnvFiles(targetDir, extractedSecrets, dryRun = false) {
  const envPath = path.join(targetDir, '.env');
  const envExamplePath = path.join(targetDir, '.env.example');

  const existingEnv = parseEnvFile(envPath);
  const existingExample = parseEnvFile(envExamplePath);

  const newEnvEntries = [];
  const newExampleEntries = [];

  for (const item of extractedSecrets) {
    if (!existingEnv.has(item.varName)) {
      newEnvEntries.push(`${item.varName}="${item.secret}"`);
      existingEnv.set(item.varName, item.secret);
    }
    if (!existingExample.has(item.varName)) {
      newExampleEntries.push(`${item.varName}="${item.placeholder || 'your_' + item.varName.toLowerCase() + '_here'}"`);
      existingExample.set(item.varName, item.placeholder);
    }
  }

  if (!dryRun) {
    if (newEnvEntries.length > 0) {
      const prefix = fs.existsSync(envPath) && !fs.readFileSync(envPath, 'utf8').endsWith('\n') ? '\n' : '';
      fs.appendFileSync(envPath, prefix + newEnvEntries.join('\n') + '\n', 'utf8');
    }
    if (newExampleEntries.length > 0) {
      const prefix = fs.existsSync(envExamplePath) && !fs.readFileSync(envExamplePath, 'utf8').endsWith('\n') ? '\n' : '';
      fs.appendFileSync(envExamplePath, prefix + newExampleEntries.join('\n') + '\n', 'utf8');
    }
  }

  return {
    addedToEnv: newEnvEntries.length,
    addedToExample: newExampleEntries.length
  };
}

function scanAndSanitizeSecretsInContent(content, filePath, targetDir, secretRegistry, framework) {
  const ext = path.extname(filePath).toLowerCase();
  const isClientFile = content.includes('"use client"') || content.includes("'use client'") || filePath.includes('client') || filePath.includes('pages');
  let modifiedContent = content;
  const fileDetections = [];

  for (const rule of SECRET_RULES) {
    rule.pattern.lastIndex = 0;
    let match;
    while ((match = rule.pattern.exec(content)) !== null) {
      const secret = match[0];
      if (isFalsePositive(secret)) continue;

      let varInfo = secretRegistry.get(secret);
      if (!varInfo) {
        let candidateVar = rule.varPrefix;
        let counter = 1;
        const usedVars = new Set(Array.from(secretRegistry.values()).map(v => v.varName));
        while (usedVars.has(candidateVar)) {
          counter++;
          candidateVar = `${rule.varPrefix}_${counter}`;
        }
        const formatted = formatEnvExpression(candidateVar, ext, framework, isClientFile);
        varInfo = {
          varName: formatted.varName,
          expr: formatted.expr,
          secret,
          name: rule.name,
          placeholder: rule.placeholder
        };
        secretRegistry.set(secret, varInfo);
      } else {
        const formatted = formatEnvExpression(varInfo.varName, ext, framework, isClientFile);
        varInfo.expr = formatted.expr;
      }

      fileDetections.push({
        ruleId: rule.id,
        ruleName: rule.name,
        secret,
        varName: varInfo.varName,
        expr: varInfo.expr,
        placeholder: varInfo.placeholder
      });
    }
  }

  const genericAssignRegex = /(?:apiKey|api_key|secretKey|secret_key|accessToken|access_token|serviceRoleKey|private_key)\s*[:=]\s*(['"`])([a-zA-Z0-9_\-\.]{20,})\1/gi;
  let genericMatch;
  while ((genericMatch = genericAssignRegex.exec(content)) !== null) {
    const fullMatch = genericMatch[0];
    const secret = genericMatch[2];

    if (isFalsePositive(secret)) continue;
    if (secretRegistry.has(secret)) continue;

    let candidateVar = 'API_KEY';
    if (/serviceRole/i.test(fullMatch)) candidateVar = 'SERVICE_ROLE_KEY';
    else if (/secret/i.test(fullMatch)) candidateVar = 'SECRET_KEY';
    else if (/token/i.test(fullMatch)) candidateVar = 'ACCESS_TOKEN';

    let counter = 1;
    const usedVars = new Set(Array.from(secretRegistry.values()).map(v => v.varName));
    while (usedVars.has(candidateVar)) {
      counter++;
      candidateVar = `${candidateVar}_${counter}`;
    }

    const formatted = formatEnvExpression(candidateVar, ext, framework, isClientFile);
    const varInfo = {
      varName: formatted.varName,
      expr: formatted.expr,
      secret,
      name: 'Generic API Key / Secret',
      placeholder: 'your_' + formatted.varName.toLowerCase() + '_here'
    };
    secretRegistry.set(secret, varInfo);

    fileDetections.push({
      ruleId: 'GENERIC_KEY',
      ruleName: 'Generic API Key / Secret',
      secret,
      varName: varInfo.varName,
      expr: varInfo.expr,
      placeholder: varInfo.placeholder
    });
  }

  for (const det of fileDetections) {
    const doubleQuoted = `"${det.secret}"`;
    const singleQuoted = `'${det.secret}'`;
    const backticked = `\`${det.secret}\``;

    if (modifiedContent.includes(doubleQuoted)) {
      modifiedContent = modifiedContent.split(doubleQuoted).join(det.expr);
    } else if (modifiedContent.includes(singleQuoted)) {
      modifiedContent = modifiedContent.split(singleQuoted).join(det.expr);
    } else if (modifiedContent.includes(backticked)) {
      modifiedContent = modifiedContent.split(backticked).join(det.expr);
    } else if (ext === '.md' || ext === '.markdown') {
      modifiedContent = modifiedContent.split(det.secret).join(det.expr);
    }
  }

  return {
    hasChanges: modifiedContent !== content,
    modifiedContent,
    detections: fileDetections
  };
}

module.exports = {
  SECRET_RULES,
  FALSE_POSITIVES,
  detectFramework,
  formatEnvExpression,
  parseEnvFile,
  scanDirectoryForSensitiveFiles,
  ensureGitIgnoreSafety,
  ensureGitIgnoreHasEnv,
  updateEnvFiles,
  scanAndSanitizeSecretsInContent
};
