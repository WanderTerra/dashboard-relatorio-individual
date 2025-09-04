import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate, useLocation } from 'react-router-dom';
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
import { getAgentGamification } from '../lib/gamification-api';
import CallList     from '../components/CallList';
import SummaryCard  from '../components/ui/SummaryCard';
import GamifiedAgentHeader from '../components/GamifiedAgentHeader';
import { formatItemName, formatAgentName, deduplicateCriteria, analyzeCriteriaDuplicates, standardizeCriteria } from '../lib/format';
import { useFilters } from '../hooks/use-filters';
import { useAuth } from '../contexts/AuthContext';
import { ArrowLeft, BarChart3, TrendingUp, Award, Target, Zap, Crown, Medal, Trophy, Star, XCircle, CheckCircle, Info } from 'lucide-react';
import { getAutomaticAchievements, getAchievementsByCategory, type AutomaticAchievement } from '../lib/achievements';
import NotificationBell from '../components/NotificationBell';

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
  const location = useLocation();
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

  // ✅ Modificado: detectar aba da URL
  const urlParams = new URLSearchParams(location.search);
  const tabFromUrl = urlParams.get('tab') as 'overview' | 'feedback' | 'calls' | null;
  const [activeTab, setActiveTab] = useState<'overview' | 'feedback' | 'calls'>(
    tabFromUrl || 'overview' // ✅ Usar aba da URL se disponível
  );

  // ✅ Adicionado: atualizar aba quando URL mudar
  useEffect(() => {
    if (tabFromUrl) {
      setActiveTab(tabFromUrl);
    }
  }, [tabFromUrl]);

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

  // gamification data
  const { data: gamificationData, isLoading: gamificationLoading, error: gamificationError } = useQuery({
    queryKey: ['agentGamification', agentId],
    queryFn: () => getAgentGamification(agentId),
    staleTime: 5 * 60 * 1000, // 5 minutos
    refetchOnWindowFocus: false
  });

  // calls
  const { data: calls, isLoading: callsLoading, error: callsError } = useQuery({
    queryKey: ['agentCalls', agentId, apiFilters],
    queryFn: () => {
      return getAgentCalls(agentId, apiFilters);
    },
  });

  // agent criteria for radar chart
  const { data: criteria, isLoading: criteriaLoading, error: criteriaError } = useQuery({
    queryKey: ['agentCriteria', agentId, apiFilters],
    queryFn: () => {
      return getAgentCriteria(agentId, apiFilters);
    },
  });

  // Calcular o pior item localmente usando os critérios
  const worstItem = React.useMemo(() => {
    if (!criteria || criteria.length === 0) return null;
    
    const deduplicatedCriteria = deduplicateCriteria(criteria);
    let worstCriterion = null;
    let worstValue = 100;
    
    deduplicatedCriteria.forEach((criterion: any) => {
      const standardized = standardizeCriteria(criterion);
      if (!standardized.isNotApplicable && standardized.value < worstValue) {
        worstValue = standardized.value;
        worstCriterion = {
          categoria: standardized.name,
          taxa_nao_conforme: (100 - standardized.value) / 100
        };
      }
    });
    
    return worstCriterion;
  }, [criteria]);

  // Verifica se o usuário autenticado é o próprio agente da página
  const isAgent = user && user.id && (
    user.id.toString() === agentId || 
    user.id === parseInt(agentId)
  );

  // ✅ Adicionar estado para o modal de níveis
  const [showLevelsModal, setShowLevelsModal] = useState<boolean>(false);

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
    
    // Log para debug - verificar estrutura dos dados
    if (process.env.NODE_ENV === 'development') {
      console.log('🔍 Dados brutos dos critérios:', criteriaData.slice(0, 3));
      console.log(' Campos disponíveis no primeiro critério:', Object.keys(criteriaData[0] || {}));
    }
    
    // Primeiro, deduplicar os critérios
    const deduplicatedCriteria = deduplicateCriteria(criteriaData);
    
    // Função para extrair categoria do nome do critério
    const extractCategoryFromName = (name: string) => {
      const lowerName = name.toLowerCase();
      
      // Categorias específicas do admin baseadas no print
      if (lowerName.includes('abordagem') || lowerName.includes('script') || lowerName.includes('cumpriment') || 
          lowerName.includes('identificou') || lowerName.includes('origem do atendimento')) {
        return 'Abordagem';
      }
      if (lowerName.includes('check') || lowerName.includes('confirm') || lowerName.includes('verific') ||
          lowerName.includes('boleto') || lowerName.includes('vencimento') || lowerName.includes('aceite')) {
        return 'Check-list';
      }
      if (lowerName.includes('confirmação') || lowerName.includes('confirmacao') || lowerName.includes('dados') ||
          lowerName.includes('valores') || lowerName.includes('informou')) {
        return 'Confirmação de dados';
      }
      if (lowerName.includes('encerramento') || lowerName.includes('agradece') || lowerName.includes('duvida') ||
          lowerName.includes('questionou') || lowerName.includes('ajudar')) {
        return 'Encerramento';
      }
      if (lowerName.includes('negociacao') || lowerName.includes('negociação') || lowerName.includes('oferta') || 
          lowerName.includes('desconto') || lowerName.includes('parcelamento') || lowerName.includes('fechamento') ||
          lowerName.includes('acordo') || lowerName.includes('pagamento')) {
        return 'Negociação';
      }
      
      // Se não conseguir identificar, usar "Outros"
      return 'Outros';
    };
    
    // Agrupar critérios por categoria
    const categoriesMap = new Map();
    
    deduplicatedCriteria.forEach((item, index) => {
      const standardized = standardizeCriteria(item);
      
      // Log detalhado para debug
      if (process.env.NODE_ENV === 'development' && index < 3) {
        console.log(` Critério ${index + 1}:`, {
          rawData: item,
          standardized: standardized,
          extractedCategory: extractCategoryFromName(standardized.name)
        });
      }
      
      // Pular critérios que não se aplicam
      if (standardized.isNotApplicable) return;
      
      // Tentar extrair categoria do nome do critério
      const category = extractCategoryFromName(standardized.name);
      
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
    const formatted = Array.from(categoriesMap.entries())
      .map(([category, data]) => {
        const averageValue = data.values.reduce((sum: number, val: number) => sum + val, 0) / data.values.length;
        
        return {
          subject: category,
          value: Math.round(averageValue * 10) / 10,
          fullMark: 100,
          count: data.count,
          originalData: data.values
        };
      })
      .sort((a, b) => b.count - a.count) // Ordenar por número de critérios (mais importantes primeiro)
      .slice(0, 8); // Limitar a 8 categorias para o radar ficar legível

    // Log para debug
    if (process.env.NODE_ENV === 'development') {
      console.log('📊 Dados formatados por categoria para radar:', {
        original: criteriaData.length,
        deduplicated: deduplicatedCriteria.length,
        categories: formatted.length,
        categoriesData: formatted.map(f => ({ category: f.subject, count: f.count, avg: f.value }))
      });
    }

    return formatted;
  };

  // Log de erros e dados recebidos
  React.useEffect(() => {
    if (summaryError) {
      console.error('Erro ao buscar resumo do agente:', summaryError);
    }
    if (callsError) {
      console.error('Erro ao buscar ligações do agente:', callsError);
    }
    if (criteriaError) {
      console.error('Erro ao buscar critérios do agente:', criteriaError);
    }
  }, [summaryError, callsError, criteriaError, summary, criteria, calls]);

  return (
    <div>
      <GamifiedAgentHeader 
        agentName={summary ? formatAgentName(summary) : `Agente ${agentId}`}
        agentId={agentId}
      />

      {/* Sistema de Abas */}
      <div className="px-4 sm:px-6 lg:px-8">
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
              onClick={() => setActiveTab('calls')}
              className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors duration-200 ${
                activeTab === 'calls'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {isAgent ? 'Histórico de Ligações' : 'Ligações do Agente'}
            </button>
            {isAgent && (
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
            )}
          </nav>
        </div>
      </div>

      {/* Sino de Notificações - Apenas para agentes */}
      {isAgent && (
        <div className="absolute top-4 right-4 z-50">
          <NotificationBell agentId={agentId} />
        </div>
      )}
      

      {/* Conteúdo da Aba Visão Geral */}
      {activeTab === 'overview' && (
        <div className="px-4 sm:px-6 lg:px-8 py-6 space-y-6">
          {/* Cards de Status Rápido - Versão Animada */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Card de Nível - Com animações */}
            <div 
              className="group relative bg-gradient-to-br from-yellow-50 to-amber-50 rounded-xl p-4 border border-yellow-200 
                         hover:shadow-xl hover:shadow-yellow-100/50 hover:-translate-y-1 hover:scale-105 
                         transition-all duration-300 ease-out cursor-pointer
                         animate-fade-in-up"
              style={{ animationDelay: '0ms' }}
              onClick={() => setShowLevelsModal(true)}
            >
              <div className="flex items-center">
                <div className="p-3 bg-gradient-to-br from-yellow-100 to-yellow-200 rounded-xl mr-3 
                                group-hover:rotate-12 group-hover:scale-110 transition-all duration-300">
                  <Trophy className="w-6 h-6 text-yellow-600 group-hover:text-yellow-700" />
                </div>
                <div>
                  <p className="text-sm text-yellow-700 font-medium group-hover:text-yellow-800 transition-colors">
                    Nível Atual
                  </p>
                  <p className="text-2xl font-bold text-yellow-800 group-hover:text-yellow-900 transition-colors">
                    {gamificationData?.current_level || 1}
                  </p>
                </div>
              </div>
              
              {/* Efeito de brilho no hover */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent 
                              opacity-0 group-hover:opacity-100 group-hover:animate-shine 
                              transition-opacity duration-300 rounded-xl"></div>
            </div>

            {/* Card de XP - Com animações */}
            <div 
              className="group relative bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-4 border border-blue-200 
                         hover:shadow-xl hover:shadow-blue-100/50 hover:-translate-y-1 hover:scale-105 
                         transition-all duration-300 ease-out cursor-pointer
                         animate-fade-in-up"
              style={{ animationDelay: '100ms' }}
            >
              <div className="flex items-center">
                <div className="p-3 bg-gradient-to-br from-blue-100 to-blue-200 rounded-xl mr-3 
                                group-hover:rotate-12 group-hover:scale-110 transition-all duration-300">
                  <Star className="w-6 h-6 text-blue-600 group-hover:text-blue-700 group-hover:animate-pulse" />
                </div>
                <div>
                  <p className="text-sm text-blue-700 font-medium group-hover:text-blue-800 transition-colors">
                    XP Total
                  </p>
                  <p className="text-2xl font-bold text-blue-800 group-hover:text-blue-900 transition-colors">
                    {gamificationData?.total_xp_earned?.toLocaleString() || '0'}
                  </p>
                </div>
              </div>
              
              {/* Contador animado de XP */}
              <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <div className="text-xs text-blue-500 font-medium animate-bounce">+XP</div>
              </div>
              
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent 
                              opacity-0 group-hover:opacity-100 group-hover:animate-shine 
                              transition-opacity duration-300 rounded-xl"></div>
            </div>

            {/* Card de Ligações - Com animações */}
            <div 
              className="group relative bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-4 border border-green-200 
                         hover:shadow-xl hover:shadow-green-100/50 hover:-translate-y-1 hover:scale-105 
                         transition-all duration-300 ease-out cursor-pointer
                         animate-fade-in-up"
              style={{ animationDelay: '200ms' }}
            >
              <div className="flex items-center">
                <div className="p-3 bg-gradient-to-br from-green-100 to-green-200 rounded-xl mr-3 
                                group-hover:rotate-12 group-hover:scale-110 transition-all duration-300">
                  <svg className="w-6 h-6 text-green-600 group-hover:text-green-700 group-hover:animate-pulse" 
                       fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                          d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm text-green-700 font-medium group-hover:text-green-800 transition-colors">
                    Ligações
                  </p>
                  <p className="text-2xl font-bold text-green-800 group-hover:text-green-900 transition-colors">
                    {calls?.length || 0}
                  </p>
                </div>
              </div>
              
              {/* Indicador de atividade */}
              <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-ping"></div>
              </div>
              
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent 
                              opacity-0 group-hover:opacity-100 group-hover:animate-shine 
                              transition-opacity duration-300 rounded-xl"></div>
            </div>

            {/* Card de Média - Com animações */}
            <div 
              className="group relative bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-4 border border-blue-200 
                         hover:shadow-xl hover:shadow-blue-100/50 hover:-translate-y-1 hover:scale-105 
                         transition-all duration-300 ease-out cursor-pointer
                         animate-fade-in-up"
              style={{ animationDelay: '300ms' }}
            >
              <div className="flex items-center">
                <div className="p-3 bg-gradient-to-br from-blue-100 to-blue-200 rounded-xl mr-3 
                                group-hover:rotate-12 group-hover:scale-110 transition-all duration-300">
                  <TrendingUp className="w-6 h-6 text-blue-600 group-hover:text-blue-700 group-hover:animate-pulse" />
                </div>
                <div>
                  <p className="text-sm text-blue-700 font-medium group-hover:text-blue-800 transition-colors">
                    Média
                  </p>
                  <p className="text-2xl font-bold text-blue-800 group-hover:text-blue-900 transition-colors">
                    {summary?.media ? summary.media.toFixed(1) : '0.0'}
                  </p>
                </div>
              </div>
              
              {/* Barra de progresso animada */}
              <div className="mt-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <div className="w-full bg-blue-100 rounded-full h-1">
                  <div 
                    className="bg-gradient-to-r from-blue-400 to-blue-600 h-1 rounded-full animate-progress"
                    style={{ width: `${Math.min((summary?.media || 0) * 10, 100)}%` }}
                  ></div>
                </div>
              </div>
              
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent 
                              opacity-0 group-hover:opacity-100 group-hover:animate-shine 
                              transition-opacity duration-300 rounded-xl"></div>
            </div>
          </div>

          {/* Seção Principal - Duas Colunas */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Coluna Esquerda - Conquistas */}
            <div className="space-y-6">
              {/* Conquistas Principais */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <div className="flex items-center mb-4">
                  <div className="p-2 bg-purple-100 rounded-lg mr-3">
                    <Award className="w-5 h-5 text-purple-600" />
                  </div>
                  <h2 className="text-lg font-bold text-gray-900">Suas Conquistas</h2>
                </div>
                
                {(() => {
                  if (!gamificationData && !calls && !criteria) {
                    return (
                      <div className="text-center py-8">
                        <div className="animate-pulse">
                          <div className="h-4 bg-gray-200 rounded w-3/4 mx-auto mb-2"></div>
                          <div className="h-4 bg-gray-200 rounded w-1/2 mx-auto"></div>
                        </div>
                      </div>
                    );
                  }

                  const agentData = {
                    agent_id: agentId,
                    current_level: gamificationData?.current_level || 1,
                    current_xp: gamificationData?.current_xp || 0,
                    total_xp_earned: gamificationData?.total_xp_earned || 0,
                    calls: calls || [],
                    criteria: criteria || [],
                    summary: summary
                  };
                  
                  const achievements = getAutomaticAchievements(agentData);
                  const unlockedAchievements = achievements.filter(a => a.is_unlocked);
                  
                  return (
                    <div className="space-y-4">
                      {/* Resumo */}
                      <div className="flex items-center justify-between p-3 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border border-green-200">
                        <div className="flex items-center">
                          <div className="w-8 h-8 bg-green-200 rounded-full flex items-center justify-center mr-3">
                            <span className="text-green-800 font-bold text-sm">{unlockedAchievements.length}</span>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-green-800">Conquistas Desbloqueadas</p>
                            <p className="text-xs text-green-600">{achievements.length} conquistas disponíveis</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-bold text-green-800">
                            {unlockedAchievements.reduce((sum, a) => sum + a.xp_reward, 0)} XP
                          </p>
                          <p className="text-xs text-green-600">Total ganho</p>
                        </div>
                      </div>

                      {/* Lista de Conquistas Desbloqueadas */}
                      {unlockedAchievements.length > 0 ? (
                        <div className="space-y-2 max-h-64 overflow-y-auto">
                          {unlockedAchievements.slice(0, 5).map((achievement) => (
                            <div key={achievement.id} className="flex items-center p-3 bg-green-50 rounded-lg border border-green-200">
                              <div className="text-2xl mr-3">{achievement.icon}</div>
                              <div className="flex-1">
                                <h4 className="font-medium text-green-800 text-sm">{achievement.name}</h4>
                                <p className="text-xs text-green-600">{achievement.description}</p>
                              </div>
                              <div className="text-right">
                                <span className="inline-block bg-green-200 text-green-800 text-xs px-2 py-1 rounded-full font-medium">
                                  +{achievement.xp_reward} XP
                                </span>
                              </div>
                            </div>
                          ))}
                          {unlockedAchievements.length > 5 && (
                            <div className="text-center py-2">
                              <span className="text-xs text-gray-500">
                                +{unlockedAchievements.length - 5} outras conquistas
                              </span>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="text-center py-6">
                          <Award className="mx-auto h-8 w-8 text-gray-400 mb-2" />
                          <p className="text-sm text-gray-600">Nenhuma conquista desbloqueada ainda</p>
                          <p className="text-xs text-gray-500 mt-1">Continue se esforçando para desbloquear conquistas!</p>
                        </div>
                      )}
                    </div>
                  );
                })()}
              </div>

              {/* Próximas Conquistas */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <div className="flex items-center mb-4">
                  <div className="p-2 bg-orange-100 rounded-lg mr-3">
                    <Target className="w-5 h-5 text-orange-600" />
                  </div>
                  <h2 className="text-lg font-bold text-gray-900">Próximas Conquistas</h2>
                </div>
                
                {(() => {
                  if (!gamificationData && !calls && !criteria) {
                    return <div className="text-center py-4 text-gray-500">Carregando...</div>;
                  }

                  const agentData = {
                    agent_id: agentId,
                    current_level: gamificationData?.current_level || 1,
                    current_xp: gamificationData?.current_xp || 0,
                    total_xp_earned: gamificationData?.total_xp_earned || 0,
                    calls: calls || [],
                    criteria: criteria || [],
                    summary: summary
                  };
                  
                  const achievements = getAutomaticAchievements(agentData);
                  const lockedAchievements = achievements.filter(a => !a.is_unlocked);
                  
                  return (
                    <div className="space-y-2">
                      {lockedAchievements.slice(0, 3).map((achievement) => (
                        <div key={achievement.id} className="flex items-center p-3 bg-gray-50 rounded-lg border border-gray-200 opacity-75">
                          <div className="text-2xl mr-3 grayscale">{achievement.icon}</div>
                          <div className="flex-1">
                            <h4 className="font-medium text-gray-600 text-sm">{achievement.name}</h4>
                            <p className="text-xs text-gray-500">{achievement.description}</p>
                          </div>
                          <div className="text-right">
                            <span className="inline-block bg-gray-200 text-gray-600 text-xs px-2 py-1 rounded-full font-medium">
                              {achievement.xp_reward} XP
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  );
                })()}
              </div>
            </div>

            {/* Coluna Direita - Desempenho */}
            <div className="space-y-6">
              {/* Resumo de Desempenho */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <div className="flex items-center mb-4">
                  <div className="p-2 bg-blue-100 rounded-lg mr-3">
                    <BarChart3 className="w-5 h-5 text-blue-600" />
                  </div>
                  <h2 className="text-lg font-bold text-gray-900">Desempenho Recente</h2>
                </div>
                
                {criteriaLoading ? (
                  <div className="animate-pulse space-y-3">
                    {[...Array(4)].map((_, i) => (
                      <div key={i} className="h-12 bg-gray-200 rounded"></div>
                    ))}
                  </div>
                ) : criteria && criteria.length > 0 ? (
                  <div className="space-y-3">
                    {deduplicateCriteria(criteria).slice(0, 4).map((criterion: any, index: number) => {
                      const standardized = standardizeCriteria(criterion);
                      
                      return (
                        <div key={standardized.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div className="flex-1">
                            <h4 className="font-medium text-gray-900 text-sm">
                              {formatItemName(standardized.name)}
                            </h4>
                            <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                              <div 
                                className={`h-2 rounded-full transition-all duration-1000 ${
                                  standardized.isNotApplicable
                                    ? 'bg-gray-400' 
                                    : standardized.value >= 70 
                                      ? 'bg-green-500' 
                                      : 'bg-red-500'
                                }`}
                                style={{ width: `${standardized.isNotApplicable ? 100 : standardized.value}%` }}
                              ></div>
                            </div>
                          </div>
                          <div className="ml-4 text-right">
                            <span className={`text-sm font-bold ${
                              standardized.isNotApplicable
                                ? 'text-gray-600' 
                                : standardized.value >= 70 
                                  ? 'text-green-600' 
                                  : 'text-red-600'
                            }`}>
                              {standardized.isNotApplicable ? 'N/A' : `${standardized.value.toFixed(0)}%`}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-6">
                    <BarChart3 className="mx-auto h-8 w-8 text-gray-400 mb-2" />
                    <p className="text-sm text-gray-600">Nenhum dado de desempenho disponível</p>
                  </div>
                )}
              </div>

              {/* Área de Atenção (apenas para admins) */}
              {!isAgent && worstItem && (
                <div className="bg-white rounded-xl shadow-sm border border-red-200 p-6">
                  <div className="flex items-center mb-4">
                    <div className="p-2 bg-red-100 rounded-lg mr-3">
                      <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                      </svg>
                    </div>
                    <h2 className="text-lg font-bold text-gray-900">Área de Atenção</h2>
                  </div>
                  
                  <div className="p-4 bg-red-50 rounded-lg border border-red-200">
                    <div className="flex items-center">
                      <div className="w-10 h-10 bg-red-200 rounded-full flex items-center justify-center mr-3">
                        <svg className="h-5 w-5 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <div>
                        <h3 className="font-semibold text-red-900">
                          {formatItemName(worstItem.categoria)}
                        </h3>
                        <p className="text-sm text-red-700">
                          Taxa de não conformidade: <span className="font-bold">{(worstItem.taxa_nao_conforme * 100).toFixed(1)}%</span>
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Seção de Gráficos (Opcional - apenas se houver dados) */}
          {criteria && criteria.length > 0 && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center">
                  <div className="p-2 bg-indigo-100 rounded-lg mr-3">
                    <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2zm0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  </div>
                  <h2 className="text-lg font-bold text-gray-900">Análise Detalhada</h2>
                </div>
                <div className="flex items-center bg-gray-100 rounded-full p-1">
                  <button 
                    onClick={() => setActiveChart('radar')} 
                    className={`px-3 py-1 text-sm font-medium rounded-full transition-all duration-200 flex items-center gap-1 ${
                      activeChart === 'radar' 
                        ? 'bg-white text-gray-900 shadow-sm' 
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2zm0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                    Radar
                  </button>
                  <button 
                    onClick={() => setActiveChart('bar')} 
                    className={`px-3 py-1 text-sm font-medium rounded-full transition-all duration-200 flex items-center gap-1 ${
                      activeChart === 'bar' 
                        ? 'bg-white text-gray-900 shadow-sm' 
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    <BarChart3 className="w-4 h-4" />
                    Barras
                  </button>
                </div>
              </div>
              
              <div className="h-64 bg-gray-50 rounded-lg p-4">
                {formatCriteriaForRadar(criteria).length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    {activeChart === 'radar' ? (
                      <RadarChart cx="50%" cy="50%" outerRadius="80%" data={formatCriteriaForRadar(criteria)}>
                        <PolarGrid stroke="#e5e7eb" />
                        <PolarAngleAxis dataKey="subject" tick={{ fill: '#6b7280', fontSize: 12 }} />
                        <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fill: '#6b7280', fontSize: 10 }} />
                        <Radar
                          name="Desempenho"
                          dataKey="value"
                          stroke="#4f46e5"
                          fill="#4f46e5"
                          fillOpacity={0.6}
                        />
                        <Tooltip 
                          formatter={(value, name, props) => {
                            const data = props.payload;
                            return [
                              `${value}%`, 
                              data.subject
                            ];
                          }} 
                        />
                      </RadarChart>
                    ) : (
                      <BarChart data={formatCriteriaForRadar(criteria)}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
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
                      <svg className="mx-auto h-8 w-8 text-gray-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2zm0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                      </svg>
                      <p className="text-gray-600 text-sm">Nenhuma categoria disponível</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Conteúdo da Aba Histórico de Ligações */}
      {activeTab === 'calls' && (
        <div className="px-4 sm:px-6 lg:px-8 py-6 space-y-6">
          {/* Header */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-xl font-bold text-gray-900">Histórico de Ligações</h2>
                <p className="text-gray-600">Visualize todas as suas ligações e avaliações</p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-blue-600">
                  {calls?.length || 0}
                </p>
                <p className="text-sm text-gray-600">Ligações realizadas</p>
              </div>
            </div>
          </div>

          {/* Lista de Ligações */}
          {callsLoading ? (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <div className="animate-pulse space-y-4">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="h-16 bg-gray-200 rounded-xl"></div>
                ))}
              </div>
            </div>
          ) : calls && calls.length > 0 ? (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-white">
                <div className="flex items-center">
                  <div className="p-2 bg-gray-100 rounded-xl mr-3">
                    <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-gray-900">Suas Ligações</h2>
                    <p className="text-sm text-gray-600 mt-1">
                      Detalhes das ligações realizadas no período
                    </p>
                  </div>
                </div>
              </div>
              
              <CallList calls={calls} user={user} />
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 text-center">
              <div className="text-gray-400 mb-4">
                <svg className="mx-auto h-12 w-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhuma ligação encontrada</h3>
              <p className="text-gray-600">
                Você ainda não realizou ligações no período selecionado.
              </p>
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
                    0
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

      {/* Modal para exibir todos os níveis */}
      {showLevelsModal && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          onClick={() => setShowLevelsModal(false)}
        >
          <div 
            className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full mx-4 p-6 max-h-[80vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold text-gray-900 flex items-center">
                <Crown className="h-6 w-6 mr-3 text-yellow-500" />
                Sistema de Níveis
              </h3>
              <button
                onClick={() => setShowLevelsModal(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <XCircle className="h-6 w-6" />
              </button>
            </div>
            
            <div className="space-y-4">
              {[
                { id: 1, name: 'Bronze', xpRequired: 0, color: '#8B4513', bgColor: '#F5DEB3', borderColor: '#D2691E', icon: '🥉' },
                { id: 2, name: 'Prata', xpRequired: 1000, color: '#4A5568', bgColor: '#E2E8F0', borderColor: '#718096', icon: '🥈' },
                { id: 3, name: 'Ouro', xpRequired: 5000, color: '#B7791F', bgColor: '#FEF5E7', borderColor: '#D69E2E', icon: '🥇' },
                { id: 4, name: 'Platina', xpRequired: 10000, color: '#2C5282', bgColor: '#EBF8FF', borderColor: '#3182CE', icon: '💎' },
                { id: 5, name: 'Diamante', xpRequired: 20000, color: '#553C9A', bgColor: '#FAF5FF', borderColor: '#805AD5', icon: '💠' },
                { id: 6, name: 'Nível Secreto', xpRequired: 50000, color: '#C53030', bgColor: '#FED7D7', borderColor: '#E53E3E', icon: '👑' }
              ].map((level) => {
                const isCurrentLevel = level.id === (gamificationData?.current_level || 1);
                const isUnlocked = (gamificationData?.current_xp || 0) >= level.xpRequired;
                
                // Calcular próximo nível
                const nextLevel = level.id < 6 ? [
                  { id: 1, name: 'Bronze', xpRequired: 0, icon: '🥉' },
                  { id: 2, name: 'Prata', xpRequired: 1000, icon: '🥈' },
                  { id: 3, name: 'Ouro', xpRequired: 5000, icon: '🥇' },
                  { id: 4, name: 'Platina', xpRequired: 10000, icon: '💎' },
                  { id: 5, name: 'Diamante', xpRequired: 20000, icon: '💠' },
                  { id: 6, name: 'Nível Secreto', xpRequired: 50000, icon: '' }
                ].find(l => l.id === level.id + 1) : null;
              
                const progressToNext = nextLevel ? (() => {
                  let xpRequired = 0;
                  let xpCurrent = 0;
                  
                  switch (nextLevel.id) {
                    case 2: // Prata
                      xpRequired = 1000;
                      xpCurrent = gamificationData?.current_xp || 0;
                      break;
                    case 3: // Ouro
                      xpRequired = 4000;
                      xpCurrent = (gamificationData?.current_xp || 0) - 1000;
                      break;
                    case 4: // Platina
                      xpRequired = 5000;
                      xpCurrent = (gamificationData?.current_xp || 0) - 5000;
                      break;
                    case 5: // Diamante
                      xpRequired = 10000;
                      xpCurrent = (gamificationData?.current_xp || 0) - 10000;
                      break;
                    case 6: // Nível Secreto
                      xpRequired = 30000;
                      xpCurrent = (gamificationData?.current_xp || 0) - 20000;
                      break;
                    default:
                      return 100;
                  }
                  
                  const percentage = Math.min(100, (xpCurrent / xpRequired) * 100);
                  return Math.max(0, percentage);
                })() : 100;
                
                return (
                  <div
                    key={level.id}
                    className={`relative p-4 rounded-xl border-2 transition-all duration-200 ${
                      isCurrentLevel
                        ? 'border-yellow-400 bg-gradient-to-r from-yellow-50 to-orange-50 shadow-lg'
                        : isUnlocked
                        ? 'border-gray-200 bg-white hover:shadow-md'
                        : 'border-gray-100 bg-gray-50 opacity-60'
                    }`}
                  >
                    {/* Badge de nível atual */}
                    {isCurrentLevel && (
                      <div className="absolute -top-2 -right-2 bg-yellow-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                        ATUAL
                      </div>
                    )}
                    
                    <div className="flex items-center space-x-4">
                      {/* Ícone do nível */}
                      <div className="text-3xl">{level.icon}</div>
                      
                      {/* Informações do nível */}
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <h4 className="text-lg font-bold text-gray-900">{level.name}</h4>
                          {isUnlocked && (
                            <CheckCircle className="h-5 w-5 text-green-500" />
                          )}
                        </div>
                        
                        <div className="text-sm text-gray-600 mb-3">
                          {level.xpRequired === 0 
                            ? 'Nível inicial' 
                            : `${level.xpRequired.toLocaleString()} XP necessário`
                          }
                        </div>
                        
                        {/* Barra de progresso para o próximo nível */}
                        {isCurrentLevel && nextLevel && (
                          <div className="space-y-2">
                            <div className="flex justify-between text-xs text-gray-600">
                              <span>Progresso para {nextLevel.name}</span>
                              <span>{progressToNext.toFixed(1)}%</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div 
                                className="bg-gradient-to-r from-yellow-400 to-orange-500 h-2 rounded-full transition-all duration-300"
                                style={{ width: `${progressToNext}%` }}
                              ></div>
                            </div>
                            <div className="flex justify-between text-xs text-gray-500">
                              <span>{(gamificationData?.current_xp || 0).toLocaleString()} XP</span>
                              <span>{nextLevel.xpRequired.toLocaleString()} XP</span>
                            </div>
                          </div>
                        )}
                        
                        {/* Status para níveis desbloqueados mas não atuais */}
                        {isUnlocked && !isCurrentLevel && (
                          <div className="text-xs text-green-600 font-medium">
                            ✓ Desbloqueado
                          </div>
                        )}
                        
                        {/* Status para níveis bloqueados */}
                        {!isUnlocked && (
                          <div className="text-xs text-gray-500">
                             Bloqueado - {level.xpRequired.toLocaleString()} XP necessário
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            
            {/* Informações adicionais */}
            <div className="mt-6 p-4 bg-blue-50 rounded-xl border border-blue-200">
              <div className="flex items-start">
                <Info className="h-5 w-5 text-blue-600 mt-0.5 mr-3 flex-shrink-0" />
                <div className="text-sm text-blue-800">
                  <p className="font-semibold mb-2">Como ganhar XP:</p>
                  <ul className="list-disc list-inside space-y-1">
                    <li>Ligações aprovadas: +10 XP</li>
                    <li>Ligações com alta pontuação (90%+): +20 XP</li>
                    <li>Conquistas desbloqueadas: +25-150 XP</li>
                    <li>Sequência de boas performances: +5 XP bônus</li>
                  </ul>
                </div>
              </div>
            </div>
            
            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setShowLevelsModal(false)}
                className="px-6 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-medium"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default AgentDetail;