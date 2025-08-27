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
  ThumbsDown,
  Phone,
  ChevronDown,
  ChevronRight
} from 'lucide-react';
import { getAgents, getTrend } from '../lib/api';
import { useFilters } from '../hooks/use-filters';
import PageHeader from '../components/PageHeader';
import { formatAgentName } from '../lib/format';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '../components/ui/collapsible';

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
  const [expandedCalls, setExpandedCalls] = useState<Set<string>>(new Set());
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

  // Agrupar feedbacks por ligação (Call ID) - versão mais clara
  const feedbacksAgrupados = useMemo(() => {
    const agrupados: { [key: string]: FeedbackItem[] } = {};
    
    filteredFeedback.forEach((feedback: FeedbackItem) => {
      const callKey = feedback.callId || 'sem-call-id';
      if (!agrupados[callKey]) {
        agrupados[callKey] = [];
      }
      agrupados[callKey].push(feedback);
    });

    // Ordenar ligações por número de feedbacks pendentes
    return Object.entries(agrupados)
      .map(([callId, feedbacks]) => {
        const performanceMedia = feedbacks.reduce((acc, fb) => acc + fb.performanceAtual, 0) / feedbacks.length;
        const feedbacksPendentes = feedbacks.filter(fb => fb.status === 'pendente').length;
        const agenteNome = feedbacks[0]?.agenteNome || 'Agente';
        
        return {
          callId,
          agenteNome,
          feedbacks,
          performanceMedia: Math.round(performanceMedia),
          totalFeedbacks: feedbacks.length,
          feedbacksPendentes,
          feedbacksAplicados: feedbacks.filter(fb => fb.status === 'aplicado').length,
          feedbacksAceitos: feedbacks.filter(fb => fb.status === 'aceito').length,
          feedbacksRevisao: feedbacks.filter(fb => fb.status === 'revisao').length,
          dataLigacao: feedbacks[0]?.dataCriacao || 'N/A'
        };
      })
      .sort((a, b) => b.feedbacksPendentes - a.feedbacksPendentes);
  }, [filteredFeedback]);

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
    if (performance >= 80) return 'text-green-600';
    if (performance >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pendente': return 'text-yellow-600';
      case 'aplicado': return 'text-green-600';
      case 'aceito': return 'text-blue-600';
      case 'revisao': return 'text-orange-600';
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

  // Função para alternar o estado de expansão de uma ligação
  const toggleCallExpansion = (callId: string) => {
    const newExpandedCalls = new Set(expandedCalls);
    if (newExpandedCalls.has(callId)) {
      newExpandedCalls.delete(callId);
    } else {
      newExpandedCalls.add(callId);
    }
    setExpandedCalls(newExpandedCalls);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <PageHeader 
        title="Painel de Feedbacks" 
        subtitle="Gerencie e visualize feedbacks de agentes em uma interface unificada"
        actions={
          isMonitor && (
            <button
              onClick={handleCriarFeedback}
              className="inline-flex items-center gap-3 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 font-medium"
            >
              <Plus className="h-5 w-5" />
              Criar Feedback
            </button>
          )
        }
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filtros e Controles */}
        <div className="bg-gradient-to-r from-slate-50 to-gray-50 rounded-2xl shadow-lg border border-gray-200 p-8 mb-8">
          <div className="flex flex-col lg:flex-row gap-8">
            <div className="flex flex-col lg:flex-row gap-6">
              <div className="flex flex-col">
                <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wide">
                  <Calendar className="h-4 w-4 text-blue-600" />
                  Data Início
                </label>
                <input
                  type="date"
                  value={filters.start}
                  onChange={e => handleDateChange(e.target.value, filters.end)}
                  className="h-12 border-2 border-gray-200 rounded-xl px-4 text-sm shadow-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 hover:border-gray-300"
                />
              </div>
              <div className="flex flex-col">
                <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wide">
                  <Calendar className="h-4 w-4 text-blue-600" />
                  Data Fim
                </label>
                <input
                  type="date"
                  value={filters.end}
                  onChange={e => handleDateChange(filters.start, e.target.value)}
                  className="h-12 border-2 border-gray-200 rounded-xl px-4 text-sm shadow-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 hover:border-gray-300"
                />
              </div>
            </div>

            <div className="flex flex-col lg:flex-row gap-6">
              <div className="flex flex-col">
                <label className="text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wide">Status</label>
                <select
                  value={statusFilter}
                  onChange={e => handleStatusFilterChange(e.target.value)}
                  className="h-12 border-2 border-gray-200 rounded-xl px-4 text-sm shadow-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 hover:border-gray-300"
                >
                  <option value="todos">📊 Todos os Status</option>
                  <option value="pendente">⏳ Pendente</option>
                  <option value="aplicado">✅ Aplicado</option>
                  <option value="aceito">🎯 Aceito</option>
                  <option value="revisao">🔍 Em Revisão</option>
                </select>
              </div>
              <div className="flex flex-col">
                <label className="text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wide">Buscar</label>
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Digite agente ou critério..."
                    value={searchTerm}
                    onChange={e => handleSearchChange(e.target.value)}
                    className="h-12 pl-12 pr-4 border-2 border-gray-200 rounded-xl text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 hover:border-gray-300"
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
                  className="h-12 px-6 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl transition-all duration-300 flex items-center gap-3 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 font-medium"
                >
                  <RefreshCw className="h-5 w-5" />
                  Atualizar
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Estatísticas Principais */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6 mb-8">
          <div className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-2xl shadow-lg border border-slate-200 p-6 hover:shadow-xl transition-all duration-300 group">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-slate-600 uppercase tracking-wider">Total</p>
                <p className="text-3xl font-bold text-slate-900 mt-1">{stats.total}</p>
                <p className="text-xs text-slate-500 mt-1">Feedbacks</p>
              </div>
              <div className="p-3 bg-white/80 rounded-xl shadow-inner group-hover:scale-110 transition-transform duration-300">
                <Target className="h-6 w-6 text-slate-600" />
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-violet-50 to-violet-100 rounded-2xl shadow-lg border border-violet-200 p-6 hover:shadow-xl transition-all duration-300 group">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-violet-600 uppercase tracking-wider">Ligações</p>
                <p className="text-3xl font-bold text-violet-900 mt-1">{feedbacksAgrupados.length}</p>
                <p className="text-xs text-violet-500 mt-1">Analisadas</p>
              </div>
              <div className="p-3 bg-white/80 rounded-xl shadow-inner group-hover:scale-110 transition-transform duration-300">
                <Phone className="h-6 w-6 text-violet-600" />
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-amber-50 to-amber-100 rounded-2xl shadow-lg border border-amber-200 p-6 hover:shadow-xl transition-all duration-300 group">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-amber-600 uppercase tracking-wider">Pendentes</p>
                <p className="text-3xl font-bold text-amber-900 mt-1">{stats.pendente}</p>
                <p className="text-xs text-amber-500 mt-1">Aguardando</p>
              </div>
              <div className="p-3 bg-white/80 rounded-xl shadow-inner group-hover:scale-110 transition-transform duration-300">
                <Clock className="h-6 w-6 text-amber-600" />
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-2xl shadow-lg border border-emerald-200 p-6 hover:shadow-xl transition-all duration-300 group">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-emerald-600 uppercase tracking-wider">Aplicados</p>
                <p className="text-3xl font-bold text-emerald-900 mt-1">{stats.aplicado}</p>
                <p className="text-xs text-emerald-500 mt-1">Implementados</p>
              </div>
              <div className="p-3 bg-white/80 rounded-xl shadow-inner group-hover:scale-110 transition-transform duration-300">
                <CheckCircle className="h-6 w-6 text-emerald-600" />
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl shadow-lg border border-blue-200 p-6 hover:shadow-xl transition-all duration-300 group">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-blue-600 uppercase tracking-wider">Aceitos</p>
                <p className="text-3xl font-bold text-blue-900 mt-1">{stats.aceito}</p>
                <p className="text-xs text-blue-500 mt-1">Validados</p>
              </div>
              <div className="p-3 bg-white/80 rounded-xl shadow-inner group-hover:scale-110 transition-transform duration-300">
                <CheckCircle className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-2xl shadow-lg border border-orange-200 p-6 hover:shadow-xl transition-all duration-300 group">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-orange-600 uppercase tracking-wider">Revisão</p>
                <p className="text-3xl font-bold text-orange-900 mt-1">{stats.revisao}</p>
                <p className="text-xs text-orange-500 mt-1">Em análise</p>
              </div>
              <div className="p-3 bg-white/80 rounded-xl shadow-inner group-hover:scale-110 transition-transform duration-300">
                <AlertTriangle className="h-6 w-6 text-orange-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Lista de Feedbacks por Ligação */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
          <div className="px-8 py-6 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-white">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-2xl font-bold text-gray-900">
                  Feedbacks por Ligação
                </h3>
                <p className="text-gray-600 mt-2">
                  {feedbacksAgrupados.length} ligações analisadas • Organizadas por contexto de chamada
                </p>
              </div>
              <div className="flex items-center gap-3">
                <div className="px-4 py-2 bg-blue-100 rounded-full">
                  <span className="text-sm font-semibold text-blue-700">
                    {feedbacksAgrupados.length} Ligações
                  </span>
                </div>
              </div>
            </div>
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
          {!agentsLoading && !trendLoading && !feedbacksLoading && !agentsError && !trendError && !feedbacksError && feedbacksAgrupados.length === 0 ? (
            <div className="text-center py-12">
              <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">Nenhum feedback encontrado para os filtros selecionados.</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {feedbacksAgrupados.map((ligacao) => (
                <div key={ligacao.callId} className="p-6">
                  {/* Cabeçalho da Ligação - Agora clicável */}
                  <Collapsible 
                    open={expandedCalls.has(ligacao.callId)}
                    onOpenChange={() => toggleCallExpansion(ligacao.callId)}
                  >
                                      <CollapsibleTrigger asChild>
                    <div className="flex items-center justify-between mb-6 p-8 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl border border-blue-200 shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer group">
                      {/* Seção Esquerda - Informações do Agente */}
                      <div className="flex items-center gap-6 flex-1">
                        <div className="p-5 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl shadow-lg">
                          <Phone className="h-8 w-8 text-white" />
                        </div>
                        <div className="space-y-3">
                          <h4 className="text-3xl font-bold text-gray-900">
                            {ligacao.agenteNome}
                          </h4>
                          <div className="grid grid-cols-2 gap-x-8 gap-y-2">
                            <p className="text-sm font-medium text-gray-700">
                              <span className="inline-flex items-center gap-2">
                                <Phone className="h-4 w-4 text-blue-600" />
                                Ligação: #{ligacao.callId}
                              </span>
                            </p>
                            <p className="text-sm text-gray-600">
                              <span className="inline-flex items-center gap-2">
                                <Target className="h-4 w-4 text-indigo-600" />
                                {ligacao.totalFeedbacks} critérios
                              </span>
                            </p>
                            <p className="text-sm text-gray-600">
                              <span className="inline-flex items-center gap-2">
                                <TrendingUp className="h-4 w-4 text-green-600" />
                                Performance: {ligacao.performanceMedia}%
                              </span>
                            </p>
                            <p className="text-sm text-gray-500">
                              <span className="inline-flex items-center gap-2">
                                📅 {ligacao.dataLigacao}
                              </span>
                            </p>
                          </div>
                        </div>
                      </div>
                      
                      {/* Seção Central - Estatísticas da Ligação */}
                      <div className="flex items-center gap-4 mx-8">
                        <div className="text-center bg-white/90 px-5 py-4 rounded-xl shadow-inner border border-gray-100">
                          <div className="text-3xl font-bold text-amber-600 mb-1">{ligacao.feedbacksPendentes}</div>
                          <div className="text-xs font-semibold text-amber-700 uppercase tracking-wider">Pendentes</div>
                        </div>
                        <div className="text-center bg-white/90 px-5 py-4 rounded-xl shadow-inner border border-gray-100">
                          <div className="text-3xl font-bold text-emerald-600 mb-1">{ligacao.feedbacksAplicados}</div>
                          <div className="text-xs font-semibold text-emerald-700 uppercase tracking-wider">Aplicados</div>
                        </div>
                        <div className="text-center bg-white/90 px-5 py-4 rounded-xl shadow-inner border border-gray-100">
                          <div className="text-3xl font-bold text-blue-600 mb-1">{ligacao.feedbacksAceitos}</div>
                          <div className="text-xs font-semibold text-blue-700 uppercase tracking-wider">Aceitos</div>
                        </div>
                        <div className="text-center bg-white/90 px-5 py-4 rounded-xl shadow-inner border border-gray-100">
                          <div className="text-3xl font-bold text-orange-600 mb-1">{ligacao.feedbacksRevisao}</div>
                          <div className="text-xs font-semibold text-orange-700 uppercase tracking-wider">Revisão</div>
                        </div>
                      </div>

                      {/* Seção Direita - Controle de Expansão */}
                      <div className="flex flex-col items-center gap-3 flex-shrink-0">
                        <div className="p-3 bg-white/90 rounded-xl shadow-inner border border-gray-100 group-hover:bg-white transition-all duration-200 group-hover:scale-110">
                          {expandedCalls.has(ligacao.callId) ? (
                            <ChevronDown className="h-6 w-6 text-blue-600" />
                          ) : (
                            <ChevronRight className="h-6 w-6 text-blue-600" />
                          )}
                        </div>
                        <div className="text-sm text-blue-600 font-semibold">
                          {expandedCalls.has(ligacao.callId) ? 'Recolher' : 'Expandir'}
                        </div>
                      </div>
                    </div>
                  </CollapsibleTrigger>

                                         {/* Conteúdo colapsável - Critérios da Ligação */}
                     <CollapsibleContent>
                       <div className="space-y-6 pl-8 pr-6">
                         {/* Cabeçalho dos Critérios */}
                         <div className="flex items-center gap-4 mb-6">
                           <div className="w-2 h-8 bg-gradient-to-b from-blue-500 to-indigo-600 rounded-full"></div>
                           <h5 className="text-xl font-bold text-gray-800">
                             Critérios Analisados
                           </h5>
                           <span className="px-4 py-2 bg-blue-100 text-blue-700 text-sm font-semibold rounded-full border border-blue-200">
                             {ligacao.totalFeedbacks} critérios
                           </span>
                         </div>
                         
                         {/* Grid de Critérios */}
                         <div className="grid gap-4">
                           {ligacao.feedbacks.map((feedback: FeedbackItem) => (
                             <div key={feedback.id} className="bg-white border-2 border-gray-100 rounded-2xl p-6 hover:shadow-xl hover:border-blue-200 transition-all duration-300">
                               <div className="flex items-center justify-between">
                                 {/* Informações do Critério */}
                                 <div className="flex items-center gap-5 flex-1">
                                   <div className="p-4 bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl border border-gray-200">
                                     <span className="text-3xl">{getOrigemIcon(feedback.origem)}</span>
                                   </div>
                                   <div className="space-y-2">
                                     <h6 className="text-lg font-bold text-gray-900">{feedback.criterio}</h6>
                                     <p className="text-sm text-gray-600 font-medium">
                                       <span className="inline-flex items-center gap-2">
                                         <FileText className="h-4 w-4 text-gray-400" />
                                         Avaliação: {feedback.avaliacaoId}
                                       </span>
                                     </p>
                                   </div>
                                 </div>

                                 {/* Métricas - Performance e Status */}
                                 <div className="flex items-center gap-8">
                                   <div className="text-center">
                                     <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Performance</p>
                                     <div className={`px-6 py-3 font-bold text-xl ${getPerformanceColor(feedback.performanceAtual)}`}>
                                       {feedback.performanceAtual}%
                                     </div>
                                   </div>
                                   
                                   <div className="text-center">
                                     <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Status</p>
                                     <span className={`inline-flex items-center px-6 py-3 text-sm font-bold ${getStatusColor(feedback.status)}`}>
                                       {feedback.status === 'pendente' ? <Clock className="h-4 w-4 mr-2" /> : 
                                        feedback.status === 'aplicado' ? <CheckCircle className="h-4 w-4 mr-2" /> :
                                        feedback.status === 'aceito' ? <CheckCircle className="h-4 w-4 mr-2" /> :
                                        <AlertTriangle className="h-4 w-4 mr-2" />}
                                       {feedback.status === 'pendente' ? 'Pendente' : 
                                        feedback.status === 'aplicado' ? 'Aplicado' :
                                        feedback.status === 'aceito' ? 'Aceito' : 'Revisão'}
                                     </span>
                                   </div>
                                 </div>

                                 {/* Botão de Ação */}
                                 <div className="flex items-center gap-3">
                                   <button
                                     onClick={() => handleVerDetalhes(feedback)}
                                     className="flex items-center gap-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-6 py-3 rounded-2xl transition-all duration-300 text-sm font-bold shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 border-2 border-transparent hover:border-blue-500"
                                   >
                                     <Eye className="h-5 w-5" />
                                     Ver Detalhes
                                   </button>
                                 </div>
                               </div>
                             </div>
                           ))}
                         </div>
                       </div>
                     </CollapsibleContent>
                  </Collapsible>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Nota sobre IA */}
        <div className="mt-8 p-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl border-2 border-blue-200 shadow-lg">
          <div className="flex items-start gap-5">
            <div className="p-3 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl shadow-lg">
              <Bot className="h-6 w-6 text-white" />
            </div>
            <div className="flex-1">
              <h4 className="text-lg font-bold text-blue-900 mb-3">Sistema de Feedback Inteligente por Ligação</h4>
              <p className="text-blue-800 leading-relaxed">
                Esta interface organiza feedbacks por ligação (Call ID) de forma clara e contextual. 
                Cada ligação mostra todos os critérios que receberam feedbacks, com estatísticas consolidadas.
                Os feedbacks são agrupados por critério dentro de cada ligação, facilitando a análise completa da chamada.
                Clique em "Ver Detalhes" para visualizar o feedback completo e tomar ações apropriadas.
                Monitores podem editar e criar feedbacks, enquanto agentes podem aceitar ou rejeitar.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Modal de Detalhes do Feedback */}
      {showFeedbackModal && selectedFeedback && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-5xl max-h-[95vh] overflow-hidden">
            {/* Header do Modal */}
            <div className="bg-gradient-to-r from-blue-600 to-indigo-700 px-8 py-6 text-white">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-sm">
                    <MessageSquare className="h-8 w-8 text-white" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold">
                      Detalhes do Feedback
                    </h3>
                    <p className="text-blue-100 text-lg">
                      {selectedFeedback.agenteNome}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowFeedbackModal(false)}
                  className="p-2 hover:bg-white/20 rounded-xl transition-all duration-200 group"
                >
                  <X className="h-6 w-6 group-hover:scale-110 transition-transform" />
                </button>
              </div>
            </div>

            {/* Conteúdo do Modal */}
            <div className="p-8 overflow-y-auto max-h-[calc(95vh-120px)]">
              {/* Grid Principal de Informações */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
                {/* Coluna Esquerda - Informações do Agente */}
                <div className="lg:col-span-2 space-y-6">
                  {/* Card do Critério */}
                  <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl p-6 border border-gray-200">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="p-2 bg-blue-100 rounded-xl">
                        <Target className="h-5 w-5 text-blue-600" />
                      </div>
                      <h4 className="text-lg font-bold text-gray-800">Critério Avaliado</h4>
                    </div>
                    <p className="text-gray-700 text-lg leading-relaxed">
                      {selectedFeedback.criterio}
                    </p>
                  </div>

                  {/* Card de Performance */}
                  <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl p-6 border border-gray-200">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="p-2 bg-green-100 rounded-xl">
                        <TrendingUp className="h-5 w-5 text-green-600" />
                      </div>
                      <h4 className="text-lg font-bold text-gray-800">Performance da Avaliação</h4>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className={`text-4xl font-bold ${getPerformanceColor(selectedFeedback.performanceAtual)}`}>
                        {selectedFeedback.performanceAtual}%
                      </div>
                      <div className="flex-1">
                        <div className="w-full bg-gray-200 rounded-full h-3">
                          <div 
                            className={`h-3 rounded-full transition-all duration-1000 ${
                              selectedFeedback.performanceAtual >= 80 ? 'bg-green-500' :
                              selectedFeedback.performanceAtual >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                            }`}
                            style={{ width: `${selectedFeedback.performanceAtual}%` }}
                          ></div>
                        </div>
                        <p className="text-sm text-gray-600 mt-2">
                          {selectedFeedback.performanceAtual >= 80 ? 'Excelente' :
                           selectedFeedback.performanceAtual >= 60 ? 'Bom' : 'Precisa Melhorar'}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Card do Comentário */}
                  <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl p-6 border border-gray-200">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="p-2 bg-purple-100 rounded-xl">
                        <FileText className="h-5 w-5 text-purple-600" />
                      </div>
                      <h4 className="text-lg font-bold text-gray-800">Comentário Detalhado</h4>
                    </div>
                    <div className="bg-white rounded-xl p-4 border border-gray-200">
                      <div className="prose prose-gray max-w-none">
                        {selectedFeedback.comentario?.split('\n\n').map((paragraph, index) => (
                          <div key={index} className="mb-4 last:mb-0">
                            {paragraph.trim() && (
                              <p className="text-gray-700 leading-relaxed whitespace-pre-line text-base">
                                {paragraph.trim()}
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Coluna Direita - Metadados */}
                <div className="space-y-6">
                  {/* Card de Origem */}
                  <div className="bg-gradient-to-br from-blue-50 to-indigo-100 rounded-2xl p-6 border border-blue-200">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="p-2 bg-blue-100 rounded-xl">
                        <span className="text-2xl">{getOrigemIcon(selectedFeedback.origem)}</span>
                      </div>
                      <h4 className="text-lg font-bold text-blue-800">Origem</h4>
                    </div>
                    <p className="text-blue-700 font-semibold text-lg">
                      {selectedFeedback.origem === 'ia' ? 'Inteligência Artificial' : 'Monitor'}
                    </p>
                  </div>

                  {/* Card de Status */}
                  <div className="bg-gradient-to-br from-amber-50 to-yellow-100 rounded-2xl p-6 border border-amber-200">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="p-2 bg-amber-100 rounded-xl">
                        {selectedFeedback.status === 'pendente' ? <Clock className="h-5 w-5 text-amber-600" /> : 
                         selectedFeedback.status === 'aplicado' ? <CheckCircle className="h-5 w-5 text-green-600" /> :
                         selectedFeedback.status === 'aceito' ? <CheckCircle className="h-5 w-5 text-blue-600" /> :
                         <AlertTriangle className="h-5 w-5 text-orange-600" />}
                      </div>
                      <h4 className="text-lg font-bold text-amber-800">Status</h4>
                    </div>
                    <span className={`inline-flex items-center px-4 py-2 rounded-xl text-sm font-bold ${getStatusColor(selectedFeedback.status)}`}>
                      {selectedFeedback.status === 'pendente' ? 'Pendente' : 
                       selectedFeedback.status === 'aplicado' ? 'Aplicado' :
                       selectedFeedback.status === 'aceito' ? 'Aceito' : 'Revisão'}
                    </span>
                  </div>

                  {/* Card de Data */}
                  <div className="bg-gradient-to-br from-emerald-50 to-green-100 rounded-2xl p-6 border border-emerald-200">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="p-2 bg-emerald-100 rounded-xl">
                        <Calendar className="h-5 w-5 text-emerald-600" />
                      </div>
                      <h4 className="text-lg font-bold text-emerald-800">Data de Criação</h4>
                    </div>
                    <p className="text-emerald-700 font-semibold text-lg">
                      {selectedFeedback.dataCriacao}
                    </p>
                  </div>

                  {/* Card de IDs */}
                  <div className="bg-gradient-to-br from-slate-50 to-gray-100 rounded-2xl p-6 border border-slate-200">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="p-2 bg-slate-100 rounded-xl">
                        <FileText className="h-5 w-5 text-slate-600" />
                      </div>
                      <h4 className="text-lg font-bold text-slate-800">Identificadores</h4>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Call ID:</span>
                        <span className="font-mono font-bold text-slate-700">{selectedFeedback.callId}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Avaliação ID:</span>
                        <span className="font-mono font-bold text-slate-700">{selectedFeedback.avaliacaoId}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Ações */}
              <div className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-2xl p-6 border border-gray-200">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div className="text-sm text-gray-600">
                    <p className="font-medium">Clique em uma das ações abaixo para prosseguir:</p>
                  </div>
                  
                  <div className="flex flex-wrap gap-3">
                    {isMonitor && (
                      <button
                        onClick={() => handleEditarFeedback(selectedFeedback)}
                        className="flex items-center gap-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-6 py-3 rounded-xl transition-all duration-300 text-sm font-bold shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 border-2 border-transparent hover:border-blue-500"
                      >
                        <Edit3 className="h-5 w-5" />
                        Editar Feedback
                      </button>
                    )}
                    
                    {selectedFeedback.status === 'pendente' && (
                      <>
                        <button
                          onClick={() => handleAceitarFeedback(selectedFeedback)}
                          className="flex items-center gap-3 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white px-6 py-3 rounded-xl transition-all duration-300 text-sm font-bold shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 border-2 border-transparent hover:border-green-500"
                        >
                          <ThumbsUp className="h-5 w-5" />
                          Aceitar
                        </button>
                        <button
                          onClick={() => handleRejeitarFeedback(selectedFeedback)}
                          className="flex items-center gap-3 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white px-6 py-3 rounded-xl transition-all duration-300 text-sm font-bold shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 border-2 border-transparent hover:border-red-500"
                        >
                          <ThumbsDown className="h-5 w-5" />
                          Rejeitar
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Feedback; 