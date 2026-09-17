#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const {
  stripCommentsWithAst,
  stripCommentsFromCStyle,
  stripCommentsFromShellOrPython,
  stripCommentsFromHtmlAndTemplates,
  stripCommentsFromCss,
  stripCommentsFromConfig
} = require('./parsers');

const {
  detectFramework,
  scanDirectoryForSensitiveFiles,
  ensureGitIgnoreSafety,
  ensureGitIgnoreHasEnv,
  updateEnvFiles,
  scanAndSanitizeSecretsInContent
} = require('./secret_scanner');

const { generateAllAiRules, syncAiRules } = require('../templates/MULTI_AI_RULES');

const DEFAULT_IGNORED_DIRS = new Set([
  'node_modules',
  '.git',
  '.agents',
  '.gemini',
  '.cursor',
  'dist',
  'build',
  '.next',
  '.nuxt',
  '.turbo',
  'coverage',
  '.system_generated',
  'logs',
  'temp',
  'tmp',
  'venv',
  '.venv',
  '__pycache__',
  'out',
  '.vscode',
  '.idea',
  'target',
  'bin',
  'obj'
]);

const JS_EXTS = new Set(['.js', '.mjs', '.cjs', '.ts', '.tsx', '.jsx']);
const CSTYLE_EXTS = new Set(['.java', '.cs', '.php', '.cpp', '.c', '.h', '.hpp', '.go', '.rs', '.kt']);
const TEMPLATE_EXTS = new Set(['.html', '.htm', '.vue', '.svelte', '.astro']);
const SHELL_PYTHON_EXTS = new Set(['.sh', '.bash', '.py']);
const CSS_EXTS = new Set(['.css', '.scss', '.less']);
const CONFIG_EXTS = new Set(['.yaml', '.yml', '.toml', '.jsonc']);
const MARKDOWN_EXTS = new Set(['.md', '.markdown']);

let ts = null;
function resolveTypeScript(targetDir) {
  const candidates = [
    path.join(__dirname, '..', 'node_modules', 'typescript'),
    path.join(targetDir, 'node_modules', 'typescript'),
    path.join(process.cwd(), 'node_modules', 'typescript'),
    'typescript'
  ];

  for (const c of candidates) {
    try {
      return require(c);
    } catch (_) {}
  }
  return null;
}

function parseCliArgs() {
  const args = process.argv.slice(2);
  const options = {
    targetDir: process.cwd(),
    enforceRule: true,
    allRules: false,
    dryRun: false,
    verbose: false,
    update: false,
    setupHook: false,
    stagedOnly: false,
    sanitizeSecrets: true,
    secretsOnly: false,
    cleanTests: false,
    customIgnores: new Set()
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === '--update') {
      options.update = true;
    } else if (arg === '--hook' || arg === '--setup-hook') {
      options.setupHook = true;
    } else if (arg === '--staged') {
      options.stagedOnly = true;
    } else if (arg === '--all-rules') {
      options.allRules = true;
      options.enforceRule = true;
    } else if (arg === '--no-rule') {
      options.enforceRule = false;
    } else if (arg === '--rule' || arg === '--enforce-rule') {
      options.enforceRule = true;
    } else if (arg === '--sanitize-secrets') {
      options.sanitizeSecrets = true;
    } else if (arg === '--no-secrets') {
      options.sanitizeSecrets = false;
    } else if (arg === '--secrets-only') {
      options.secretsOnly = true;
      options.sanitizeSecrets = true;
    } else if (arg === '--clean-tests' || arg === '--purge-tests') {
      options.cleanTests = true;
    } else if (arg === '--dry-run') {
      options.dryRun = true;
    } else if (arg === '--verbose' || arg === '-v') {
      options.verbose = true;
    } else if (arg === '--ignore' && i + 1 < args.length) {
      options.customIgnores.add(args[++i]);
    } else if (!arg.startsWith('-')) {
      options.targetDir = path.resolve(arg);
    }
  }

  return options;
}

