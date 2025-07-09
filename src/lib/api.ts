import axios from 'axios';
import type { Filters } from '../hooks/use-filters';
 
//
// baseURL vazio: tudo já vai no proxy do Vite em /api/…
//
export const baseURL = '/api';

// Exporting the api instance to be used consistently across all files
export const api = axios.create({
  baseURL,
  headers: {
    'Accept': 'application/json',
    'Content-Type': 'application/json',
  },
});

// DEBUG: log de todas as requests/responses
// Removido para produção

export interface CallRow {
  call_id:         string;
  avaliacao_id:    string;
  data_ligacao:    string;
  pontuacao:       number;
  status_avaliacao:string;
  callerid?:       string;  // número do cliente (telefone)
}

export const getKpis           = (f: Filters)        => api.get('/kpis',    { params: f }).then(r => r.data);
export const getTrend          = (f: Filters)        => api.get('/trend',   { params: f }).then(r => r.data);
export const getAgents         = (f: Filters)        => api.get('/agents',  { params: f }).then(r => r.data);
export const getAgentSummary   = (id: string, f: Filters) => api.get(`/agent/${id}/summary`, { params: f }).then(r => r.data);
export const getAgentCalls     = (id: string, f: Filters) => api.get(`/agent/${id}/calls`,   { params: f }).then(r => r.data);
export const getCallItems      = (avaliacaoId: string)   => api.get(`/call/${avaliacaoId}/items`).then(r => r.data);
export const getTranscription  = (avaliacaoId: string)   => api.get(`/call/${avaliacaoId}/transcription`).then(r => r.data);
export const getAgentWorstItem = (id: string, f: Filters) => api.get(`/agent/${id}/worst_item`, { params: f }).then(r => r.data);
export const getAgentCriteria  = (id: string, f: Filters) => api.get(`/agent/${id}/criteria`, { params: f }).then(r => r.data);
export const downloadAudio     = (callId: string)     => api.get(`/call/${callId}/audio`, { responseType: 'blob' }).then(r => r.data);

// Nova função para buscar informações do caller (telefone)
export const getCallerInfo     = (avaliacaoId: string)   => api.get(`/call/${avaliacaoId}/caller`).then(r => r.data);

// Função para atualizar um item de avaliação
export const updateItem = (avaliacaoId: string, categoria: string, resultado: string, descricao: string) => {
  return api.put(`/call/${avaliacaoId}/item/${encodeURIComponent(categoria)}`, {
    categoria,
    resultado,
    descricao
  }).then(r => r.data);
};

// Authentication interfaces
export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  access_token: string;
  token_type: string;
  user: {
    id: number;
    username: string;
    full_name: string;
    active: boolean;
    requires_password_change: boolean;
  };
}

export interface UserInfo {
  id: number;
  username: string;
  full_name: string;
  active: boolean;
  permissions: string[];
}

export interface ChangePasswordRequest {
  current_password: string;
  new_password: string;
}

// Token management
export const getAuthToken = (): string | null => {
  return localStorage.getItem('auth_token');
};

export const setAuthToken = (token: string): void => {
  localStorage.setItem('auth_token', token);
  // Update axios default headers
  api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
};

export const removeAuthToken = (): void => {
  localStorage.removeItem('auth_token');
  localStorage.removeItem('user_info');
  delete api.defaults.headers.common['Authorization'];
};

export const isAuthenticated = (): boolean => {
  return getAuthToken() !== null;
};

// Set up axios interceptor to add token to requests
api.interceptors.request.use(
  (config) => {
    console.log('🌐 Requisição:', config.method?.toUpperCase(), config.url);
    const token = getAuthToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    console.error('❌ Erro na requisição:', error);
    return Promise.reject(error);
  }
);

// Set up axios interceptor to handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      removeAuthToken();
      // Redirect to login page
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Authentication API functions
export const login = async (credentials: LoginRequest): Promise<LoginResponse> => {
  console.log('🔐 Iniciando login...', { username: credentials.username });
  
  // OAuth2 password flow requires form data
  const formData = new URLSearchParams();
  formData.append('username', credentials.username);
  formData.append('password', credentials.password);
  
  console.log('📝 Form data criado, enviando requisição...');
  console.log('🌐 URL completa:', `${api.defaults.baseURL}/auth/token`);
  
  try {
    const response = await api.post('/auth/token', formData, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      timeout: 10000, // 10 seconds timeout
    });
    
    console.log('✅ Resposta recebida:', response.status);
    const data = response.data;
    console.log('👤 Dados do usuário:', data.user);
    
    // Store token and user info
    setAuthToken(data.access_token);
    localStorage.setItem('user_info', JSON.stringify(data.user));
    
    console.log('💾 Token armazenado com sucesso');
    return data;
  } catch (error) {
    console.error('❌ Erro no login:', error);
    throw error;
  }
};

export const logout = (): void => {
  removeAuthToken();
};

export const getCurrentUser = async (): Promise<UserInfo> => {
  const response = await api.get('/auth/me');
  return response.data;
};

export const changePassword = async (passwordData: ChangePasswordRequest): Promise<void> => {
  await api.post('/auth/change-password', passwordData);
};

export const getUserInfoFromStorage = (): UserInfo | null => {
  const userInfo = localStorage.getItem('user_info');
  return userInfo ? JSON.parse(userInfo) : null;
};

// Initialize token from storage on app load
const storedToken = getAuthToken();
if (storedToken) {
  setAuthToken(storedToken);
}

// Função para buscar feedbacks de uma avaliação específica
export const getFeedbacksByAvaliacao = (avaliacaoId: string) =>
  api.get(`/avaliacao/${avaliacaoId}/feedbacks`).then(r => r.data);

// Função para buscar uma avaliação individual pelo ID
export const getAvaliacaoById = (avaliacaoId: string) =>
  api.get(`/avaliacao/${avaliacaoId}`).then(r => r.data);

export async function getAllAgents() {
  const res = await fetch('/api/admin/agents', {
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
    }
  });
  if (!res.ok) throw new Error('Erro ao buscar agentes');
  return await res.json();
}

// Lista todos os usuários do sistema (admin)
export async function getAllUsers() {
  const res = await fetch(`/admin/users`, {
    headers: { 'Authorization': `Bearer ${localStorage.getItem('auth_token')}` }
  });
  if (!res.ok) throw new Error('Erro ao buscar usuários');
  return res.json();
}

// Reseta a senha do usuário para o valor padrão (admin)
export async function resetUserPassword(userId: number) {
  const res = await fetch(`/admin/users/${userId}/reset-password`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${localStorage.getItem('auth_token')}` }
  });
  if (!res.ok) throw new Error('Erro ao resetar senha');
  return res.json();
}

// Atualiza dados do usuário (admin)
export async function updateUser(userId: number, data: { full_name: string; active: boolean }) {
  const res = await fetch(`/admin/users/${userId}`, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(data)
  });
  if (!res.ok) throw new Error('Erro ao atualizar usuário');
  return res.json();
}
