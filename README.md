# 🧹 Clean Code Skill & CLI (v1.2.0)

> **Transforme seu código em código puro, funcional e validado.**  
> Elimine anotações desnecessárias, comentários redundantes gerados por IA e cabeçalhos JSDoc óbvios em segundos.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Antigravity Skill](https://img.shields.io/badge/Antigravity-Skill-blue.svg)](https://github.com/Gumballxnz/clean-code)
[![NPM Package](https://img.shields.io/badge/npm-%40gumballwotersan%2Fclean--code-red.svg)](https://www.npmjs.com/package/@gumballwotersan/clean-code)
[![Version](https://img.shields.io/badge/version-1.2.0-brightgreen.svg)](https://github.com/Gumballxnz/clean-code/releases)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](https://github.com/Gumballxnz/clean-code/pulls)

---

## 🚀 O que é o Clean Code?

Ao programar com inteligência artificial, é comum ver assistentes adicionando dezenas de comentários óbvios (`// função que faz login`, `// loop pelos itens`, etc.) e JSDocs redundantes que poluem o código.

O **Clean Code** é uma **Skill oficial para o Google Antigravity** e uma **ferramenta CLI universal** que:
1. **Remove todo o ruído visual e comentários redundantes** de forma inteligente e segura.
2. **Auto-Detecta a IA ou IDE em Uso**: identifica automaticamente se você está rodando no Cursor, Antigravity, Claude Code, Windsurf, VS Code com Copilot/Cline ou OpenAI Codex, e gera as diretrizes exatas para aquele ambiente.
3. **Suporta 15+ linguagens e formatos** (Web, Backend, Sistemas e Configurações).
4. **Preserva diretivas essenciais** (como `eslint-disable`, `@ts-expect-error`, `@license`, shebangs `#!`, `//go:build`).
5. **Garante integridade sintática** via AST do TypeScript, máquinas de estados e validação com reversão instantânea em caso de erro.
6. **Git Pre-Commit Hook Automático**: limpa apenas os arquivos modificados antes de cada commit.
7. **Auto-atualização em 1 comando** (`--update`) via Git ou GitHub.

---

## 🤖 IAs e IDEs com Detecção Automática

O Clean Code reconhece o ambiente ativo (por variáveis de processo ou arquivos do projeto) e sincroniza as regras para:

| IA / IDE | Arquivos de Regras Gerados | Detecção |
| :--- | :--- | :--- |
| **Google Antigravity & Gemini** | `GEMINI.md`, `AGENTS.md` | Variáveis de runtime, `.agents/` ou `GEMINI.md` |
| **Cursor IDE** | `.cursorrules`, `.cursor/rules/clean-code.mdc` | `CURSOR_VERSION`, pasta `.cursor/` |
| **Claude Code & Anthropic** | `CLAUDE.md` | `CLAUDE_CODE`, `ANTHROPIC_API_KEY`, `CLAUDE.md` |
| **OpenAI Codex & ChatGPT** | `CODEX.md` | `OPENAI_API_KEY`, `CODEX_CLI`, `.openai/` |
| **Windsurf / Codeium** | `.windsurfrules`, `.windsurf/rules/clean-code.md` | `WINDSURF_VERSION`, `.windsurf/` |
| **GitHub Copilot** | `.github/copilot-instructions.md` | `GITHUB_COPILOT_ENABLED`, `.github/` |
| **Cline & Roo Code** | `.clinerules`, `.roomodes/rules.md` | `CLINE_VERSION`, `.clinerules` |
| **Continue.dev** | `.continue/rules/clean-code.md` | Pasta `.continue/` |
| **Amazon Q Developer** | `.aws/q-rules.md` | `AWS_Q_ENABLED`, `.aws/` |
| **Aider Pair Programmer** | `CONVENTIONS.md` | `CONVENTIONS.md`, `.aider.conf.yml` |

---

## ⚡ Instalação e Execução

### 1. Execução Rápida via NPX (Sem Instalação Prévia)
Se você tem Node.js instalado, pode rodar diretamente em qualquer pasta:
```bash
npx @gumballwotersan/clean-code
```

### 2. Instalação Permanente para Google Antigravity
Para ter o comando `/clean-code` disponível nativamente no chat do Antigravity em qualquer computador:

#### 🪟 Windows (PowerShell)
```powershell
irm https://raw.githubusercontent.com/Gumballxnz/clean-code/main/install.ps1 | iex
```

#### 🐧 Linux & 🍎 macOS (Terminal)
```bash
curl -fsSL https://raw.githubusercontent.com/Gumballxnz/clean-code/main/install.sh | bash
```

---

## 🔄 Como Atualizar (`--update`)

Basta digitar no chat do Antigravity ou rodar no terminal:
```bash
/clean-code --update
```
O script verifica o repositório oficial no GitHub, faz o pull das novidades e recompila dependências automaticamente!

---

## ⚓ Git Pre-Commit Hook Automático (`--hook`)

Para que seu repositório nunca mais receba comentários indesejados:
```bash
# Na raiz de qualquer projeto com Git:
node ~/.gemini/config/skills/clean-code/scripts/clean_code.js --hook
```
**O que acontece?**
Sempre que você rodar `git commit`, o hook limpa automaticamente apenas os arquivos que estão no stage (`git add`), garantindo commits 100% limpos.

---

## 🌐 Linguagens Suportadas

- **Frontend & Web**: JavaScript, TypeScript, JSX, TSX, HTML, Vue, Svelte, Astro, CSS, SCSS, LESS.
- **Backend & Sistemas**: Java, C#, PHP, C, C++, Go, Rust, Kotlin, Python, Shell (`.sh`, `.bash`).
- **Configurações**: YAML, TOML, JSONC.

---

## 🎮 Comandos Disponíveis

```bash
node path/to/clean-code/scripts/clean_code.js [caminho_do_projeto] [opções]
```

| Flag | Descrição |
| :--- | :--- |
| `[caminho]` | Pasta alvo para limpar (se omitido, usa a pasta atual). |
| `--update` | Auto-atualiza a skill para a versão mais recente do GitHub. |
| `--hook` | Instala o Git pre-commit hook automático no projeto alvo. |
| `--all-rules` | Força a geração de regras para todas as IAs conhecidas (Cursor, Copilot, Claude, Codex, etc.). |
| `--dry-run` | Simula a faxina e mostra o relatório sem alterar nenhum arquivo em disco. |
| `--no-rule` | Não cria nem altera arquivos de diretrizes. |
| `--ignore <pasta>` | Ignora uma pasta específica além das padrões. |
| `--verbose` | Exibe logs detalhados de cada arquivo processado. |

---

## 📄 Licença

Distribuído sob a licença **MIT**. Consulte [`LICENSE`](./LICENSE) para obter mais informações.
