import React, { useState } from 'react';
import RepositorySearch from './components/RepositorySearch';
import GitHubDetails from './components/GitHubDetails';
import RAGChat from './components/RAGChat';
import './App.css';

interface SelectedRepo {
  owner: string;
  name: string;
  url: string;
}

const App: React.FC = () => {
  const [selectedRepo, setSelectedRepo] = useState<SelectedRepo | null>(null);
  const [activeTab, setActiveTab] = useState<'search' | 'details' | 'rag'>('search');

  const handleRepoSelect = (owner: string, name: string, url: string) => {
    setSelectedRepo({ owner, name, url });
    setActiveTab('details');
  };

  return (
    <div className="container">
      <header className="header">
        <h1>🚀 GitHub RAG Explorer</h1>
        <p>Explore GitHub repositories with AI-powered insights</p>
      </header>

      <div className="tabs">
        <button
          className={`tab-btn ${activeTab === 'search' ? 'active' : ''}`}
          onClick={() => setActiveTab('search')}
        >
          Search Repos
        </button>
        <button
          className={`tab-btn ${activeTab === 'details' ? 'active' : ''}`}
          onClick={() => setActiveTab('details')}
          disabled={!selectedRepo}
        >
          Repository Details
        </button>
        <button
          className={`tab-btn ${activeTab === 'rag' ? 'active' : ''}`}
          onClick={() => setActiveTab('rag')}
          disabled={!selectedRepo}
        >
          Ask RAG Agent
        </button>
      </div>

      <div className="content">
        {activeTab === 'search' && (
          <RepositorySearch onRepoSelect={handleRepoSelect} />
        )}

        {activeTab === 'details' && selectedRepo && (
          <GitHubDetails repo={selectedRepo} />
        )}

        {activeTab === 'rag' && selectedRepo && (
          <RAGChat repo={selectedRepo} />
        )}
      </div>
    </div>
  );
};

export default App;
