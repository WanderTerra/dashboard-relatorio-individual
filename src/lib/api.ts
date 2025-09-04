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
export const getMonthlyComparison = (f: Filters)     => api.get('/monthly-comparison', { params: f }).then(r => r.data);
export const getAgentSummary   = (id: string, f: Filters) => api.get(`/agent/${id}/summary`, { params: f }).then(r => r.data);
export const getAgentCalls     = (id: string, f: Filters) => api.get(`/agent/${id}/calls`,   { params: f }).then(r => r.data);
export const getCallItems      = (avaliacaoId: string)   => api.get(`/call/${avaliacaoId}/items`).then(r => r.data);
export const getTranscription  = (avaliacaoId: string)   => api.get(`/call/${avaliacaoId}/transcription`).then(r => r.data);
export const getAgentWorstItem = (id: string, f: Filters) => api.get(`/agent/${id}/worst_item`, { params: f }).then(r => r.data);
export const getAgentCriteria  = (id: string, f: Filters) => api.get(`/agent/${id}/criteria`, { params: f }).then(r => r.data);
export const downloadAudio     = (callId: string)     => api.get(`/call/${callId}/audio`, { responseType: 'blob' }).then(r => r.data);

// Nova função para buscar informações do caller (telefone)
export const getCallerInfo     = (avaliacaoId: string)   => api.get(`/call/${avaliacaoId}/caller`).then(r => r.data);

// Função para atualizar um item de avaliação usando o novo endpoint item-id (recomendado)
export const updateItem = (avaliacaoId: string, itemId: string, resultado: string, descricao: string) => {
  return api.put(`/call/${avaliacaoId}/item-id/${itemId}`, {
    resultado,
    descricao
  }).then(r => r.data);
};

// Função para atualizar um item de avaliação usando categoria (legacy - mantida para compatibilidade)
export const updateItemByCategoria = (avaliacaoId: string, categoria: string, resultado: string, descricao: string) => {
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

// Aceitar feedback (POST) – endpoint dedicado
export const aceitarFeedback = (id: number) =>
  api.post(`/feedbacks/${id}/aceite`).then(r => r.data);

// Alternativa (PUT) – seta aceite=1; o backend preenche aceite_em server-side
export const aceitarFeedbackPut = (id: number) =>
  api.put(`/feedbacks/${id}`, { aceite: 1 }).then(r => r.data);

// Função para salvar feedbacks automaticamente
export const salvarFeedbacksAutomaticos = (avaliacaoId: string, feedbacks: Array<{
  agent_id: string;
  comentario: string;
  status: string;
  origem: 'IA' | 'MONITOR';
}>) => api.post(`/avaliacao/${avaliacaoId}/feedbacks/automaticos`, { feedbacks }).then(r => r.data);

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
  const res = await api.get('/admin/users');
  return res.data;
}

// Lista apenas usuários ativos do sistema
export async function getActiveUsers() {
  try {
    const res = await api.get('/admin/users');
    
    // Filtrar apenas usuários ativos - ser mais flexível com o campo
    const activeUsers = res.data.filter((user: any) => {
      // Verificar se o campo active existe e é verdadeiro
      const isActive = user.active === true || user.active === 1 || user.active === 'true';
      return isActive;
    });
    
    return activeUsers;
  } catch (error) {
    console.error('❌ Erro em getActiveUsers:', error);
    throw error;
  }
}