function handleUpdate() {
  console.log('\n================================================================');
  console.log('            ATUALIZAÇÃO AUTOMÁTICA - CLEAN CODE SKILL           ');
  console.log('================================================================');

  const rootSkillDir = path.resolve(__dirname, '..');
  const gitDir = path.join(rootSkillDir, '.git');

  if (fs.existsSync(gitDir)) {
    console.log(`Detectado repositório Git em: ${rootSkillDir}`);
    console.log('Executando "git pull origin main"...');
    try {
      const gitPull = execSync('git pull origin main', { cwd: rootSkillDir, stdio: 'pipe' }).toString();
      console.log(gitPull.trim());
      console.log('Atualizando dependências...');
      execSync('npm install --omit=dev --silent', { cwd: rootSkillDir, stdio: 'inherit' });
      console.log('\n[OK] Clean Code atualizado com sucesso via Git!');
    } catch (err) {
      console.error('Falha ao atualizar via Git:', err.message);
    }
  } else {
    console.log(`Atualizando instalação autônoma em: ${rootSkillDir}`);
    try {
      const tarUrl = 'https://github.com/Gumballxnz/clean-code/archive/refs/heads/main.tar.gz';
      const tempArchive = path.join(rootSkillDir, 'update_temp.tar.gz');
      execSync(`curl -fsSL "${tarUrl}" -o "${tempArchive}"`, { stdio: 'pipe' });
      execSync(`tar -xz -f "${tempArchive}" --strip-components=1 -C "${rootSkillDir}"`, { stdio: 'pipe' });
      if (fs.existsSync(tempArchive)) fs.unlinkSync(tempArchive);
      execSync('npm install --omit=dev --silent', { cwd: rootSkillDir, stdio: 'inherit' });
      console.log('\n[OK] Clean Code atualizado com sucesso com a versão mais recente do GitHub!');
    } catch (err) {
      console.error('Falha ao baixar atualização:', err.message);
      console.log('Você pode executar o instalador de 1 linha novamente para forçar a atualização.');
    }
  }
  console.log('================================================================\n');
}

function handleSetupHook(targetDir) {
  console.log('\n================================================================');
  console.log('          INSTALAÇÃO DO GIT PRE-COMMIT HOOK AUTOMÁTICO          ');
  console.log('================================================================');

  const gitDir = path.join(targetDir, '.git');
  if (!fs.existsSync(gitDir)) {
    console.error(`Erro: ${targetDir} não é um repositório Git (.git não encontrado).`);
    console.log('Execute "git init" antes de configurar o hook.');
    console.log('================================================================\n');
    return false;
  }

  const hooksDir = path.join(gitDir, 'hooks');
  if (!fs.existsSync(hooksDir)) {
    fs.mkdirSync(hooksDir, { recursive: true });
  }

  const preCommitHookPath = path.join(hooksDir, 'pre-commit');
  const cleanCodeScriptPath = path.resolve(__dirname, 'clean_code.js');

  const hookScriptContent = `#!/bin/sh
# Clean Code pre-commit hook
echo "🧹 Executando Clean Code nos arquivos staged..."
node "${cleanCodeScriptPath.replace(/\\/g, '/')}" --staged "${targetDir.replace(/\\/g, '/')}"
`;

  try {
    fs.writeFileSync(preCommitHookPath, hookScriptContent, { mode: 0o755 });
    console.log(`✓ Hook pre-commit criado com sucesso em: ${preCommitHookPath}`);
    console.log('A partir de agora, qualquer "git commit" executará a faxina automaticamente nos arquivos modificados!');
    console.log('================================================================\n');
    return true;
  } catch (err) {
    console.error(`Falha ao criar hook: ${err.message}`);
    console.log('================================================================\n');
    return false;
  }
}

function getStagedFiles(targetDir) {
  try {
    const output = execSync('git diff --cached --name-only --diff-filter=ACM', {
      cwd: targetDir,
      stdio: 'pipe'
    }).toString();
    return output
      .split('\n')
      .map(f => f.trim())
      .filter(Boolean)
      .map(f => path.join(targetDir, f));
  } catch (_) {
    return [];
  }
}

function loadCleanIgnore(targetDir) {
  const ignoreFile = path.join(targetDir, '.cleanignore');
  const ignores = new Set();
  if (fs.existsSync(ignoreFile)) {
    try {
      const lines = fs.readFileSync(ignoreFile, 'utf8').split('\n');
      for (const line of lines) {
        const trimmed = line.trim();
        if (trimmed && !trimmed.startsWith('#')) {
          ignores.add(trimmed);
        }
      }
    } catch (_) {}
  }
  return ignores;
}

