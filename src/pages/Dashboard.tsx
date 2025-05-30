import React, { useState } from 'react';
import { formatISO } from 'date-fns';
import { useQuery, useQueries } from '@tanstack/react-query';
import { Link } from 'react-router-dom';

import KpiCards from '../components/KpiCards';
import TrendLineChart from '../components/TrendLineChart';
import { getKpis, getTrend, getAgents, getAgentWorstItem, Filters } from '../lib/api';

const today  = new Date();
const first  = new Date(today.getFullYear(), today.getMonth(), 1);

const Dashboard: React.FC = () => {
  const [start, setStart]   = useState(formatISO(first, { representation: 'date' }));
  const [end,   setEnd]     = useState(formatISO(today, { representation: 'date' }));
  const [carteira, setCart] = useState('');

  const filters: Filters = { start, end, ...(carteira ? { carteira } : {}) };

  // KPIs e tendência
  const { data: kpis }   = useQuery({ queryKey: ['kpis',   filters], queryFn: () => getKpis(filters) });
  const { data: trend }  = useQuery({ queryKey: ['trend',  filters], queryFn: () => getTrend(filters) });
  const { data: agents } = useQuery({ queryKey: ['agents', filters], queryFn: () => getAgents(filters) });

  // Para cada agente, dispara uma query para obter o pior item
  const worstItemQueries = useQueries({
    queries: agents?.map(agent => ({
      queryKey: ['agentWorstItem', agent.agent_id, filters],
      queryFn: () => getAgentWorstItem(agent.agent_id, filters),
      enabled: !!agents,
      staleTime: 5 * 60_000,
    })) ?? [],
  });

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">Avaliação de Ligações</h1>

      {/* filtros */}
      <div className="flex flex-wrap gap-4">
        <div>
          <label className="block text-xs">Início</label>
          <input
            type="date"
            value={start}
            onChange={e => setStart(e.target.value)}
            className="border rounded p-1"
          />
        </div>
        <div>
          <label className="block text-xs">Fim</label>
          <input
            type="date"
            value={end}
            onChange={e => setEnd(e.target.value)}
            className="border rounded p-1"
          />
        </div>
        <div>
          <label className="block text-xs">Carteira</label>
          <input
            type="text"
            value={carteira}
            onChange={e => setCart(e.target.value)}
            className="border rounded p-1"
          />
        </div>
      </div>

      {/* Cartões de KPI */}
      <KpiCards
        media={kpis?.media_geral ?? null}
        total={kpis?.total_ligacoes ?? 0}
        pior={kpis?.pior_item ?? null}
      />

      {/* Gráfico de linha */}
      <TrendLineChart data={trend ?? []} />

      {/* Tabela de Agentes */}
      <div className="overflow-x-auto">
        <table className="min-w-full border">
          <thead>
            <tr className="bg-gray-100">
              <th className="px-4 py-2">Agente</th>
              <th className="px-4 py-2"># Ligações</th>
              <th className="px-4 py-2">Média</th>
              <th className="px-4 py-2">Pior Item</th>
              <th className="px-4 py-2">Detalhar</th>
            </tr>
          </thead>
          <tbody>
            {agents?.map((agent, idx) => {
              const wi = worstItemQueries[idx];
              let piorLabel = '—';
              if (wi.isLoading) piorLabel = '…';
              else if (wi.isError) piorLabel = 'Erro';
              else if (wi.data)
                piorLabel = `${wi.data.categoria} (${(wi.data.taxa_nao_conforme * 100).toFixed(0)}%)`;

              return (
                <tr key={agent.agent_id} className="even:bg-gray-50">
                  <td className="border px-4 py-2">{agent.nome}</td>
                  <td className="border px-4 py-2">{agent.ligacoes}</td>
                  <td className="border px-4 py-2">{agent.media.toFixed(1)}</td>
                  <td className="border px-4 py-2">{piorLabel}</td>
                  <td className="border px-4 py-2">
                    <Link
                      to={`/agent/${agent.agent_id}`}
                      className="text-blue-600 hover:underline"
                    >
                      DETALHAR
                    </Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Dashboard;
