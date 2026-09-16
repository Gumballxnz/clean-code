---
name: clean-code
description: >-
  Executa varredura e limpeza profunda em arquivos de código, removendo todos os comentários desnecessários, cabeçalhos JSDoc e anotações redundantes, deixando apenas código puro, funcional e validado. Gera relatório detalhado e pode configurar regra preventiva no GEMINI.md.
---

# Clean Code (Faxina Profunda e Código Puro)

Esta skill executa uma varredura completa e automática para eliminar comentários desnecessários, cabeçalhos de documentação redundantes, anotações óbvias e linhas em branco excessivas de projetos de código, deixando apenas o código puro, executável e validado.

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
   - Caso a skill esteja instalada no workspace (`.agents/skills/clean-code`):
     ```bash
     node "./.agents/skills/clean-code/scripts/clean_code.js" "<caminho_do_projeto>"
     ```

   *(Se `<caminho_do_projeto>` não for informado, o script utilizará o diretório atual de trabalho).*

2. **Opções Disponíveis (CLI Flags):**
   - `--dry-run`: Simula a faxina e exibe o relatório detalhado sem alterar nenhum arquivo em disco.
   - `--no-rule`: Pula a criação/atualização da diretriz anti-comentários no `GEMINI.md`.
   - `--ignore <pasta>`: Ignora diretórios adicionais especificados pelo usuário.

3. **Garantias de Execução:**
   - **AST-Based Parsing:** Utiliza a API de compilação do TypeScript para remover comentários de forma precisa, sem quebrar strings, templates literals ou regex.
   - **Preservação Crítica:** Diretivas essenciais como `eslint-disable`, `@ts-expect-error`, `@license` e shebangs (`#!/...`) são preservadas.
   - **Validação de Sintaxe Imediata:** Cada arquivo é verificado após a limpeza. Se houver erro de sintaxe, a alteração é revertida na hora.
   - **Persistência Preventiva:** Garante a presença do arquivo de regra `GEMINI.md` no projeto alvo para que as IAs nunca mais voltem a sujar o código com comentários redundantes.

4. **Retorno ao Usuário:**
   - Apresente ao usuário o relatório detalhado gerado pelo script contendo:
     - Arquivos limpos com contagem e porcentagem de linhas reduzidas.
     - Quantidade de comentários em bloco vs. comentários de linha removidos.
     - Confirmação da integridade sintática e status da diretriz permanente no `GEMINI.md`.