function cleanSingleFile(fullPath, options, stats, secretContext = null) {
  const ext = path.extname(fullPath).toLowerCase();
  const isJs = JS_EXTS.has(ext);
  const isCStyle = CSTYLE_EXTS.has(ext);
  const isTemplate = TEMPLATE_EXTS.has(ext);
  const isShellOrPy = SHELL_PYTHON_EXTS.has(ext);
  const isCss = CSS_EXTS.has(ext);
  const isConfig = CONFIG_EXTS.has(ext);
  const isMarkdown = MARKDOWN_EXTS.has(ext);

  if (!isJs && !isCStyle && !isTemplate && !isShellOrPy && !isCss && !isConfig && !isMarkdown) {
    return;
  }

  stats.scannedFiles++;

  try {
    const original = fs.readFileSync(fullPath, 'utf8');
    const origLines = original.split('\n').length;
    let workingContent = original;
    let commentResult = null;

    if (!options.secretsOnly && !isMarkdown) {
      if (isJs) {
        if (!ts) ts = resolveTypeScript(options.targetDir);
        commentResult = stripCommentsWithAst(workingContent, ext, ts);
      } else if (isCStyle) {
        commentResult = stripCommentsFromCStyle(workingContent, ext);
      } else if (isTemplate) {
        commentResult = stripCommentsFromHtmlAndTemplates(workingContent, ext, ts);
      } else if (isShellOrPy) {
        commentResult = stripCommentsFromShellOrPython(workingContent);
      } else if (isCss) {
        commentResult = stripCommentsFromCss(workingContent);
      } else if (isConfig) {
        commentResult = stripCommentsFromConfig(workingContent, ext);
      }

      if (commentResult && commentResult.cleaned) {
        workingContent = commentResult.cleaned;
      }
    }

    let secretResult = null;
    if (options.sanitizeSecrets && secretContext) {
      secretResult = scanAndSanitizeSecretsInContent(
        workingContent,
        fullPath,
        options.targetDir,
        secretContext.registry,
        secretContext.framework
      );
      if (secretResult.hasChanges) {
        workingContent = secretResult.modifiedContent;
        stats.secretsSanitized += secretResult.detections.length;
        for (const det of secretResult.detections) {
          stats.sanitizedSecretsList.push({
            file: path.relative(options.targetDir, fullPath) || path.basename(fullPath),
            ruleName: det.ruleName,
            varName: det.varName,
            expr: det.expr
          });
        }
      }
    }

    if (workingContent !== original) {
      const finalLines = workingContent.split('\n').length;
      const linesDiff = Math.max(0, origLines - finalLines);

      if (!options.dryRun) {
        fs.writeFileSync(fullPath, workingContent, 'utf8');

        if (isJs && ext !== '.ts' && ext !== '.tsx' && ext !== '.jsx') {
          try {
            execSync(`node -c "${fullPath}"`, { stdio: 'pipe' });
          } catch (syntaxErr) {
            fs.writeFileSync(fullPath, original, 'utf8');
            stats.errors.push(`Sintaxe inválida detectada e revertida em ${path.relative(options.targetDir, fullPath)}: ${syntaxErr.message}`);
            return;
          }
        }

        if (options.stagedOnly) {
          try {
            execSync(`git add "${fullPath}"`, { cwd: options.targetDir, stdio: 'pipe' });
          } catch (_) {}
        }
      }

      stats.filesCleaned++;
      stats.linesRemoved += linesDiff;
      if (commentResult) {
        stats.totalBlockComments += commentResult.blockCommentsCount || 0;
        stats.totalLineComments += commentResult.lineCommentsCount || 0;
      }

      stats.cleanedDetails.push({
        filePath: path.relative(options.targetDir, fullPath) || path.basename(fullPath),
        originalLines: origLines,
        newLines: finalLines,
        linesRemoved: linesDiff,
        reductionPercent: origLines > 0 ? ((linesDiff / origLines) * 100).toFixed(1) : 0,
        blockComments: commentResult ? commentResult.blockCommentsCount || 0 : 0,
        lineComments: commentResult ? commentResult.lineCommentsCount || 0 : 0,
        secretsCount: secretResult ? secretResult.detections.length : 0
      });
    }
  } catch (err) {
    stats.errors.push(`Falha ao processar ${fullPath}: ${err.message}`);
  }
}