// Busca agentes ativos (combinando dados de usuários e performance)
export async function getActiveAgents(filters: any) {
  try {
    // Se activeOnly for false ou undefined, retornar todos os agentes
    if (filters.activeOnly === false) {
      return await getAgents(filters);
    }
    
    // Filtrar apenas agentes ativos
    let activeUsers;
    try {
      activeUsers = await getActiveUsers();
    } catch (userError) {
      console.error('❌ Erro ao buscar usuários ativos:', userError);
      return await getAgents(filters);
    }
    
    // Se não há usuários ativos, retornar lista vazia
    if (!activeUsers || activeUsers.length === 0) {
      return [];
    }
    
    // Buscar dados de performance dos agentes
    let agentsData;
    try {
      agentsData = await getAgents(filters);
    } catch (agentError) {
      console.error('❌ Erro ao buscar dados de performance:', agentError);
      return [];
    }
    
    // Se não há dados de performance, retornar lista vazia
    if (!agentsData || agentsData.length === 0) {
      return [];
    }
    
    // Combinar e filtrar apenas agentes que são usuários ativos
    const activeUserIds = new Set([
      ...activeUsers.map((user: any) => user.username),
      ...activeUsers.map((user: any) => user.id?.toString()),
      ...activeUsers.map((user: any) => user.agent_id?.toString())
    ]);
    
    // Filtrar agentes ativos com dados válidos
    const activeAgents = agentsData.filter((agent: any) => {
      const agentId = agent.agent_id?.toString();
      const ligacoes = agent.ligacoes || 0;
      
      // PRIMEIRO: Verificar se o agente tem dados válidos
      if (ligacoes === 0 || ligacoes === null || ligacoes === undefined) {
        return false;
      }
      
      // SEGUNDO: Tentar diferentes estratégias de match
      let isActive = false;
      
      // 1. Match direto por agent_id
      if (activeUserIds.has(agentId)) {
        isActive = true;
      } else {
        // 2. Tentar encontrar usuário com username que contenha o agent_id
        const matchingUser = activeUsers.find((user: any) => {
          return user.username && user.username.includes(agentId);
        });
        
        if (matchingUser) {
          isActive = true;
        } else {
          // 3. Tentar match por nome (case insensitive)
          const agentName = agent.agent_name || agent.nome;
          const matchingUserByName = activeUsers.find((user: any) => {
            const userName = user.full_name?.toLowerCase() || '';
            const agentNameLower = agentName?.toLowerCase() || '';
            return userName.includes(agentNameLower) || agentNameLower.includes(userName);
          });
          
          if (matchingUserByName) {
            isActive = true;
          } else {
            // 4. Tentar match por username que seja similar ao agent_id
            const matchingUserBySimilarId = activeUsers.find((user: any) => {
              if (user.username && user.username.includes('agent.')) {
                const userAgentId = user.username.replace('agent.', '');
                return userAgentId === agentId;
              }
              return false;
            });
            
            if (matchingUserBySimilarId) {
              isActive = true;
            }
          }
        }
      }
      
      return isActive;
    });
    
    return activeAgents;
  } catch (error) {
    console.error('❌ Erro geral em getActiveAgents:', error);
    try {
      return await getAgents(filters);
    } catch (fallbackError) {
      console.error('❌ Erro no fallback também:', fallbackError);
      return [];
    }
  }
}

// Reseta a senha do usuário para o valor padrão (admin)
export async function resetUserPassword(userId: number) {
  const res = await api.post(`/admin/users/${userId}/reset-password`);
  return res.data;
}

// Atualiza dados do usuário (admin)
export async function updateUser(userId: number, data: { full_name: string; active: boolean; username: string }) {
  const res = await api.put(`/admin/users/${userId}`, data);
  return res.data;
}

export async function createUser(username: string, full_name: string, permissions?: string[]) {
  const body: any = { username, full_name };
  if (permissions) body.permissions = permissions;
  
  const res = await fetch('/api/admin/ensure-user', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(body)
  });
  if (!res.ok) throw new Error('Erro ao criar usuário');
  return res.json();
}

export async function getUserPermissions(userId: number): Promise<string[]> {
  const res = await fetch(`/api/admin/users/${userId}/permissions`, {
    headers: { 'Authorization': `Bearer ${localStorage.getItem('auth_token')}` }
  });
  if (!res.ok) throw new Error('Erro ao buscar permissões');
  return res.json();
}

export async function updateUserPermissions(userId: number, permissions: string[]) {
  const res = await fetch(`/api/admin/users/${userId}/permissions`, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(permissions)
  });
  if (!res.ok) throw new Error('Erro ao atualizar permissões');
  return res.json();
}

// Função para buscar todas as carteiras (tabela carteiras)
export async function getAllCarteiras() {
  const res = await fetch('/api/carteiras/', {
    headers: { 'Authorization': `Bearer ${localStorage.getItem('auth_token')}` }
  });
  if (!res.ok) throw new Error('Erro ao buscar carteiras');
  return res.json();
}

// Função para buscar carteiras únicas da tabela avaliacoes
export async function getCarteirasFromAvaliacoes() {
  const res = await fetch('/carteiras-avaliacoes', {
    headers: { 'Authorization': `Bearer ${localStorage.getItem('auth_token')}` }
  });
  if (!res.ok) {
    throw new Error('Erro ao buscar carteiras das avaliações');
  }
  return res.json();
}

// ===== FUNÇÕES PARA AVALIAÇÃO AUTOMÁTICA =====

// Interface para requisição de avaliação automática
export interface AvaliacaoAutomaticaRequest {
  transcricao: string;
  carteira_id: number;
  call_id?: string;
  agent_id?: string;
}

