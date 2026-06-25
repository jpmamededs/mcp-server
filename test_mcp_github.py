"""
Script de teste para validar o MCP GitHub Server

Execute com: python test_mcp_github.py
"""

import os
import sys
from dotenv import load_dotenv

# Load .env file
load_dotenv()

# Simular as functions do function_app.py
def test_token_validation():
    """Testa se o token do GitHub está configurado corretamente"""
    print("=" * 60)
    print("🔐 TESTE 1: Validação do Token GitHub")
    print("=" * 60)
    
    token = os.getenv("GITHUB_TOKEN")
    
    if not token:
        print("❌ ERRO: GITHUB_TOKEN não está definido!")
        print("\n   Passos para resolver:")
        print("   1. Gere um token em: https://github.com/settings/tokens")
        print("   2. Configure a variável de ambiente:")
        print("      - Windows CMD: setx GITHUB_TOKEN \"seu_token\"")
        print("      - Windows PowerShell: $env:GITHUB_TOKEN = \"seu_token\"")
        print("      - Linux/Mac: export GITHUB_TOKEN=\"seu_token\"")
        print("   3. Reinicie o terminal e execute novamente")
        return False
    
    if len(token) < 20:
        print("⚠️  AVISO: Token parece muito curto")
        return False
    
    print(f"✅ Token detectado: {token[:10]}...{token[-10:]}")
    return True

def test_imports():
    """Testa se todas as dependências estão instaladas"""
    print("\n" + "=" * 60)
    print("📦 TESTE 2: Validação de Dependências")
    print("=" * 60)
    
    dependencies = [
        ("httpx", "HTTP Client"),
        ("azure.functions", "Azure Functions"),
        ("PyGithub", "GitHub SDK (opcional)")
    ]
    
    all_ok = True
    for package, desc in dependencies:
        try:
            __import__(package)
            print(f"✅ {package:20} ({desc})")
        except ImportError:
            print(f"❌ {package:20} ({desc}) - NÃO INSTALADO")
            all_ok = False
    
    if not all_ok:
        print("\n   Execute: pip install -r requirements.txt")
    
    return all_ok

def test_github_connection():
    """Testa conexão com a API do GitHub"""
    print("\n" + "=" * 60)
    print("🌐 TESTE 3: Conexão com GitHub API")
    print("=" * 60)
    
    try:
        import httpx
        
        token = os.getenv("GITHUB_TOKEN")
        if not token:
            print("⏭️  Pulando teste (token não configurado)")
            return False
        
        headers = {
            "Authorization": f"token {token}",
            "Accept": "application/vnd.github.v3+json",
            "User-Agent": "MCP-GitHub-Test"
        }
        
        print("📡 Conectando a https://api.github.com/user...")
        
        with httpx.Client() as client:
            response = client.get("https://api.github.com/user", headers=headers)
        
        if response.status_code == 200:
            user = response.json()
            print(f"✅ Conexão bem-sucedida!")
            print(f"   Usuário: {user['login']}")
            print(f"   Nome: {user['name']}")
            print(f"   Repos públicos: {user['public_repos']}")
            return True
        elif response.status_code == 401:
            print(f"❌ ERRO 401: Token inválido ou expirado")
            print(f"   Regenere um novo em: https://github.com/settings/tokens")
            return False
        elif response.status_code == 403:
            print(f"❌ ERRO 403: Acesso negado (verifique permissões)")
            return False
        else:
            print(f"❌ ERRO {response.status_code}: {response.text}")
            return False
            
    except Exception as e:
        print(f"❌ ERRO de conexão: {e}")
        return False

def test_sample_tools():
    """Executa exemplo das tools disponíveis"""
    print("\n" + "=" * 60)
    print("🛠️  TESTE 4: Exemplo de Tools Disponíveis")
    print("=" * 60)
    
    print("""
As seguintes tools estão disponíveis no seu MCP Server:

1️⃣  list_repositories(owner=None, limit=10)
    Exemplo: list_repositories(owner="microsoft", limit=5)

2️⃣  list_file_tree(owner, repo, path="")
    Exemplo: list_file_tree("microsoft", "vscode", "src/")

3️⃣  search_files(owner, repo, query, language=None)
    Exemplo: search_files("microsoft", "vscode", "debug")

4️⃣  get_pr_diff(owner, repo, pr_number)
    Exemplo: get_pr_diff("microsoft", "vscode", 123)

5️⃣  get_workflows(owner, repo)
    Exemplo: get_workflows("microsoft", "vscode")

6️⃣  get_workflow_runs(owner, repo, workflow_id=None, limit=10)
    Exemplo: get_workflow_runs("microsoft", "vscode")

7️⃣  list_issues(owner, repo, state="open", limit=10)
    Exemplo: list_issues("microsoft", "vscode")

8️⃣  get_issue_details(owner, repo, issue_number)
    Exemplo: get_issue_details("microsoft", "vscode", 123)

📖 Veja GITHUB_SETUP.md para documentação completa!
    """)
    
    return True

def main():
    """Executa todos os testes"""
    print("\n🚀 MCP GitHub Server - Test Suite\n")
    
    results = {
        "Token": test_token_validation(),
        "Dependências": test_imports(),
        "GitHub API": test_github_connection(),
        "Tools": test_sample_tools()
    }
    
    print("\n" + "=" * 60)
    print("📊 RESUMO DOS TESTES")
    print("=" * 60)
    
    for test_name, passed in results.items():
        status = "✅ PASSOU" if passed else "⚠️  REQUER AÇÃO"
        print(f"{test_name:20} {status}")
    
    all_passed = all(results.values())
    
    print("\n" + "=" * 60)
    if all_passed:
        print("✅ Tudo pronto! Seu MCP Server está configurado corretamente")
        print("   Execute: func start")
    else:
        print("⚠️  Alguns testes falharam. Veja acima para mais detalhes.")
        print("   Consulte GITHUB_SETUP.md para troubleshooting")
    print("=" * 60 + "\n")
    
    return 0 if all_passed else 1

if __name__ == "__main__":
    sys.exit(main())
