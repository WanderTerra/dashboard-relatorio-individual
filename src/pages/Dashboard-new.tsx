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

      <div className="p-6 space-y-8">
        {/* Cartões de KPI */}
        <KpiCards
          media={kpis?.media_geral ?? null}
          total={kpis?.total_ligacoes ?? 0}
          pior={kpis?.pior_item ?? null}
        />

        {/* Gráfico de linha */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Tendência Temporal</h2>
          <TrendLineChart data={trend ?? []} />
        </div>

        {/* Tabela de Agentes */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
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
                            <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
                              <span className="text-sm font-medium text-blue-600">
                                {formatAgentName(agent).charAt(0)}
                              </span>
                            </div>
                          </div>
                          <div className="ml-3">
                            <div className="text-sm font-medium text-gray-900">
                              {formatAgentName(agent)}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {agent.ligacoes}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <div className="flex items-center">
                          <span className="text-sm font-medium">
                            {agent.media.toFixed(1)}
                          </span>
                          <div className="ml-2 w-16 bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-blue-600 h-2 rounded-full" 
                              style={{ width: `${(agent.media / 10) * 100}%` }}
                            ></div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {piorLabel}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <Link
                          to={`/agent/${agent.agent_id}`}
                          className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
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
