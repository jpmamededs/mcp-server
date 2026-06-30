import React, { useState } from 'react';
import axios from 'axios';
import './RepositorySearch.css';

// ❌ PROBLEMA ARQUITETURAL 1: API URL hardcoded, sem configuração centralizada
const API_URL = 'http://localhost:7071/api/';

interface Repo {
  id: number;
  name: string;
  owner: { login: string };
  description: string;
  url: string;
  stargazers_count: number;
  language: string;
}

interface Props {
  onRepoSelect: (owner: string, name: string, url: string) => void;
}

const RepositorySearch: React.FC<Props> = ({ onRepoSelect }) => {
  const [owner, setOwner] = useState('');
  const [repos, setRepos] = useState<Repo[]>([]);
  const [loading, setLoading] = useState(false);
  // ❌ PROBLEMA ARQUITETURAL 2: Estado compartilhado com string genérica, sem tipagem clara
  const [error, setError] = useState<any>(null);
  const [searchHistory, setSearchHistory] = useState<string[]>([]);

  // ❌ PROBLEMA ARQUITETURAL 3: Lógica de API espalhada no componente
  const handleSearch = async () => {
    if (!owner) {
      setError('Owner name is required');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // ❌ PROBLEMA ARQUITETURAL 4: Chamada HTTP direta sem abstração de serviço
      const response = await axios.get(`${API_URL}list_repositories`, {
        params: { owner, limit: 20 },
        timeout: 5000,
      });

      // ❌ PROBLEMA ARQUITETURAL 5: Sem tratamento consistente de erros
      if (response.status === 200) {
        setRepos(response.data);
        setSearchHistory([...searchHistory, owner]); // ❌ PROBLEMA: Sem limite de histórico
      }
    } catch (err: any) {
      // ❌ PROBLEMA ARQUITETURAL 6: Tratamento genérico de erros
      setError(err.message || 'Failed to fetch repositories');
      console.log('Error caught:', err); // ❌ PROBLEMA: Logging inadequado
    } finally {
      setLoading(false);
    }
  };

  const handleSelectRepo = (repo: Repo) => {
    // ❌ PROBLEMA: Sem validação de dados
    onRepoSelect(repo.owner.login, repo.name, repo.url);
  };

  // ❌ PROBLEMA ARQUITETURAL 7: Componente traz toda a responsabilidade
  return (
    <div className="search-container">
      <div className="search-form">
        <input
          type="text"
          placeholder="Enter GitHub owner/username"
          value={owner}
          onChange={(e) => setOwner(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
        />
        <button onClick={handleSearch} disabled={loading}>
          {loading ? 'Searching...' : 'Search'}
        </button>
      </div>

      {/* ❌ PROBLEMA ARQUITETURAL 8: Search history sem propósito claro */}
      {searchHistory.length > 0 && (
        <div className="search-history">
          <h4>Recent Searches:</h4>
          <div className="history-tags">
            {searchHistory.map((item, idx) => (
              <span
                key={idx}
                className="history-tag"
                onClick={() => setOwner(item)}
              >
                {item} ×
              </span>
            ))}
          </div>
        </div>
      )}

      {error && <div className="error">{error}</div>}

      {loading && <div className="loading">Loading repositories...</div>}

      <div className="repos-grid">
        {repos.map((repo) => (
          <div
            key={repo.id}
            className="repo-card"
            onClick={() => handleSelectRepo(repo)}
          >
            <div className="repo-header">
              <h3>{repo.name}</h3>
              {repo.stargazers_count > 0 && (
                <span className="stars">⭐ {repo.stargazers_count}</span>
              )}
            </div>
            <p className="repo-owner">by @{repo.owner.login}</p>
            {repo.description && (
              <p className="repo-description">{repo.description}</p>
            )}
            {repo.language && (
              <span className="language-badge">{repo.language}</span>
            )}
          </div>
        ))}
      </div>

      {repos.length === 0 && !loading && !error && (
        <p className="no-results">
          Enter an owner name and click Search to find repositories
        </p>
      )}
    </div>
  );
};

export default RepositorySearch;
