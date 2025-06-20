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
api.interceptors.request.use(request => {
  console.log('→ API Request:', request.method, request.url, request.params || request.data);
  return request;
});
api.interceptors.response.use(
  response => {
    console.log('← API Response:', response.status, response.data);
    return response;
  },
  error => {
    console.error('× API Error:', error.response?.status, error.response?.data);
    return Promise.reject(error);
  }
);

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
export const downloadAudio     = (callId: string)     => api.get(`/call/${callId}/audio`, { responseType: 'blob' }).then(r => r.data);

// Função para atualizar um item de avaliação
export const updateItem = (avaliacaoId: string, categoria: string, resultado: string, descricao: string) => {
  return api.put(`/call/${avaliacaoId}/item/${encodeURIComponent(categoria)}`, {
    categoria,
    resultado,
    descricao
  }).then(r => r.data);
};
