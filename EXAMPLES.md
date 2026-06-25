"""
Exemplos de Uso do MCP GitHub Server

Este arquivo mostra como usar cada tool do servidor MCP.
Execute cada exemplo conforme necessário.
"""

# ============================================
# EXEMPLO 1: Listar Repositórios
# ============================================

def exemplo_list_repositories():
    """Lista repositórios do GitHub"""
    # Seus repositórios
    result = list_repositories(limit=5)
    
    if result["success"]:
        print("📚 Seus Repositórios:")
        for repo in result["repositories"]:
            print(f"  - {repo['name']} ({repo['stars']} ⭐)")
    
    # Repositórios de um usuário
    result = list_repositories(owner="microsoft", limit=3)
    if result["success"]:
        print("\n📚 Repositórios do Microsoft:")
        for repo in result["repositories"]:
            print(f"  - {repo['full_name']}")

# ============================================
# EXEMPLO 2: Listar Estrutura de Arquivos
# ============================================

def exemplo_list_file_tree():
    """Lista a estrutura de pastas de um repositório"""
    # Raiz do repositório
    result = list_file_tree("microsoft", "vscode")
    if result["success"]:
        print("📁 Arquivos na raiz do VSCode:")
        for file in result["files"]:
            icon = "📁" if file["type"] == "dir" else "📄"
            print(f"  {icon} {file['name']}")
    
    # Pasta específica
    result = list_file_tree("microsoft", "vscode", "src")
    if result["success"]:
        print("\n📁 Arquivos em src/:")
        for file in result["files"][:5]:  # Primeiros 5
            print(f"  - {file['name']}")

# ============================================
# EXEMPLO 3: Buscar Arquivos
# ============================================

def exemplo_search_files():
    """Busca arquivos com critérios específicos"""
    # Buscar arquivo de configuração
    result = search_files("microsoft", "vscode", "tsconfig")
    if result["success"]:
        print(f"🔍 Encontrados {result['total_count']} arquivos:")
        for file in result["files"]:
            print(f"  - {file['path']}")
    
    # Buscar por linguagem
    result = search_files("microsoft", "vscode", "class", language="TypeScript")
    if result["success"]:
        print(f"\n🔍 Arquivos TypeScript com 'class':")
        for file in result["files"][:3]:
            print(f"  - {file['name']}")

# ============================================
# EXEMPLO 4: Ver Diff de Pull Request
# ============================================

def exemplo_get_pr_diff():
    """Visualiza mudanças em um PR"""
    result = get_pr_diff("microsoft", "vscode", 123)
    
    if result["success"]:
        print(f"🔀 PR: {result['title']}")
        print(f"   Autor: {result['author']}")
        print(f"   Status: {result['state']}")
        print(f"\n📝 Diff Preview (primeiras linhas):")
        diff_lines = result["diff"].split("\n")[:20]
        for line in diff_lines:
            print(line)
    else:
        print(f"❌ Erro: {result['error']}")

# ============================================
# EXEMPLO 5: Recuperar Workflows
# ============================================

def exemplo_get_workflows():
    """Lista workflows/actions do repositório"""
    result = get_workflows("microsoft", "vscode")
    
    if result["success"]:
        print("⚙️  Workflows do VSCode:")
        for workflow in result["workflows"]:
            print(f"  - {workflow['name']} ({workflow['state']})")
            print(f"    Path: {workflow['path']}")

# ============================================
# EXEMPLO 6: Ver Execuções de Workflows
# ============================================

def exemplo_get_workflow_runs():
    """Lista execuções recentes dos workflows"""
    result = get_workflow_runs("microsoft", "vscode", limit=5)
    
    if result["success"]:
        print("▶️  Execuções Recentes:")
        for run in result["runs"]:
            status_icon = "✅" if run["conclusion"] == "success" else "❌"
            print(f"  {status_icon} {run['name']}")
            print(f"     Status: {run['status']} | Conclusão: {run['conclusion']}")

# ============================================
# EXEMPLO 7: Listar Issues
# ============================================

def exemplo_list_issues():
    """Lista issues abertas"""
    # Issues abertas
    result = list_issues("microsoft", "vscode", state="open", limit=5)
    if result["success"]:
        print("📋 Issues Abertas (primeiras 5):")
        for issue in result["issues"]:
            is_pr = "🔀" if issue["is_pull_request"] else "📌"
            print(f"  {is_pr} #{issue['number']} - {issue['title']}")
            print(f"     Comentários: {issue['comments']}")
    
    # Issues fechadas
    result = list_issues("microsoft", "vscode", state="closed", limit=3)
    if result["success"]:
        print("\n✅ Issues Fechadas (primeiras 3):")
        for issue in result["issues"]:
            print(f"  ✓ #{issue['number']} - {issue['title']}")

