#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const os = require('os');
const { execSync } = require('child_process');

const isProjectInstall = process.argv.includes('--project');
const homeDir = os.homedir();
const targetDir = isProjectInstall
  ? path.resolve(process.cwd(), '.agents', 'skills', 'clean-code')
  : path.join(homeDir, '.gemini', 'config', 'skills', 'clean-code');

console.log('\n========================================================');
console.log('   Instalador Multi-plataforma: Clean Code Skill        ');
console.log('========================================================\n');
console.log(`Instalando skill em modo ${isProjectInstall ? 'PROJETO (Workspace)' : 'GLOBAL'}:`);
console.log(` -> ${targetDir}\n`);

if (!fs.existsSync(targetDir)) {
  fs.mkdirSync(targetDir, { recursive: true });
}

const files = ['SKILL.md', 'package.json', 'LICENSE'];
for (const file of files) {
  const src = path.join(__dirname, file);
  if (fs.existsSync(src)) {
    fs.copyFileSync(src, path.join(targetDir, file));
  }
}

const dirs = ['scripts', 'templates'];
for (const dir of dirs) {
  const srcDir = path.join(__dirname, dir);
  const destDir = path.join(targetDir, dir);
  if (fs.existsSync(srcDir)) {
    if (!fs.existsSync(destDir)) {
      fs.mkdirSync(destDir, { recursive: true });
    }
    const entries = fs.readdirSync(srcDir);
    for (const entry of entries) {
      fs.copyFileSync(path.join(srcDir, entry), path.join(destDir, entry));
    }
  }
}

console.log('Instalando dependências (TypeScript)...');
try {
  execSync('npm install --omit=dev --silent', { cwd: targetDir, stdio: 'inherit' });
} catch (err) {
  console.warn('Aviso: Falha ao rodar npm install. Verifique se o Node/npm estão no PATH.');
}

console.log('\n========================================================');
console.log(' [OK] Clean Code Skill instalada com sucesso!');
console.log('========================================================');
console.log('Como usar:');
console.log(' 1. No chat do Antigravity, basta digitar:');
console.log('    /clean-code');
console.log(' 2. Ou rodar diretamente via terminal:');
console.log(`    node "${path.join(targetDir, 'scripts', 'clean_code.js')}" "<pasta_do_projeto>"`);
console.log('========================================================\n');
