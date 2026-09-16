const fs = require('fs');
const path = require('path');
const assert = require('assert');
const { processDirectory, ensureAiDirectiveRule } = require('./clean_code');

console.log('--- Teste de Integração (Varredura e GEMINI.md) ---');

const tempDir = path.join(__dirname, '..', 'temp_integration_test');
if (fs.existsSync(tempDir)) {
  fs.rmSync(tempDir, { recursive: true, force: true });
}
fs.mkdirSync(tempDir, { recursive: true });

// Arquivo JS com comentários
const jsPath = path.join(tempDir, 'example.js');
fs.writeFileSync(jsPath, '/**\n * Test JSDoc\n */\nfunction calculate(x) {\n  // Duplica o valor\n  return x * 2;\n}\nmodule.exports = { calculate };\n', 'utf8');

// Arquivo Python com comentários
const pyPath = path.join(tempDir, 'script.py');
fs.writeFileSync(pyPath, '#!/usr/bin/env python3\n# Script de teste\nmsg = "Ola # mundo"\nprint(msg) # log\n', 'utf8');

const ignoredDirs = new Set(['node_modules']);
const options = {
  targetDir: tempDir,
  enforceRule: true,
  dryRun: false,
  verbose: false,
  customIgnores: new Set()
};

const stats = processDirectory(tempDir, options, ignoredDirs);
assert.strictEqual(stats.filesCleaned, 2, '2 arquivos devem ter sido limpos');
assert.ok(stats.linesRemoved > 0, 'Linhas devem ter sido removidas');

const cleanedJs = fs.readFileSync(jsPath, 'utf8');
assert.ok(!cleanedJs.includes('Test JSDoc'), 'JSDoc removido');
assert.ok(!cleanedJs.includes('Duplica o valor'), 'Comentário de linha removido');
assert.ok(cleanedJs.includes('return x * 2;'), 'Código funcional preservado');

const ruleResult = ensureAiDirectiveRule(tempDir);
assert.strictEqual(ruleResult.status, 'created', 'GEMINI.md deve ser criado');
assert.ok(fs.existsSync(path.join(tempDir, 'GEMINI.md')), 'Arquivo GEMINI.md existe');

// Limpeza
fs.rmSync(tempDir, { recursive: true, force: true });
console.log('✓ Teste de integração passou 100%!');
