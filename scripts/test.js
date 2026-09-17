const assert = require('assert');
const path = require('path');
const fs = require('fs');
const {
  stripCommentsWithAst,
  stripCommentsFromCStyle,
  stripCommentsFromShellOrPython,
  stripCommentsFromHtmlAndTemplates,
  stripCommentsFromCss,
  stripCommentsFromConfig
} = require('./parsers');

const { generateAllAiRules } = require('../templates/MULTI_AI_RULES');

console.log('--- Iniciando Testes Unitários de Clean Code v1.1.0 ---');

const pyCode = `#!/usr/bin/env python3\n# Comentário de cabeçalho\nurl = "http://example.com#anchor"\n# Outro comentário\nprint('Hello # world') # linha comentada\n`;
const pyResult = stripCommentsFromShellOrPython(pyCode);
assert.ok(pyResult.cleaned.startsWith('#!/usr/bin/env python3'), 'Shebang deve ser mantido');
assert.ok(pyResult.cleaned.includes('http://example.com#anchor'), 'URL com # deve ser preservada');
assert.ok(pyResult.cleaned.includes("Hello # world"), 'String com # deve ser preservada');
assert.ok(!pyResult.cleaned.includes('Comentário de cabeçalho'), 'Comentário deve ser removido');
assert.strictEqual(pyResult.lineCommentsCount, 3, 'Deve contar 3 comentários de linha');
console.log('✓ 1. Teste Python/Shell passou!');

const cssCode = `/* @license MIT */\n/* Comentário desnecessário */\nbody {\n  color: red; /* cor do texto */\n}\n`;
const cssResult = stripCommentsFromCss(cssCode);
assert.ok(cssResult.cleaned.includes('@license MIT'), 'Licença deve ser preservada');
assert.ok(!cssResult.cleaned.includes('Comentário desnecessário'), 'Comentário normal deve ser removido');
console.log('✓ 2. Teste CSS passou!');

let ts = null;
try {
  ts = require('typescript');
} catch (_) {
  try {
    ts = require(path.join(__dirname, '..', 'node_modules', 'typescript'));
  } catch (_) {}
}

const jsCode = `/**\n * Funcao de soma\n * @param {number} a\n * @returns {number}\n */\n// eslint-disable-next-line no-unused-vars\nconst add = (a, b) => {\n  // soma dois valores\n  return a + b; /* retorno */\n};\n`;
const jsResult = stripCommentsWithAst(jsCode, '.js', ts);
if (jsResult) {
  assert.ok(jsResult.cleaned.includes('eslint-disable-next-line'), 'Diretiva eslint deve ser preservada');
  assert.ok(!jsResult.cleaned.includes('Funcao de soma'), 'JSDoc deve ser removido');
  assert.ok(!jsResult.cleaned.includes('soma dois valores'), 'Comentário de linha deve ser removido');
  assert.ok(!jsResult.cleaned.includes('/* retorno */'), 'Comentário inline de bloco deve ser removido');
  console.log('✓ 3. Teste JavaScript / TypeScript AST passou!');
}

const cstyleCode = `// @license MIT\n// Comentário de classe\npublic class App {\n  // Campo de texto\n  private String msg = "Texto com // barras e \\"aspas\\"";\n  /* Bloco de comentário */\n  public void run() {\n    System.out.println(msg); // print\n  }\n}\n`;
const cstyleResult = stripCommentsFromCStyle(cstyleCode, '.java');
assert.ok(cstyleResult.cleaned.includes('// @license MIT'), 'Licença deve ser preservada');
assert.ok(cstyleResult.cleaned.includes('Texto com // barras'), 'String com barras duplas deve ser preservada');
assert.ok(!cstyleResult.cleaned.includes('Comentário de classe'), 'Comentário // deve ser removido');
assert.ok(!cstyleResult.cleaned.includes('Bloco de comentário'), 'Comentário /* */ deve ser removido');
assert.strictEqual(cstyleResult.blockCommentsCount, 1, '1 bloco removido');
console.log('✓ 4. Teste C-Style (Java/C#/Go/Rust) passou!');

