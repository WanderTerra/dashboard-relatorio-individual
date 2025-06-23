import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';

import {
  getAgentSummary,
  getAgentCalls,
  getAgentWorstItem
} from '../lib/api';
import CallList     from '../components/CallList';
import SummaryCard  from '../components/ui/SummaryCard';
import PageHeader   from '../components/PageHeader';
import { formatItemName, formatAgentName } from '../lib/format';
import { useFilters } from '../hooks/use-filters';

const AgentDetail: React.FC = () => {
  const { agentId } = useParams<{ agentId: string }>();
  if (!agentId) return <div>Agente não especificado.</div>;

  const { filters, setStartDate, setEndDate } = useFilters();

  // Construir objeto de filtros para a API
  const apiFilters = { 
    start: filters.start, 
    end: filters.end, 
    ...(filters.carteira ? { carteira: filters.carteira } : {}) 
  };
  
    // summary
  const { data: summary, isLoading: summaryLoading, error: summaryError } = useQuery({
    queryKey: ['agentSummary', agentId, apiFilters],
    queryFn: () => {
      return getAgentSummary(agentId, apiFilters).then(data => {
        return data;
      });
    },
  });

  // calls
  const { data: calls, isLoading: callsLoading, error: callsError } = useQuery({
    queryKey: ['agentCalls', agentId, apiFilters],
    queryFn: () => {
      return getAgentCalls(agentId, apiFilters);
    },
  });

  // worst item
  const { data: worstItem, isLoading: wiLoading, error: wiError } = useQuery({
    queryKey: ['agentWorstItem', agentId, apiFilters],
    queryFn: () => {
      return getAgentWorstItem(agentId, apiFilters);
    },
  });
  
  // Log de erros
  React.useEffect(() => {
    if (summaryError) console.error('Erro ao buscar resumo:', summaryError);
    if (callsError) console.error('Erro ao buscar chamadas:', callsError);
    if (wiError) console.error('Erro ao buscar pior item:', wiError);
  }, [summaryError, callsError, wiError]);
  return (
    <div>
      <PageHeader 
        title={summaryLoading ? "Carregando..." : formatAgentName(summary)}
        subtitle={`Análise detalhada do Agente ${agentId}`}
        breadcrumbs={[
          { label: 'Dashboard', href: '/' },
          { label: 'Detalhes do Agente', isActive: true }
        ]}
        actions={
          <div className="flex items-center space-x-4">
            {/* Filtros de data */}
            <div className="flex gap-4 items-end">
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
            </div>
            
            {/* Botão voltar */}
            <Link 
              to="/" 
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
            >
              ← Voltar
            </Link>
          </div>
        }
      />

      <div className="p-6 space-y-8">
        {/* Resumo do agente */}
        {summaryLoading ? (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
              <div className="h-8 bg-gray-200 rounded w-1/2"></div>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center space-x-4">
              <div className="flex-shrink-0 h-16 w-16">
                <div className="h-16 w-16 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
                  <span className="text-2xl font-bold text-white">
                    {formatAgentName(summary).charAt(0)}
                  </span>
                </div>
              </div>
              <div className="flex-1">
                <h3 className="text-2xl font-bold text-gray-900">
                  {formatAgentName(summary)}
                </h3>
                <p className="text-gray-600">Agente ID: {agentId}</p>
                <div className="mt-4 grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Total de Ligações</p>
                    <p className="text-xl font-semibold text-gray-900">{summary?.ligacoes ?? 0}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Média de Avaliação</p>
                    <p className="text-xl font-semibold text-blue-600">{(summary?.media ?? 0).toFixed(1)}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Pior item */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Pior Item Avaliado</h2>
          {wiLoading ? (
            <div className="animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            </div>
          ) : worstItem ? (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-800">
                    {formatItemName(worstItem.categoria)}
                  </h3>
                  <p className="text-sm text-red-700 mt-1">
                    Taxa de não conformidade: <span className="font-semibold">{(worstItem.taxa_nao_conforme * 100).toFixed(1)}%</span>
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <p className="text-gray-600">Sem dados de avaliação disponíveis para o período selecionado.</p>
            </div>
          )}
        </div>

        {/* Lista de ligações */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Histórico de Ligações</h2>
            <p className="text-sm text-gray-600 mt-1">
              Detalhes das ligações realizadas no período
            </p>
          </div>
          
          {callsLoading ? (
            <div className="p-6">
              <div className="animate-pulse space-y-4">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="h-16 bg-gray-200 rounded"></div>
                ))}
              </div>
            </div>
          ) : (
            <CallList calls={calls ?? []} />
          )}
        </div>
      </div>
    </div>
  );
};

export default AgentDetail;
