# MCP GitHub Server

Um servidor MCP (Model Context Protocol) para integração com o GitHub, permitindo acesso a repositórios, arquivos, PRs, workflows e issues através de tools.

## 🎯 Funcionalidades

✅ **Listar repositórios** - Liste seus repos ou de qualquer usuário  
✅ **Ler árvores de arquivos** - Navegue pela estrutura de arquivos  
✅ **Buscar arquivos relevantes** - Pesquise por arquivos específicos  
✅ **Capturar diffs de PR** - Veja mudanças em Pull Requests  
✅ **Recuperar workflows/actions** - Acesse GitHub Actions workflows  
✅ **Recuperar issues/PRs** - Liste e detalhe issues e pull requests  

## 🚀 Quick Start

### 1. Clonar e Instalar
```bash
cd mcp-server
pip install -r requirements.txt
```

### 2. Configurar o Token do GitHub
Veja [GITHUB_SETUP.md](GITHUB_SETUP.md) para instruções detalhadas.

```bash
# Windows (CMD)
setx GITHUB_TOKEN "seu_token_aqui"

# Reinicie o terminal e verifique
echo %GITHUB_TOKEN%
```

### 3. Rodar o Servidor
```bash
# Localmente
func start

# Ou em modo debug
func start --verbose
```

## 📚 API Tools

Todas as tools retornam um dicionário com `{"success": bool, ...}`:

### Repositórios
```python
list_repositories(owner="microsoft", limit=10)
```

### Arquivos
```python
list_file_tree(owner="microsoft", repo="vscode", path="src/")
search_files(owner="microsoft", repo="vscode", query="debug")
```

### Pull Requests
```python
get_pr_diff(owner="microsoft", repo="vscode", pr_number=123)
```

### GitHub Actions
```python
get_workflows(owner="microsoft", repo="vscode")
get_workflow_runs(owner="microsoft", repo="vscode", limit=10)
```

### Issues e PRs
```python
list_issues(owner="microsoft", repo="vscode", state="open")
get_issue_details(owner="microsoft", repo="vscode", issue_number=123)
```

## 📖 Documentação Completa

Veja [GITHUB_SETUP.md](GITHUB_SETUP.md) para:
- ✅ Como gerar Personal Access Token
- ✅ Scopes necessários
- ✅ Configurações de segurança
- ✅ Troubleshooting

## 🔧 Desenvolvimento

### Estrutura de Arquivos
```
mcp-server/
├── function_app.py           # MCP Server principal
├── requirements.txt          # Dependências Python
├── local.settings.json       # Configurações locais (gitignored)
├── local.settings.example.json
├── host.json                 # Configuração Azure Functions
├── GITHUB_SETUP.md          # Setup GitHub
└── README.md                # Este arquivo
```

### Adicionar Novas Tools

1. Crie uma nova função com o decorador `@app.mcp_tool()`
2. Use `get_headers()` para autenticação
3. Retorne um dicionário com `{"success": bool, ...}`

Exemplo:
```python
@app.mcp_tool()
def my_tool(param1: str, param2: int = 10) -> dict:
    """Descrição da tool"""
    try:
        # Implementação
        return {"success": True, "data": result}
    except Exception as e:
        return {"success": False, "error": str(e)}
```

## ⚠️ Segurança

- **Nunca** committe `local.settings.json` com token real
- Use `.gitignore`:
  ```
  local.settings.json
  .env
  __pycache__/
  ```
- Rotacione tokens a cada 90 dias
- Use Key Vault para produção

## 🐛 Troubleshooting

### Erro: "401 Unauthorized"
- Token inválido ou expirado
- Regenere um novo: https://github.com/settings/tokens

### Erro: "GITHUB_TOKEN not found"
- Variável de ambiente não configurada
- Reinicie terminal/IDE após configurar
- Verifique: `echo $GITHUB_TOKEN` (Linux/Mac) ou `echo %GITHUB_TOKEN%` (Windows)

### Rate Limit Atingido
- Aguarde 1 hora
- Ou use um token com mais permissões

## 📝 Exemplo de Uso

```python
# Listar repos do usuário autenticado
repos = list_repositories(limit=5)

# Listar estrutura de pastas
files = list_file_tree("microsoft", "vscode", "src")

# Buscar arquivos com "debug"
search = search_files("microsoft", "vscode", "debug", language="TypeScript")

# Ver detalhes de um PR
pr = get_pr_diff("microsoft", "vscode", 123)

# Listar workflows
workflows = get_workflows("microsoft", "vscode")

# Listar issues abertas
issues = list_issues("microsoft", "vscode", state="open")
```

## 📞 Suporte

Para problemas com o GitHub:
- [GitHub Docs](https://docs.github.com)
- [GitHub API Docs](https://docs.github.com/en/rest)

Para problemas com MCP:
- [MCP Specification](https://modelcontextprotocol.io)

---

**Versão**: 1.0  
**Última atualização**: 2024  
**Mantido por**: MCP Server Team
