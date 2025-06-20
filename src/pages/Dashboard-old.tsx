import * as React from 'react';
import { useQuery, useQueries } from '@tanstack/react-query';
import { Link } from 'react-router-dom';

import KpiCards from '../components/KpiCards';
import TrendLineChart from '../components/TrendLineChart';
import PageHeader from '../components/PageHeader';
import { Combobox } from '../components/ui/select-simple';
import { getKpis, getTrend, getAgents, getAgentWorstItem } from '../lib/api';
import { formatItemName, formatAgentName } from '../lib/format';
import { useFilters } from '../hooks/use-filters';

// Lista de carteiras disponíveis - pode ser expandida no futuro
const carteiras = [
  { value: 'AGUAS', label: 'AGUAS' },
  { value: 'VUON', label: 'VUON' },
];

const Dashboard: React.FC = () => {
  const { filters, setStartDate, setEndDate, setCarteira } = useFilters();

  // Construir objeto de filtros para a API (incluindo carteira apenas se tiver valor)
  const apiFilters = { 
    start: filters.start, 
    end: filters.end, 
    ...(filters.carteira ? { carteira: filters.carteira } : {}) 
  };
  // KPIs e tendência
  const { data: kpis }   = useQuery({ queryKey: ['kpis',   apiFilters], queryFn: () => getKpis(apiFilters) });
  const { data: trend }  = useQuery({ queryKey: ['trend',  apiFilters], queryFn: () => getTrend(apiFilters) });
  const { data: agents } = useQuery({ queryKey: ['agents', apiFilters], queryFn: () => getAgents(apiFilters) });
  // Para cada agente, dispara uma query para obter o pior item
  const worstItemQueries = useQueries({
    queries: agents?.map((agent: any) => ({
      queryKey: ['agentWorstItem', agent.agent_id, apiFilters],
      queryFn: () => getAgentWorstItem(agent.agent_id, apiFilters),
      enabled: !!agents,
      staleTime: 5 * 60_000,
    })) ?? [],
  });  return (
    <div>
      <PageHeader 
        title="Dashboard de Avaliação" 
        subtitle="Análise de performance e qualidade de ligações"
        actions={
          <div className="flex flex-wrap gap-4 items-end">
            {/* Filtros */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Data Início</label>
              <input
                type="date"
                value={filters.start}
                onChange={e => setStartDate(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Data Fim</label>
              <input
                type="date"
                value={filters.end}
                onChange={e => setEndDate(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div className="min-w-[180px]">
              <label className="block text-sm font-medium text-gray-700 mb-1">Carteira</label>
              <Combobox
                options={carteiras}
                value={filters.carteira || ''}
                onChange={(value) => {
                  console.log('Carteira selecionada:', value);
                  setCarteira(value);
                }}
                placeholder="Selecionar carteira"
                emptyMessage="Nenhuma carteira encontrada"
              />
            </div>
          </div>
        }
      />

      <div className="p-6 space-y-6">
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
              <th className="px-4 py-2">Ligações</th>
              <th className="px-4 py-2">Média</th>
              <th className="px-4 py-2">Pior Item</th>
              <th className="px-4 py-2">Detalhar</th>
            </tr>
          </thead>          <tbody>
            {agents?.map((agent: any, idx: number) => {const wi = worstItemQueries[idx];
              let piorLabel = '—';
              if (wi.isLoading) piorLabel = '…';
              else if (wi.isError) piorLabel = 'Erro';              else if (wi.data && typeof wi.data === 'object' && 'categoria' in wi.data && 'taxa_nao_conforme' in wi.data) {
                const data = wi.data as { categoria: string; taxa_nao_conforme: number };
                piorLabel = `${formatItemName(data.categoria)} (${(data.taxa_nao_conforme * 100).toFixed(0)}%)`;
              }              return (
                <tr key={agent.agent_id} className="even:bg-gray-50">
                  <td className="border px-4 py-2">{formatAgentName(agent)}</td>
                  <td className="border px-4 py-2">{agent.ligacoes}</td>
                  <td className="border px-4 py-2">{agent.media.toFixed(1)}</td><td className="border px-4 py-2">{piorLabel}</td>
                  <td className="border px-4 py-2">
                    <Link
                      to={`/agent/${agent.agent_id}`}
                      className="bg-blue-600 text-white px-3 py-1 rounded shadow hover:bg-blue-700 transition-colors font-medium text-sm"
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
