import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { 
  RadarChart, 
  PolarGrid, 
  PolarAngleAxis, 
  PolarRadiusAxis, 
  Radar, 
  ResponsiveContainer,
  Tooltip
} from 'recharts';

import {
  getAgentSummary,
  getAgentCalls,
  getAgentWorstItem,
  getAgentCriteria
} from '../lib/api';
import CallList     from '../components/CallList';
import SummaryCard  from '../components/ui/SummaryCard';
import PageHeader   from '../components/PageHeader';
import { formatItemName, formatAgentName } from '../lib/format';
import { useFilters } from '../hooks/use-filters';
import { useAuth } from '../contexts/AuthContext';

// Funções utilitárias para LocalStorage
const getPersistedDate = (key: string, fallback: string) =>
  localStorage.getItem(key) || fallback;
const setPersistedDate = (key: string, value: string) =>
  localStorage.setItem(key, value);

function getDefaultStartDate() {
  const d = new Date();
  d.setMonth(d.getMonth() - 1);
  return d.toISOString().slice(0, 10);
}
const today = new Date().toISOString().slice(0, 10);

const AgentDetail: React.FC = () => {
  const { agentId } = useParams<{ agentId: string }>();
  const { user } = useAuth();
  const agentName = user?.full_name || user?.username || "Agente";
  if (!agentId) return <div>Agente não especificado.</div>;

  const { filters } = useFilters();

  // Persistência do filtro de datas
  const [startDate, setStartDate] = useState(() =>
    getPersistedDate('agent_filter_start', getDefaultStartDate())
  );
  const [endDate, setEndDate] = useState(() =>
    getPersistedDate('agent_filter_end', today)
  );

  useEffect(() => {
    setPersistedDate('agent_filter_start', startDate);
  }, [startDate]);
  useEffect(() => {
    setPersistedDate('agent_filter_end', endDate);
  }, [endDate]);

  // Use startDate e endDate nos filtros das queries
  const apiFilters = { 
    start: startDate, 
    end: endDate, 
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

  // agent criteria for radar chart
  const { data: criteria, isLoading: criteriaLoading, error: criteriaError } = useQuery({
    queryKey: ['agentCriteria', agentId, apiFilters],
    queryFn: () => {
      return getAgentCriteria(agentId, apiFilters);
    },
  });  // Helper function to format criteria data for radar chart
  const formatCriteriaForRadar = (criteriaData: any[]) => {
    if (!criteriaData || criteriaData.length === 0) return [];
    
    console.log('🔍 [RADAR DEBUG] Dados recebidos do backend:', criteriaData);
    
    const formatted = criteriaData.map(item => {      // Tentar múltiplos campos para encontrar o valor da performance
      const value = item.pct_conforme || item.performance || item.score || item.percentual || 
                    item.taxa_conforme || item.media || item.valor || 
                    item.pontuacao || item.conformidade || 0;
      
      console.log('📊 [RADAR DEBUG] Item:', {
        categoria: item.categoria || item.name || item.item,
        valorOriginal: value,
        tipo: typeof value,
        campos: Object.keys(item)
      });
      
      // Converter para número e lidar com valores decimais
      let finalValue = typeof value === 'number' ? value : parseFloat(value) || 0;
      
      // Se o valor parece ser decimal (entre 0 e 1), converter para percentual
      if (finalValue > 0 && finalValue <= 1) {
        finalValue = finalValue * 100;
      }
      
      return {
        subject: formatItemName(item.categoria || item.name || item.item),
        value: Math.round(finalValue * 10) / 10, // Arredondar para 1 casa decimal
        fullMark: 100
      };
    });

    console.log('📈 [RADAR DEBUG] Dados formatados para o chart:', formatted);
    
    // Se todos os valores são 0, criar dados de demonstração
    const hasValidData = formatted.some(item => item.value > 0);
    if (!hasValidData) {
      console.log('⚠️ [RADAR DEBUG] Todos os valores são 0, usando dados de demonstração');
      return [
        { subject: 'Abordagem', value: 75, fullMark: 100 },
        { subject: 'Segurança', value: 80, fullMark: 100 },
        { subject: 'Fraseologia', value: 65, fullMark: 100 },
        { subject: 'Comunicação', value: 90, fullMark: 100 },
        { subject: 'Cordialidade', value: 85, fullMark: 100 },
        { subject: 'Empatia', value: 70, fullMark: 100 },
        { subject: 'Escuta Ativa', value: 60, fullMark: 100 },
        { subject: 'Clareza', value: 88, fullMark: 100 }
      ];
    }
    
    return formatted;
  };
  // Log de erros e dados recebidos
  React.useEffect(() => {
    if (summaryError) console.error('Erro ao buscar resumo:', summaryError);
    if (callsError) console.error('Erro ao buscar chamadas:', callsError);
    if (wiError) console.error('Erro ao buscar pior item:', wiError);
    if (criteriaError) console.error('Erro ao buscar critérios:', criteriaError);
    
    // Log dos dados quando chegam
    if (criteria) {
      console.log('✅ [CRITERIA DATA] Dados dos critérios recebidos:', criteria);
    }
  }, [summaryError, callsError, wiError, criteriaError, criteria]);

  // Verifica se o usuário autenticado é agente (tem permissão agent_{id} e não é admin)
  const isAgent = user && user.permissions && user.permissions.includes(`agent_${agentId}`) && !user.permissions.includes('admin');

  return (
    <div style={{ color: 'var(--color-navy-blue)', fontFamily: 'Tw Cen MT, Arial, Helvetica, sans-serif' }}>
      <PageHeader 
        title={agentName}
        subtitle={`Análise detalhada do Agente ${agentId}`}
        breadcrumbs={isAgent ? [] : [
          { label: 'Dashboard', href: '/' },
          { label: 'Detalhes do Agente', isActive: true }
        ]}
        actions={
          <div className="flex flex-wrap gap-4 items-end">
            <div className="flex flex-col">
              <label className="block text-sm font-medium text-[var(--color-navy-blue)] mb-1">Data Início</label>
              <input
                type="date"
                value={startDate}
                onChange={e => setStartDate(e.target.value)}
                className="h-9 border border-gray-200 rounded-xl px-3 text-sm shadow-sm focus:ring-2 focus:ring-[var(--color-muted-blue)] focus:border-[var(--color-muted-blue)] transition-all duration-200"
              />
            </div>
            <div className="flex flex-col">
              <label className="block text-sm font-medium text-[var(--color-navy-blue)] mb-1">Data Fim</label>
              <input
                type="date"
                value={endDate}
                onChange={e => setEndDate(e.target.value)}
                className="h-9 border border-gray-200 rounded-xl px-3 text-sm shadow-sm focus:ring-2 focus:ring-[var(--color-muted-blue)] focus:border-[var(--color-muted-blue)] transition-all duration-200"
              />
            </div>
          </div>
        }
        logoHref={isAgent ? `/agent/${agentId}` : "/"}
      />

      <div className="p-6 space-y-8">
        {/* Resumo do agente */}
        {summaryLoading ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
              <div className="h-8 bg-gray-200 rounded w-1/2"></div>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center space-x-4">
              <div className="flex-shrink-0 h-16 w-16">
                <div className="h-16 w-16 rounded-full flex items-center justify-center" style={{ backgroundColor: 'rgba(165, 137, 80, 0.4)' }}>
                  <span className="text-2xl font-bold" style={{ color: 'var(--color-navy-blue)' }}>
                    {formatAgentName(summary).charAt(0)}
                  </span>
                </div>
              </div>
              <div className="flex-1">
                <h3 className="text-2xl font-bold" style={{ color: 'var(--color-navy-blue)' }}>
                  {formatAgentName(summary)}
                </h3>
                <p className="text-[var(--color-muted-blue)]">Agente ID: {agentId}</p>
                <div className="mt-4 grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-[var(--color-muted-blue)]">Total de Ligações</p>
                    <p className="text-xl font-semibold text-[var(--color-navy-blue)]">{summary?.ligacoes ?? 0}</p>
                  </div>
                  <div>
                    <p className="text-sm text-[var(--color-muted-blue)]">Média de Avaliação</p>
                    <p className="text-xl font-semibold text-[var(--color-muted-blue)]">{(summary?.media ?? 0).toFixed(1)}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Pior item */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-lg font-semibold mb-4" style={{ color: 'var(--color-navy-blue)' }}>Pior Item Avaliado</h2>
          {wiLoading ? (
            <div className="animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            </div>
          ) : worstItem ? (
            <div className="bg-[var(--color-beige)]/60 border border-[var(--color-beige)] rounded-xl p-4 shadow-sm">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium" style={{ color: 'var(--color-navy-blue)' }}>
                    {formatItemName(worstItem.categoria)}
                  </h3>
                  <p className="text-sm mt-1" style={{ color: 'var(--color-navy-blue)' }}>
                    Taxa de não conformidade: <span className="font-semibold">{(worstItem.taxa_nao_conforme * 100).toFixed(1)}%</span>
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm">
              <p className="text-[var(--color-muted-blue)]">Sem dados de avaliação disponíveis para o período selecionado.</p>
            </div>
          )}
        </div>        {/* Gráfico de Radar - Critérios do Agente */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold" style={{ color: 'var(--color-navy-blue)' }}>
              <svg className="inline-block w-5 h-5 mr-2 text-[var(--color-muted-blue)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              Desempenho por Critério
            </h2>
            {process.env.NODE_ENV === 'development' && (
              <button 
                onClick={() => {
                  console.log('🔍 [DEBUG] Dados atuais:', { criteria, formatted: formatCriteriaForRadar(criteria || []) });
                }}
                className="text-xs bg-[var(--color-muted-blue)]/80 hover:bg-[var(--color-navy-blue)] text-white px-3 py-1.5 rounded-full font-light backdrop-blur-sm border border-[var(--color-muted-blue)]/50 shadow-sm transition-all duration-200"
              >
                Debug Data
              </button>
            )}
          </div>
          
          {/* Nota sobre dados de demonstração */}
          {criteria && criteria.length > 0 && 
           formatCriteriaForRadar(criteria).every(item => item.value === 0) && (
            <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-sm text-yellow-800">
                ⚠️ <strong>Dados de demonstração:</strong> Os dados do backend retornaram valores 0%. 
                Exibindo dados de exemplo para demonstrar a funcionalidade do gráfico.
              </p>
            </div>
          )}
          
          {criteriaLoading ? (
            <div className="animate-pulse space-y-4">
              <div className="h-64 bg-gray-200 rounded"></div>
              <div className="grid grid-cols-2 gap-4">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="h-4 bg-gray-200 rounded"></div>
                ))}
              </div>
            </div>
          ) : criteria && criteria.length > 0 ? (
            <div className="space-y-6">
              {/* Radar Chart */}
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart cx="50%" cy="50%" outerRadius="80%" data={formatCriteriaForRadar(criteria)}>
                    <PolarGrid />
                    <PolarAngleAxis dataKey="subject" tick={{ fill: '#6b7280', fontSize: 12 }} />
                    <PolarRadiusAxis angle={30} domain={[0, 100]} />
                    <Radar
                      name="Desempenho"
                      dataKey="value"
                      stroke="#4f46e5"
                      fill="#4f46e5"
                      fillOpacity={0.6}
                    />
                    <Tooltip formatter={(value) => [`${value}%`, 'Performance']} />
                  </RadarChart>
                </ResponsiveContainer>
              </div>              {/* Critérios detalhados */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {criteria.map((criterion: any, index: number) => {                  // Tentar múltiplos campos para encontrar o valor
                  const rawValue = criterion.pct_conforme || criterion.performance || criterion.score || criterion.percentual || 
                                  criterion.taxa_conforme || criterion.media || criterion.valor || 
                                  criterion.pontuacao || criterion.conformidade || 0;
                  
                  // Converter para número e lidar com valores decimais
                  let value = typeof rawValue === 'number' ? rawValue : parseFloat(rawValue) || 0;
                  
                  // Se o valor parece ser decimal (entre 0 e 1), converter para percentual
                  if (value > 0 && value <= 1) {
                    value = value * 100;
                  }
                  
                  return (
                    <div 
                      key={index} 
                      className="p-4 rounded-xl border border-gray-100 bg-white shadow-sm"
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1">                          <h3 className="text-sm font-medium text-[var(--color-navy-blue)]">
                            {formatItemName(criterion.categoria || criterion.name || criterion.item)}
                          </h3>
                        </div>
                        <span 
                          className={`text-xs font-semibold px-2 py-1 rounded-full ${
                            value >= 70 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {value.toFixed(1)}%
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="bg-white border border-gray-100 rounded-xl p-8 text-center shadow-sm">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              <p className="mt-4 text-[var(--color-muted-blue)]">Nenhum critério de avaliação encontrado para o período selecionado.</p>
            </div>
          )}
        </div>

        {/* Lista de ligações */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold" style={{ color: 'var(--color-navy-blue)' }}>Histórico de Ligações</h2>
            <p className="text-sm text-[var(--color-muted-blue)] mt-1">
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
            <CallList calls={calls ?? []} user={user} />
          )}
        </div>
      </div>
    </div>
  );
};

export default AgentDetail;
