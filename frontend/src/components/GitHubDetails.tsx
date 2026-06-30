import React, { useEffect, useState } from 'react';
import axios from 'axios';
import './GitHubDetails.css';

// ❌ PROBLEMA ARQUITETURAL 1: URL duplicada (deveria vir de config centralizada)
const API_URL = 'http://localhost:7071/api/';

interface Repo {
  owner: string;
  name: string;
  url: string;
}

interface FileItem {
  name: string;
  type: string;
  path: string;
}

interface Issue {
  number: number;
  title: string;
  state: string;
  created_at: string;
  user: { login: string };
}

interface Props {
  repo: Repo;
}

const GitHubDetails: React.FC<Props> = ({ repo }) => {
  const [files, setFiles] = useState<FileItem[]>([]);
  const [issues, setIssues] = useState<Issue[]>([]);
  const [loading, setLoading] = useState(true);
  // ❌ PROBLEMA ARQUITETURAL 2: Estado separado para cada tipo de dado, sem padrão
  const [filesLoading, setFilesLoading] = useState(false);
  const [issuesLoading, setIssuesLoading] = useState(false);
  const [error, setError] = useState<any>(null);
  const [selectedTab, setSelectedTab] = useState<'files' | 'issues'>('files');

  // ❌ PROBLEMA ARQUITETURAL 3: Dois useEffect que poderiam ser consolidados
  useEffect(() => {
    fetchFileTree();
  }, [repo]);

  useEffect(() => {
    fetchIssues();
  }, [repo]);

  // ❌ PROBLEMA ARQUITETURAL 4: Lógica de API duplicada em múltiplos componentes
  const fetchFileTree = async () => {
    setFilesLoading(true);
    try {
      const response = await axios.get(`${API_URL}list_file_tree`, {
        params: {
          owner: repo.owner,
          repo: repo.name,
          path: '/',
        },
        timeout: 8000,
      });

      // ❌ PROBLEMA ARQUITETURAL 5: Sem validação de resposta
      setFiles(response.data || []);
    } catch (err: any) {
      // ❌ PROBLEMA ARQUITETURAL 6: Erro não diferenciado
      setError('Failed to load files');
      console.error(err);
    } finally {
      setFilesLoading(false);
    }
  };

  // ❌ PROBLEMA ARQUITETURAL 7: Mesmo padrão repetido sem abstração
  const fetchIssues = async () => {
    setIssuesLoading(true);
    try {
      const response = await axios.get(`${API_URL}list_issues`, {
        params: {
          owner: repo.owner,
          repo: repo.name,
          state: 'open',
          limit: 20,
        },
        timeout: 8000,
      });

      setIssues(response.data || []);
    } catch (err: any) {
      setError('Failed to load issues');
      console.error(err);
    } finally {
      setIssuesLoading(false);
    }
  };

  // ❌ PROBLEMA ARQUITETURAL 8: Componente montado mas com fetches assíncronos sem loading coordenado
  useEffect(() => {
    setLoading(filesLoading || issuesLoading);
  }, [filesLoading, issuesLoading]);

  return (
    <div className="details-container">
      <div className="repo-info">
        <h2>{repo.name}</h2>
        <p className="repo-owner-info">Owner: {repo.owner}</p>
        <a href={repo.url} target="_blank" rel="noopener noreferrer" className="repo-link">
          View on GitHub →
        </a>
      </div>

      {error && <div className="error">{error}</div>}

      <div className="details-tabs">
        <button
          className={`tab ${selectedTab === 'files' ? 'active' : ''}`}
          onClick={() => setSelectedTab('files')}
        >
          📁 Files ({files.length})
        </button>
        <button
          className={`tab ${selectedTab === 'issues' ? 'active' : ''}`}
          onClick={() => setSelectedTab('issues')}
        >
          🐛 Issues ({issues.length})
        </button>
      </div>

      {/* ❌ PROBLEMA ARQUITETURAL 9: Estado de loading separado por tipo */}
      {selectedTab === 'files' && (
        <div className="tab-content">
          {filesLoading && <div className="loading">Loading files...</div>}
          {!filesLoading && (
            <div className="files-list">
              {files.map((file) => (
                <div
                  key={file.path}
                  className={`file-item ${file.type}`}
                >
                  <span className="file-icon">
                    {file.type === 'dir' ? '📁' : '📄'}
                  </span>
                  <span className="file-name">{file.name}</span>
                </div>
              ))}
              {files.length === 0 && (
                <p className="empty">No files found</p>
              )}
            </div>
          )}
        </div>
      )}

      {selectedTab === 'issues' && (
        <div className="tab-content">
          {issuesLoading && <div className="loading">Loading issues...</div>}
          {!issuesLoading && (
            <div className="issues-list">
              {issues.map((issue) => (
                <div key={issue.number} className="issue-item">
                  <div className="issue-header">
                    <h4>#{issue.number}: {issue.title}</h4>
                    <span className={`status ${issue.state}`}>{issue.state}</span>
                  </div>
                  <p className="issue-meta">
                    by <strong>@{issue.user.login}</strong> on{' '}
                    {new Date(issue.created_at).toLocaleDateString()}
                  </p>
                </div>
              ))}
              {issues.length === 0 && (
                <p className="empty">No open issues found</p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default GitHubDetails;