# ============================================
# EXEMPLO 8: Detalhes de Issue/PR
# ============================================

def exemplo_get_issue_details():
    """Obtém detalhes completos de uma issue ou PR"""
    result = get_issue_details("microsoft", "vscode", 123)
    
    if result["success"]:
        print(f"📌 Detalhes da Issue #{result['number']}")
        print(f"   Título: {result['title']}")
        print(f"   Autor: {result['author']}")
        print(f"   Estado: {result['state']}")
        print(f"   Comentários: {result['comments']}")
        
        if result["labels"]:
            print(f"   Labels: {', '.join(result['labels'])}")
        
        # Se for um PR
        if result["is_pull_request"] and result["pr_details"]:
            pr = result["pr_details"]
            print(f"\n   🔀 Pull Request Details:")
            print(f"      Adições: +{pr['additions']}")
            print(f"      Deleções: -{pr['deletions']}")
            print(f"      Arquivos: {pr['changed_files']}")
            print(f"      Merged: {'Sim' if pr['merged'] else 'Não'}")

# ============================================
# EXEMPLO 9: Busca Avançada
# ============================================

def exemplo_busca_avancada():
    """Exemplo de caso de uso avançado"""
    owner = "microsoft"
    repo = "vscode"
    
    # 1. Listar repositórios recentes
    print("1️⃣  Listando repositórios recentes...")
    repos = list_repositories(owner=owner, limit=3)
    
    # 2. Para cada repo, listar estrutura
    for repo_info in repos["repositories"]:
        repo_name = repo_info["name"]
        print(f"\n2️⃣  Estrutura de {repo_name}:")
        tree = list_file_tree(owner, repo_name)
        if tree["success"]:
            for file in tree["files"][:3]:
                print(f"     - {file['name']}")
    
    # 3. Buscar issues abertas
    print(f"\n3️⃣  Issues em {repo}:")
    issues = list_issues(owner, repo, state="open", limit=3)
    if issues["success"]:
        for issue in issues["issues"]:
            print(f"     - #{issue['number']}: {issue['title']}")

# ============================================
# EXEMPLO 10: Análise de PR
# ============================================

def exemplo_analise_pr():
    """Exemplo de análise completa de um PR"""
    owner = "microsoft"
    repo = "vscode"
    pr_number = 123
    
    print(f"🔍 Analisando PR #{pr_number}...")
    
    # 1. Obter informações do PR
    pr_info = get_issue_details(owner, repo, pr_number)
    if pr_info["success"]:
        print(f"\n📋 Informações:")
        print(f"   Título: {pr_info['title']}")
        print(f"   Autor: {pr_info['author']}")
        print(f"   Status: {pr_info['state']}")
        
        # 2. Obter diff
        pr_diff = get_pr_diff(owner, repo, pr_number)
        if pr_diff["success"]:
            lines = len(pr_diff['diff'].split('\n'))
            print(f"\n📝 Alterações:")
            print(f"   Total de linhas no diff: {lines}")
            print(f"   Adições: +{pr_info['pr_details']['additions']}")
            print(f"   Deleções: -{pr_info['pr_details']['deletions']}")
        
        # 3. Buscar arquivos modificados (aproximado)
        print(f"\n📂 Arquivos modificados: {pr_info['pr_details']['changed_files']}")

# ============================================
# COMO EXECUTAR ESTES EXEMPLOS
# ============================================
"""
Opção 1: No Azure Functions Runtime
  - As tools estão disponíveis automaticamente como MCP Tools

Opção 2: Em um script Python
  - Importe as funções do function_app.py:
    from function_app import list_repositories, get_workflows, etc.
  - Configure GITHUB_TOKEN como variável de ambiente
  - Execute os exemplos

Opção 3: Via MCP Client
  - Configure o servidor como um recurso MCP no seu cliente
  - Use as tools através da API MCP

EXEMPLOS:
  exemplo_list_repositories()
  exemplo_list_file_tree()
  exemplo_search_files()
  exemplo_get_pr_diff()
  exemplo_get_workflows()
  exemplo_get_workflow_runs()
  exemplo_list_issues()
  exemplo_get_issue_details()
  exemplo_busca_avancada()
  exemplo_analise_pr()
"""

if __name__ == "__main__":
    print("""
    Este arquivo contém exemplos de uso das tools MCP GitHub.
    
    Descomente e execute os exemplos desejados:
    - exemplo_list_repositories()
    - exemplo_list_file_tree()
    - etc.
    
    Ou importe as funções em outro arquivo Python.
    """)
