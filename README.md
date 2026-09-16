# 🧹 Clean Code Skill & CLI (v1.1.0)

> **Transforme seu código em código puro, funcional e validado.**  
> Elimine anotações desnecessárias, comentários redundantes gerados por IA e cabeçalhos JSDoc óbvios em segundos.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Antigravity Skill](https://img.shields.io/badge/Antigravity-Skill-blue.svg)](https://github.com/Gumballxnz/clean-code)
[![Version](https://img.shields.io/badge/version-1.1.0-brightgreen.svg)](https://github.com/Gumballxnz/clean-code/releases)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](https://github.com/Gumballxnz/clean-code/pulls)

---

## 🚀 O que é o Clean Code?

Ao programar com inteligência artificial, é comum ver assistentes adicionando dezenas de comentários óbvios (`// função que faz login`, `// loop pelos itens`, etc.) e JSDocs redundantes que poluem o código.

O **Clean Code** é uma **Skill oficial para o Google Antigravity** e uma **ferramenta CLI universal** que:
1. **Remove todo o ruído visual e comentários redundantes** de forma inteligente e segura.
2. **Suporta 15+ linguagens e formatos** (Web, Backend, Sistemas e Configurações).
3. **Preserva diretivas essenciais** (como `eslint-disable`, `@ts-expect-error`, `@license`, shebangs `#!` e anotações do compilador).
4. **Garante integridade sintática** via AST do TypeScript, máquinas de estados e validação com reversão instantânea em caso de erro.
5. **Git Pre-Commit Hook Automático**: faxina apenas os arquivos modificados antes de cada commit.
6. **Proteção Multi-IA**: gera regras para Antigravity (`GEMINI.md`), Cursor (`.cursorrules`), Windsurf (`.windsurfrules`), Copilot e Claude.
7. **Auto-atualização em 1 comando** via Git ou GitHub.

---

## 🌐 Linguagens Suportadas

| Categoria | Extensões | Parser & Garantias |
| :--- | :--- | :--- |
| **Frontend & Web** | `.js`, `.ts`, `.jsx`, `.tsx`, `.html`, `.vue`, `.svelte`, `.astro` | AST do TypeScript + Remoção de `<!-- -->` e limpeza interna de `<script>` e `<style>`. |
| **Backend & Sistemas** | `.java`, `.cs`, `.php`, `.cpp`, `.c`, `.h`, `.go`, `.rs`, `.kt` | Máquina de estados C-Style com preservação de strings escapadas, raw strings e diretivas. |
| **Scripts & Shell** | `.py`, `.sh`, `.bash` | Preservação de shebangs `#!`, multiline strings `"""` e URLs com `#`. |
| **Estilos & Configurações**| `.css`, `.scss`, `.less`, `.yaml`, `.yml`, `.toml`, `.jsonc` | Preservação de licenças e valores entre aspas. |

---

## ⚡ Instalação Rápida (1 Comando)

O instalador detecta automaticamente se você tem `git` ou não e configura a skill diretamente no Antigravity:

### 🪟 Windows (PowerShell)
Execute no PowerShell:
```powershell
irm https://raw.githubusercontent.com/Gumballxnz/clean-code/main/install.ps1 | iex
```

### 🐧 Linux & 🍎 macOS (Terminal)
Execute no terminal:
```bash
curl -fsSL https://raw.githubusercontent.com/Gumballxnz/clean-code/main/install.sh | bash
```

### 📦 Instalação Manual (Git Clone)
```bash
git clone https://github.com/Gumballxnz/clean-code.git
cd clean-code
npm install
npm run install:global
```

---

## 🔄 Como Atualizar (`--update`)

Se você já tem o Clean Code instalado e nós lançarmos uma nova versão, basta rodar:

```bash
# Pelo chat do Antigravity:
/clean-code --update

# Ou pelo terminal:
node ~/.gemini/config/skills/clean-code/scripts/clean_code.js --update
```
O script verifica o repositório no GitHub, baixa a versão mais recente e recompila as dependências silenciosamente!

---

## ⚓ Git Pre-Commit Hook Automático (`--hook`)

Para que você nunca mais se preocupe em esquecer de rodar a limpeza:
```bash
# Na raiz de qualquer projeto com Git:
node ~/.gemini/config/skills/clean-code/scripts/clean_code.js --hook
```
**O que acontece?**
Sempre que você executar `git commit`, o hook roda automaticamente apenas nos arquivos staged, remove qualquer comentário inserido pela IA ou pelo dev, e conclui o commit com o código 100% puro!

---

## 🤖 Proteção Multi-IA (`--all-rules`)

Para equipes heterogêneas onde cada desenvolvedor usa um editor diferente com IA:
```bash
node ~/.gemini/config/skills/clean-code/scripts/clean_code.js --all-rules
```
Cria instantaneamente as diretrizes anti-comentários nos seguintes arquivos:
- `GEMINI.md` (Google Antigravity e Gemini Code Assist)
- `.cursorrules` e `.cursor/rules/clean-code.mdc` (Cursor IDE)
- `.windsurfrules` (Windsurf / Codeium)
- `.github/copilot-instructions.md` (GitHub Copilot)
- `CLAUDE.md` (Claude Code / Anthropic)

---

## 🎮 Como Usar no Dia a Dia

### 1. No Chat do Antigravity
Basta digitar:
```text
/clean-code
```
Ou com opções:
```text
/clean-code --hook
/clean-code --all-rules
/clean-code --dry-run
/clean-code --update
```

### 2. Pelo Terminal (CLI / NPX)
```bash
node path/to/clean-code/scripts/clean_code.js [caminho_do_projeto] [opções]
```

#### Opções Disponíveis:
| Flag | Descrição |
| :--- | :--- |
| `[caminho]` | Pasta alvo para limpar (se omitido, usa a pasta atual). |
| `--update` | Auto-atualiza a skill para a versão mais recente do GitHub. |
| `--hook` | Instala o Git pre-commit hook automático no projeto alvo. |
| `--all-rules` | Gera regras anti-comentários para todas as IAs (Cursor, Copilot, Claude, etc.). |
| `--dry-run` | Simula a faxina e mostra o relatório sem alterar nenhum arquivo em disco. |
| `--no-rule` | Não cria nem altera o arquivo de regra permanente `GEMINI.md`. |
| `--ignore <pasta>` | Ignora uma pasta específica além das padrões. |
| `--verbose` | Exibe logs detalhados de cada arquivo processado. |

---

## 📊 Exemplo do Relatório Detalhado

```text
================================================================
                 RELATÓRIO DETALHADO - CLEAN CODE               
================================================================
Diretório analisado: /meu-projeto
Modo de execução:    FAVORITO / ATIVO
Tempo de varredura:  98ms
----------------------------------------------------------------
Total de arquivos varridos:    42
Arquivos limpos e otimizados:  9
Linhas totais eliminadas:      245
Comentários em bloco (JSDoc):  18
Comentários de linha única:    114
----------------------------------------------------------------

DETALHES POR ARQUIVO:
 • src/services/PaymentService.java
   - Linhas: 180 -> 142 (-38 linhas | -21.1%)
   - Blocos JSDoc/Multi-linha: 4 | Linhas //: 22
 • src/components/Header.vue
   - Linhas: 110 -> 85 (-25 linhas | -22.7%)
   - Blocos JSDoc/Multi-linha: 2 | Linhas //: 12
 • backend/main.go
   - Linhas: 95 -> 74 (-21 linhas | -22.1%)
   - Blocos JSDoc/Multi-linha: 0 | Linhas //: 19

----------------------------------------------------------------
DIRETRIZES PERSISTENTES PARA IA:
 ✓ Arquivo GEMINI.md configurado com sucesso.
 ✓ Arquivo .cursorrules configurado com sucesso.
 ✓ Arquivo copilot-instructions.md configurado com sucesso.
================================================================
```

---

## 🤝 Contribuindo

1. Faça um Fork do projeto
2. Crie uma branch para sua feature (`git checkout -b feature/nova-linguagem`)
3. Teste suas alterações: `npm test`
4. Faça commit das mudanças (`git commit -m 'feat: adiciona parser para nova linguagem'`)
5. Faça push para a branch (`git push origin feature/nova-linguagem`)
6. Abra um Pull Request

---

## 📄 Licença

Distribuído sob a licença **MIT**. Consulte [`LICENSE`](./LICENSE) para obter mais informações.
