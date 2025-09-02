import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { 
  RadarChart, 
  PolarGrid, 
  PolarAngleAxis, 
  PolarRadiusAxis, 
  Radar, 
  ResponsiveContainer,
  Tooltip,
  BarChart,
  Bar,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Legend
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
import { formatItemName, formatAgentName, deduplicateCriteria, analyzeCriteriaDuplicates, standardizeCriteria } from '../lib/format';
import { useFilters } from '../hooks/use-filters';
import { useAuth } from '../contexts/AuthContext';
import { ArrowLeft, BarChart3, TrendingUp } from 'lucide-react';

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
  const navigate = useNavigate();
  const [activeChart, setActiveChart] = React.useState<'radar' | 'bar'>('radar');
  
  if (!agentId) return <div>Agente não especificado.</div>;

  const { filters } = useFilters();

  // Persistência do filtro de datas
  const [startDate, setStartDate] = useState(() =>
    getPersistedDate('agent_filter_start', getDefaultStartDate())
  );
  const [endDate, setEndDate] = useState(() =>
    getPersistedDate('agent_filter_end', today)
  );
  const [activeTab, setActiveTab] = useState<'overview' | 'feedback'>('overview');

  useEffect(() => {
    setPersistedDate('agent_filter_start', startDate);
  }, [startDate]);
  useEffect(() => {
    setPersistedDate('agent_filter_end', endDate);
  }, [endDate]);

  // Use startDate e endDate nos filtros das queries
  // CORREÇÃO: Não usar carteira do localStorage para página de agente específico
  const apiFilters = { 
    start: startDate, 
    end: endDate
    // Removido carteira para que a API busque em todas as carteiras
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
  });

  // Feedbacks do agente
  const { data: agentFeedbacks, isLoading: feedbacksLoading, error: feedbacksError } = useQuery({
    queryKey: ['agentFeedbacks', agentId, apiFilters, user?.id],
    queryFn: () => {
      return fetch('/api/feedbacks/with-scores')
        .then(res => res.json())
        .then(data => {
          // Filtrar apenas feedbacks deste agente específico
          const filteredFeedbacks = data.filter((fb: any) => {
            // Se for um agente, sempre filtrar pelo ID do usuário logado
            // Se for admin/monitor, filtrar pelo ID da página
            const targetAgentId = isAgent ? user?.id?.toString() : agentId;
            
            // Comparar pelo ID do agente na tabela de feedbacks
            const matchById = fb.agent_id === targetAgentId;
            
            return matchById;
          });
          
          return filteredFeedbacks;
        });
    },
    enabled: activeTab === 'feedback' && !!user, // Só busca quando a aba feedback estiver ativa e usuário estiver logado
  });

  // Helper function to format criteria data for radar chart
  const generateMonthlyData = (callsData: any[]) => {
    if (!callsData || callsData.length === 0) return [];
    
    const monthlyGroups = callsData.reduce((acc: any, call: any) => {
      const date = new Date(call.data_ligacao);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      const monthLabel = date.toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' });
      
      if (!acc[monthKey]) {
        acc[monthKey] = { month: monthLabel, monthKey: monthKey, scores: [], count: 0 };
      }
      
      acc[monthKey].scores.push(call.pontuacao);
      acc[monthKey].count++;
      return acc;
    }, {});
    
    const monthlyData = Object.values(monthlyGroups).map((group: any) => {
      const averageScore = group.scores.reduce((sum: number, score: number) => sum + score, 0) / group.scores.length;
      
      return {
        month: group.month,
        monthKey: group.monthKey,
        notas: Math.round(averageScore * 10) / 10,
        avaliacoes: group.count,
        totalChamadas: group.count
      };
    });
    
    return monthlyData.sort((a: any, b: any) => a.monthKey.localeCompare(b.monthKey));
  };

  const formatCriteriaForRadar = (criteriaData: any[]) => {
    if (!criteriaData || criteriaData.length === 0) return [];
    
    // Primeiro, deduplicar os critérios
    const deduplicatedCriteria = deduplicateCriteria(criteriaData);
    
    // Agrupar critérios por categoria
    const categoriesMap = new Map();
    
    deduplicatedCriteria.forEach(item => {
      const standardized = standardizeCriteria(item);
      
      // Pular critérios que não se aplicam
      if (standardized.isNotApplicable) return;
      
      const category = standardized.name.split(' - ')[0] || 'Sem Categoria'; // Pegar primeira parte como categoria
      
      if (!categoriesMap.has(category)) {
        categoriesMap.set(category, {
          values: [],
          count: 0
        });
      }
      
      categoriesMap.get(category).values.push(standardized.value);
      categoriesMap.get(category).count++;
    });
    
          // Calcular média de cada categoria
      const formatted = Array.from(categoriesMap.entries()).map(([category, data]) => {
        const averageValue = data.values.reduce((sum: number, val: number) => sum + val, 0) / data.values.length;
        
        return {
          subject: category,
          value: Math.round(averageValue * 10) / 10,
          fullMark: 100,
          count: data.count,
          originalData: data.values
        };
      });

    // Log para debug
    if (process.env.NODE_ENV === 'development') {
      console.log('📊 Dados formatados por categoria para radar:', {
        original: criteriaData.length,
        deduplicated: deduplicatedCriteria.length,
        categories: formatted.length,
        categoriesData: formatted.map(f => ({ category: f.subject, count: f.count, avg: f.value }))
      });
    }

    // Retornar dados agrupados por categoria
    return formatted;
  };

  // Funções auxiliares para feedbacks
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pendente': return 'text-yellow-600';
      case 'aplicado': return 'text-green-600';
      case 'aceito': return 'text-blue-600';
      case 'revisao': return 'text-orange-600';
      default: return 'text-gray-600';
    }
  };

  const getPerformanceColor = (performance: number) => {
    if (performance >= 80) return 'text-green-600';
    if (performance >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getOrigemIcon = (origem: string) => {
    switch (origem?.toLowerCase()) {
      case 'ia':
        return '🤖';
      case 'monitor':
        return '👨‍💼';
      default:
        return '❓';
    }
  };

  // Log de erros e dados recebidos
  React.useEffect(() => {
    if (summaryError) {
      console.error('Erro ao buscar resumo do agente:', summaryError);
    }
    if (callsError) {
      console.error('Erro ao buscar ligações do agente:', callsError);
    }
    if (wiError) {
      console.error('Erro ao buscar pior item do agente:', wiError);
    }
    if (criteriaError) {
      console.error('Erro ao buscar critérios do agente:', criteriaError);
    }
  }, [summaryError, callsError, wiError, criteriaError, summary, criteria, calls]);

  // Verifica se o usuário autenticado é o próprio agente da página
  const isAgent = user && user.id && (
    user.id.toString() === agentId || 
    user.id === parseInt(agentId)
  );
  


  return (
    <div>
      <PageHeader 
        title={isAgent ? "Minha Página" : "Detalhes do Agente"}
        subtitle={isAgent ? "Análise detalhada do seu desempenho" : `Análise detalhada do Agente ${agentId}`}
        breadcrumbs={isAgent ? [] : [
          { label: 'Dashboard', href: '/' },
          { label: 'Detalhes do Agente', isActive: true }
        ]}
        actions={
          <div className="flex flex-col sm:flex-row flex-wrap gap-3 sm:gap-4 items-end">
            <div className="flex flex-col">
              <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Data Início</label>
              <input
                type="date"
                value={startDate}
                onChange={e => setStartDate(e.target.value)}
                className="h-8 sm:h-9 border border-gray-300 rounded-xl px-2 sm:px-3 text-xs sm:text-sm shadow-sm bg-white !text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
              />
            </div>
            <div className="flex flex-col">
              <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Data Fim</label>
              <input
                type="date"
                value={endDate}
                onChange={e => setEndDate(e.target.value)}
                className="h-8 sm:h-9 border border-gray-300 rounded-xl px-2 sm:px-3 text-xs sm:text-sm shadow-sm bg-white !text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
              />
            </div>
            {!isAgent && (
              <button
                onClick={() => navigate(-1)}
                className="inline-flex items-center gap-1 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-medium text-blue-600 bg-blue-50 border border-blue-200 rounded-full hover:bg-blue-100 transition-all duration-200 shadow-sm"
              >
                <ArrowLeft className="h-3 w-3 sm:h-4 sm:w-4" />
                Voltar
              </button>
            )}
          </div>
        }

      />

      {/* Sistema de Abas */}
      {isAgent && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setActiveTab('overview')}
                className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors duration-200 ${
                  activeTab === 'overview'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Visão Geral
              </button>
              <button
                onClick={() => setActiveTab('feedback')}
                className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors duration-200 ${
                  activeTab === 'feedback'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Feedbacks
              </button>
            </nav>
          </div>
        </div>
      )}
      

      


      {/* Conteúdo da Aba Visão Geral */}
      {activeTab === 'overview' && (
        <div className="p-4 sm:p-6 space-y-6 sm:space-y-8 !text-gray-900">
          {/* Resumo do agente */}
          {summaryLoading ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="animate-pulse !text-gray-900">
              <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
              <div className="h-8 bg-gray-200 rounded w-1/2"></div>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 sm:p-6 !text-gray-900">
            {/* Layout responsivo: Ícone, Nome/ID, Métricas */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-4 sm:space-y-0 sm:space-x-6 !text-gray-900">
              {/* Coluna 1: Ícone */}
              <div className="flex-shrink-0">
                <div className="h-12 w-12 sm:h-14 sm:w-14 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-md">
                  <span className="text-xl sm:text-2xl font-bold text-white">
                    {formatAgentName(summary).charAt(0)}
                  </span>
                </div>
              </div>
              
              {/* Coluna 2: Nome e ID */}
              <div className="flex-1 min-w-0">
                <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-1 truncate">
                  {formatAgentName(summary)}
                </h3>
                <p className="text-sm sm:text-base text-gray-600 font-medium">Agente ID: {agentId}</p>
              </div>
              
              {/* Coluna 3: Métricas - Apenas para administradores */}
              {!isAgent && (
                <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-6 !text-gray-900 w-full sm:w-auto">
                  <div className="text-center sm:text-left !text-gray-900">
                    <p className="text-xs sm:text-sm text-gray-500 font-medium mb-1">Total de Ligações</p>
                    <p className="text-xl sm:text-2xl font-bold text-gray-900">{summary?.ligacoes ?? 0}</p>
                  </div>
                  <div className="text-center sm:text-left !text-gray-900">
                    <p className="text-xs sm:text-sm text-gray-500 font-medium mb-1">Média de Avaliação</p>
                    <p className="text-xl sm:text-2xl font-bold text-blue-600">{(summary?.media ?? 0).toFixed(1)}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Pior item - Apenas para administradores */}
        {!isAgent && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 sm:p-6 !text-gray-900">
            <h2 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">Pior Item Avaliado</h2>
            {wiLoading ? (
              <div className="animate-pulse !text-gray-900">
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              </div>
            ) : worstItem ? (
              <div className="bg-red-50 border border-red-200 rounded-xl p-4 shadow-sm">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-red-800">
                      {formatItemName(worstItem.categoria)}
                    </h3>
                    <p className="text-sm text-red-700 mt-1">
                      Taxa de não conformidade: <span className="text-sm font-semibold">{(worstItem.taxa_nao_conforme * 100).toFixed(1)}%</span>
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm">
                <p className="text-gray-600">Sem dados de avaliação disponíveis para o período selecionado.</p>
              </div>
            )}
          </div>
        )}        {/* Gráfico de Radar - Critérios do Agente */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 sm:p-6 !text-gray-900">

          
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
            <div className="animate-pulse space-y-4 !text-gray-900">
              <div className="h-64 bg-gray-200 rounded"></div>
              <div className="grid grid-cols-2 gap-4">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="h-4 bg-gray-200 rounded"></div>
                ))}
              </div>
            </div>
          ) : criteria && criteria.length > 0 ? (
            <>
              {/* Informação sobre duplicatas */}
              {(() => {
                const analysis = analyzeCriteriaDuplicates(criteria);
                return analysis.duplicates > 0 ? (
                  <div className="mb-4 p-3 bg-orange-50 border border-orange-200 rounded-lg">
                    <p className="text-sm text-orange-800">
                      ⚠️ <strong>Critérios duplicados detectados:</strong> 
                      {analysis.duplicateGroups.map((group, index) => (
                        <span key={index}>
                          "{group.normalizedName}" ({group.items.length}x){index < analysis.duplicateGroups.length - 1 ? ', ' : ''}
                        </span>
                      ))}
                      <br />
                      <span className="text-xs">
                        Total: {analysis.total} critérios recebidos, {analysis.unique} únicos exibidos.
                        {analysis.duplicates} duplicatas foram removidas automaticamente.
                      </span>
                    </p>
                  </div>
                ) : null;
              })()}
              <div className="space-y-6">
                {/* Header com opções de gráfico */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-3 sm:space-y-0">
                  <h2 className="text-base sm:text-lg font-semibold text-gray-900">
                    <svg className="inline-block w-4 h-4 sm:w-5 sm:h-5 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2zm0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                    Desempenho por Categoria
                  </h2>
                  <div className="flex items-center gap-2">
                    <div className="flex items-center bg-gray-100 rounded-full p-1 shadow-sm">
                      <button 
                        onClick={() => setActiveChart('radar')} 
                        className={`px-2 sm:px-3 py-1 sm:py-1.5 text-xs sm:text-sm font-medium rounded-full transition-all duration-200 flex items-center gap-1 ${
                          activeChart === 'radar' 
                            ? 'bg-white text-gray-900 shadow-sm' 
                            : 'text-gray-600 hover:text-gray-900'
                        }`}
                      >
                        <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2zm0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                        </svg>
                        <span className="hidden sm:inline">Radar</span>
                      </button>
                      <button 
                        onClick={() => setActiveChart('bar')} 
                        className={`px-2 sm:px-3 py-1 sm:py-1.5 text-xs sm:text-sm font-medium rounded-full transition-all duration-200 flex items-center gap-1 ${
                          activeChart === 'bar' 
                            ? 'bg-white text-gray-900 shadow-sm' 
                            : 'text-gray-600 hover:text-gray-900'
                        }`}
                      >
                        <BarChart3 className="w-3 h-3 sm:w-4 sm:h-4" />
                        <span className="hidden sm:inline">Barras</span>
                      </button>
                    </div>
                    {process.env.NODE_ENV === 'development' && (
                      <button 
                        onClick={() => {
                          console.log('🔍 [DEBUG] Dados atuais:', { criteria, formatted: formatCriteriaForRadar(criteria || []) });
                        }}
                        className="text-xs bg-blue-600/70 hover:bg-blue-700/80 text-white px-3 py-1.5 rounded-full font-light backdrop-blur-sm border border-blue-300/50 shadow-sm transition-all duration-200"
                      >
                        Debug Data
                      </button>
                    )}
                  </div>
                </div>
                
                {/* Gráfico dinâmico */}
                <div className="h-48 sm:h-64">
                  {formatCriteriaForRadar(criteria).length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      {activeChart === 'radar' ? (
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
                      ) : (
                        <BarChart data={formatCriteriaForRadar(criteria)}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="subject" tick={{ fill: '#6b7280', fontSize: 12 }} />
                          <YAxis domain={[0, 100]} tick={{ fill: '#6b7280', fontSize: 12 }} />
                          <Tooltip formatter={(value) => [`${value}%`, 'Performance']} />
                          <Bar dataKey="value" fill="#4f46e5" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      )}
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-full flex items-center justify-center">
                      <div className="text-center">
                        <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2zm0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                        </svg>
                        <p className="text-gray-600">Nenhuma categoria disponível para exibir nos gráficos.</p>
                      </div>
                    </div>
                  )}
                </div>
                
                {/* Critérios detalhados */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  {deduplicateCriteria(criteria).map((criterion: any, index: number) => {
                    const standardized = standardizeCriteria(criterion);
                    
                    return (
                      <div 
                        key={standardized.id} 
                        className="p-4 rounded-xl border border-gray-100 bg-white shadow-sm"
                      >
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <h3 className="text-sm font-medium text-gray-900">
                              {formatItemName(standardized.name)}
                            </h3>
                            {criterion._deduplicationInfo?.duplicateCount > 1 && (
                              <p className="text-xs text-orange-600 mt-1">
                                ⚠️ Critério duplicado ({criterion._deduplicationInfo.duplicateCount}x)
                              </p>
                            )}
                          </div>
                          <span 
                            className={`text-xs font-semibold px-2 py-1 rounded-full ${
                              standardized.isNotApplicable
                                ? 'bg-gray-100 text-gray-600' // Cinza para "Não se aplica"
                                : standardized.value >= 70 
                                  ? 'bg-green-100 text-green-800' 
                                  : 'bg-red-100 text-red-800'
                            }`}
                          >
                            {standardized.isNotApplicable ? 'Não se aplica' : `${standardized.value.toFixed(1)}%`}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </>
          ) : (
            <div className="bg-white border border-gray-100 rounded-xl p-8 text-center shadow-sm">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              <p className="mt-4 text-gray-600">Nenhum critério de avaliação encontrado para o período selecionado.</p>
            </div>
          )}
        </div>

        {/* Gráfico de Comparativo Mensal */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 sm:p-6 !text-gray-900">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-3 sm:space-y-0 mb-4">
            <h2 className="text-base sm:text-lg font-semibold text-gray-900">
              <TrendingUp className="inline-block w-4 h-4 sm:w-5 sm:h-5 mr-2 text-blue-600" />
              Comparativo Mensal
            </h2>
          </div>
          
          {generateMonthlyData(calls || []).length > 0 ? (
            <>
              <div className="h-48 sm:h-64" id="chart-container">
                {(() => {
                  const chartData = generateMonthlyData(calls || []);
                  
                  return (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart 
                        data={chartData}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis 
                          dataKey="month" 
                          tick={{ fill: '#6b7280', fontSize: 12 }}
                        />
                        <YAxis 
                          domain={[0, 100]} 
                          tick={{ fill: '#6b7280', fontSize: 12 }}
                        />
                        <Tooltip 
                          formatter={(value) => {
                            return [`${value}%`, 'Média de Pontuação'];
                          }} 
                        />
                        <Legend />
                        <Bar 
                          dataKey="notas" 
                          radius={[4, 4, 0, 0]} 
                          name="Média de Pontuação" 
                          fill="#3b82f6"
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  );
                })()}
              </div>

            </>
          ) : (
            <div className="h-64 flex items-center justify-center">
              <div className="text-center">
                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                <p className="mt-4 text-gray-600">Nenhum dado disponível para gerar o comparativo mensal.</p>
              </div>
            </div>
          )}
        </div>

        {/* Lista de ligações - Apenas para administradores */}
        {!isAgent && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 !text-gray-900">
            <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-gray-200">
              <h2 className="text-base sm:text-lg font-semibold text-gray-900">Histórico de Ligações</h2>
              <p className="text-xs sm:text-sm text-gray-600 mt-1">
                Detalhes das ligações realizadas no período
              </p>
            </div>
            
            {callsLoading ? (
              <div className="p-4 sm:p-6 !text-gray-900">
                <div className="animate-pulse space-y-4 !text-gray-900">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="h-16 bg-gray-200 rounded"></div>
                  ))}
                </div>
              </div>
            ) : (
              <CallList calls={calls ?? []} user={user} />
            )}
          </div>
        )}
      </div>
      )}

      {/* Conteúdo da Aba Feedbacks */}
      {activeTab === 'feedback' && (
        <div className="p-4 sm:p-6 space-y-6 sm:space-y-8 !text-gray-900">
          {/* Verificação de Segurança */}
          {!isAgent && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-red-100 rounded-full">
                  <svg className="h-5 w-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-red-800">Acesso Restrito</h3>
                  <p className="text-sm text-red-700">Apenas o próprio agente pode visualizar seus feedbacks pessoais.</p>
                </div>
              </div>
            </div>
          )}

          {/* Header dos Feedbacks */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 sm:p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-xl font-bold text-gray-900">
                  {isAgent ? 'Meus Feedbacks' : 'Feedbacks do Agente'}
                </h2>
                <p className="text-gray-600">
                  {isAgent ? 'Visualize e gerencie seus feedbacks pessoais' : 'Feedbacks deste agente específico'}
                </p>
              </div>
              {!isAgent && (
                <div className="text-right">
                  <p className="text-2xl font-bold text-blue-600">
                    {agentFeedbacks?.length || 0}
                  </p>
                  <p className="text-sm text-gray-500">Total de Feedbacks</p>
                </div>
              )}
            </div>
          </div>

          {/* Lista de Feedbacks */}
          {!isAgent ? (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 text-center">
              <div className="text-gray-400 mb-4">
                <svg className="mx-auto h-12 w-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Acesso Restrito</h3>
              <p className="text-gray-600">
                Apenas o próprio agente pode visualizar seus feedbacks pessoais.
              </p>
            </div>
          ) : feedbacksLoading ? (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <div className="animate-pulse space-y-4">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="h-20 bg-gray-200 rounded"></div>
                ))}
              </div>
            </div>
          ) : feedbacksError ? (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <div className="text-center text-red-600">
                <p>Erro ao carregar feedbacks. Tente novamente.</p>
              </div>
            </div>
          ) : agentFeedbacks && agentFeedbacks.length > 0 ? (
            <div className="space-y-4">

              
              {agentFeedbacks.map((feedback: any) => (
                <div key={feedback.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 sm:p-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between space-y-3 sm:space-y-0">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="text-lg">{getOrigemIcon(feedback.origem)}</span>
                        <h3 className="text-lg font-semibold text-gray-900">
                          {feedback.criterio_nome || 'Critério não especificado'}
                        </h3>
                      </div>
                      <p className="text-gray-600 mb-3">
                        {feedback.comentario || 'Nenhum comentário disponível'}
                      </p>
                      <div className="flex flex-wrap gap-4 text-sm">
                        <div className="flex items-center gap-2">
                          <span className="text-gray-500">Performance:</span>
                          <span className={`font-semibold ${getPerformanceColor(feedback.performance_atual || 0)}`}>
                            {feedback.performance_atual || 0}%
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-gray-500">Status:</span>
                          <span className={`font-semibold ${getStatusColor(feedback.status)}`}>
                            {feedback.status === 'ENVIADO' ? 'Pendente' : feedback.status}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-gray-500">Origem:</span>
                          <span className="font-semibold text-gray-700">
                            {feedback.origem === 'monitoria' ? 'Monitor' : 'IA'}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-gray-500">Data:</span>
                          <span className="font-semibold text-gray-700">
                            {new Date(feedback.criado_em).toLocaleDateString('pt-BR')}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    {/* Ações do Feedback */}
                    {feedback.status === 'ENVIADO' && (
                      <div className="flex flex-col sm:flex-row gap-2">
                        <button
                          onClick={() => alert('Funcionalidade de aceitar feedback será implementada!')}
                          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
                        >
                          Aceitar
                        </button>
                        <button
                          onClick={() => alert('Funcionalidade de rejeitar feedback será implementada!')}
                          className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium"
                        >
                          Rejeitar
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 text-center">
              <div className="text-gray-400 mb-4">
                <svg className="mx-auto h-12 w-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhum feedback encontrado</h3>
              <p className="text-gray-600">
                Você ainda não recebeu feedbacks. Continue se esforçando e os feedbacks aparecerão aqui quando disponíveis.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AgentDetail;
