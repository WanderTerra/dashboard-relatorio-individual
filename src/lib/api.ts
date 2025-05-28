// src/lib/api.ts
import axios from 'axios';


// Em desenvolvimento, usa o proxy do Vite
export const baseURL = '/api';

const api = axios.create({
  baseURL,
  headers: {
    'Accept': 'application/json',
    'Content-Type': 'application/json'
  }
});

// Add request/response interceptors for debugging
api.interceptors.request.use(request => {
  console.log('API Request:', request.url);
  return request;
});

api.interceptors.response.use(
  response => {
    console.log('API Response:', response.status, response.data);
    return response;
  },
  error => {
    console.error('API Error:', error.response?.status, error.response?.data);
    return Promise.reject(error);
  }
);

export interface Filters {
  start: string;    // ISO YYYY-MM-DD
  end: string;      // ISO YYYY-MM-DD
  carteira?: string;
}

export interface CallRow {
  call_id: string;
  avaliacao_id: string;
  data_ligacao: string;
  pontuacao: number;
  status_avaliacao: string;
}

export const getKpis = (f: Filters) =>
  api.get('/kpis', { params: f }).then(r => r.data);

export const getTrend = (f: Filters) =>
  api.get('/trend', { params: f }).then(r => r.data);

export const getAgents = (f: Filters) =>
  api.get('/agents', { params: f }).then(r => r.data);

export const getAgentSummary = (id: string, f: Filters) =>
  api.get(`/agent/${id}/summary`, { params: f }).then(r => r.data);

export const getAgentCalls = (id: string, f: Filters) =>
  api.get(`/agent/${id}/calls`, { params: f }).then(r => r.data);

export const getCallItems = (avaliacaoId: string) =>
  api.get(`/call/${avaliacaoId}/items`).then(r => r.data);

export const getTranscription = (avaliacaoId: string) =>
  api.get(`/call/${avaliacaoId}/transcription`).then(r => r.data);


/** Busca o pior item de conformidade de um agente no período */
export interface WorstItem {
  categoria: string;
  qtd_nao_conforme: number;
  total_avaliacoes_item: number;
  taxa_nao_conforme: number;
}

export const getAgentWorstItem = (id: string, f: Filters) =>
  api
    .get< WorstItem >(`/agent/${id}/worst_item`, { params: f })
    .then(r => r.data);

