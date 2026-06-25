# Integração com GitHub Actions

Se você quer usar o MCP GitHub Server dentro de seus workflows do GitHub Actions, aqui estão as informações.

## 🔧 Configuração Necessária

### 1. Criar um GitHub App (Alternativa ao PAT)

Para usar em GitHub Actions automaticamente, você pode criar um GitHub App:

1. Acesse: https://github.com/settings/apps/new
2. Preencha:
   - **App name**: `MCP GitHub Server`
   - **Homepage URL**: `https://github.com` (ou seu repo)
   - **Webhook URL**: (opcional)
   - **Permissions**: Selecione as necessárias

3. Clique em "Create GitHub App"
4. Gere uma chave privada (Private key) - salve com segurança

### 2. Ou use um Personal Access Token com Secrets

1. Crie um PAT em: https://github.com/settings/tokens
2. No seu repositório, vá a **Settings** → **Secrets and variables** → **Actions**
3. Clique em **New repository secret**
4. Nome: `GITHUB_TOKEN` (ou outro nome)
5. Valor: Cole o token

## 📝 Exemplo de Workflow

### Opção 1: Usar o MCP Server em um Workflow

```yaml
name: Use MCP GitHub Server

on:
  schedule:
    - cron: '0 0 * * *'  # Executar diariamente
  workflow_dispatch:     # Permitir execução manual

jobs:
  use-mcp:
    runs-on: ubuntu-latest
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v3
      
      - name: Set up Python
        uses: actions/setup-python@v4
        with:
          python-version: '3.11'
      
      - name: Install dependencies
        run: |
          pip install -r requirements.txt
      
      - name: Run MCP Server
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
        run: |
          python -c "
          from function_app import list_repositories, list_issues
          
          # Exemplo: listar issues abertas
          result = list_issues('${{ github.repository_owner }}', 
                             '${{ github.event.repository.name }}')
          
          if result['success']:
              print(f'Encontradas {len(result[\"issues\"])} issues abertas')
          "
```

### Opção 2: Deploy do MCP Server em Azure

```yaml
name: Deploy MCP Server to Azure

on:
  push:
    branches: [ main ]

jobs:
  deploy:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Set up Python
        uses: actions/setup-python@v4
        with:
          python-version: '3.11'
      
      - name: Install Azure Functions Core Tools
        run: sudo apt-get install -y azure-functions-core-tools-4
      
      - name: Install dependencies
        run: pip install -r requirements.txt
      
      - name: Run tests
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
        run: python test_mcp_github.py
      
      - name: Deploy to Azure
        env:
          AZURE_CREDENTIALS: ${{ secrets.AZURE_CREDENTIALS }}
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
        run: |
          az login --service-principal -u ${{ secrets.AZURE_CLIENT_ID }} \
            -p ${{ secrets.AZURE_CLIENT_SECRET }} \
            --tenant ${{ secrets.AZURE_TENANT_ID }}
          
          func azure functionapp publish mcp-github-server \
            --build remote
```

### Opção 3: Análise Automatizada de PRs

```yaml
name: Analyze PR with MCP

on:
  pull_request:
    types: [opened, synchronize]

jobs:
  analyze:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Set up Python
        uses: actions/setup-python@v4
        with:
          python-version: '3.11'
      
      - name: Install dependencies
        run: pip install -r requirements.txt
      
      - name: Analyze PR
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
        run: |
          python -c "
          from function_app import get_pr_diff, get_issue_details
          import os
          
          owner, repo = '${{ github.repository }}'.split('/')
          pr_number = ${{ github.event.pull_request.number }}
          
          # Obter diff
          diff = get_pr_diff(owner, repo, pr_number)
          if diff['success']:
              print('## PR Diff')
              print(diff['diff'][:500])  # Primeiros 500 chars
          
          # Obter detalhes
          details = get_issue_details(owner, repo, pr_number)
          if details['success']:
              print(f\"## PR: {details['title']}\")
              print(f\"Autor: {details['author']}\")
          "
      
      - name: Comment PR
        uses: actions/github-script@v6
        with:
          script: |
            github.rest.issues.createComment({
              issue_number: context.issue.number,
              owner: context.repo.owner,
              repo: context.repo.repo,
              body: '✅ MCP Analysis completed'
            })
```

## 🔐 Configurar Secrets no GitHub

Para adicionar o token do GitHub como secret:

1. Vá ao seu repositório
2. **Settings** → **Secrets and variables** → **Actions**
3. **New repository secret**
4. Nome: `GITHUB_TOKEN`
5. Valor: Seu Personal Access Token

Para Azure (se fazer deploy):
- `AZURE_CREDENTIALS` (JSON com credenciais)
- `AZURE_CLIENT_ID`
- `AZURE_CLIENT_SECRET`
- `AZURE_TENANT_ID`

## 🚀 Variáveis de Contexto Disponíveis

No GitHub Actions, você tem acesso a variáveis de contexto:

```yaml
${{ github.repository }}          # owner/repo
${{ github.repository_owner }}    # owner
${{ github.event.repository.name }}  # repo
${{ github.event.pull_request.number }}  # PR number
${{ github.actor }}               # Usuário que disparou
${{ github.ref }}                 # Branch ref
${{ github.sha }}                 # Commit SHA
```

## 📊 Casos de Uso Comuns

### 1. Notificar sobre Issues Abertas
```python
result = list_issues(owner, repo, state="open")
print(f"Total de issues abertas: {len(result['issues'])}")
```

### 2. Verificar Status de Workflows
```python
result = get_workflow_runs(owner, repo, limit=5)
for run in result['runs']:
    if run['conclusion'] != 'success':
        print(f"⚠️  {run['name']} falhou!")
```

### 3. Análise de PRs
```python
pr = get_pr_diff(owner, repo, pr_number)
additions = len([l for l in pr['diff'].split('\n') if l.startswith('+')])
deletions = len([l for l in pr['diff'].split('\n') if l.startswith('-')])
print(f"Mudanças: +{additions} -{deletions}")
```

### 4. Buscar Arquivos Modificados
```python
files = search_files(owner, repo, "*.py", language="Python")
for file in files['files']:
    print(f"Arquivo Python: {file['path']}")
```

## ⚠️ Considerações de Segurança

1. **Nunca** committe o token em repositórios públicos
2. Use **Secrets** do GitHub Actions para armazená-lo
3. **Rotacione** o token regularmente (90 dias)
4. **Revogue** imediatamente se comprometido
5. Considere usar **GitHub App** para acesso mais limitado

## 📈 Rate Limiting em GitHub Actions

- Com PAT: 5.000 requisições/hora
- Sem autenticação: 60 requisições/hora

A maioria das tools do MCP fazem 1 requisição. Algumas fazem 2.

## 🔗 Referências

- [GitHub Actions Secrets](https://docs.github.com/en/actions/security-guides/using-secrets-in-github-actions)
- [GitHub Actions Context](https://docs.github.com/en/actions/learn-github-actions/contexts)
- [GitHub Apps](https://docs.github.com/en/apps)
- [GitHub API](https://docs.github.com/en/rest)
