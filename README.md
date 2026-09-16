# 🧹 Clean Code Skill & CLI

> **Transforme seu código em código puro, funcional e validado.**  
> Elimine anotações desnecessárias, comentários redundantes gerados por IA e cabeçalhos JSDoc óbvios em segundos.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Antigravity Skill](https://img.shields.io/badge/Antigravity-Skill-blue.svg)](https://github.com/Gumballxnz/clean-code)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](https://github.com/Gumballxnz/clean-code/pulls)

---

## 🚀 O que é o Clean Code?

Ao programar com inteligência artificial, é comum ver assistentes adicionando dezenas de comentários óbvios (`// função que faz login`, `// loop pelos itens`, etc.) e JSDocs redundantes que poluem o código.

O **Clean Code** é uma **Skill oficial para o Google Antigravity** e uma **ferramenta CLI universal** que:
1. **Remove todo o ruído visual e comentários redundantes** de forma inteligente e segura.
2. **Preserva diretivas essenciais** (como `eslint-disable`, `@ts-expect-error`, `@license` e shebangs).
3. **Garante integridade sintática** via AST do TypeScript e validação de runtime com reversão instantânea em caso de erro.
4. **Gera um Relatório Detalhado** arquivo por arquivo com porcentagens de redução e tipos de comentários eliminados.
5. **Configura uma Regra Preventiva (`GEMINI.md`)** para que a IA aprenda a **nunca mais** poluir o código daquele projeto.

---

## ⚡ Instalação Rápida (1 Comando)

Não precisa configurar pastas manualmente. O instalador detecta seu sistema e configura a skill diretamente no Antigravity:

### 🪟 Windows (PowerShell)
Execute no PowerShell:
```powershell
irm https://raw.githubusercontent.com/Gumballxnz/clean-code/main/install.ps1 | iex
```

### 🐧 Linux & 🍎 macOS (Bash)
Execute no terminal:
```bash
curl -fsSL https://raw.githubusercontent.com/Gumballxnz/clean-code/main/install.sh | bash
```

### 📦 Instalação Manual (Git Clone)
Se preferir clonar o repositório:
```bash
git clone https://github.com/Gumballxnz/clean-code.git
cd clean-code
npm install
npm run install:global
```

Após instalar, reinicie o Antigravity ou abra uma nova conversa: o comando `/clean-code` estará disponível imediatamente no menu de barras (`/`).

---

## 🎮 Como Usar

### 1. No Chat do Antigravity
Basta digitar:
```text
/clean-code
```
O assistente executará a faxina profunda no diretório do projeto ativo e exibirá o relatório detalhado.

### 2. Pelo Terminal (CLI)
Você também pode rodar diretamente em qualquer pasta de projeto:
```bash
node path/to/clean-code/scripts/clean_code.js [caminho_do_projeto] [opções]
```

#### Opções Disponíveis:
| Flag | Descrição |
| :--- | :--- |
| `[caminho]` | Pasta alvo para limpar (se omitido, usa a pasta atual). |
| `--dry-run` | Simula a faxina e mostra o relatório sem alterar nenhum arquivo em disco. |
| `--no-rule` | Não cria nem altera o arquivo de regra permanente `GEMINI.md`. |
| `--ignore <pasta>` | Ignora uma pasta específica além das padrões. |
| `--verbose` | Exibe logs detalhados de cada arquivo processado. |

---

## 📊 Relatório Detalhado

Ao final da execução, você recebe um relatório transparente:

```text
================================================================
                 RELATÓRIO DETALHADO - CLEAN CODE               
================================================================
Diretório analisado: /meu-projeto
Modo de execução:    FAVORITO / ATIVO
Tempo de varredura:  142ms
----------------------------------------------------------------
Total de arquivos varridos:    28
Arquivos limpos e otimizados:  6
Linhas totais eliminadas:      184
Comentários em bloco (JSDoc):  12
Comentários de linha única:    94
----------------------------------------------------------------

DETALHES POR ARQUIVO:
 • src/auth/login.ts
   - Linhas: 95 -> 68 (-27 linhas | -28.4%)
   - Blocos JSDoc/Multi-linha: 3 | Linhas //: 18
 • src/utils/formatters.js
   - Linhas: 140 -> 108 (-32 linhas | -22.9%)
   - Blocos JSDoc/Multi-linha: 5 | Linhas //: 14

----------------------------------------------------------------
DIRETRIZ PERSISTENTE PARA IA:
 ✓ Arquivo GEMINI.md criado com sucesso! As IAs não comentarão mais este projeto.
================================================================
```

---

## 🛡️ Segurança e Integridade

- **Parser AST Real**: Não faz substituições simples que poderiam apagar URLs ou quebrar regex; analisa nós sintáticos reais da AST.
- **Rollback Imediato**: Se qualquer arquivo JavaScript falhar na verificação de sintaxe (`node -c`), o arquivo original é restaurado imediatamente.
- **Ignore Inteligente**: Ignora automaticamente `node_modules`, `.git`, `.agents`, `dist`, `build`, `.next`, `coverage`, `.gemini`, `venv`, etc. Suporta regras personalizadas em `.cleanignore`.

---

## 🤝 Contribuindo

Contribuições são muito bem-vindas! Sinta-se livre para abrir [Issues](https://github.com/Gumballxnz/clean-code/issues) e enviar [Pull Requests](https://github.com/Gumballxnz/clean-code/pulls).

1. Faça um Fork do projeto
2. Crie uma branch para sua feature (`git checkout -b feature/nova-faxina`)
3. Faça commit das mudanças (`git commit -m 'feat: adiciona suporte a nova linguagem'`)
4. Faça push para a branch (`git push origin feature/nova-faxina`)
5. Abra um Pull Request

---

## 📄 Licença

Distribuído sob a licença **MIT**. Consulte [`LICENSE`](./LICENSE) para obter mais informações.