function processDirectory(targetDir, options, ignoredDirs, stats = {
  scannedFiles: 0,
  filesCleaned: 0,
  linesRemoved: 0,
  totalBlockComments: 0,
  totalLineComments: 0,
  secretsSanitized: 0,
  sanitizedSecretsList: [],
  cleanedDetails: [],
  errors: []
}, secretContext = null) {
  let entries = [];
  try {
    entries = fs.readdirSync(targetDir, { withFileTypes: true });
  } catch (err) {
    stats.errors.push(`Erro ao acessar diretório ${targetDir}: ${err.message}`);
    return stats;
  }

  for (const entry of entries) {
    const fullPath = path.join(targetDir, entry.name);

    const relPath = path.relative(options.targetDir, fullPath).replace(/\\/g, '/');
    const isIgnored = ignoredDirs.has(entry.name) || ignoredDirs.has(relPath) || Array.from(ignoredDirs).some(ig => {
      if (ig.includes('*')) {
        const regex = new RegExp('^' + ig.replace(/\./g, '\\.').replace(/\*/g, '.*') + '$');
        return regex.test(relPath) || regex.test(entry.name);
      }
      return false;
    });

    if (isIgnored) continue;

    if (entry.isDirectory()) {
      processDirectory(fullPath, options, ignoredDirs, stats, secretContext);
      continue;
    }

    cleanSingleFile(fullPath, options, stats, secretContext);
  }

  return stats;
}

function ensureAiDirectiveRule(targetDir, allRules = false) {
  try {
    return syncAiRules(targetDir, { allRules });
  } catch (err) {
    return {
      detected: [],
      configured: [{ status: 'error', file: 'GEMINI.md', error: err.message }]
    };
  }
}

