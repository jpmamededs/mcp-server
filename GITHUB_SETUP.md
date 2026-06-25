# MCP GitHub Server - Setup

## 📋 O que você precisa fazer no GitHub

### 1. **Criar um Personal Access Token (PAT)**

Este é o passo mais importante para que o MCP Server funcione.

#### Passos:
1. Acesse [GitHub Settings > Developer settings > Personal access tokens](https://github.com/settings/tokens)
2. Clique em **"Generate new token"** → **"Generate new token (classic)"**
3. Defina um nome para o token (ex: "MCP Server")
4. Defina a data de expiração (recomendado: 90 dias)

#### Permissões necessárias (Scopes):

Marque as seguintes permissões:

- **repo** - Acesso completo a repositórios públicos e privados
  - ✅ `repo:status` - Acessar status de repositório
  - ✅ `repo_deployment` - Acessar deployments
  - ✅ `public_repo` - Acessar repositórios públicos
  - ✅ `repo:invite` - Aceitar convites de repositório

- **workflow** - Atualizar arquivos de workflow do GitHub Actions
  - ✅ `actions:read` - Ler workflows/actions

- **read:org** - Ler dados de organizações

- **read:user** - Ler dados do perfil do usuário

- **user:email** - Acessar email do usuário

#### Exemplo de seleção mínima:
```
✅ repo (todas as sub-permissões)
✅ workflow (actions:read)
✅ read:org
✅ read:user
```

5. Clique em **"Generate token"**
6. **Copie o token** (você não conseguirá vê-lo novamente!)

### 2. **Configurar o Token no Ambiente**

#### Opção A: Variável de Ambiente Global (Recomendado)
```bash
# Windows (CMD)
setx GITHUB_TOKEN "seu_token_aqui"

# Windows (PowerShell)
[Environment]::SetEnvironmentVariable("GITHUB_TOKEN", "seu_token_aqui", "User")

# Linux/macOS
export GITHUB_TOKEN="seu_token_aqui"
# Adicione ao ~/.bashrc ou ~/.zshrc para persistência
```

#### Opção B: Arquivo `.env` (Desenvolvimento Local)
Crie um arquivo `.env` na raiz do projeto:
```env
GITHUB_TOKEN=seu_token_aqui
```

#### Opção C: Azure Key Vault (Produção)
Se está usando Azure Functions em produção:
1. Vá para o Azure Portal
2. Crie um Key Vault
3. Adicione um secret chamado `GITHUB-TOKEN`
4. Configure a referência no `local.settings.json`:
```json
{
  "Values": {
    "GITHUB_TOKEN": "@Microsoft.KeyVault(SecretUri=https://your-keyvault.vault.azure.net/secrets/GITHUB-TOKEN/)"
  }
}
```

### 3. **Testar a Conexão**

Execute em Python:
```python
import os
import httpx

GITHUB_TOKEN = os.getenv("GITHUB_TOKEN")
headers = {
    "Authorization": f"token {GITHUB_TOKEN}",
    "Accept": "application/vnd.github.v3+json"
}

with httpx.Client() as client:
    response = client.get("https://api.github.com/user", headers=headers)
    if response.status_code == 200:
        print("✅ Token válido!")
        print(response.json())
    else:
        print("❌ Erro:", response.status_code)
```

## 🛠️ Tools Disponíveis

### 1. **list_repositories(owner=None, limit=10)**
Lista repositórios do GitHub
- `owner` (opcional): usuário/organização (se não especificado, lista seus repositórios)
- `limit`: quantidade máxima de repos a retornar
```python
result = list_repositories(owner="microsoft", limit=5)
```

### 2. **list_file_tree(owner, repo, path="", recursive=False)**
Lista a árvore de arquivos de um repositório
```python
result = list_file_tree("microsoft", "vscode", "src/")
```

### 3. **search_files(owner, repo, query, language=None)**
Busca arquivos relevantes no repositório
```python
result = search_files("microsoft", "vscode", "debug", language="TypeScript")
```

### 4. **get_pr_diff(owner, repo, pr_number)**
Captura o diff de um Pull Request
```python
result = get_pr_diff("microsoft", "vscode", 123)
```

### 5. **get_workflows(owner, repo)**
Recupera workflows/actions do repositório
```python
result = get_workflows("microsoft", "vscode")
```

### 6. **get_workflow_runs(owner, repo, workflow_id=None, limit=10)**
Recupera execuções dos workflows
```python
result = get_workflow_runs("microsoft", "vscode", workflow_id="ci.yml", limit=5)
```

### 7. **list_issues(owner, repo, state="open", limit=10)**
Lista issues e PRs do repositório
```python
result = list_issues("microsoft", "vscode", state="open")
```

### 8. **get_issue_details(owner, repo, issue_number)**
Obtém detalhes de uma issue/PR específica
```python
result = get_issue_details("microsoft", "vscode", 123)
```

## 🔒 Segurança

⚠️ **IMPORTANTE:**
- **Nunca** committe o token em repositórios públicos
- **Nunca** exponha o token em logs
- Use `.gitignore` para ignorar `.env`:
```
.env
local.settings.json
```
- Rotacione o token regularmente (recomendado a cada 90 dias)
- Se comprometer o token, revogue-o imediatamente em GitHub Settings

## 📊 Limites da API do GitHub

### Rate Limiting:
- **Autenticado**: 5.000 requests por hora
- **Não autenticado**: 60 requests por hora

### Dicas:
- Use o token para evitar limites rigorosos
- A maioria das tools faz 1 request, algumas fazem 2

## 🚀 Próximas Etapas

1. ✅ Crie o Personal Access Token
2. ✅ Configure a variável de ambiente `GITHUB_TOKEN`
3. ✅ Instale as dependências: `pip install -r requirements.txt`
4. ✅ Teste uma das tools

## ❓ Troubleshooting

### "401 Unauthorized"
- Token expirou ou é inválido
- Regenere um novo token

### "403 Forbidden"
- Token não tem permissões suficientes
- Certifique-se de ter marcado todas as scopes recomendadas

### "404 Not Found"
- Repositório não existe ou é privado
- Verifique o owner/repo
- Certifique-se de ter permissão de acesso

### Variável de ambiente não reconhecida
- Reinicie o terminal/IDE
- No Windows, reinicie a máquina se necessário