const htmlCode = `<!DOCTYPE html>\n<!-- Comentário no HTML -->\n<!--[if IE]><p>IE</p><![endif]-->\n<div id="app">\n  <!-- Comentário do componente -->\n  <h1>Olá Mundo</h1>\n</div>\n`;
const htmlResult = stripCommentsFromHtmlAndTemplates(htmlCode, '.html', ts);
assert.ok(htmlResult.cleaned.includes('<!--[if IE]><p>IE</p><![endif]-->'), 'Condicional IE preservada');
assert.ok(!htmlResult.cleaned.includes('Comentário no HTML'), 'Comentário HTML removido');
assert.ok(!htmlResult.cleaned.includes('Comentário do componente'), 'Comentário do componente removido');
console.log('✓ 5. Teste HTML / Templates passou!');

const yamlCode = `# Configuração geral\nserver:\n  port: 8080 # porta principal\n  url: "http://example.com#api" # endpoint\n`;
const yamlResult = stripCommentsFromConfig(yamlCode, '.yaml');
assert.ok(yamlResult.cleaned.includes('http://example.com#api'), 'URL com # dentro de aspas deve ser preservada');
assert.ok(!yamlResult.cleaned.includes('Configuração geral'), 'Comentário de cabeçalho YAML removido');
assert.ok(!yamlResult.cleaned.includes('porta principal'), 'Comentário inline YAML removido');
console.log('✓ 6. Teste YAML / Config passou!');

const tempDir = path.join(__dirname, '..', 'temp_multi_ai_test');
if (fs.existsSync(tempDir)) fs.rmSync(tempDir, { recursive: true, force: true });
fs.mkdirSync(tempDir, { recursive: true });

const multiAiResults = generateAllAiRules(tempDir);
assert.ok(multiAiResults.length >= 8, 'Deve gerar arquivos de regras para 8+ IAs');
assert.ok(fs.existsSync(path.join(tempDir, '.agents', 'GEMINI.md')), '.agents/GEMINI.md gerado');
assert.ok(fs.existsSync(path.join(tempDir, '.cursorrules')), '.cursorrules gerado');
assert.ok(fs.existsSync(path.join(tempDir, '.cursor', 'rules', 'clean-code.mdc')), '.cursor/rules/clean-code.mdc gerado');
assert.ok(fs.existsSync(path.join(tempDir, '.windsurfrules')), '.windsurfrules gerado');
assert.ok(fs.existsSync(path.join(tempDir, '.github', 'copilot-instructions.md')), 'copilot-instructions.md gerado');
assert.ok(fs.existsSync(path.join(tempDir, 'CLAUDE.md')), 'CLAUDE.md gerado');
assert.ok(fs.existsSync(path.join(tempDir, 'CODEX.md')), 'CODEX.md gerado');
assert.ok(fs.existsSync(path.join(tempDir, '.clinerules')), '.clinerules gerado');
fs.rmSync(tempDir, { recursive: true, force: true });
console.log('✓ 7. Teste Gerador Multi-IA (com Codex) passou!');

const { detectActiveAiEnvironments } = require('../templates/MULTI_AI_RULES');
const simulatedEnv = { CURSOR_VERSION: '0.42.0', ANTHROPIC_API_KEY: 'sk-ant-test' };
const detected = detectActiveAiEnvironments(process.cwd(), simulatedEnv);
const detectedIds = detected.map(d => d.id);
assert.ok(detectedIds.includes('cursor'), 'Cursor deve ser detectado via variável de ambiente');
assert.ok(detectedIds.includes('claude'), 'Claude deve ser detectado via variável de ambiente');
console.log('✓ 8. Teste de Auto-Detecção de IA/IDE passou!');

console.log('--- Todos os testes da v1.2.0 passaram com 100% de sucesso! ---');
