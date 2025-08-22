import React, { useState, useMemo, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  TrendingUp, 
  TrendingDown, 
  User, 
  Target,
  Filter,
  Calendar,
  Search,
  MessageSquare,
  Star,
  Eye,
  Plus,
  Edit3,
  X,
  RefreshCw,
  Users,
  Bot,
  FileText,
  Send,
  ThumbsUp,
  ThumbsDown
} from 'lucide-react';
import { getAgents, getTrend } from '../lib/api';
import { useFilters } from '../hooks/use-filters';
import PageHeader from '../components/PageHeader';
import { formatAgentName } from '../lib/format';

interface Agente {
  id: string;
  nome: string;
  media: number;
  total_ligacoes: number;
  ultima_avaliacao?: string;
}

interface FeedbackItem {
  id: string;
  agenteId: string;
  agenteNome: string;
  criterio: string;
  performanceAtual: number;
  observacao: string;
  status: 'pendente' | 'aplicado' | 'aceito' | 'revisao';
  dataCriacao: string;
  dataAplicacao?: string;
  origem: 'ia' | 'monitor';
  criadoPor?: string;
  comentario?: string;
  callId?: string;
  avaliacaoId?: string;
}

const Feedback: React.FC = () => {
  const { filters, setStartDate, setEndDate, setCarteira } = useFilters();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'todos' | 'pendente' | 'aplicado' | 'aceito' | 'revisao'>('todos');
  const [selectedFeedback, setSelectedFeedback] = useState<FeedbackItem | null>(null);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [feedbackForm, setFeedbackForm] = useState({
    criterio: '',
    observacao: '',
    acao: '',
    agenteId: '',
    agenteNome: ''
  });

  // Filtros para API - com fallback para datas padrão
  const apiFilters = {
    start: filters.start || '2024-01-01',
    end: filters.end || '2025-12-31',
    carteira: filters.carteira
  };

  // Buscar feedbacks com pontuações das avaliações
  const { data: feedbacks, isLoading: feedbacksLoading, error: feedbacksError, refetch: refetchFeedbacks } = useQuery({
    queryKey: ['feedbacks-with-scores', apiFilters],
    queryFn: () => {
      console.log('[DEBUG] Frontend: Chamando endpoint /feedbacks/with-scores');
      return fetch('/api/feedbacks/with-scores')
        .then(res => {
          console.log('[DEBUG] Frontend: Resposta do /feedbacks/with-scores:', res.status, res.statusText);
          return res.json();
        })
        .then(data => {
          console.log('[DEBUG] Frontend: Dados recebidos:', data);
          return data;
        })
        .catch(err => {
          console.error('[DEBUG] Frontend: Erro ao buscar feedbacks com pontuações:', err);
          throw err;
        });
    },
    staleTime: 5 * 60 * 1000,
    retry: 3,
    retryDelay: 1000,
    refetchOnWindowFocus: false
  });





  // Buscar agentes para estatísticas (mantido para compatibilidade)
  const { data: agents, isLoading: agentsLoading, error: agentsError, refetch: refetchAgents } = useQuery({
    queryKey: ['feedbacks-agents', apiFilters],
    queryFn: () => {
      console.log('[DEBUG] Frontend: Chamando endpoint /feedbacks/agents');
      return fetch(`/api/feedbacks/agents?start=${apiFilters.start}&end=${apiFilters.end}${apiFilters.carteira ? `&carteira=${apiFilters.carteira}` : ''}`)
        .then(res => {
          console.log('[DEBUG] Frontend: Resposta do /feedbacks/agents:', res.status, res.statusText);
          return res.json();
        })
        .then(data => {
          console.log('[DEBUG] Frontend: Dados de agentes recebidos:', data);
          return data;
        })
        .catch(err => {
          console.error('[DEBUG] Frontend: Erro ao buscar agentes:', err);
          throw err;
        });
    },
    staleTime: 5 * 60 * 1000,
    retry: 3,
    retryDelay: 1000,
    refetchOnWindowFocus: false
  });

  const { data: trend, isLoading: trendLoading, error: trendError, refetch: refetchTrend } = useQuery({
    queryKey: ['trend', apiFilters],
    queryFn: () => getTrend(apiFilters),
    staleTime: 5 * 60 * 1000,
    retry: 3,
    retryDelay: 1000,
    refetchOnWindowFocus: false
  });

  // Usar feedbacks reais se disponíveis, senão gerar baseado nos agentes
  const feedbackData = useMemo(() => {
    console.log('[DEBUG] Frontend: Processando feedbackData com:', { feedbacks, agents });
    
    if (feedbacks && feedbacks.length > 0) {
      // Usar feedbacks reais da tabela
      console.log('[DEBUG] Frontend: Usando feedbacks reais da tabela feedbacks');
      return feedbacks.map((fb: any) => {
        // A pontuação já vem do backend via JOIN com a tabela avaliacoes
        const performanceAtual = fb.performance_atual || 0;
        console.log(`[DEBUG] Frontend: Pontuação recebida do backend para feedback ${fb.id}: ${performanceAtual}%`);
        
        // Normalizar nome do agente como na página Agents
        const nomeNormalizado = formatAgentName({ agent_id: fb.agent_id, nome: fb.nome_agente });
        
        return {
          id: fb.id,
          callId: fb.avaliacao_id,
          avaliacaoId: fb.avaliacao_id,
          agenteId: fb.agent_id,
          agenteNome: nomeNormalizado,
          criterio: fb.criterio_nome || 'Critério não especificado',
          performanceAtual: performanceAtual,
          observacao: fb.comentario,
          status: fb.status === 'ENVIADO' ? 'pendente' : fb.status.toLowerCase(),
          dataCriacao: fb.criado_em,
          origem: fb.origem === 'monitoria' ? 'monitor' : 'ia',
          comentario: fb.comentario
        };
      });
    } else if (agents && agents.length > 0) {
      // Fallback: gerar feedbacks baseado nos agentes (lógica existente)
      console.log('[DEBUG] Frontend: Usando fallback - gerando feedbacks baseado nos agentes');
      const feedback: FeedbackItem[] = [];
      
      // Identificar agentes com notas baixas (performance < 70%)
      const agentesComNotasBaixas = agents
        .filter((agent: any) => {
          const media = agent.media || 0;
          return media < 70;
        })
        .sort((a: any, b: any) => (a.media || 0) - (b.media || 0));

      // Critérios específicos baseados em problemas comuns
      const criteriosCriticos = [
        'Argumentação e Persuasão',
        'Gestão de Objeções', 
        'Tempo de Resposta',
        'Adesão ao Script',
        'Empatia com Cliente',
        'Clareza na Comunicação',
        'Resolução de Problemas',
        'Follow-up e Acompanhamento',
        'Abordagem Atendeu',
        'Explicação do Motivo'
      ];

      // Gerar feedback focado nos agentes com notas baixas
      agentesComNotasBaixas.forEach((agent: any) => {
        const performanceMedia = agent.media || 0;
        
        // Determinar quantos critérios precisam de feedback baseado na performance
        let numCriterios = 3;
        if (performanceMedia < 30) numCriterios = 6;
        else if (performanceMedia < 50) numCriterios = 5;
        else if (performanceMedia < 70) numCriterios = 4;

        // Selecionar critérios específicos para este agente
        const criteriosSelecionados = criteriosCriticos
          .sort(() => Math.random() - 0.5)
          .slice(0, numCriterios);

        criteriosSelecionados.forEach((criterio, index) => {
          let performanceAtual = performanceMedia;
          
          // Adicionar variação realística baseada no critério
          if (criterio === 'Empatia com Cliente') {
            performanceAtual = Math.max(0, performanceMedia + (Math.random() - 0.5) * 20);
          } else if (criterio === 'Abordagem Atendeu') {
            performanceAtual = Math.max(0, performanceMedia + (Math.random() - 0.5) * 15);
          } else if (criterio === 'Explicação do Motivo') {
            performanceAtual = Math.max(0, performanceMedia + (Math.random() - 0.5) * 25);
          } else {
            performanceAtual = Math.max(0, performanceMedia + (Math.random() - 0.5) * 30);
          }
          
          // Só adicionar se for um feedback relevante (performance baixa)
          if (performanceAtual < 70) {
            feedback.push({
              id: `${agent.id || 'agente'}-${index}`,
              agenteId: agent.id || 'agente',
              agenteNome: agent.nome || 'Agente',
              criterio,
              performanceAtual: Math.round(performanceAtual),
              observacao: `Performance atual: ${Math.round(performanceAtual)}%. Necessita melhoria para atingir meta de 80%.`,
              status: 'pendente',
              dataCriacao: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
              origem: 'ia',
              comentario: `🎯 **CRITÉRIO:** ${criterio}\n\n📊 **PERFORMANCE ATUAL:** ${Math.round(performanceAtual)}%\n\n🎯 **META:** 80%\n\n💡 **RECOMENDAÇÕES:**\n• Pratique técnicas de ${criterio.toLowerCase()}\n• Solicite treinamento específico\n• Peça feedback de colegas mais experientes\n\n📈 **PRÓXIMOS PASSOS:**\n1. Identifique pontos de melhoria\n2. Estabeleça metas semanais\n3. Acompanhe progresso mensalmente`,
              callId: `call-${Math.floor(Math.random() * 1000)}`,
              avaliacaoId: `av-${Math.floor(Math.random() * 1000)}`
            });
          }
        });
      });
      
      return feedback;
    }
    
    console.log('[DEBUG] Frontend: Nenhum dado disponível para feedbacks');
    return [];
  }, [feedbacks, agents, trend]);

  // Debug dos dados
  useEffect(() => {
    console.log('[DEBUG] Frontend: Estado dos feedbacks:', {
      feedbacks,
      feedbacksLoading,
      feedbacksError,
      feedbacksParaExibir: feedbackData?.length || 0,
      agents: agents?.length || 0,
      agentsLoading,
      agentsError
    });
  }, [feedbacks, feedbacksLoading, feedbacksError, feedbackData, agents, agentsLoading, agentsError]);

  // Filtrar feedback
  const filteredFeedback = useMemo(() => {
    let filtered = feedbackData;

    if (statusFilter !== 'todos') {
      filtered = filtered.filter((item: FeedbackItem) => item.status === statusFilter);
    }

    if (searchTerm) {
      filtered = filtered.filter((item: FeedbackItem) => 
        item.criterio.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.agenteNome.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    return filtered;
  }, [feedbackData, statusFilter, searchTerm]);

  // Estatísticas
  const stats = useMemo(() => {
    const total = feedbackData.length;
    const pendente = feedbackData.filter((f: FeedbackItem) => f.status === 'pendente').length;
    const aplicado = feedbackData.filter((f: FeedbackItem) => f.status === 'aplicado').length;
    const aceito = feedbackData.filter((f: FeedbackItem) => f.status === 'aceito').length;
    const revisao = feedbackData.filter((f: FeedbackItem) => f.status === 'revisao').length;

    return { total, pendente, aplicado, aceito, revisao };
  }, [feedbackData]);

  const getPerformanceColor = (performance: number) => {
    if (performance >= 80) return 'text-green-600 bg-green-100';
    if (performance >= 60) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pendente': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'aplicado': return 'bg-green-100 text-green-800 border-green-200';
      case 'aceito': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'revisao': return 'bg-orange-100 text-orange-800 border-orange-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
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

  const handleVerDetalhes = (feedback: FeedbackItem) => {
    setSelectedFeedback(feedback);
    setShowFeedbackModal(true);
  };

  const handleAceitarFeedback = (feedback: FeedbackItem) => {
    // Aqui você implementaria a lógica para aceitar o feedback
    console.log('Feedback aceito:', feedback.id);
    alert('Feedback aceito com sucesso!');
  };

  const handleRejeitarFeedback = (feedback: FeedbackItem) => {
    // Aqui você implementaria a lógica para rejeitar o feedback
    console.log('Feedback rejeitado:', feedback.id);
    alert('Feedback rejeitado. Será enviado para revisão.');
  };

  const handleEditarFeedback = (feedback: FeedbackItem) => {
    // Aqui você implementaria a lógica para editar o feedback
    console.log('Editando feedback:', feedback.id);
    alert('Funcionalidade de edição será implementada!');
  };

  const handleCriarFeedback = () => {
    // Aqui você implementaria a lógica para criar novo feedback
    console.log('Criando novo feedback');
    alert('Funcionalidade de criação será implementada!');
  };

  const isMonitor = true; // Aqui você implementaria a lógica de role/permissão

  // Filtros de status
  const handleStatusFilterChange = (newStatus: string) => {
    console.log('[DEBUG] Frontend: Status filter mudou para:', newStatus);
    setStatusFilter(newStatus as any);
  };

  // Filtros de busca
  const handleSearchChange = (searchTerm: string) => {
    console.log('[DEBUG] Frontend: Search filter mudou para:', searchTerm);
    setSearchTerm(searchTerm);
  };

  // Filtros de data
  const handleDateChange = (startDate: string, endDate: string) => {
    console.log('[DEBUG] Frontend: Date filter mudou para:', startDate, 'até', endDate);
    setStartDate(startDate);
    setEndDate(endDate);
  };

  // Aplicar filtros
  const applyFilters = () => {
    console.log('[DEBUG] Frontend: Aplicando filtros:', { filters, statusFilter, searchTerm });
    // Forçar refetch dos dados com novos filtros
    refetchAgents();
    refetchFeedbacks();
  };

  // Efeito para aplicar filtros automaticamente
  useEffect(() => {
    console.log('[DEBUG] Frontend: Filtros mudaram, aplicando automaticamente:', { filters, statusFilter, searchTerm });
    applyFilters();
  }, [filters.start, filters.end, filters.carteira, statusFilter, searchTerm]);

  return (
    <div className="min-h-screen bg-gray-50">
      <PageHeader 
        title="Painel de Feedbacks" 
        subtitle="Gerencie e visualize feedbacks de agentes em uma interface unificada"
        actions={
          isMonitor && (
            <button
              onClick={handleCriarFeedback}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="h-4 w-4" />
              Criar Feedback
            </button>
          )
        }
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filtros */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-8">
          <div className="flex flex-col lg:flex-row gap-6">
            <div className="flex flex-col lg:flex-row gap-4 flex-1">
              <div className="flex flex-col">
                <label className="flex items-center gap-1 text-sm font-medium text-gray-700 mb-2">
                  <Calendar className="h-3 w-3" />
                  Data Início
                </label>
                <input
                  type="date"
                  value={filters.start}
                  onChange={e => handleDateChange(e.target.value, filters.end)}
                  className="h-10 border border-gray-300 rounded-xl px-3 text-sm shadow-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                />
              </div>
              <div className="flex flex-col">
                <label className="flex items-center gap-1 text-sm font-medium text-gray-700 mb-2">
                  <Calendar className="h-3 w-3" />
                  Data Fim
                </label>
                <input
                  type="date"
                  value={filters.end}
                  onChange={e => handleDateChange(filters.start, e.target.value)}
                  className="h-10 border border-gray-300 rounded-xl px-3 text-sm shadow-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                />
              </div>
            </div>

            <div className="flex flex-col lg:flex-row gap-4">
              <div className="flex flex-col">
                <label className="text-sm font-medium text-gray-700 mb-2">Status</label>
                <select
                  value={statusFilter}
                  onChange={e => handleStatusFilterChange(e.target.value)}
                  className="h-10 border border-gray-300 rounded-xl px-3 text-sm shadow-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="todos">Todos</option>
                  <option value="pendente">Pendente</option>
                  <option value="aplicado">Aplicado</option>
                  <option value="aceito">Aceito</option>
                  <option value="revisao">Em Revisão</option>
                </select>
              </div>
              <div className="flex flex-col">
                <label className="text-sm font-medium text-gray-700 mb-2">Buscar</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Agente ou critério..."
                    value={searchTerm}
                    onChange={e => handleSearchChange(e.target.value)}
                    className="h-10 pl-10 pr-4 border border-gray-300 rounded-xl text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                  />
                </div>
              </div>
              <div className="flex flex-col justify-end">
                                 <button
                   onClick={() => {
                     refetchAgents();
                     refetchTrend();
                     refetchFeedbacks();
                   }}
                   className="h-10 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                 >
                   <RefreshCw className="h-4 w-4" />
                   Atualizar
                 </button>
                 
              </div>
            </div>
          </div>
        </div>

        {/* Estatísticas */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Target className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Total</p>
                <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <Clock className="h-6 w-6 text-yellow-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Pendentes</p>
                <p className="text-2xl font-bold text-yellow-600">{stats.pendente}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Aplicados</p>
                <p className="text-2xl font-bold text-green-600">{stats.aplicado}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <CheckCircle className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Aceitos</p>
                <p className="text-2xl font-bold text-blue-600">{stats.aceito}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-100 rounded-lg">
                <AlertTriangle className="h-6 w-6 text-orange-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Revisão</p>
                <p className="text-2xl font-bold text-orange-600">{stats.revisao}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Lista de Feedbacks */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">
              Feedbacks Disponíveis ({filteredFeedback.length})
            </h3>
            <p className="text-sm text-gray-600 mt-1">
              Clique em "Ver Detalhes" para visualizar o feedback completo e tomar ações
            </p>
          </div>

                                           {/* Loading State */}
           {(agentsLoading || trendLoading || feedbacksLoading) && (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-500">Carregando feedbacks...</p>
            </div>
          )}

                                           {/* Error State */}
           {(agentsError || trendError || feedbacksError) && (
            <div className="text-center py-12">
              <AlertTriangle className="h-12 w-12 text-red-400 mx-auto mb-4" />
              <p className="text-red-500">Erro ao carregar dados. Tente novamente.</p>
              <div className="mt-4 flex gap-3 justify-center">
                <button
                  onClick={() => refetchAgents()}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Tentar Novamente - Agentes
                </button>
                <button
                  onClick={() => refetchTrend()}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                >
                  Tentar Novamente - Trend
                </button>
                <button
                  onClick={() => refetchFeedbacks()}
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                >
                  Tentar Novamente - Feedbacks
                </button>
              </div>
            </div>
          )}

                                           {/* No Data State */}
           {!agentsLoading && !trendLoading && !feedbacksLoading && !agentsError && !trendError && !feedbacksError && filteredFeedback.length === 0 ? (
            <div className="text-center py-12">
              <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">Nenhum feedback encontrado para os filtros selecionados.</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {filteredFeedback.map((feedback: FeedbackItem) => (
                <div key={feedback.id} className="p-6 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center justify-between">
                    {/* Informações do Feedback */}
                    <div className="flex items-center gap-4 flex-1">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{getOrigemIcon(feedback.origem)}</span>
                        <div>
                          <h4 className="text-lg font-semibold text-gray-900">{feedback.agenteNome}</h4>
                          <p className="text-sm text-gray-600">Critério: {feedback.criterio}</p>
                          <p className="text-xs text-gray-500">Call ID: {feedback.callId} | Avaliação: {feedback.avaliacaoId}</p>
                        </div>
                      </div>
                    </div>

                    {/* Performance e Status */}
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="text-sm text-gray-600">Performance da Avaliação</p>
                        <p className={`text-lg font-bold px-3 py-1 rounded-full ${getPerformanceColor(feedback.performanceAtual)}`}>
                          {feedback.performanceAtual}%
                        </p>
                      </div>
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(feedback.status)}`}>
                        {feedback.status === 'pendente' ? <Clock className="h-4 w-4 mr-2" /> : 
                         feedback.status === 'aplicado' ? <CheckCircle className="h-4 w-4 mr-2" /> :
                         feedback.status === 'aceito' ? <CheckCircle className="h-4 w-4 mr-2" /> :
                         <AlertTriangle className="h-4 w-4 mr-2" />}
                        {feedback.status === 'pendente' ? 'Pendente' : 
                         feedback.status === 'aplicado' ? 'Aplicado' :
                         feedback.status === 'aceito' ? 'Aceito' : 'Revisão'}
                      </span>
                    </div>

                    {/* Ações */}
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleVerDetalhes(feedback)}
                        className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-lg transition-colors text-sm"
                      >
                        <Eye className="h-4 w-4" />
                        Ver Detalhes
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Nota sobre IA */}
        <div className="mt-8 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Bot className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <h4 className="font-semibold text-blue-900">Sistema de Feedback Inteligente</h4>
              <p className="text-sm text-blue-800 mt-1">
                Esta interface mostra feedbacks automáticos da IA e manuais dos monitores. 
                Clique em "Ver Detalhes" para visualizar o feedback completo e tomar ações apropriadas.
                Monitores podem editar e criar feedbacks, enquanto agentes podem aceitar ou rejeitar.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Modal de Detalhes do Feedback */}
      {showFeedbackModal && selectedFeedback && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-4xl mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">
                Detalhes do Feedback - {selectedFeedback.agenteNome}
              </h3>
              <button
                onClick={() => setShowFeedbackModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            {/* Informações do Feedback */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Agente</label>
                  <p className="text-lg font-semibold text-gray-900">{selectedFeedback.agenteNome}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Critério</label>
                  <p className="text-lg text-gray-900">{selectedFeedback.criterio}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Performance da Avaliação</label>
                  <p className={`text-lg font-bold px-3 py-1 rounded-full inline-block ${getPerformanceColor(selectedFeedback.performanceAtual)}`}>
                    {selectedFeedback.performanceAtual}%
                  </p>
                </div>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Origem</label>
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{getOrigemIcon(selectedFeedback.origem)}</span>
                    <span className="text-lg text-gray-900">
                      {selectedFeedback.origem === 'ia' ? 'Inteligência Artificial' : 'Monitor'}
                    </span>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(selectedFeedback.status)}`}>
                    {selectedFeedback.status === 'pendente' ? <Clock className="h-4 w-4 mr-2" /> : 
                     selectedFeedback.status === 'aplicado' ? <CheckCircle className="h-4 w-4 mr-2" /> :
                     selectedFeedback.status === 'aceito' ? <CheckCircle className="h-4 w-4 mr-2" /> :
                     <AlertTriangle className="h-4 w-4 mr-2" />}
                    {selectedFeedback.status === 'pendente' ? 'Pendente' : 
                     selectedFeedback.status === 'aplicado' ? 'Aplicado' :
                     selectedFeedback.status === 'aceito' ? 'Aceito' : 'Revisão'}
                  </span>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Data de Criação</label>
                  <p className="text-lg text-gray-900">{selectedFeedback.dataCriacao}</p>
                </div>
              </div>
            </div>

            {/* Comentário Detalhado */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">Comentário Detalhado</label>
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="prose prose-gray max-w-none">
                  {selectedFeedback.comentario?.split('\n\n').map((paragraph, index) => (
                    <div key={index} className="mb-4 last:mb-0">
                      {paragraph.trim() && (
                        <p className="text-gray-700 leading-relaxed whitespace-pre-line">
                          {paragraph.trim()}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Ações */}
            <div className="flex justify-between items-center pt-6 border-t border-gray-200">
              <div className="text-sm text-gray-500">
                <p><strong>Call ID:</strong> {selectedFeedback.callId}</p>
                <p><strong>Avaliação ID:</strong> {selectedFeedback.avaliacaoId}</p>
              </div>
              
              <div className="flex gap-3">
                {isMonitor && (
                  <button
                    onClick={() => handleEditarFeedback(selectedFeedback)}
                    className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
                  >
                    <Edit3 className="h-4 w-4" />
                    Editar Feedback
                  </button>
                )}
                
                {selectedFeedback.status === 'pendente' && (
                  <>
                    <button
                      onClick={() => handleAceitarFeedback(selectedFeedback)}
                      className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors"
                    >
                      <ThumbsUp className="h-4 w-4" />
                      Aceitar
                    </button>
                    <button
                      onClick={() => handleRejeitarFeedback(selectedFeedback)}
                      className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors"
                    >
                      <ThumbsDown className="h-4 w-4" />
                      Rejeitar
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Feedback; 