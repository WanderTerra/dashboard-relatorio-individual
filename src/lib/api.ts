import axios from 'axios';

export const baseURL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';

const api = axios.create({
  baseURL,
});

export interface Filters {
  start: string;
  end: string;
  carteira?: string;
}

export interface CallRow {
  call_id: string;
  avaliacao_id: string;        // ⇦ novo campo
  data_ligacao: string;
  pontuacao: number;
  status_avaliacao: string;
}



export const getKpis   = (f: Filters)            => api.get('/kpis',              { params: f }).then(r => r.data);
export const getTrend  = (f: Filters)            => api.get('/trend',             { params: f }).then(r => r.data);
export const getAgents = (f: Filters)            => api.get('/agents',            { params: f }).then(r => r.data);
export const getAgentSummary  = (id: string,f:Filters) => api.get(`/agent/${id}/summary`, { params: f }).then(r=>r.data);
export const getAgentCalls = (id: string, f: Filters) => api.get(`/agent/${id}/calls`, { params: f }).then(r => r.data);
export const getCallItems = (avaliacaoId: string) =>  api.get(`/call/${avaliacaoId}/items`).then(r => r.data);
export const getTranscription = (avaliacaoId: string) =>
  api.get(`/call/${avaliacaoId}/transcription`).then(r => r.data);