function printDetailedReport(stats, options, durationMs, ruleResult, gitInfo = null, envSyncResult = null, sensitiveFiles = [], gitIgnoreSafetyResult = null) {
  console.log('\n================================================================');
  console.log('                 RELATÓRIO DETALHADO - CLEAN CODE               ');
  console.log('================================================================');
  console.log(`Diretório analisado: ${options.targetDir}`);
  console.log(`Modo de execução:    ${options.dryRun ? 'DRY-RUN (Simulação)' : options.stagedOnly ? 'STAGED (Pré-Commit)' : 'FAVORITO / ATIVO'}`);
  console.log(`Tempo de varredura:  ${durationMs}ms`);
  console.log('----------------------------------------------------------------');
  console.log(`Total de arquivos varridos:    ${stats.scannedFiles}`);
  console.log(`Arquivos limpos e otimizados:  ${stats.filesCleaned}`);
  console.log(`Linhas totais eliminadas:      ${stats.linesRemoved}`);
  console.log(`Comentários em bloco (JSDoc):  ${stats.totalBlockComments}`);
  console.log(`Comentários de linha única:    ${stats.totalLineComments}`);
  console.log(`Credenciais sanitizadas:       ${stats.secretsSanitized}`);
  console.log('----------------------------------------------------------------');

  if (stats.cleanedDetails.length > 0) {
    console.log('\nDETALHES POR ARQUIVO:');
    stats.cleanedDetails.forEach(item => {
      const secInfo = item.secretsCount > 0 ? ` | 🛡️ Segredos extraídos: ${item.secretsCount}` : '';
      console.log(` • ${item.filePath}`);
      console.log(`   - Linhas: ${item.originalLines} -> ${item.newLines} (-${item.linesRemoved} linhas | -${item.reductionPercent}%)${secInfo}`);
      console.log(`   - Blocos JSDoc/Multi-linha: ${item.blockComments} | Linhas // ou #: ${item.lineComments}`);
    });
  } else {
    console.log('\nNenhum arquivo necessitou de limpeza. Todo o código já está puro!');
  }

  const sensitiveKeys = (sensitiveFiles && sensitiveFiles.sensitiveKeys) || [];
  const scratchTests = (sensitiveFiles && sensitiveFiles.scratchTests) || [];

  if (sensitiveKeys.length > 0) {
    console.log('\n----------------------------------------------------------------');
    console.log(`SEGURANÇA: CHAVES SSH & ARQUIVOS PRIVADOS PROTEGIDOS (${sensitiveKeys.length}):`);
    sensitiveKeys.forEach(f => {
      console.log(` 🔒 ${f.relativePath} (${(f.sizeBytes / 1024).toFixed(1)} KB)`);
    });
  }

  if (scratchTests.length > 0) {
    console.log('\n----------------------------------------------------------------');
    console.log(`ARQUIVOS DE TESTE / RASCUNHOS MAPEADOS (${scratchTests.length} encontrados):`);
    scratchTests.forEach(f => {
      console.log(` 🧪 ${f.relativePath} (${(f.sizeBytes / 1024).toFixed(1)} KB)`);
    });
    console.log('\n 🔒 Todos os rascunhos de teste foram blindados no .gitignore contra vazamentos.');
    console.log(' 💡 Deseja deletar esses arquivos de teste ou eles ainda têm utilidade no seu projeto?');
    console.log('    (Para deletá-los automaticamente com segurança, rode: clean-code --clean-tests)');
  }

  if (stats.testsDeleted && stats.testsDeleted > 0) {
    console.log(`\n 🗑️ ${stats.testsDeleted} arquivo(s) de teste/rascunho deletado(s) conforme solicitado (--clean-tests).`);
  }

  if (gitIgnoreSafetyResult && gitIgnoreSafetyResult.updated) {
    console.log(`\n • Proteção no .gitignore aplicada para: ${gitIgnoreSafetyResult.added.join(', ')}`);
  }

  if (stats.secretsSanitized > 0 || (envSyncResult && (envSyncResult.addedToEnv > 0 || envSyncResult.addedToExample > 0))) {
    console.log('\n----------------------------------------------------------------');
    console.log('SEGURANÇA: CREDENCIAIS SANITIZADAS & MIGRADAS PARA O .ENV:');
    console.log(` • Credenciais isoladas no código:    ${stats.secretsSanitized}`);
    if (envSyncResult) {
      console.log(` • Variáveis adicionadas ao .env:      ${envSyncResult.addedToEnv}`);
      console.log(` • Placeholders no .env.example:       ${envSyncResult.addedToExample}`);
      console.log(` • Blindagem ativa no .gitignore:      SIM (.env protegido contra commits)`);
    }
    if (stats.sanitizedSecretsList.length > 0) {
      console.log('\nLISTA DE SEGREDO(S) PROTEGIDO(S):');
      stats.sanitizedSecretsList.forEach(item => {
        console.log(`   - [${item.ruleName}] ${item.file} -> ${item.expr}`);
      });
    }
  }

  if (ruleResult && ruleResult.configured) {
    console.log('\n----------------------------------------------------------------');
    console.log('DIRETRIZES PERSISTENTES PARA IA:');
    if (ruleResult.detected && ruleResult.detected.length > 0) {
      console.log(` • Ambientes de IA detectados: ${ruleResult.detected.join(', ')}`);
    }
    ruleResult.configured.forEach(res => {
      const tag = res.providerName ? `[${res.providerName}]` : '';
      if (res.status === 'migrated') {
        console.log(` 📦 ${tag} ${res.file} (raiz limpa).`);
      } else if (res.status === 'created') {
        console.log(` ✓ ${tag} Arquivo ${res.file} criado com sucesso!`);
      } else if (res.status === 'updated') {
        console.log(` ✓ ${tag} Diretriz anexada ao ${res.file} com sucesso.`);
      } else if (res.status === 'already_present') {
        console.log(` ✓ ${tag} Diretriz já ativa em ${res.file}.`);
      } else if (res.status === 'error') {
        console.log(` ! Falha ao configurar ${res.file}: ${res.error}`);
      }
    });
  }

  if (gitInfo && stats.filesCleaned > 0) {
    console.log('\n----------------------------------------------------------------');
    console.log('REPOSITÓRIO GIT DETECTADO:');
    console.log(` • Branch ativa: ${gitInfo.branch || 'main'}`);
    if (gitInfo.remoteUrl) {
      console.log(` • Remoto configurado: ${gitInfo.remoteUrl}`);
    }
    console.log(' 💡 Pergunte ao usuário se deseja enviar as alterações:');
    console.log(`    git commit -am "chore: clean code" && git push origin ${gitInfo.branch || 'main'}`);
  }

  if (stats.errors.length > 0) {
    console.log('\n----------------------------------------------------------------');
    console.log(`ALERTAS E REVERSÕES PREVENTIVAS (${stats.errors.length}):`);
    stats.errors.forEach(err => console.error(` ! ${err}`));
  }

  console.log('================================================================\n');
}

