# GitHub RAG Explorer Frontend

Um frontend React que deveria integrar com um servidor MCP de GitHub e um agente de RAG (Retrieval-Augmented Generation) para explorar repositórios com insights alimentados por IA.

> ⚠️ **AVISO**: Este projeto foi criado com **problemas arquiteturais intencionais** para fins educacionais e de demonstração.

## 🚨 Problemas Arquiteturais Identificados

### 1. **Falta de Centralização de Configuração**
- URLs das APIs estão hardcoded em cada componente
- Sem arquivo de configuração centralizado
- Difícil de gerenciar diferentes ambientes (dev, staging, prod)

### 2. **Acoplamento Forte entre Componentes**
- Cada componente faz suas próprias chamadas HTTP
- Sem serviço abstrato para comunicação com API
- Lógica de negócio misturada com UI

### 3. **Gerenciamento de Estado Inadequado**
- Estado distribuído de forma inconsistente
- Sem contexto global para dados compartilhados
- Estado de loading duplicado em múltiplos componentes

### 4. **Tratamento de Erros Inconsistente**
- Erros tratados de forma genérica em cada componente
- Sem retry logic automático
- Erros silenciosos em alguns casos

### 5. **Duplicação de Código**
- Padrão de chamadas HTTP repetido em 3 componentes
- Mesma lógica de erro/loading em vários lugares
- URLs hardcoded repetidas

### 6. **Falta de Tipagem**
- `error` tipado como `any`
- Sem validação de estrutura de resposta da API
- Interfaces não completas

### 7. **Sem Padrão de Serviço**
- Não há camada de abstração para chamadas HTTP
- API calls espalhadas pelos componentes
- Sem reutilização de lógica comum

### 8. **Conversa com RAG Sem Persistência**
- Histórico de conversa perdido ao recarregar
- Sem armazenamento local
- Sem sincronização com backend

### 9. **Sem Validação de Dados**
- Respostas da API assumidas como válidas
- Sem schemas de validação
- Dados podem estar corrompidos

### 10. **Context de Repositório Não Isolado**
- Informações do repositório podem vazar entre sessões
- Sem cleanup adequado de recursos

## 📁 Estrutura do Projeto

```
frontend/
├── src/
│   ├── components/
│   │   ├── RepositorySearch.tsx      # Busca repos (problemas: 1, 2, 3, 4, 5, 6, 7)
│   │   ├── RepositorySearch.css
│   │   ├── GitHubDetails.tsx         # Detalhes (problemas: 1, 2, 3, 4, 5, 6, 7)
│   │   ├── GitHubDetails.css
│   │   ├── RAGChat.tsx               # Chat com RAG (problemas: 1, 2, 3, 4, 5, 6, 7, 8, 9, 10)
│   │   └── RAGChat.css
│   ├── App.tsx                        # App principal
│   ├── App.css
│   ├── index.tsx
│   └── index.css
├── package.json
├── tsconfig.json
└── README.md
```

## 🔧 Como Usar

### Instalação
```bash
npm install
```

### Desenvolvimento
```bash
npm start
```

A aplicação abrirá em `http://localhost:3000`

### Build
```bash
npm run build
```

## ⚙️ Configuração

### Variáveis de Ambiente Necessárias
Crie um `.env` na raiz do frontend:

```env
REACT_APP_MCP_API_URL=http://localhost:7071/api/
REACT_APP_RAG_API_URL=http://localhost:5000/api/rag/
```

## 🎯 Funcionalidades Atuais

1. **Search Repositories** - Busca repositórios de um owner
2. **View Details** - Visualiza arquivos e issues
3. **RAG Chat** - Conversa com agente de IA sobre o repo

## 🔧 Como Refatorar (Sugestões)

### 1. Criar um Serviço de API Centralizado
```typescript
// services/apiService.ts
class APIService {
  private baseUrl: string;
  private ragUrl: string;
  
  async listRepositories(owner: string, limit: number) {
    // Centralizado
  }
  
  async listIssues(...) { }
  // ... mais métodos
}
```

### 2. Implementar Context API ou Redux
```typescript
// context/AppContext.ts
export const AppContext = React.createContext();
export const AppProvider = ({ children }) => {
  const [repos, setRepos] = useState([]);
  const [selectedRepo, setSelectedRepo] = useState(null);
  // ...
};
```

### 3. Criar Hooks Reutilizáveis
```typescript
// hooks/useRepository.ts
export const useRepository = (owner: string) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  // Lógica compartilhada
};
```

### 4. Implementar Validação com Zod ou Yup
```typescript
const RepoSchema = z.object({
  name: z.string(),
  owner: z.object({ login: z.string() }),
  // ...
});
```

### 5. Configuração Centralizada
```typescript
// config/api.ts
export const API_CONFIG = {
  development: {
    mcp: 'http://localhost:7071/api/',
    rag: 'http://localhost:5000/api/rag/',
  },
  production: {
    mcp: process.env.REACT_APP_MCP_API_URL,
    rag: process.env.REACT_APP_RAG_API_URL,
  },
};
```

## 📊 Diagrama de Comunicação

```
┌─────────────┐
│  Frontend   │
├─────────────┤
│ - Search    │──────────┐
│ - Details   │          │  HTTP Calls (Desacoplados)
│ - RAG Chat  │          │
└─────────────┘          │
                         ▼
           ┌──────────────────────────┐
           │   MCP Server (Backend)   │
           ├──────────────────────────┤
           │ - list_repositories()    │
           │ - list_issues()          │
           │ - list_file_tree()       │
           │ - ... (8 tools total)    │
           └──────────────────────────┘
                         ▲
                         │
           ┌──────────────────────────┐
           │   RAG Agent Service      │
           ├──────────────────────────┤
           │ - Chat endpoint          │
           │ - Context retrieval      │
           │ - Answer generation      │
           └──────────────────────────┘
```

## 🚀 Próximos Passos

- [ ] Implementar serviço de API
- [ ] Adicionar Context API
- [ ] Criar hooks reutilizáveis
- [ ] Adicionar validação de dados
- [ ] Implementar persistência local
- [ ] Adicionar retry logic
- [ ] Melhorar tratamento de erros
- [ ] Adicionar testes unitários
- [ ] Implementar logging estruturado

## 📝 Notas

Este projeto foi criado com propósitos educacionais para demonstrar problemas comuns em arquitetura frontend e como resolvê-los.
