---
name: clean-code
description: >-
  Executa varredura e limpeza profunda em arquivos de código em 15+ linguagens (JS, TS, HTML, Vue, Svelte, Java, C#, PHP, Go, Rust, Python, Shell, YAML, CSS), removendo comentários desnecessários e anotações redundantes. Suporta auto-atualização (--update), pré-commit hook (--hook) e regras para múltiplas IAs (--all-rules).
---

# Clean Code (Faxina Profunda e Engenharia de Código Puro)

Esta skill executa uma varredura completa, segura e automática para eliminar comentários desnecessários, cabeçalhos redundantes de documentação, anotações óbvias e linhas em branco excessivas de projetos de software. Também oferece integração nativa com Git hooks e regras de IA.

## Como Executar

Quando o usuário chamar `/clean-code` ou solicitar a limpeza:

1. **Localizar e Executar o Script:**
   - No Windows:
     ```bash
     node "$HOME\.gemini\config\skills\clean-code\scripts\clean_code.js" "<caminho_do_projeto>"
     ```
   - No Linux / macOS:
     ```bash
     node "$HOME/.gemini/config/skills/clean-code/scripts/clean_code.js" "<caminho_do_projeto>"
     ```
   - No Workspace (`.agents/skills/clean-code`):
     ```bash
     node "./.agents/skills/clean-code/scripts/clean_code.js" "<caminho_do_projeto>"
     ```

2. **Comandos e Flags Especiais:**
   - `--update`: Atualiza a skill Clean Code para a versão mais recente do GitHub na hora.
   - `--hook`: Instala o hook de pré-commit do Git no repositório ativo (`.git/hooks/pre-commit`). A partir de então, cada `git commit` limpa automaticamente os arquivos modificados.
   - `--all-rules`: Cria diretrizes anti-comentários para todas as principais IAs (`GEMINI.md`, `.cursorrules`, `.cursor/rules/clean-code.mdc`, `.windsurfrules`, `.github/copilot-instructions.md` e `CLAUDE.md`).
   - `--dry-run`: Simula a faxina e exibe o relatório detalhado sem alterar arquivos em disco.
   - `--no-rule`: Pula a criação/atualização de arquivos de diretrizes.
   - `--ignore <pasta>`: Ignora diretórios específicos adicionais.

3. **Linguagens e Formatos Suportados:**
   - **Web & Frontend**: JavaScript, TypeScript, JSX, TSX, HTML, Vue, Svelte, Astro, CSS, SCSS, LESS.
   - **Backend & Sistemas**: Java, C#, PHP, C, C++, Go, Rust, Kotlin, Python, Shell (`.sh`, `.bash`).
   - **Configuração**: YAML, TOML, JSONC.

4. **Garantias de Execução:**
   - **Parser AST Real**: TypeScript compiler API para JS/TS; máquinas de estado para C-Style e Shell/Python (preserva strings, URLs e regex).
   - **Preservação de Diretivas**: Mantém `eslint-disable`, `@ts-expect-error`, shebangs (`#!/...`), tags de licença e condicionais.
   - **Rollback Imediato**: Se qualquer arquivo falhar na verificação de sintaxe, o arquivo original é imediatamente restaurado.
   - **Relatório Detalhado**: Retorne ao usuário o resumo detalhado contendo a redução de linhas e os tipos de comentários eliminados.
