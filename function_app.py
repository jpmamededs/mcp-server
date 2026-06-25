import azure.functions as func
import os
import json
import base64
import re
from pathlib import Path
from urllib.parse import urljoin
import httpx
from dotenv import load_dotenv

_local_env = Path(__file__).with_name(".env")
if _local_env.exists():
    load_dotenv(dotenv_path=_local_env, override=False)

app = func.FunctionApp()

# GitHub API configuration
GITHUB_TOKEN = os.getenv("GITHUB_TOKEN", "")
GITHUB_API_BASE = "https://api.github.com"

def get_headers():
    """Retorna headers para requisições ao GitHub"""
    headers = {
        "Accept": "application/vnd.github.v3+json",
        "User-Agent": "MCP-GitHub-Server"
    }
    if GITHUB_TOKEN:
        headers["Authorization"] = f"token {GITHUB_TOKEN}"
    return headers

# ===== Tools =====

@app.mcp_tool()
def list_repositories(owner: str = None, limit: int = 10) -> dict:
    """Lista repositórios do GitHub. Se owner não for especificado, lista do usuário autenticado."""
    try:
        if owner:
            url = f"{GITHUB_API_BASE}/users/{owner}/repos"
        else:
            url = f"{GITHUB_API_BASE}/user/repos"
        
        params = {"per_page": limit, "sort": "updated"}
        
        with httpx.Client() as client:
            response = client.get(url, headers=get_headers(), params=params)
            response.raise_for_status()
            repos = response.json()
        
        return {
            "success": True,
            "repositories": [
                {
                    "name": repo["name"],
                    "full_name": repo["full_name"],
                    "url": repo["html_url"],
                    "description": repo["description"],
                    "language": repo["language"],
                    "stars": repo["stargazers_count"],
                    "updated_at": repo["updated_at"]
                }
                for repo in repos
            ]
        }
    except Exception as e:
        return {"success": False, "error": str(e)}

@app.mcp_tool()
def list_file_tree(owner: str, repo: str, path: str = "", recursive: bool = False) -> dict:
    """Lista a árvore de arquivos de um repositório."""
    try:
        url = f"{GITHUB_API_BASE}/repos/{owner}/{repo}/contents/{path}"
        
        with httpx.Client() as client:
            response = client.get(url, headers=get_headers())
            response.raise_for_status()
            contents = response.json()
        
        if not isinstance(contents, list):
            contents = [contents]
        
        tree = []
        for item in contents:
            tree.append({
                "name": item["name"],
                "path": item["path"],
                "type": item["type"],
                "size": item.get("size", 0),
                "url": item["html_url"],
                "sha": item["sha"]
            })
        
        return {
            "success": True,
            "path": path,
            "owner": owner,
            "repo": repo,
            "files": tree
        }
    except Exception as e:
        return {"success": False, "error": str(e)}

@app.mcp_tool()
def search_files(owner: str, repo: str, query: str, language: str = None) -> dict:
    """Busca arquivos relevantes no repositório."""
    try:
        # Usar a API de busca do GitHub
        search_query = f"repo:{owner}/{repo} {query}"
        if language:
            search_query += f" language:{language}"
        
        url = f"{GITHUB_API_BASE}/search/code"
        params = {"q": search_query, "per_page": 10}
        
        with httpx.Client() as client:
            response = client.get(url, headers=get_headers(), params=params)
            response.raise_for_status()
            results = response.json()
        
        files = []
        for item in results.get("items", []):
            files.append({
                "name": item["name"],
                "path": item["path"],
                "url": item["html_url"],
                "repository": item["repository"]["full_name"],
                "score": item["score"]
            })
        
        return {
            "success": True,
            "query": query,
            "total_count": results.get("total_count", 0),
            "files": files
        }
    except Exception as e:
        return {"success": False, "error": str(e)}

@app.mcp_tool()
def get_file_content_raw(owner: str, repo: str, path: str, ref: str = None, max_bytes: int = 5000) -> dict:
    """Lê o conteúdo bruto de um arquivo no repositório (texto)."""
    try:
        url = f"{GITHUB_API_BASE}/repos/{owner}/{repo}/contents/{path}"
        params = {}
        if ref:
            params["ref"] = ref

        with httpx.Client() as client:
            response = client.get(url, headers=get_headers(), params=params)
            response.raise_for_status()
            payload = response.json()

        if payload.get("type") != "file":
            return {
                "success": False,
                "error": "O caminho informado nao e um arquivo.",
                "path": path,
            }

        size = int(payload.get("size", 0))
        if size > max_bytes:
            return {
                "success": False,
                "error": f"Arquivo excede limite max_bytes={max_bytes}.",
                "path": path,
                "size": size,
            }

        encoding = payload.get("encoding")
        if encoding != "base64":
            return {
                "success": False,
                "error": f"Encoding nao suportado: {encoding}",
                "path": path,
            }

        raw_b64 = payload.get("content", "").replace("\n", "")
        raw_bytes = base64.b64decode(raw_b64)
        text = raw_bytes.decode("utf-8", errors="replace")

        return {
            "success": True,
            "owner": owner,
            "repo": repo,
            "path": payload.get("path", path),
            "ref": ref,
            "sha": payload.get("sha"),
            "size": size,
            "content": text,
        }
    except Exception as e:
        return {"success": False, "error": str(e)}