// Interface para resposta da avaliação automática
export interface AvaliacaoAutomaticaResponse {
  id_chamada: string;
  avaliador: string;
  falha_critica: boolean;
  itens: Record<string, Record<string, {
    status: string;
    observacao: string;
    peso: number;
  }>>;
  erro_processamento?: string;
  pontuacao_total: number;
  pontuacao_percentual: number;
  feedbacks: Array<{
    agent_id: string;
    comentario: string;
    status: string;
    origem: 'IA' | 'MONITOR';
  }>;
}

// Função para chamar avaliação automática
export const avaliarTranscricaoAutomatica = (data: AvaliacaoAutomaticaRequest) =>
  api.post('/avaliacao/automatica', data).then(r => r.data);

// Função para buscar critérios de uma carteira
export const getCriteriosCarteira = (carteiraId: number) =>
  api.get(`/carteira/${carteiraId}/criterios`).then(r => r.data);

// Função para buscar todos os critérios
export const getCriterios = () =>
  api.get('/criterios/').then(r => r.data);

// Função para buscar apenas as categorias únicas dos critérios
export const getCategoriasCriterios = () =>
  api.get('/criterios/categorias/').then(r => r.data);

// Funções para carteira_criterios
export const getCriteriosDaCarteira = (carteiraId: number): Promise<Array<{
  id: number;
  carteira_id: number;
  criterio_id: number;
  ordem?: number;
  peso_especifico?: number;
}>> => api.get(`/carteira_criterios/carteira/${carteiraId}`).then(r => r.data);

export const adicionarCriterioNaCarteira = (data: {
  carteira_id: number;
  criterio_id: number;
  ordem?: number;
  peso_especifico?: number;
}) => api.post('/carteira_criterios/', data).then(r => r.data);

export const removerCriterioDaCarteira = (assocId: number) =>
  api.delete(`/carteira_criterios/${assocId}`);

// Clonar critério para outra carteira (cria um novo critério independente e associa)
export const clonarCriterioParaCarteira = (data: {
  from_criterio_id: number;
  to_carteira_id: number;
  novo_nome?: string;
  nova_descricao?: string;
  novo_exemplo_frase?: string;
  nova_categoria?: string;
  novo_peso?: number;
  ordem?: number;
  peso_especifico?: number;
}) => api.post('/carteira_criterios/clone', data).then(r => r.data);

// Função para buscar dados específicos de uma carteira para análise P.O.R.T.E.S
export const getCarteiraPortesData = (carteiraId: number, filters: Filters) =>
  api.get(`/carteira/${carteiraId}/portes`, { params: filters }).then(r => r.data);

// Função para buscar dados reais das avaliações para análise P.O.R.T.E.S
export const getAvaliacoesPortesData = (filters: Filters) =>
  api.get('/avaliacoes/portes', { params: filters }).then(r => r.data);

// Função para buscar critérios mais avaliados com notas específicas
export const getCriteriosNotas = (filters: Filters) =>
  api.get('/criterios/notas', { params: filters }).then(r => r.data);

// Função para buscar evolução dos agentes
export const getEvolucaoAgentes = (filters: Filters) =>
  api.get('/agentes/evolucao', { params: filters }).then(r => r.data);

// Função para buscar itens de uma avaliação
export const getItensAvaliacao = (avaliacaoId: string) =>
  api.get(`/avaliacao/${avaliacaoId}/itens`).then(r => r.data);

// ===== CORREÇÕES DE TRANSCRIÇÃO =====
export interface CorrecaoBase {
  padrao: string;
  substituicao: string;
  ignore_case: boolean;
  carteira_id?: number | null;
  ordem: number;
}

export interface Correcao extends CorrecaoBase {
  id: number;
}

export const listCorrecoes = (params: { carteira_id?: number | null; incluir_globais?: boolean } = {}) =>
  api.get<Correcao[]>(`/correcoes/`, {
    params: {
      carteira_id: params.carteira_id ?? undefined,
      incluir_globais: params.incluir_globais ?? true,
    }
  }).then(r => r.data);

export const createCorrecao = (data: CorrecaoBase) =>
  api.post<Correcao>(`/correcoes/`, data).then(r => r.data);

export const updateCorrecao = (id: number, data: CorrecaoBase) =>
  api.put<Correcao>(`/correcoes/${id}`, data).then(r => r.data);

export const deleteCorrecao = (id: number) =>
  api.delete(`/correcoes/${id}`).then(r => r.data);

export const aplicarCorrecoesPreview = (texto: string, carteira_id?: number | null) =>
  api.post<{ original: string; corrigido: string; total_regras: number }>(`/correcoes/aplicar`, {
    texto,
    carteira_id: carteira_id ?? null,
  }).then(r => r.data);