function getGitRepoInfo(targetDir) {
  try {
    const isGit = execSync('git rev-parse --is-inside-work-tree', { cwd: targetDir, stdio: 'pipe' }).toString().trim() === 'true';
    if (!isGit) return null;

    let branch = '';
    try {
      branch = execSync('git rev-parse --abbrev-ref HEAD', { cwd: targetDir, stdio: 'pipe' }).toString().trim();
    } catch (_) {}

    let remoteUrl = '';
    try {
      remoteUrl = execSync('git remote get-url origin', { cwd: targetDir, stdio: 'pipe' }).toString().trim();
    } catch (_) {}

    return { isGit: true, branch, remoteUrl };
  } catch (_) {
    return null;
  }
}

function main() {
  const startTime = Date.now();
  const options = parseCliArgs();

  if (options.update) {
    handleUpdate();
    return;
  }

  if (options.setupHook) {
    handleSetupHook(options.targetDir);
    return;
  }

  ts = resolveTypeScript(options.targetDir);

  const secretRegistry = new Map();
  const framework = detectFramework(options.targetDir);
  const secretContext = { registry: secretRegistry, framework };

  const stats = {
    scannedFiles: 0,
    filesCleaned: 0,
    linesRemoved: 0,
    totalBlockComments: 0,
    totalLineComments: 0,
    secretsSanitized: 0,
    sanitizedSecretsList: [],
    cleanedDetails: [],
    errors: []
  };

  const ignoredDirs = new Set(DEFAULT_IGNORED_DIRS);
  const cleanIgnore = loadCleanIgnore(options.targetDir);
  for (const item of cleanIgnore) ignoredDirs.add(item);
  for (const item of options.customIgnores) ignoredDirs.add(item);

  let sensitiveFiles = [];
  let gitIgnoreSafetyResult = null;
  if (!options.stagedOnly) {
    sensitiveFiles = scanDirectoryForSensitiveFiles(options.targetDir, ignoredDirs);
    gitIgnoreSafetyResult = ensureGitIgnoreSafety(options.targetDir, sensitiveFiles, options.dryRun);

    if (options.cleanTests && !options.dryRun && sensitiveFiles.scratchTests && sensitiveFiles.scratchTests.length > 0) {
      stats.testsDeleted = 0;
      for (const sf of sensitiveFiles.scratchTests) {
        try {
          if (fs.existsSync(sf.fullPath)) {
            fs.unlinkSync(sf.fullPath);
            stats.testsDeleted++;
          }
        } catch (_) {}
      }
    }
  }

  if (options.stagedOnly) {
    const stagedFiles = getStagedFiles(options.targetDir);
    for (const file of stagedFiles) {
      cleanSingleFile(file, options, stats, secretContext);
    }
  } else {
    processDirectory(options.targetDir, options, ignoredDirs, stats, secretContext);
  }

  let envSyncResult = null;
  if (options.sanitizeSecrets && secretRegistry.size > 0) {
    envSyncResult = updateEnvFiles(options.targetDir, Array.from(secretRegistry.values()), options.dryRun);
  }

  let ruleResult = null;
  if (options.enforceRule && !options.dryRun && !options.stagedOnly) {
    ruleResult = ensureAiDirectiveRule(options.targetDir, options.allRules);
  }

  const gitInfo = getGitRepoInfo(options.targetDir);
  const durationMs = Date.now() - startTime;
  printDetailedReport(stats, options, durationMs, ruleResult, gitInfo, envSyncResult, sensitiveFiles, gitIgnoreSafetyResult);
}

if (require.main === module) {
  main();
}

module.exports = {
  processDirectory,
  cleanSingleFile,
  ensureAiDirectiveRule,
  handleSetupHook
};
