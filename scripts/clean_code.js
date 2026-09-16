#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const DEFAULT_IGNORED_DIRS = new Set([
  'node_modules',
  '.git',
  '.agents',
  '.gemini',
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
  '.idea'
]);

const JS_EXTS = new Set(['.js', '.mjs', '.cjs', '.ts', '.tsx', '.jsx']);
const SHELL_PYTHON_EXTS = new Set(['.sh', '.bash', '.py']);
const CSS_EXTS = new Set(['.css', '.scss', '.less']);

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
    dryRun: false,
    verbose: false,
    customIgnores: new Set()
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === '--no-rule') {
      options.enforceRule = false;
    } else if (arg === '--rule' || arg === '--enforce-rule') {
      options.enforceRule = true;
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

function stripCommentsWithAst(code, ext) {
  if (!ts) ts = resolveTypeScript(process.cwd());
  if (!ts) return null;
  const isJsx = ext === '.tsx' || ext === '.jsx';
  const scriptKind = ext === '.tsx' ? ts.ScriptKind.TSX :
                     ext === '.jsx' ? ts.ScriptKind.JSX :
                     ext === '.ts'  ? ts.ScriptKind.TS : ts.ScriptKind.JS;

  const sf = ts.createSourceFile('file' + ext, code, ts.ScriptTarget.Latest, true, scriptKind);
  const comments = [];

  function visit(node) {
    const leading = ts.getLeadingCommentRanges(code, node.getFullStart()) || [];
    const trailing = ts.getTrailingCommentRanges(code, node.getEnd()) || [];
    for (const c of [...leading, ...trailing]) comments.push(c);
    ts.forEachChild(node, visit);
  }
  visit(sf);

  const unique = Array.from(new Map(comments.map(c => [c.pos, c])).values());
  unique.sort((a, b) => b.pos - a.pos);

  let result = code;
  let blockCommentsCount = 0;
  let lineCommentsCount = 0;

  for (const c of unique) {
    const commentText = code.slice(c.pos, c.end);
    if (
      commentText.includes('eslint-disable') ||
      commentText.includes('prettier-ignore') ||
      commentText.includes('@license') ||
      commentText.includes('@ts-expect-error') ||
      commentText.includes('@ts-ignore') ||
      commentText.includes('istanbul ignore')
    ) {
      continue;
    }

    if (c.kind === ts.SyntaxKind.MultiLineCommentTrivia) {
      blockCommentsCount++;
    } else {
      lineCommentsCount++;
    }

    result = result.slice(0, c.pos) + result.slice(c.end);
  }

  const cleaned = result
    .split('\n')
    .map(line => line.replace(/\s+$/, ''))
    .join('\n')
    .replace(/^\s*\{\s*\}\s*$\n/gm, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim() + '\n';

  return {
    cleaned,
    blockCommentsCount,
    lineCommentsCount
  };
}

function stripCommentsFromShellOrPython(content) {
  let result = '';
  let i = 0;
  const len = content.length;

  let inSingleQuote = false;
  let inDoubleQuote = false;
  let inComment = false;
  let commentsRemoved = 0;

  if (content.startsWith('#!')) {
    const firstLineEnd = content.indexOf('\n');
    if (firstLineEnd !== -1) {
      result += content.slice(0, firstLineEnd + 1);
      i = firstLineEnd + 1;
    }
  }

  while (i < len) {
    const ch = content[i];

    if (inComment) {
      if (ch === '\n') {
        inComment = false;
        result += ch;
      }
      i++;
      continue;
    }

    if (inSingleQuote) {
      result += ch;
      if (ch === '\\' && i + 1 < len) {
        result += content[i + 1];
        i += 2;
        continue;
      }
      if (ch === '\'') inSingleQuote = false;
      i++;
      continue;
    }

    if (inDoubleQuote) {
      result += ch;
      if (ch === '\\' && i + 1 < len) {
        result += content[i + 1];
        i += 2;
        continue;
      }
      if (ch === '"') inDoubleQuote = false;
      i++;
      continue;
    }

    if (ch === '\'') {
      inSingleQuote = true;
      result += ch;
      i++;
      continue;
    }

    if (ch === '"') {
      inDoubleQuote = true;
      result += ch;
      i++;
      continue;
    }

    if (ch === '#') {
      inComment = true;
      commentsRemoved++;
      i++;
      continue;
    }

    result += ch;
    i++;
  }

  const cleaned = result
    .split('\n')
    .map(line => line.replace(/\s+$/, ''))
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim() + '\n';

  return {
    cleaned,
    blockCommentsCount: 0,
    lineCommentsCount: commentsRemoved
  };
}

function stripCommentsFromCss(content) {
  let commentsRemoved = 0;
  const cleaned = content.replace(/\/\*[\s\S]*?\*\//g, (match) => {
    if (match.includes('@license')) return match;
    commentsRemoved++;
    return '';
  })
    .split('\n')
    .map(line => line.replace(/\s+$/, ''))
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim() + '\n';

  return {
    cleaned,
    blockCommentsCount: commentsRemoved,
    lineCommentsCount: 0
  };
}

function processDirectory(targetDir, options, ignoredDirs, stats = {
  scannedFiles: 0,
  filesCleaned: 0,
  linesRemoved: 0,
  totalBlockComments: 0,
  totalLineComments: 0,
  cleanedDetails: [],
  errors: []
}) {
  let entries = [];
  try {
    entries = fs.readdirSync(targetDir, { withFileTypes: true });
  } catch (err) {
    stats.errors.push(`Erro ao acessar diretório ${targetDir}: ${err.message}`);
    return stats;
  }

  for (const entry of entries) {
    const fullPath = path.join(targetDir, entry.name);

    if (entry.isDirectory()) {
      if (!ignoredDirs.has(entry.name)) {
        processDirectory(fullPath, options, ignoredDirs, stats);
      }
      continue;
    }

    const ext = path.extname(entry.name).toLowerCase();
    const isJs = JS_EXTS.has(ext);
    const isShellOrPy = SHELL_PYTHON_EXTS.has(ext);
    const isCss = CSS_EXTS.has(ext);

    if (!isJs && !isShellOrPy && !isCss) continue;

    stats.scannedFiles++;

    try {
      const original = fs.readFileSync(fullPath, 'utf8');
      const origLines = original.split('\n').length;
      let result = null;

      if (isJs) {
        result = stripCommentsWithAst(original, ext);
      } else if (isShellOrPy) {
        result = stripCommentsFromShellOrPython(original);
      } else if (isCss) {
        result = stripCommentsFromCss(original);
      }

      if (result && result.cleaned !== original) {
        const linesDiff = Math.max(0, origLines - result.cleaned.split('\n').length);

        if (!options.dryRun) {
          fs.writeFileSync(fullPath, result.cleaned, 'utf8');

          if (isJs && ext !== '.ts' && ext !== '.tsx' && ext !== '.jsx') {
            try {
              execSync(`node -c "${fullPath}"`, { stdio: 'pipe' });
            } catch (syntaxErr) {
              fs.writeFileSync(fullPath, original, 'utf8');
              stats.errors.push(`Sintaxe inválida detectada e revertida em ${path.relative(options.targetDir, fullPath)}: ${syntaxErr.message}`);
              continue;
            }
          }
        }

        stats.filesCleaned++;
        stats.linesRemoved += linesDiff;
        stats.totalBlockComments += result.blockCommentsCount;
        stats.totalLineComments += result.lineCommentsCount;

        stats.cleanedDetails.push({
          filePath: path.relative(options.targetDir, fullPath) || path.basename(fullPath),
          originalLines: origLines,
          newLines: result.cleaned.split('\n').length,
          linesRemoved: linesDiff,
          reductionPercent: origLines > 0 ? ((linesDiff / origLines) * 100).toFixed(1) : 0,
          blockComments: result.blockCommentsCount,
          lineComments: result.lineCommentsCount
        });
      }
    } catch (err) {
      stats.errors.push(`Falha ao processar ${fullPath}: ${err.message}`);
    }
  }

  return stats;
}

function ensureAiDirectiveRule(targetDir) {
  const geminiMdPath = path.join(targetDir, 'GEMINI.md');
  const templatePath = path.join(__dirname, '..', 'templates', 'GEMINI_RULE.md');
  let ruleTemplate = '';

  if (fs.existsSync(templatePath)) {
    ruleTemplate = fs.readFileSync(templatePath, 'utf8');
  } else {
    ruleTemplate = `# Clean Code Directive\n\n- Write pure, self-documenting code.\n- Do NOT add unnecessary, redundant, or explanatory comments inside code files.\n- Preserve only critical compiler/linter directives.\n`;
  }

  try {
    if (!fs.existsSync(geminiMdPath)) {
      fs.writeFileSync(geminiMdPath, ruleTemplate, 'utf8');
      return { status: 'created', file: 'GEMINI.md' };
    } else {
      const existing = fs.readFileSync(geminiMdPath, 'utf8');
      if (!existing.includes('Clean Code Directive') && !existing.includes('clean-code')) {
        fs.appendFileSync(geminiMdPath, '\n\n' + ruleTemplate, 'utf8');
        return { status: 'updated', file: 'GEMINI.md' };
      }
      return { status: 'already_present', file: 'GEMINI.md' };
    }
  } catch (err) {
    return { status: 'error', error: err.message };
  }
}

function printDetailedReport(stats, options, durationMs, ruleResult) {
  console.log('\n================================================================');
  console.log('                 RELATÓRIO DETALHADO - CLEAN CODE               ');
  console.log('================================================================');
  console.log(`Diretório analisado: ${options.targetDir}`);
  console.log(`Modo de execução:    ${options.dryRun ? 'DRY-RUN (Simulação)' : 'FAVORITO / ATIVO'}`);
  console.log(`Tempo de varredura:  ${durationMs}ms`);
  console.log('----------------------------------------------------------------');
  console.log(`Total de arquivos varridos:    ${stats.scannedFiles}`);
  console.log(`Arquivos limpos e otimizados:  ${stats.filesCleaned}`);
  console.log(`Linhas totais eliminadas:      ${stats.linesRemoved}`);
  console.log(`Comentários em bloco (JSDoc):  ${stats.totalBlockComments}`);
  console.log(`Comentários de linha única:    ${stats.totalLineComments}`);
  console.log('----------------------------------------------------------------');

  if (stats.cleanedDetails.length > 0) {
    console.log('\nDETALHES POR ARQUIVO:');
    stats.cleanedDetails.forEach(item => {
      console.log(` • ${item.filePath}`);
      console.log(`   - Linhas: ${item.originalLines} -> ${item.newLines} (-${item.linesRemoved} linhas | -${item.reductionPercent}%)`);
      console.log(`   - Blocos JSDoc/Multi-linha: ${item.blockComments} | Linhas //: ${item.lineComments}`);
    });
  } else {
    console.log('\nNenhum arquivo necessitou de limpeza. Todo o código já está puro!');
  }

  if (ruleResult) {
    console.log('\n----------------------------------------------------------------');
    console.log('DIRETRIZ PERSISTENTE PARA IA:');
    if (ruleResult.status === 'created') {
      console.log(` ✓ Arquivo ${ruleResult.file} criado com sucesso! As IAs não comentarão mais este projeto.`);
    } else if (ruleResult.status === 'updated') {
      console.log(` ✓ Diretriz anexada ao ${ruleResult.file} existente com sucesso.`);
    } else if (ruleResult.status === 'already_present') {
      console.log(` ✓ Diretriz de Clean Code já estava ativa no ${ruleResult.file}.`);
    } else if (ruleResult.status === 'error') {
      console.log(` ! Não foi possível aplicar a regra no GEMINI.md: ${ruleResult.error}`);
    }
  }

  if (stats.errors.length > 0) {
    console.log('\n----------------------------------------------------------------');
    console.log(`ALERTAS E REVERSÕES PREVENTIVAS (${stats.errors.length}):`);
    stats.errors.forEach(err => console.error(` ! ${err}`));
  }

  console.log('================================================================\n');
}

function main() {
  const startTime = Date.now();
  const options = parseCliArgs();

  ts = resolveTypeScript(options.targetDir);
  if (!ts) {
    console.warn('Aviso: TypeScript compiler API não foi encontrado globalmente nem localmente. Recomenda-se rodar "npm install".');
  }

  const ignoredDirs = new Set(DEFAULT_IGNORED_DIRS);
  const cleanIgnore = loadCleanIgnore(options.targetDir);
  for (const item of cleanIgnore) ignoredDirs.add(item);
  for (const item of options.customIgnores) ignoredDirs.add(item);

  const stats = processDirectory(options.targetDir, options, ignoredDirs);

  let ruleResult = null;
  if (options.enforceRule && !options.dryRun) {
    ruleResult = ensureAiDirectiveRule(options.targetDir);
  }

  const durationMs = Date.now() - startTime;
  printDetailedReport(stats, options, durationMs, ruleResult);
}

if (require.main === module) {
  main();
}

module.exports = {
  stripCommentsWithAst,
  stripCommentsFromShellOrPython,
  stripCommentsFromCss,
  processDirectory,
  ensureAiDirectiveRule
};
