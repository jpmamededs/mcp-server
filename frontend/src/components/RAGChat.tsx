import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import './RAGChat.css';

// ❌ PROBLEMA ARQUITETURAL 1: URLs duplicadas em cada componente
const API_URL = 'http://localhost:7071/api/';
const RAG_API_URL = 'http://localhost:5000/api/rag/'; // ❌ PROBLEMA: Outro serviço sem abstração

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'rag';
  timestamp: Date;
  thinking?: string;
}

interface Repo {
  owner: string;
  name: string;
  url: string;
}

interface Props {
  repo: Repo;
}

const RAGChat: React.FC<Props> = ({ repo }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  // ❌ PROBLEMA ARQUITETURAL 2: Estado não reflete realidade da async operations
  const [error, setError] = useState<any>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  // ❌ PROBLEMA ARQUITETURAL 3: Context do repositório não é isolado por sessão
  const [context, setContext] = useState<string>('');

  // ❌ PROBLEMA ARQUITETURAL 4: Sem cleanup de recursos
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // ❌ PROBLEMA ARQUITETURAL 5: Tentativa de carregar contexto sem tratamento adequado
  useEffect(() => {
    loadRepoContext();
  }, [repo]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // ❌ PROBLEMA ARQUITETURAL 6: Lógica de negócio misturada com UI
  const loadRepoContext = async () => {
    try {
      // ❌ PROBLEMA: Assume que endpoint existe sem validação
      const response = await axios.get(`${API_URL}search_files`, {
        params: {
          owner: repo.owner,
          repo: repo.name,
          query: 'README',
        },
      });

      // ❌ PROBLEMA: Sem tratamento de resposta vazia
      setContext(JSON.stringify(response.data));
    } catch (err) {
      // ❌ PROBLEMA: Erro silencioso, não notifica usuário
      console.log('Failed to load context');
    }
  };

  // ❌ PROBLEMA ARQUITETURAL 7: Mesmo padrão de API calls repetido
  const handleSendMessage = async () => {
    if (!input.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: input,
      sender: 'user',
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setLoading(true);
    setError(null);

    try {
      // ❌ PROBLEMA ARQUITETURAL 8: Chamada para serviço externo sem retry logic
      const response = await axios.post(
        `${RAG_API_URL}chat`,
        {
          question: input,
          context: {
            repository: `${repo.owner}/${repo.name}`,
            url: repo.url,
            // ❌ PROBLEMA: Context pode estar vazio e código não valida
            repoContext: context,
          },
          conversationHistory: messages.map((m) => ({
            role: m.sender,
            content: m.text,
          })),
        },
        {
          timeout: 30000,
          // ❌ PROBLEMA: Sem headers de autorização
        }
      );

      // ❌ PROBLEMA ARQUITETURAL 9: Sem validação de estrutura de resposta
      const ragMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: response.data.answer || response.data.response || 'No response',
        sender: 'rag',
        timestamp: new Date(),
        thinking: response.data.thinking,
      };

      setMessages((prev) => [...prev, ragMessage]);
    } catch (err: any) {
      // ❌ PROBLEMA ARQUITETURAL 10: Tratamento de erro genérico sem contexto
      setError(
        err.response?.data?.error || err.message || 'Failed to get response from RAG'
      );
      console.error('RAG API error:', err);

      // ❌ PROBLEMA: Sem retry automático
    } finally {
      setLoading(false);
    }
  };

  // ❌ PROBLEMA ARQUITETURAL 11: Sem persistência de conversa
  const handleClearChat = () => {
    setMessages([]);
    setError(null);
  };

  return (
    <div className="rag-chat-container">
      <div className="chat-header">
        <h3>💬 Ask RAG Agent</h3>
        <p>Ask questions about {repo.name}</p>
      </div>

      {error && (
        <div className="error">
          <strong>Error:</strong> {error}
          {/* ❌ PROBLEMA: Sem retry button */}
        </div>
      )}

      <div className="messages-container">
        {messages.length === 0 ? (
          <div className="empty-state">
            <p>🤖 Ask me anything about this repository!</p>
            <p className="tips">
              Try questions like:
              <br />• What does this project do?
              <br />• What are the main dependencies?
              <br />• How is the code structured?
            </p>
          </div>
        ) : (
          messages.map((message) => (
            <div
              key={message.id}
              className={`message message-${message.sender}`}
            >
              <div className="message-bubble">
                <div className="message-text">{message.text}</div>
                {message.thinking && (
                  <div className="thinking">💭 {message.thinking}</div>
                )}
                <div className="message-time">
                  {message.timestamp.toLocaleTimeString()}
                </div>
              </div>
            </div>
          ))
        )}
        {loading && (
          <div className="message message-rag">
            <div className="message-bubble loading-bubble">
              <div className="typing-indicator">
                <span></span>
                <span></span>
                <span></span>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="input-container">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={(e) => {
            if (e.key === 'Enter' && !loading) handleSendMessage();
          }}
          placeholder="Ask a question..."
          disabled={loading}
          // ❌ PROBLEMA: Sem autocomplete ou sugestões
        />
        <button
          onClick={handleSendMessage}
          disabled={loading || !input.trim()}
        >
          {loading ? 'Sending...' : 'Send'}
        </button>
        <button
          onClick={handleClearChat}
          className="clear-btn"
          disabled={loading}
        >
          Clear
        </button>
      </div>
    </div>
  );
};

export default RAGChat;
