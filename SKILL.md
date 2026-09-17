---
name: clean-code
description: >-
  Executa varredura profunda em 15+ linguagens, removendo comentários desnecessários, sanitizando credenciais hardcodadas (Supabase, Firebase, OpenAI, Stripe) para .env e blindando .gitignore. Suporta auto-atualização (--update), pré-commit hook (--hook) e regras para múltiplas IAs (--all-rules).
---

# Clean Code (Faxina Profunda, Blindagem de Segredos e Engenharia de Código Puro)

Esta skill executa uma varredura completa, segura e automática para eliminar comentários desnecessários, cabeçalhos redundantes de documentação, anotações óbvias, e **higienizar credenciais expostas no código** (Supabase URL/Key, OpenAI, Anthropic, Firebase, Stripe, AWS, GitHub tokens), movendo-as para `.env`, gerando `.env.example` e protegendo o `.gitignore`.

## Como Executar

Quando o usuário chamar `/clean-code` ou solicitar a limpeza:

1. **Localizar e Executar o Script:**
   - Se instalado via NPM global (`npm i -g @gumballwotersan/clean-code`):
     ```bash
     clean-code "<caminho_do_projeto>"
     ```
   - No Windows (Skill Antigravity):
     ```bash
     node "$HOME\.gemini\config\skills\clean-code\scripts\clean_code.js" "<caminho_do_projeto>"
     ```
   - No Linux / macOS (Skill Antigravity):
     ```bash
     node "$HOME/.gemini/config/skills/clean-code/scripts/clean_code.js" "<caminho_do_projeto>"
     ```
   - No Workspace (`.agents/skills/clean-code`):
     ```bash
     node "./.agents/skills/clean-code/scripts/clean_code.js" "<caminho_do_projeto>"
     ```

2. **Comandos e Flags Especiais:**
   - `--sanitize-secrets`: (Padrão: ativo) Detecta credenciais hardcodadas, migra para `.env` e blinda o `.gitignore`.
   - `--secrets-only`: Apenas higieniza credenciais e gera `.env`/`.env.example` (sem alterar comentários).
   - `--no-secrets`: Desativa a sanitização de segredos.
   - `--update`: Atualiza a skill Clean Code para a versão mais recente do GitHub na hora.
   - `--hook`: Instala o hook de pré-commit do Git no repositório ativo (`.git/hooks/pre-commit`). A partir de então, cada `git commit` limpa automaticamente os arquivos modificados.
   - `--all-rules`: Cria diretrizes anti-comentários para todas as principais IAs (`GEMINI.md`, `.cursorrules`, `.cursor/rules/clean-code.mdc`, `.windsurfrules`, `.github/copilot-instructions.md` e `CLAUDE.md`).
   - `--clean-tests`: Deleta com segurança os scripts de teste/rascunhos mapeados criados por IAs que o usuário aprovou remover.
   - `--dry-run`: Simula a faxina e exibe o relatório detalhado sem alterar arquivos em disco.
   - `--no-rule`: Pula a criação/atualização de arquivos de diretrizes.
   - `--ignore <pasta>`: Ignora diretórios específicos adicionais.

3. **Linguagens e Formatos Suportados:**
   - **Web & Frontend**: JavaScript, TypeScript, JSX, TSX, HTML, Vue, Svelte, Astro, CSS, SCSS, LESS.
   - **Backend & Sistemas**: Java, C#, PHP, C, C++, Go, Rust, Kotlin, Python, Shell (`.sh`, `.bash`).
   - **Configuração & Docs**: YAML, TOML, JSONC, Markdown (`.md`).

4. **Garantias de Execução:**
   - **Parser AST Real**: TypeScript compiler API para JS/TS; máquinas de estado para C-Style e Shell/Python (preserva strings, URLs e regex).
   - **Preservação de Diretivas**: Mantém `eslint-disable`, `@ts-expect-error`, shebangs (`#!/...`), tags de licença e condicionais.
   - **Zero Destruição de Testes**: Arquivos de teste e rascunhos NUNCA são deletados automaticamente. Eles são mapeados, blindados no `.gitignore` contra commits, e o assistente pergunta educadamente se o usuário deseja deletá-los.
   - **Rollback Imediato**: Se qualquer arquivo falhar na verificação de sintaxe, o arquivo original é imediatamente restaurado.
   - **Relatório Detalhado**: Retorne ao usuário o resumo detalhado contendo a redução de linhas e os tipos de comentários eliminados.

5. **Tratamento Condicional de Git / GitHub e Rascunhos:**
   - Se houver arquivos de teste/rascunho mapeados: pergunte ao usuário:
     *"Foram mapeados X arquivos de teste/rascunho (ex: ...). Eles foram blindados no .gitignore para não vazarem. Deseja que eu delete esses arquivos ou eles ainda têm utilidade no projeto?"*
   - Se a pasta do projeto **NÃO** possuir repositório Git (`.git` ausente): apresente apenas o relatório e **NÃO mencione Git ou GitHub**.
   - Se a pasta possuir repositório Git e houver arquivos limpos: pergunte explicitamente ao usuário:
     *"Foram limpos X arquivos na branch `<branch>`. Deseja que eu realize o commit e envie (push) as alterações para o repositório remoto?"*
     Se o usuário aprovar, execute `git commit -am "chore: clean code"` e `git push origin <branch>`.
