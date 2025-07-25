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
      queryKey: ['agent-worst-item', agent.agent_id, apiFilters],
      queryFn: () => getAgentWorstItem(agent.agent_id, apiFilters),
      enabled: !!agents,
      staleTime: 5 * 60_000,
    })) ?? [],
  });

  return (
    <div className="dashboard-page" style={{ color: 'var(--color-navy-blue)', fontFamily: 'Tw Cen MT, Arial, Helvetica, sans-serif' }}>
      <PageHeader 
        title="Dashboard de Avaliação" 
        subtitle="Análise de performance e qualidade de ligações"
        actions={
          <div className="flex flex-wrap gap-4 items-end">
            {/* Filtros */}
            <div className="flex flex-col">
              <label className="block text-sm font-medium text-gray-700 mb-1">Data Início</label>
              <input
                type="date"
                value={filters.start}
                onChange={e => setStartDate(e.target.value)}
                className="h-9 border border-gray-200 rounded-xl px-3 text-sm shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
              />
            </div>
            <div className="flex flex-col">
              <label className="block text-sm font-medium text-gray-700 mb-1">Data Fim</label>
              <input
                type="date"
                value={filters.end}
                onChange={e => setEndDate(e.target.value)}
                className="h-9 border border-gray-200 rounded-xl px-3 text-sm shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
              />
            </div>
            <div className="min-w-[180px] flex flex-col">
              <label className="block text-sm font-medium text-gray-700 mb-1">Carteira</label>
              <Combobox
                options={carteiras}
                value={filters.carteira || ''}
                onChange={(value) => {
                  setCarteira(value);
                }}
                placeholder="Selecionar carteira"
                emptyMessage="Nenhuma carteira encontrada"
              />
            </div>
          </div>
        }
      />

      <div className="p-6 space-y-8">
        {/* Cartões de KPI */}
        <KpiCards
          media={kpis?.media_geral ?? null}
          total={kpis?.total_ligacoes ?? 0}
          pior={kpis?.pior_item ?? null}
        />

        {/* Gráfico de linha */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Tendência Temporal</h2>
          <TrendLineChart data={trend ?? []} />
        </div>

        {/* Tabela de Agentes */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Performance por Agente</h2>
            <p className="text-sm text-gray-600 mt-1">
              Análise detalhada de desempenho individual
            </p>
          </div>
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Agente
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ligações
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Média
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Pior Item
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {agents?.map((agent: any, idx: number) => {
                  const wi = worstItemQueries[idx];
                  let piorLabel = '—';
                  if (wi.isLoading) piorLabel = '…';
                  else if (wi.isError) piorLabel = 'Erro';
                  else if (wi.data && typeof wi.data === 'object' && 'categoria' in wi.data && 'taxa_nao_conforme' in wi.data) {
                    const data = wi.data as { categoria: string; taxa_nao_conforme: number };
                    piorLabel = `${formatItemName(data.categoria)} (${(data.taxa_nao_conforme * 100).toFixed(0)}%)`;
                  }

                  return (
                    <tr key={agent.agent_id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-8 w-8">
                            <div className="h-8 w-8 rounded-full flex items-center justify-center" style={{ backgroundColor: 'rgba(165, 137, 80, 0.4)' }}>
                              <span className="text-sm font-bold" style={{ color: 'var(--color-navy-blue)' }}>
                                {formatAgentName(agent).charAt(0)}
                              </span>
                            </div>
                          </div>
                          <div className="ml-3">
                            <div className="text-base font-bold" style={{ color: 'var(--color-navy-blue)' }}>
                              {formatAgentName(agent)}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium" style={{ backgroundColor: 'rgba(209, 205, 193, 0.4)', color: 'var(--color-navy-blue)' }}>
                          {agent.ligacoes}
                        </span>
                      </td>                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <div className="flex items-center">
                          <span className={`text-sm font-medium ${
                            agent.media >= 70 ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {agent.media.toFixed(1)}%
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-base" style={{ color: 'var(--color-navy-blue)', fontWeight: 500 }}>
                        {piorLabel}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <Link
                          to={`/agent/${agent.agent_id}`}
                          className="inline-flex items-center px-3 py-2 border border-[var(--color-navy-blue)] text-sm font-bold leading-4 rounded-full transition-all shadow-sm backdrop-blur-sm"
                          style={{ backgroundColor: 'rgba(165, 137, 80, 0.09)', color: 'var(--color-navy-blue)', borderWidth: '1px' }}
                          onMouseEnter={e => {
                            e.currentTarget.style.backgroundColor = 'var(--color-navy-blue)';
                            e.currentTarget.style.color = '#fff';
                          }}
                          onMouseLeave={e => {
                            e.currentTarget.style.backgroundColor = 'rgba(165, 137, 80, 0.09)';
                            e.currentTarget.style.color = 'var(--color-navy-blue)';
                          }}
                        >
                          Detalhar
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
