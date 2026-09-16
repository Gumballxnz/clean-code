const assert = require('assert');
const {
  stripCommentsWithAst,
  stripCommentsFromShellOrPython,
  stripCommentsFromCss
} = require('./clean_code');

console.log('--- Iniciando Testes Unitários de Clean Code ---');

// 1. Teste Shell/Python
const pyCode = `#!/usr/bin/env python3\n# Comentário de cabeçalho\nurl = "http://example.com#anchor"\n# Outro comentário\nprint('Hello # world') # linha comentada\n`;
const pyResult = stripCommentsFromShellOrPython(pyCode);
assert.ok(pyResult.cleaned.startsWith('#!/usr/bin/env python3'), 'Shebang deve ser mantido');
assert.ok(pyResult.cleaned.includes('http://example.com#anchor'), 'URL com # deve ser preservada');
assert.ok(pyResult.cleaned.includes("Hello # world"), 'String com # deve ser preservada');
assert.ok(!pyResult.cleaned.includes('Comentário de cabeçalho'), 'Comentário deve ser removido');
assert.strictEqual(pyResult.lineCommentsCount, 3, 'Deve contar 3 comentários de linha');
console.log('✓ Teste Python/Shell passou!');

// 2. Teste CSS
const cssCode = `/* @license MIT */\n/* Comentário desnecessário */\nbody {\n  color: red; /* cor do texto */\n}\n`;
const cssResult = stripCommentsFromCss(cssCode);
assert.ok(cssResult.cleaned.includes('@license MIT'), 'Licença deve ser preservada');
assert.ok(!cssResult.cleaned.includes('Comentário desnecessário'), 'Comentário normal deve ser removido');
console.log('✓ Teste CSS passou!');
// 3. Teste JavaScript / TypeScript AST
const jsCode = `/**\n * Funcao de soma\n * @param {number} a\n * @returns {number}\n */\n// eslint-disable-next-line no-unused-vars\nconst add = (a, b) => {\n  // soma dois valores\n  return a + b; /* retorno */\n};\n`;
const jsResult = stripCommentsWithAst(jsCode, '.js');
assert.ok(jsResult !== null, 'stripCommentsWithAst deve retornar resultado');
assert.ok(jsResult.cleaned.includes('eslint-disable-next-line'), 'Diretiva eslint deve ser preservada');
assert.ok(!jsResult.cleaned.includes('Funcao de soma'), 'JSDoc deve ser removido');
assert.ok(!jsResult.cleaned.includes('soma dois valores'), 'Comentário de linha deve ser removido');
assert.ok(!jsResult.cleaned.includes('/* retorno */'), 'Comentário inline de bloco deve ser removido');
console.log('✓ Teste JavaScript / TypeScript AST passou!');

console.log('--- Todos os testes rápidos passaram com sucesso! ---');

