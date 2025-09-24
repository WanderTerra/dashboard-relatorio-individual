import React from 'react';
import { useQuery, useQueries, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Filter } from 'lucide-react';

import PageHeader from '../components/PageHeader';
import { Combobox } from '../components/ui/select-simple';
import { getActiveAgents, getAgentWorstItem, getCarteirasFromAvaliacoes } from '../lib/api';
import { useFilters } from '../hooks/use-filters';
import { formatItemName, formatAgentName } from '../lib/format';

const Agents: React.FC = () => {
  const queryClient = useQueryClient();
  const { filters, setCarteira } = useFilters();
  
  // Estados para filtros específicos da página Agents
  const [showOnlyActive, setShowOnlyActive] = React.useState<boolean>(true);
  
  // Estados para paginação
  const [currentPage, setCurrentPage] = React.useState(1);
  const itemsPerPage = 10;
  
  // Estado para pesquisa de agente
  const [agentSearch, setAgentSearch] = React.useState('');

  // Buscar carteiras únicas da tabela avaliacoes
  const { data: carteiras = [] } = useQuery({
    queryKey: ['carteiras-avaliacoes'],
    queryFn: getCarteirasFromAvaliacoes,
    staleTime: 5 * 60 * 1000, // 5 minutos
  });

  // Construir objeto de filtros para a API (incluindo carteira apenas se tiver valor)
  const apiFilters = { 
    start: '2024-01-01', // Data padrão para evitar erro 422
    end: '2025-12-31',   // Data padrão para evitar erro 422
    activeOnly: showOnlyActive, // Usar o estado do toggle
    ...(filters.carteira ? { carteira: filters.carteira } : {}) 
  };

  // Buscar agentes ativos
  const { data: agents, isLoading, error } = useQuery({ 
    queryKey: ['active-agents', apiFilters], 
    queryFn: () => {
      return getActiveAgents(apiFilters);
    },
    staleTime: 5 * 60 * 1000, // 5 minutos
    enabled: true, // Sempre habilitado
  });

  // Para cada agente, dispara uma query para obter o pior item
  const worstItemQueries = useQueries({
    queries: agents?.map((agent: any) => ({
      queryKey: ['agent-worst-item', agent.agent_id, apiFilters],
      queryFn: () => getAgentWorstItem(agent.agent_id, apiFilters),
      enabled: !!agents,
      staleTime: 5 * 60_000,
    })) ?? [],
  });

  // Filtrar agentes baseado na pesquisa
  const filteredAgents = React.useMemo(() => {
    if (!agents) return [];
    
    if (!agentSearch.trim()) return agents;
    
    const searchTerm = agentSearch.toLowerCase().trim();
    
    return agents.filter((agent: any) => {
      const agentName = formatAgentName(agent).toLowerCase();
      const agentId = agent.agent_id.toString().toLowerCase();
      
      return agentName.includes(searchTerm) || agentId.includes(searchTerm);
    });
  }, [agents, agentSearch]);

  // Calcular paginação para agentes filtrados
  const totalPages = Math.ceil((filteredAgents?.length || 0) / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedAgents = filteredAgents?.slice(startIndex, endIndex) || [];

  // Reset página quando filtros mudam
  React.useEffect(() => {
    setCurrentPage(1);
  }, [selectedCarteira, agentSearch, showOnlyActive]);

  // Forçar invalidação da query quando os filtros mudam
  React.useEffect(() => {
    // Invalidar a query para forçar nova execução
    queryClient.invalidateQueries({ queryKey: ['active-agents'] });
  }, [showOnlyActive, filters.carteira, queryClient]);

  return (
    <div>
      <PageHeader 
        title="Performance por Agente" 
        subtitle="Análise detalhada de desempenho individual"
        actions={
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
            <div className="flex items-center gap-2 mb-3">
              <Filter className="h-4 w-4 text-gray-500" />
              <span className="text-sm font-medium text-gray-700">Filtros</span>
            </div>
            <div className="flex flex-wrap gap-4 items-end">
              <div className="min-w-[180px] flex flex-col">
                <label className="block text-sm font-medium text-gray-700 mb-2">Carteira</label>
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
              
              {/* Toggle para mostrar apenas agentes ativos */}
              <div className="flex items-center gap-3">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={showOnlyActive}
                    onChange={(e) => {
                      setShowOnlyActive(e.target.checked);
                    }}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <span className="text-sm font-medium text-gray-700">
                    Agentes ativos
                  </span>
                </label>
              </div>
            </div>
            
            {/* Contador de resultados */}
            {agentSearch && (
              <div className="mt-3 text-sm text-gray-600">
                {filteredAgents.length === 0 ? (
                  <span className="text-red-600">Nenhum agente encontrado para "{agentSearch}"</span>
                ) : (
                  <span className="text-blue-600">
                    {filteredAgents.length} agente{filteredAgents.length !== 1 ? 's' : ''} encontrado{filteredAgents.length !== 1 ? 's' : ''} para "{agentSearch}"
                  </span>
                )}
              </div>
            )}
            
            {/* Informação sobre filtro de agentes ativos */}
            {showOnlyActive && (
              <div className="mt-3 text-sm text-gray-600">
              </div>
            )}
          </div>
        }
      />

      <div className="p-6">
        {/* Indicadores de Status */}
        {isLoading && (
          <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center gap-2">
              <div className="animate-spin h-4 w-4 border-2 border-blue-600 border-t-transparent rounded-full"></div>
              <span className="text-blue-800">Carregando agentes ativos...</span>
            </div>
          </div>
        )}
        
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center gap-2">
              <span className="text-red-800">❌ Erro ao carregar agentes: {error.message}</span>
            </div>
          </div>
        )}
        
        {/* Tabela de Agentes */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden hover:shadow-xl transition-shadow duration-300">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Performance por Agente</h2>
                <p className="text-sm text-gray-600 mt-1">
                  Análise detalhada de desempenho individual
                </p>
              </div>
              
              {/* Campo de busca de agente */}
              <div className="relative min-w-[300px]">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <input
                  type="text"
                  placeholder="Buscar por nome ou ID do agente..."
                  value={agentSearch}
                  onChange={(e) => setAgentSearch(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-full text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                />
                {agentSearch && (
                  <button
                    onClick={() => setAgentSearch('')}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 transition-colors duration-200"
                  >
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>
            </div>
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
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {paginatedAgents?.map((agent: any, idx: number) => {
                  const originalIndex = startIndex + idx;
                  const wi = worstItemQueries[originalIndex];
                  let piorLabel = '—';
                  if (wi && wi.isLoading) piorLabel = '…';
                  else if (wi && wi.isError) piorLabel = 'Erro';
                  else if (wi && wi.data && typeof wi.data === 'object' && 'categoria' in wi.data && 'taxa_nao_conforme' in wi.data) {
                    const data = wi.data as { categoria: string; taxa_nao_conforme: number };
                    piorLabel = `${formatItemName(data.categoria)} (${(data.taxa_nao_conforme * 100).toFixed(0)}%)`;
                  }

                  return (
                    <tr key={agent.agent_id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10">
                            <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-sm">
                              <span className="text-sm font-bold text-white">
                                {formatAgentName(agent).charAt(0).toUpperCase()}
                              </span>
                            </div>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {formatAgentName(agent)}
                            </div>
                            <div className="text-xs text-gray-500">
                              ID: {agent.agent_id}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <span className="inline-flex items-center px-3 py-1 rounded-xl text-xs font-medium bg-blue-100 text-blue-800 shadow-sm">
                          {agent.ligacoes} ligações
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <div className="flex items-center">
                          <span className={`inline-flex items-center px-3 py-1 rounded-xl text-xs font-medium shadow-sm ${
                            agent.media >= 80 
                              ? 'bg-green-100 text-green-800' 
                              : agent.media >= 60 
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {agent.media.toFixed(1)}%
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {piorLabel}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium">
                        <Link
                          to={`/agent/${agent.agent_id}`}
                          className="inline-flex items-center px-4 py-2 text-sm font-medium rounded-full text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200 shadow-sm"
                        >
                          Ver Detalhes
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          
          {/* Controles de paginação */}
          {filteredAgents && filteredAgents.length > 0 && totalPages > 1 && (
            <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-700">
                  Mostrando <span className="font-medium">{startIndex + 1}</span> até{' '}
                  <span className="font-medium">{Math.min(endIndex, filteredAgents.length)}</span> de{' '}
                  <span className="font-medium">{filteredAgents.length}</span> agente{filteredAgents.length !== 1 ? 's' : ''}
                  {agentSearch && (
                    <span className="text-blue-600 ml-2">
                      (filtrado de {agents?.length || 0} total)
                    </span>
                  )}
                  {showOnlyActive && (
                    <span className="text-green-600 ml-2">
                      (ativos)
                    </span>
                  )}
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                    className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                  >
                    Anterior
                  </button>
                  
                  <div className="flex items-center space-x-1">
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                      <button
                        key={page}
                        onClick={() => setCurrentPage(page)}
                        className={`inline-flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
                          currentPage === page
                            ? 'bg-blue-600 text-white shadow-sm'
                            : 'text-gray-700 bg-white border border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        {page}
                      </button>
                    ))}
                  </div>
                  
                  <button
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                    className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 disabled:cursor-not-allowed transition-all duration-200"
                  >
                    Próxima
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Agents; 