@app.mcp_tool()
def get_pr_diff(owner: str, repo: str, pr_number: int) -> dict:
    """Captura o diff de um Pull Request."""
    try:
        url = f"{GITHUB_API_BASE}/repos/{owner}/{repo}/pulls/{pr_number}"
        
        with httpx.Client() as client:
            headers = get_headers()
            headers["Accept"] = "application/vnd.github.v3.diff"
            response = client.get(url, headers=headers)
            response.raise_for_status()
            diff = response.text
        
        # Obter informações do PR
        url_info = f"{GITHUB_API_BASE}/repos/{owner}/{repo}/pulls/{pr_number}"
        with httpx.Client() as client:
            response = client.get(url_info, headers=get_headers())
            response.raise_for_status()
            pr_info = response.json()
        
        return {
            "success": True,
            "pr_number": pr_number,
            "title": pr_info["title"],
            "state": pr_info["state"],
            "author": pr_info["user"]["login"],
            "created_at": pr_info["created_at"],
            "updated_at": pr_info["updated_at"],
            "diff": diff
        }
    except Exception as e:
        return {"success": False, "error": str(e)}

@app.mcp_tool()
def get_workflows(owner: str, repo: str) -> dict:
    """Recupera workflows/actions do repositório."""
    try:
        url = f"{GITHUB_API_BASE}/repos/{owner}/{repo}/actions/workflows"
        
        with httpx.Client() as client:
            response = client.get(url, headers=get_headers())
            response.raise_for_status()
            data = response.json()
        
        workflows = []
        for workflow in data.get("workflows", []):
            workflows.append({
                "name": workflow["name"],
                "id": workflow["id"],
                "path": workflow["path"],
                "state": workflow["state"],
                "created_at": workflow["created_at"],
                "updated_at": workflow["updated_at"],
                "url": workflow["html_url"]
            })
        
        return {
            "success": True,
            "owner": owner,
            "repo": repo,
            "workflows": workflows
        }
    except Exception as e:
        return {"success": False, "error": str(e)}

@app.mcp_tool()
def get_workflow_runs(owner: str, repo: str, workflow_id: str = None, limit: int = 10) -> dict:
    """Recupera as execuções dos workflows."""
    try:
        if workflow_id:
            url = f"{GITHUB_API_BASE}/repos/{owner}/{repo}/actions/workflows/{workflow_id}/runs"
        else:
            url = f"{GITHUB_API_BASE}/repos/{owner}/{repo}/actions/runs"
        
        params = {"per_page": limit}
        
        with httpx.Client() as client:
            response = client.get(url, headers=get_headers(), params=params)
            response.raise_for_status()
            data = response.json()
        
        runs = []
        for run in data.get("workflow_runs", []):
            runs.append({
                "id": run["id"],
                "name": run["name"],
                "status": run["status"],
                "conclusion": run["conclusion"],
                "created_at": run["created_at"],
                "updated_at": run["updated_at"],
                "head_branch": run["head_branch"],
                "url": run["html_url"]
            })
        
        return {
            "success": True,
            "workflow_id": workflow_id,
            "owner": owner,
            "repo": repo,
            "runs": runs
        }
    except Exception as e:
        return {"success": False, "error": str(e)}

@app.mcp_tool()
def list_issues(owner: str, repo: str, state: str = "open", limit: int = 10) -> dict:
    """Lista issues e PRs do repositório."""
    try:
        url = f"{GITHUB_API_BASE}/repos/{owner}/{repo}/issues"
        params = {"state": state, "per_page": limit}
        
        with httpx.Client() as client:
            response = client.get(url, headers=get_headers(), params=params)
            response.raise_for_status()
            issues = response.json()
        
        items = []
        for issue in issues:
            items.append({
                "number": issue["number"],
                "title": issue["title"],
                "state": issue["state"],
                "author": issue["user"]["login"],
                "created_at": issue["created_at"],
                "updated_at": issue["updated_at"],
                "comments": issue["comments"],
                "labels": [label["name"] for label in issue["labels"]],
                "is_pull_request": "pull_request" in issue,
                "url": issue["html_url"]
            })
        
        return {
            "success": True,
            "owner": owner,
            "repo": repo,
            "state": state,
            "issues": items
        }
    except Exception as e:
        return {"success": False, "error": str(e)}

@app.mcp_tool()
def get_issue_details(owner: str, repo: str, issue_number: int) -> dict:
    """Obtém detalhes de uma issue/PR específica."""
    try:
        url = f"{GITHUB_API_BASE}/repos/{owner}/{repo}/issues/{issue_number}"
        pr_details = None
        
        with httpx.Client() as client:
            response = client.get(url, headers=get_headers())
            response.raise_for_status()
            issue = response.json()

            # Se for PR, obter informações adicionais
            if "pull_request" in issue:
                pr_url = f"{GITHUB_API_BASE}/repos/{owner}/{repo}/pulls/{issue_number}"
                response = client.get(pr_url, headers=get_headers())
                if response.status_code == 200:
                    pr_data = response.json()
                    pr_details = {
                        "additions": pr_data["additions"],
                        "deletions": pr_data["deletions"],
                        "changed_files": pr_data["changed_files"],
                        "merged": pr_data["merged"],
                        "mergeable": pr_data["mergeable"],
                        "base_branch": pr_data["base"]["ref"],
                        "head_branch": pr_data["head"]["ref"]
                    }
        
        return {
            "success": True,
            "number": issue["number"],
            "title": issue["title"],
            "body": issue["body"],
            "state": issue["state"],
            "author": issue["user"]["login"],
            "created_at": issue["created_at"],
            "updated_at": issue["updated_at"],
            "comments": issue["comments"],
            "labels": [label["name"] for label in issue["labels"]],
            "is_pull_request": "pull_request" in issue,
            "pr_details": pr_details,
            "url": issue["html_url"]
        }
    except Exception as e:
        return {"success": False, "error": str(e)}
