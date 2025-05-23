/* Página de detalhe do agente  +  tabela de ligações */

import React from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';

import {
  getAgentSummary,
  getAgentCalls,
  Filters,
} from '../lib/api';

// ------------------ tipos ------------------

interface CallRow {
  call_id: string;
  avaliacao_id: string; // Adicionado para corrigir o erro
  data_ligacao: string;   // ISO string
  pontuacao: number;
  status_avaliacao: string;
}

// ------------------ helpers ------------------

const cor = (v: number) =>
  v < 50 ? 'text-red-600'
  : v < 70 ? 'text-yellow-600'
  :          'text-green-600';

// ------------------ componente ------------------

const AgentDetail: React.FC = () => {
  const { agentId }  = useParams();
  const location     = useLocation();
  const filters      = (location.state || {}) as Filters;

  // resumo (nota média, total ligações etc.)
  const { data: resumo,  isLoading: loadSum } = useQuery({
    queryKey: ['summary', agentId, filters],
    queryFn : () => getAgentSummary(agentId!, filters),
  });

  // lista de ligações
  const { data: calls = [], isLoading: loadCalls } = useQuery<CallRow[]>({
    queryKey: ['calls', agentId, filters],
    queryFn : () => getAgentCalls(agentId!, filters),
  });

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-4 md:p-6">
      {/* voltar */}
      <Link
        to="/"
        className="inline-block mb-4 rounded bg-blue-600 px-4 py-2 text-white font-semibold shadow hover:bg-blue-700 transition-colors"
      >
        &larr; Voltar
      </Link>

      {/* bloco resumo */}
      <div className="rounded-xl bg-white p-6 shadow flex flex-wrap gap-6">
        {loadSum ? (
          <p>Carregando resumo…</p>
        ) : (
          <>
            <div>
              <h2 className="text-xl font-bold">{resumo?.name ?? agentId}</h2>
              <p className="text-sm text-gray-500">ID {agentId}</p>
            </div>
            <div className="ml-auto text-right">
              <p className={`text-3xl font-extrabold ${cor(resumo?.media ?? 0)}`}>
                {resumo?.media ?? '-'}
              </p>
              <p className="text-xs uppercase text-gray-500">
                Pontuação média
              </p>
            </div>
            <div className="text-right">
              <p className="text-3xl font-extrabold">{resumo?.ligacoes ?? '-'}</p>
              <p className="text-xs uppercase text-gray-500">
                Ligações avaliadas
              </p>
            </div>
          </>
        )}
      </div>

      {/* tabela de ligações */}
      <div className="overflow-x-auto rounded-xl shadow ring-1 ring-gray-200">
        {loadCalls ? (
          <p className="p-4">Carregando ligações…</p>
        ) : (
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50 text-left">
              <tr className="text-xs font-semibold text-gray-500 uppercase">
                <th className="p-3">Data</th>
                <th className="p-3">Call&nbsp;ID</th>
                <th className="p-3">Pontuação</th>
                <th className="p-3">Status</th>
                <th className="p-3" />
              </tr>
            </thead>
            <tbody>
              {calls.map((c, idx) => (
                <tr key={c.call_id} className={idx % 2 ? 'bg-white' : 'bg-gray-50/70'}>
                  <td className="p-3">{new Date(c.data_ligacao).toLocaleString('pt-BR')}</td>
                  <td className="p-3 font-mono">{c.call_id}</td>
                  <td className={`p-3 font-semibold ${cor(c.pontuacao)}`}>{c.pontuacao}</td>
                  <td className="p-3">{c.status_avaliacao}</td>
                  <td className="p-3">
                    <Link
                      to={`/call/${c.avaliacao_id}/items`}
                      className="inline-block rounded bg-slate-700 px-3 py-1
                              text-xs font-semibold text-white hover:bg-slate-600"
                      state={{ agentId: agentId }}
                    >
                      Itens
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default AgentDetail;