// ===== DOWNLOADS =====
export interface DownloadJobCreate {
  carteira_id: number;
  fila_like: string;
  data_inicio: string;
  data_fim: string;
  min_secs: number;
  limite?: number;
  delete_after_process: boolean;
}

export interface DownloadJob {
  id: number;
  carteira_id: number;
  fila_like: string;
  data_inicio: string;
  data_fim: string;
  min_secs: number;
  limite?: number;
  delete_after_process: boolean;
  status: string;
  total_calls: number;
  total_baixados: number;
  total_processados: number;
  error_msg?: string;
  created_at: string;
  finished_at?: string;
}

export interface AudioFile {
  id: number;
  job_id: number;
  carteira_id: number;
  call_id: string;
  queue_id: string;
  start_time: string;
  answer_time?: string;
  hangup_time?: string;
  call_secs: number;
  filename: string;
  status: string;
  transcricao_id?: number;
  error_msg?: string;
  downloaded_at: string;
}

// Funções da API
export const createDownloadJob = (data: DownloadJobCreate) =>
  api.post<DownloadJob>('/downloads/jobs', data).then(r => r.data);

export const listDownloadJobs = (params?: { status?: string; carteira_id?: number; limit?: number; offset?: number }) =>
  api.get<DownloadJob[]>('/downloads/jobs', { params }).then(r => r.data);

export const getDownloadJob = (jobId: number) =>
  api.get<DownloadJob>(`/downloads/jobs/${jobId}`).then(r => r.data);

export const cancelDownloadJob = (jobId: number) =>
  api.post(`/downloads/jobs/${jobId}/cancel`).then(r => r.data);

export const listDownloadedFiles = (params?: { job_id?: number; status?: string; carteira_id?: number; limit?: number; offset?: number }) =>
  api.get<AudioFile[]>('/downloads/files', { params }).then(r => r.data);

export const reprocessFile = (fileId: number) =>
  api.post(`/downloads/files/${fileId}/reprocess`).then(r => r.data);

// === FUNÇÕES MISTAS PARA UPLOADS + JOBS ===

// Funções mistas que buscam dados tanto das tabelas originais quanto das clones de upload
export const getMixedKpis           = (f: Filters)        => api.get('/mixed/kpis',    { params: f }).then(r => r.data);
export const getMixedTrend          = (f: Filters)        => api.get('/mixed/trend',   { params: f }).then(r => r.data);
export const getMixedAgents         = (f: Filters)        => api.get('/mixed/agents',  { params: f }).then(r => r.data);
export const getMixedAgentSummary   = (id: string, f: Filters) => api.get(`/mixed/agent/${id}/summary`, { params: f }).then(r => r.data);
export const getMixedAgentCalls     = (id: string, f: Filters) => api.get(`/mixed/agent/${id}/calls`,   { params: f }).then(r => r.data);
export const getMixedCallItems      = (avaliacaoId: string)   => api.get(`/mixed/call/${avaliacaoId}/items`).then(r => r.data);
export const getMixedTranscription  = (avaliacaoId: string)   => api.get(`/mixed/call/${avaliacaoId}/transcription`).then(r => r.data);
export const getMixedAgentWorstItem = (id: string, f: Filters) => api.get(`/mixed/agent/${id}/worst_item`, { params: f }).then(r => r.data);
export const getMixedAgentCriteria  = (id: string, f: Filters) => api.get(`/mixed/agent/${id}/criteria`, { params: f }).then(r => r.data);
export const getMixedCallerInfo     = (avaliacaoId: string)   => api.get(`/mixed/call/${avaliacaoId}/caller`).then(r => r.data);
export const getMixedCarteirasFromAvaliacoes = () => api.get('/mixed/carteiras-avaliacoes').then(r => r.data);
export const getFeedbackGeralLigacao = (callId: string) => api.get(`/mixed/call/${callId}/feedback-geral`).then(r => r.data);

// API para buscar notificações do agente
export const getAgentNotifications = async (agentId: string) => {
  const response = await fetch(`/api/notifications/agent/${agentId}`);
  if (!response.ok) throw new Error('Erro ao buscar notificações');
  return response.json();
};

// API para marcar notificação como lida
export const markNotificationAsRead = async (notificationId: string) => {
  const response = await fetch(`/api/notifications/${notificationId}/read`, {
    method: 'PUT',
  });
  if (!response.ok) throw new Error('Erro ao marcar notificação como lida');
  return response.json();
};