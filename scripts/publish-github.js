#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('\n========================================================');
console.log('   Publicando no GitHub Packages (@gumballxnz/clean-code)');
console.log('========================================================\n');

const pkgPath = path.join(__dirname, '..', 'package.json');
const npmrcPath = path.join(__dirname, '..', '.npmrc');

const originalPkg = fs.readFileSync(pkgPath, 'utf8');
const pkg = JSON.parse(originalPkg);

let token = '';
try {
  token = execSync('gh auth token', { stdio: 'pipe' }).toString().trim();
} catch (_) {
  token = process.env.GITHUB_TOKEN || process.env.NODE_AUTH_TOKEN || '';
}

if (!token) {
  console.error('Erro: Nenhum token do GitHub encontrado. Execute "gh auth login".');
  process.exit(1);
}

pkg.name = '@gumballxnz/clean-code';
pkg.repository = 'https://github.com/Gumballxnz/clean-code';
pkg.publishConfig = {
  registry: 'https://npm.pkg.github.com'
};

fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + '\n', 'utf8');

const npmrcContent = `@gumballxnz:registry=https://npm.pkg.github.com\n//npm.pkg.github.com/:_authToken=${token}\n`;
let existingNpmrc = null;
if (fs.existsSync(npmrcPath)) {
  existingNpmrc = fs.readFileSync(npmrcPath, 'utf8');
}
fs.writeFileSync(npmrcPath, npmrcContent, 'utf8');

try {
  console.log('Enviando pacote para https://npm.pkg.github.com...');
  execSync('npm publish', { cwd: path.join(__dirname, '..'), stdio: 'inherit' });
  console.log('\n========================================================');
  console.log(' [OK] Pacote publicado com sucesso no GitHub Packages!');
  console.log('========================================================');
  console.log('Disponível em:');
  console.log(' -> https://github.com/Gumballxnz/clean-code/packages');
  console.log(' -> https://github.com/Gumballxnz?tab=packages\n');
} catch (err) {
  console.error('Falha ao publicar no GitHub Packages:', err.message);
} finally {
  fs.writeFileSync(pkgPath, originalPkg, 'utf8');
  if (existingNpmrc !== null) {
    fs.writeFileSync(npmrcPath, existingNpmrc, 'utf8');
  } else if (fs.existsSync(npmrcPath)) {
    fs.unlinkSync(npmrcPath);
  }
}
