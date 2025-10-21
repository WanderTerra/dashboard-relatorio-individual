import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useQuery, useQueryClient, useInfiniteQuery } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';
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
  ChevronRight,
  MessageCircle,
  Shield,
  AlertCircle,
  CheckCheck,
  XCircle,
  Settings,
  Mic
} from 'lucide-react';
import { getMixedAgents, getMixedTrend, aceitarFeedback, aceitarFeedbackPut, getFeedbackGeralLigacao, aceitarTodosFeedbacks, contestarFeedback, getContestacoesPendentes, analisarContestacao, getAvaliacaoFeedbackStatus } from '../lib/api';
import { useFilters } from '../hooks/use-filters';
import PageHeader from '../components/PageHeader';
import { formatAgentName } from '../lib/format';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '../components/ui/collapsible';
import { useAuth } from '../contexts/AuthContext';
import TranscriptionModal from '../components/TranscriptionModal';

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
  status: 'pendente' | 'aceito' | 'revisao';
  dataCriacao: string;
  dataAplicacao?: string;
  origem: 'ia' | 'monitor';
  criadoPor?: string;
  comentario?: string;
  callId?: string;
  avaliacaoId?: string;
  contestacaoId?: string;
  contestacaoComentario?: string;
  contestacaoStatus?: string;
  contestacaoCriadoEm?: string;
}

const Feedback: React.FC = () => {
  const { user } = useAuth();
  const { filters, setStartDate, setEndDate, setCarteira } = useFilters();
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'todos' | 'pendente' | 'aceito' | 'revisao'>('todos');
  const [selectedFeedback, setSelectedFeedback] = useState<FeedbackItem | null>(null);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  // Estado para edição
  const [showEditModal, setShowEditModal] = useState(false);
  const [editForm, setEditForm] = useState<{ id: string; comentario: string; status: string }>({ id: '', comentario: '', status: 'ENVIADO' });

  // Estado de acordeão para agentes e avaliações
  const [expandedAgents, setExpandedAgents] = useState<Set<string>>(new Set());
  const [expandedCalls, setExpandedCalls] = useState<Set<string>>(new Set());
  const [feedbackForm, setFeedbackForm] = useState({
    criterio: '',
    observacao: '',
    acao: '',
    agenteId: '',
    agenteNome: ''
  });
  
  // Estado para feedbacks gerais das ligações
  const [feedbacksGerais, setFeedbacksGerais] = useState<{[callId: string]: any}>({});

  // Estados para contestação
  const [showContestacaoModal, setShowContestacaoModal] = useState(false);
  const [feedbackParaContestar, setFeedbackParaContestar] = useState<FeedbackItem | null>(null);
  const [comentarioContestacao, setComentarioContestacao] = useState('');
  const [tipoAcao, setTipoAcao] = useState<'contestar' | 'rejeitar'>('contestar');
  const [showAnaliseModal, setShowAnaliseModal] = useState(false);
  const [contestacaoParaAnalisar, setContestacaoParaAnalisar] = useState<any>(null);
  const [novoResultado, setNovoResultado] = useState<'CONFORME' | 'NAO_CONFORME' | 'NAO_SE_APLICA'>('CONFORME');
  const [comentarioMonitor, setComentarioMonitor] = useState('');
  const [contestacoesPendentes, setContestacoesPendentes] = useState<any[]>([]);
  const [showContestacoesModal, setShowContestacoesModal] = useState(false);
  const [showAceitarModal, setShowAceitarModal] = useState(false);
  
  // Estados para transcrição
  const [expandedCallWithTranscription, setExpandedCallWithTranscription] = useState<string | null>(null);
  const [selectedCallForTranscription, setSelectedCallForTranscription] = useState<{callId: string, avaliacaoId: string} | null>(null);

  // Infinite scroll
  const pageSize = 50;
  const bottomRef = useRef<HTMLDivElement | null>(null);

  // Lógica de permissões
  const isAdmin = user?.permissions?.includes('admin') || false;
  const agentPermission = user?.permissions?.find((p: string) => p.startsWith('agent_'));
  const currentAgentId = agentPermission ? agentPermission.replace('agent_', '') : null;
  const isAgentUser = currentAgentId && !isAdmin;

  // Debug: Log das permissões do usuário
  // Debug removido para melhorar performance



  // Filtros para API - incluindo apenas parâmetros com valores
  const apiFilters = {
    ...(filters.start ? { start: filters.start } : {}),
    ...(filters.end ? { end: filters.end } : {}),
    ...(filters.carteira ? { carteira: filters.carteira } : {}),
    // Adicionar filtro de agente se for um agente comum
    ...(isAgentUser && currentAgentId ? { agent_id: currentAgentId } : {})
  };

  // Debug: Log dos filtros da API
  // Debug removido para melhorar performance

  // Buscar feedbacks com pontuações das avaliações (infinite scroll)
  const {
    data: feedbacksPages,
    isLoading: feedbacksLoading,
    error: feedbacksError,
    refetch: refetchFeedbacks,
    hasNextPage,
    fetchNextPage,
    isFetchingNextPage
  } = useInfiniteQuery({
    queryKey: ['feedbacks-with-scores', apiFilters],
    initialPageParam: 0,
    queryFn: ({ pageParam = 0 }) => {
      const params = new URLSearchParams();
      params.append('limit', String(pageSize));
      params.append('offset', String(pageParam));
      if (apiFilters.start) params.append('start', apiFilters.start);
      if (apiFilters.end) params.append('end', apiFilters.end);
      if (apiFilters.carteira) params.append('carteira', apiFilters.carteira);
      if (apiFilters.agent_id) params.append('agent_id', apiFilters.agent_id);

      return fetch(`/api/feedbacks/with-scores?${params.toString()}`)
        .then(res => res.json());
    },
    getNextPageParam: (lastPage, allPages) => {
      return Array.isArray(lastPage) && lastPage.length === pageSize
        ? allPages.length * pageSize
        : undefined;
    },
    staleTime: 5 * 60 * 1000,
    retry: 3,
    retryDelay: 1000,
    refetchOnWindowFocus: false
  });

  // Array achatado para manter compatibilidade com o restante do componente
  const feedbacks = useMemo(() => {
    const flattened = feedbacksPages?.pages ? feedbacksPages.pages.flat() : [];
    
    // Debug removido para melhorar performance
    
    return flattened;
  }, [feedbacksPages]);

  // IntersectionObserver para carregar próximas páginas
  useEffect(() => {
    if (!bottomRef.current) return;
    const el = bottomRef.current;

    const observer = new IntersectionObserver((entries) => {
      const isVisible = entries.some(e => e.isIntersecting);
      if (isVisible && hasNextPage && !isFetchingNextPage) {
        fetchNextPage();
      }
    }, { root: null, rootMargin: '200px', threshold: 0 });

    observer.observe(el);
    return () => observer.unobserve(el);
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);






  // Buscar agentes para estatísticas (mantido para compatibilidade)
  const { data: agents, isLoading: agentsLoading, error: agentsError, refetch: refetchAgents } = useQuery({
    queryKey: ['feedbacks-agents-mixed', apiFilters],
    queryFn: () => {
      const params = new URLSearchParams();
      if (apiFilters.start) params.append('start', apiFilters.start);
      if (apiFilters.end) params.append('end', apiFilters.end);
      if (apiFilters.carteira) params.append('carteira', apiFilters.carteira);
      
      return fetch(`/api/mixed/agents?${params.toString()}`)
        .then(res => res.json())
        .catch(err => {
          throw err;
        });
    },
    staleTime: 5 * 60 * 1000,
    retry: 3,
    retryDelay: 1000,
    refetchOnWindowFocus: false
  });

  const { data: trend, isLoading: trendLoading, error: trendError, refetch: refetchTrend } = useQuery({
    queryKey: ['mixed-trend', apiFilters],
    queryFn: () => getMixedTrend(apiFilters),
    staleTime: 5 * 60 * 1000,
    retry: 3,
    retryDelay: 1000,
    refetchOnWindowFocus: false
  });

  // Usar feedbacks reais se disponíveis, senão gerar baseado nos agentes
  const feedbackData = useMemo(() => {
    if (feedbacks && feedbacks.length > 0) {
      // Usar feedbacks reais da tabela
      // O backend já filtra por agent_id se necessário, não precisamos filtrar novamente aqui
      let filteredFeedbacks = feedbacks;
      
      const mapped = filteredFeedbacks.map((fb: any) => {
        // A pontuação já vem do backend via JOIN com a tabela avaliacoes
        const performanceAtual = fb.performance_atual || 0;
        
        // Normalizar nome do agente como na página Agents
        const nomeNormalizado = formatAgentName({ agent_id: fb.agent_id, nome: fb.nome_agente });
        // Mapear status visual considerando aceite vindo do backend
        const statusVisual: 'pendente' | 'aceito' | 'revisao' = (fb?.aceite === 1 || fb?.status === 'ACEITO')
          ? 'aceito'
          : (fb?.status === 'REVISAO')
            ? 'revisao'
            : 'pendente';
        
        return {
          id: String(fb.id),
          callId: fb.avaliacao_id, // Usar avaliacao_id para agrupamento correto
          avaliacaoId: fb.avaliacao_id,
          agenteId: fb.agent_id,
          agenteNome: nomeNormalizado,
          criterio: fb.criterio_nome || 'Critério não especificado',
          performanceAtual: performanceAtual,
          observacao: fb.comentario,
          status: statusVisual,
          dataCriacao: fb.criado_em,
          origem: (fb.origem === 'monitoria' ? 'monitor' : 'ia') as 'ia' | 'monitor',
          comentario: fb.comentario,
          contestacaoId: fb.contestacao_id,
          contestacaoComentario: fb.contestacao_comentario,
          contestacaoStatus: fb.contestacao_status,
          contestacaoCriadoEm: fb.contestacao_criado_em
        };
      });

      // Agrupar por critério + avaliação para evitar repetição visual
      const grouped = new Map<string, FeedbackItem>();
      for (const item of mapped) {
        // Usar critério + avaliação como chave para deduplicação
        const key = `${item.avaliacaoId}-${item.criterio}`;
        const existing = grouped.get(key);
        if (!existing) {
          grouped.set(key, item);
        } else {
          // Manter o feedback com ID maior (mais recente)
          const existingId = parseInt(existing.id);
          const currentId = parseInt(item.id);
          if (currentId > existingId) {
            grouped.set(key, item);
          }
        }
      }

      return Array.from(grouped.values()).sort(
        (a, b) => new Date(b.dataCriacao).getTime() - new Date(a.dataCriacao).getTime()
      );
    } else if (agents && agents.length > 0) {
      // Fallback: gerar feedbacks baseado nos agentes (lógica existente)
      const feedback: FeedbackItem[] = [];
      
      // Filtrar agentes se for um agente comum
      let filteredAgents = agents;
      if (isAgentUser && currentAgentId) {
        filteredAgents = agents.filter((agent: any) => String(agent.id) === String(currentAgentId));
      }
      
      // Identificar agentes com notas baixas (performance < 70%)
      const agentesComNotasBaixas = filteredAgents
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
    
    return [];
  }, [feedbacks, agents, trend, isAgentUser, currentAgentId]);



  // Filtrar feedback
  const filteredFeedback = useMemo(() => {
    let filtered = feedbackData;

    if (statusFilter !== 'todos') {
      filtered = filtered.filter((item: FeedbackItem) => item.status === statusFilter);
    }

    if (searchTerm) {
      filtered = filtered.filter((item: FeedbackItem) => 
        item.criterio.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.agenteNome.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (item.callId && String(item.callId).toLowerCase().includes(searchTerm.toLowerCase())) ||
        (item.avaliacaoId && String(item.avaliacaoId).toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    // Deduplicar por id do feedback (mantém o mais recente por id)
    const byId = new Map<string, FeedbackItem>();
    
    for (const item of filtered) {
      const key = item.id;
      const existing = byId.get(key);
      if (!existing) {
        byId.set(key, item);
      } else {
        const prev = new Date(existing.dataCriacao || 0).getTime();
        const cur = new Date(item.dataCriacao || 0).getTime();
        if (cur >= prev) byId.set(key, item);
      }
    }
    
    return Array.from(byId.values());
  }, [feedbackData, statusFilter, searchTerm]);

  // Agrupar feedbacks por agente (para administradores)
  const feedbacksPorAgente = useMemo(() => {
    const agrupadosPorAgente: { [key: string]: FeedbackItem[] } = {};
    
    // Primeiro agrupar todos os feedbacks por agente
    filteredFeedback.forEach((feedback: FeedbackItem) => {
      const agenteKey = feedback.agenteId || 'sem-agente-id';
      
      // O backend já filtra por agent_id se necessário, não precisamos filtrar novamente aqui
      
      if (!agrupadosPorAgente[agenteKey]) {
        agrupadosPorAgente[agenteKey] = [];
      }
      agrupadosPorAgente[agenteKey].push(feedback);
    });

    // Transformar em estrutura para visualização
    return Object.entries(agrupadosPorAgente)
      .map(([agenteId, feedbacks]) => {
        const agenteNome = feedbacks[0]?.agenteNome || 'Agente';
        const performanceMedia = feedbacks.reduce((acc, fb) => acc + fb.performanceAtual, 0) / feedbacks.length;
        
        // Agrupar feedbacks do agente por avaliação
        const avaliacoesPorAgente: { [key: string]: FeedbackItem[] } = {};
        feedbacks.forEach((feedback: FeedbackItem) => {
          const avaliacaoKey = feedback.callId || 'sem-avaliacao-id';
          if (!avaliacoesPorAgente[avaliacaoKey]) {
            avaliacoesPorAgente[avaliacaoKey] = [];
          }
          avaliacoesPorAgente[avaliacaoKey].push(feedback);
        });

        // Transformar avaliações em array
        const avaliacoes = Object.entries(avaliacoesPorAgente)
          .map(([avaliacaoId, feedbacksAvaliacao]) => ({
            avaliacaoId,
            feedbacks: feedbacksAvaliacao,
            totalFeedbacks: feedbacksAvaliacao.length,
            feedbacksPendentes: feedbacksAvaliacao.filter(fb => fb.status === 'pendente').length,
            feedbacksAceitos: feedbacksAvaliacao.filter(fb => fb.status === 'aceito').length,
            feedbacksRevisao: feedbacksAvaliacao.filter(fb => fb.status === 'revisao').length,
            performanceMedia: Math.round(feedbacksAvaliacao.reduce((acc, fb) => acc + fb.performanceAtual, 0) / feedbacksAvaliacao.length),
            dataLigacao: feedbacksAvaliacao[0]?.dataCriacao || 'N/A'
          }))
          .sort((a, b) => b.feedbacksPendentes - a.feedbacksPendentes);

        return {
          agenteId,
          agenteNome,
          totalFeedbacks: feedbacks.length,
          totalAvaliacoes: avaliacoes.length,
          feedbacksPendentes: feedbacks.filter(fb => fb.status === 'pendente').length,
          feedbacksAceitos: feedbacks.filter(fb => fb.status === 'aceito').length,
          feedbacksRevisao: feedbacks.filter(fb => fb.status === 'revisao').length,
          performanceMedia: Math.round(performanceMedia),
          avaliacoes
        };
      })
      .sort((a, b) => b.feedbacksPendentes - a.feedbacksPendentes);
  }, [filteredFeedback, isAgentUser, currentAgentId]);

  // Manter estrutura antiga para compatibilidade (se não for admin)
  const feedbacksAgrupados = useMemo(() => {
    const agrupados: { [key: string]: FeedbackItem[] } = {};
    
    filteredFeedback.forEach((feedback: FeedbackItem) => {
      const avaliacaoKey = feedback.callId || 'sem-avaliacao-id'; // callId agora é avaliacao_id
      if (!agrupados[avaliacaoKey]) {
        agrupados[avaliacaoKey] = [];
      }
      agrupados[avaliacaoKey].push(feedback);
    });

    // Ordenar avaliações por número de feedbacks pendentes
    return Object.entries(agrupados)
      .map(([avaliacaoId, feedbacks]) => {
        const performanceMedia = feedbacks.reduce((acc, fb) => acc + fb.performanceAtual, 0) / feedbacks.length;
        const feedbacksPendentes = feedbacks.filter(fb => fb.status === 'pendente').length;
        const agenteNome = feedbacks[0]?.agenteNome || 'Agente';
        
        return {
          callId: avaliacaoId, // Manter nome para compatibilidade, mas agora é avaliacao_id
          agenteNome,
          feedbacks,
          performanceMedia: Math.round(performanceMedia),
          totalFeedbacks: feedbacks.length,
          feedbacksPendentes,
          feedbacksAceitos: feedbacks.filter(fb => fb.status === 'aceito').length,
          feedbacksRevisao: feedbacks.filter(fb => fb.status === 'revisao').length,
          dataLigacao: feedbacks[0]?.dataCriacao || 'N/A'
        };
      })
      .sort((a, b) => b.feedbacksPendentes - a.feedbacksPendentes);
  }, [filteredFeedback]);

  // Buscar contestações pendentes para estatísticas
  const { data: contestacoesPendentesStats = [] } = useQuery({
    queryKey: ['contestacoes-pendentes-stats'],
    queryFn: async () => {
      try {
        return await getContestacoesPendentes();
      } catch (error: any) {
        // Só logar o erro uma vez, não a cada 30 segundos
        if (error?.response?.status === 403) {
          console.warn('⚠️ Acesso negado para contestações pendentes - usuário sem permissão');
        }
        return [];
      }
    },
    refetchInterval: 30000, // Refetch a cada 30 segundos
    retry: false, // Não tentar novamente em caso de erro
  });

  // Função para navegar ao feedback específico
  const handleVerFeedback = (contestacao: any) => {
    setShowContestacoesModal(false);
    
    // Expandir o agente correspondente
    setExpandedAgents(prev => new Set([...prev, contestacao.agent_id]));
    
    // Expandir a avaliação correspondente
    setExpandedCalls(prev => new Set([...prev, contestacao.avaliacao_id.toString()]));
    
    // Scroll suave para o feedback após um pequeno delay
    setTimeout(() => {
      const feedbackElement = document.getElementById(`feedback-${contestacao.feedback_id}`);
      if (feedbackElement) {
        feedbackElement.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'center' 
        });
        // Destacar temporariamente o feedback
        feedbackElement.classList.add('ring-4', 'ring-orange-400', 'ring-opacity-75');
        setTimeout(() => {
          feedbackElement.classList.remove('ring-4', 'ring-orange-400', 'ring-opacity-75');
        }, 3000);
      }
    }, 100);
  };

  // Detectar parâmetro de contestação na URL e abrir modal automaticamente
  useEffect(() => {
    const contestacaoId = searchParams.get('contestacao');
    if (contestacaoId && Array.isArray(contestacoesPendentesStats) && contestacoesPendentesStats.length > 0) {
      const contestacao = contestacoesPendentesStats.find((c: any) => c.id.toString() === contestacaoId);
      if (contestacao) {
        console.log('🔍 [DEBUG] Contestação encontrada na URL:', contestacao);
        handleVerFeedback(contestacao);
        // Limpar o parâmetro da URL após usar
        setSearchParams(prev => {
          const newParams = new URLSearchParams(prev);
          newParams.delete('contestacao');
          return newParams;
        });
      }
    }
  }, [searchParams, contestacoesPendentesStats, setSearchParams]);

  // Estatísticas
  const stats = useMemo(() => {
    const total = feedbackData.length;
    const pendente = feedbackData.filter((f: FeedbackItem) => f.status === 'pendente').length;
    const aceito = feedbackData.filter((f: FeedbackItem) => f.status === 'aceito').length;
    const revisao = Array.isArray(contestacoesPendentesStats) ? contestacoesPendentesStats.length : 0; // Usar contestações pendentes ao invés de status revisão

    return { total, pendente, aceito, revisao };
  }, [feedbackData, contestacoesPendentesStats]);

  const getPerformanceColor = (performance: number) => {
    if (performance >= 80) return 'text-green-600';
    if (performance >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pendente': return 'text-yellow-600';
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

  const handleAceitarFeedback = async (feedback: FeedbackItem) => {
    try {
      // Tenta via endpoint dedicado (POST)
      try {
        await aceitarFeedback(Number(feedback.id));
      } catch (e) {
        // Fallback via PUT caso o POST não exista no ambiente
        await aceitarFeedbackPut(Number(feedback.id));
      }
      // Atualiza UI
      setSelectedFeedback(prev => prev && prev.id === feedback.id ? { ...prev, status: 'aceito' } : prev);
      await refetchFeedbacks();
      alert('Feedback aceito com sucesso!');
    } catch (err) {
      console.error('[DEBUG] Erro ao aceitar feedback:', err);
      alert('Não foi possível aceitar o feedback. Faça login novamente e tente de novo.');
    }
  };

  const handleRejeitarFeedback = (feedback: FeedbackItem) => {
    // Rejeitar = contestar (mesmo fluxo, mas com texto diferente)
    setFeedbackParaContestar(feedback);
    setComentarioContestacao('');
    setTipoAcao('rejeitar');
    setShowContestacaoModal(true);
  };

  // Função para expandir ligação com transcrição
  const handleShowTranscriptionSplit = (callId: string, avaliacaoId: string) => {
    setSelectedCallForTranscription({ callId, avaliacaoId });
    setExpandedCallWithTranscription(avaliacaoId);
    // Garantir que a ligação esteja expandida
    setExpandedCalls(prev => new Set([...prev, callId]));
  };

  const handleEditarFeedback = (feedback: FeedbackItem) => {
    // Preenche o formulário com os dados atuais
    setEditForm({
      id: feedback.id,
      comentario: feedback.comentario || feedback.observacao || '',
      // Converter status visual -> status backend
      status:
        feedback.status === 'pendente' ? 'ENVIADO' :
        feedback.status === 'aceito' ? 'ACEITO' : 'REVISAO',
    });
    setShowEditModal(true);
  };

  const handleSalvarEdicao = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      const res = await fetch(`/api/feedbacks/${editForm.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ comentario: editForm.comentario, status: editForm.status }),
      });
      if (!res.ok) {
        const t = await res.text();
        throw new Error(`Falha ao atualizar feedback: ${res.status} ${t}`);
      }
      setShowEditModal(false);
      // Atualiza listagem
      refetchFeedbacks();
    } catch (err) {
      console.error('[DEBUG] Erro ao salvar edição de feedback:', err);
      alert('Não foi possível salvar as alterações.');
    }
  };

  const handleCancelarEdicao = () => {
    setShowEditModal(false);
  };

  const handleCriarFeedback = () => {
    // Aqui você implementaria a lógica para criar novo feedback
    alert('Funcionalidade de criação será implementada!');
  };

  // Funções para contestação
  const handleAceitarTodos = async (avaliacaoId: string) => {
    try {
      await aceitarTodosFeedbacks(Number(avaliacaoId));
      alert('Todos os feedbacks foram aceitos com sucesso!');
      refetchFeedbacks();
    } catch (error: any) {
      alert(`Erro ao aceitar feedbacks: ${error.response?.data?.detail || error.message}`);
    }
  };

  const handleContestarFeedback = (feedback: FeedbackItem) => {
    setFeedbackParaContestar(feedback);
    setComentarioContestacao('');
    setTipoAcao('contestar');
    setShowContestacaoModal(true);
  };

  const siarContestacao = async () => {
    if (!feedbackParaContestar || !comentarioContestacao.trim()) {
      alert(tipoAcao === 'contestar' ? 'Por favor, escreva um comentário para a contestação.' : 'Por favor, escreva o motivo da rejeição.');
      return;
    }

    try {
      await contestarFeedback(Number(feedbackParaContestar.id), comentarioContestacao);
      alert(tipoAcao === 'contestar' ? 'Contestação enviada com sucesso!' : 'Rejeição enviada com sucesso!');
      setShowContestacaoModal(false);
      setFeedbackParaContestar(null);
      setComentarioContestacao('');
      
      // Atualizar o feedback selecionado se estiver aberto
      if (selectedFeedback && selectedFeedback.id === feedbackParaContestar.id) {
        setSelectedFeedback(prev => prev ? {
          ...prev,
          contestacaoId: 'temp', // ID temporário até o refetch
          contestacaoComentario: comentarioContestacao,
          contestacaoStatus: 'PENDENTE',
          contestacaoCriadoEm: new Date().toISOString()
        } : null);
      }
      
      refetchFeedbacks();
    } catch (error: any) {
      alert(`Erro ao contestar feedback: ${error.response?.data?.detail || error.message}`);
    }
  };

  const handleAnalisarContestacao = (contestacao: any) => {
    setContestacaoParaAnalisar(contestacao);
    setNovoResultado('CONFORME');
    setComentarioMonitor('');
    setShowAnaliseModal(true);
  };


  const handleBuscarContestacoesPendentes = async () => {
    try {
      const contestacoes = await getContestacoesPendentes();
      setContestacoesPendentes(contestacoes);
      setShowContestacoesModal(true);
    } catch (error: any) {
      if (error?.response?.status === 403) {
        alert('Você não tem permissão para acessar as contestações pendentes.');
      } else {
        alert(`Erro ao buscar contestações: ${error.response?.data?.detail || error.message}`);
      }
    }
  };


  const handleAceitarContestacao = (contestacao: any) => {
    setContestacaoParaAnalisar(contestacao);
    setNovoResultado('CONFORME');
    setComentarioMonitor('');
    setShowAceitarModal(true);
  };

  const handleConfirmarAceitacao = async () => {
    if (!contestacaoParaAnalisar) return;

    const debugInfo = {
      contestacaoId: contestacaoParaAnalisar.id,
      timestamp: new Date().toISOString(),
      user: user?.full_name || user?.username,
      analise: {
        aceitar_contestacao: true,
        novo_resultado: novoResultado,
        observacao: comentarioMonitor.trim() || undefined
      }
    };
    
    console.log('🚀 Iniciando aceitação de contestação:', debugInfo);

    try {
      const response = await analisarContestacao(Number(contestacaoParaAnalisar.id), debugInfo.analise);
      console.log('✅ Resposta do servidor:', response);
      
      // ✅ SÓ AGORA atualiza o estado local após confirmação do BD
      if (selectedFeedback && selectedFeedback.contestacaoId === contestacaoParaAnalisar.id) {
        setSelectedFeedback(prev => prev ? {
          ...prev,
          contestacaoStatus: 'ACEITA'
        } : null);
      }
      
      alert(`✅ Contestação aceita com sucesso! Resultado alterado para ${novoResultado}.\n\nID: ${contestacaoParaAnalisar.id}`);
      
      // Fechar modais
      setShowAceitarModal(false);
      setContestacaoParaAnalisar(null);
      setComentarioMonitor('');
      
      // Força reload dos dados do servidor
      refetchFeedbacks();
    } catch (error: any) {
      console.error('❌ Falha completa ao aceitar contestação:', {
        ...debugInfo,
        error: error,
        response: error.response?.data,
        status: error.response?.status,
        stack: error.stack
      });
      
      let errorMessage = 'Erro desconhecido';
      
      if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
        errorMessage = 'Timeout: A operação demorou muito. Verifique se foi processada.';
      } else if (error.code === 'NETWORK_ERROR' || !error.response) {
        errorMessage = 'Erro de rede. Verifique sua conexão e tente novamente.';
      } else if (error.response?.status === 500) {
        errorMessage = 'Erro interno do servidor. A operação pode ter sido processada.';
      } else if (error.response?.status === 404) {
        errorMessage = 'Contestação não encontrada no servidor.';
      } else if (error.response?.status === 400) {
        errorMessage = `Dados inválidos: ${error.response?.data?.detail || 'Verifique os campos.'}`;
      } else {
        errorMessage = error.response?.data?.detail || error.message || 'Erro desconhecido';
      }
      
      alert(`❌ FALHA ao aceitar contestação:\n\n${errorMessage}\n\nID: ${contestacaoParaAnalisar.id}\nHorário: ${debugInfo.timestamp}\n\nVerifique o console para mais detalhes.`);
      
      // Força reload para verificar se a operação foi processada no servidor
      console.log('🔄 Forçando reload para verificar estado no servidor...');
      refetchFeedbacks();
    }
  };

  const handleEnviarAnalise = async (aceitar: boolean) => {
    // Se estamos no modal de análise (contestacaoParaAnalisar existe), usar ele
    // Senão, usar o feedback selecionado diretamente
    const contestacao = contestacaoParaAnalisar || (selectedFeedback ? {
      id: selectedFeedback.contestacaoId,
      avaliacao_id: selectedFeedback.avaliacaoId,
      criterio_nome: selectedFeedback.criterio
    } : null);

    if (!contestacao) return;

    const debugInfo = {
      contestacaoId: contestacao.id,
      aceitar,
      timestamp: new Date().toISOString(),
      user: user?.full_name || user?.username,
      analise: {
        aceitar_contestacao: aceitar,
        novo_resultado: aceitar ? 'CONFORME' as const : undefined,
        observacao: comentarioMonitor.trim() || undefined
      }
    };
    
    console.log('🚀 Iniciando análise de contestação:', debugInfo);

    try {
      const response = await analisarContestacao(Number(contestacao.id), debugInfo.analise);
      console.log('✅ Resposta do servidor:', response);
      
      // ✅ SÓ AGORA atualiza o estado local após confirmação do BD
      if (selectedFeedback && selectedFeedback.contestacaoId === contestacao.id) {
        setSelectedFeedback(prev => prev ? {
          ...prev,
          contestacaoStatus: aceitar ? 'ACEITA' : 'REJEITADA'
        } : null);
      }
      
      alert(`✅ Contestação ${aceitar ? 'aceita' : 'rejeitada'} com sucesso!\n\nID: ${contestacao.id}`);
      
      // Fechar modais se estiverem abertos
      setShowAnaliseModal(false);
      setContestacaoParaAnalisar(null);
      setComentarioMonitor('');
      
      // Força reload dos dados do servidor
      refetchFeedbacks();
    } catch (error: any) {
      console.error('❌ Falha completa ao analisar contestação:', {
        ...debugInfo,
        error: error,
        response: error.response?.data,
        status: error.response?.status,
        stack: error.stack
      });
      
      let errorMessage = 'Erro desconhecido';
      
      if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
        errorMessage = 'Timeout: A operação demorou muito. Verifique se foi processada.';
      } else if (error.code === 'NETWORK_ERROR' || !error.response) {
        errorMessage = 'Erro de rede. Verifique sua conexão e tente novamente.';
      } else if (error.response?.status === 500) {
        errorMessage = 'Erro interno do servidor. A operação pode ter sido processada.';
      } else if (error.response?.status === 404) {
        errorMessage = 'Contestação não encontrada no servidor.';
      } else if (error.response?.status === 400) {
        errorMessage = `Dados inválidos: ${error.response?.data?.detail || 'Verifique os campos.'}`;
      } else {
        errorMessage = error.response?.data?.detail || error.message || 'Erro desconhecido';
      }
      
      alert(`❌ FALHA ao ${aceitar ? 'aceitar' : 'rejeitar'} contestação:\n\n${errorMessage}\n\nID: ${contestacao.id}\nHorário: ${debugInfo.timestamp}\n\nVerifique o console para mais detalhes.`);
      
      // Força reload para verificar se a operação foi processada no servidor
      console.log('🔄 Forçando reload para verificar estado no servidor...');
      refetchFeedbacks();
    }
  };

  const isMonitor = isAdmin; // Apenas administradores são considerados monitores
  
  // Debug removido para melhorar performance

  // Filtros de status
  const handleStatusFilterChange = (newStatus: string) => {
    setStatusFilter(newStatus as any);
  };

  // Filtros de busca
  const handleSearchChange = (searchTerm: string) => {
    setSearchTerm(searchTerm);
  };

  // Filtros de data
  const handleDateChange = (startDate: string, endDate: string) => {
    setStartDate(startDate);
    setEndDate(endDate);
  };

  // Aplicar filtros
  const applyFilters = () => {
    // Forçar refetch dos dados com novos filtros
    refetchAgents();
    refetchFeedbacks();
  };

  // Função para buscar feedback geral de uma ligação
  const fetchFeedbackGeral = async (avaliacaoId: string) => {
    try {
      // Buscar o call_id real através dos dados do backend
      const feedbacksAvaliacao = feedbacks.filter((f: any) => f.avaliacao_id.toString() === avaliacaoId);
      const callIdReal = (feedbacksAvaliacao[0] as any)?.call_id; // Pegar o call_id real do backend
      
      if (!callIdReal) {
        return;
      }
      
      const feedbackGeral = await getFeedbackGeralLigacao(callIdReal);
      setFeedbacksGerais(prev => ({
        ...prev,
        [avaliacaoId]: feedbackGeral
      }));
    } catch (error: any) {
      // Se erro 403 (sem permissão), não mostrar erro - apenas não exibir o feedback
      if (error?.response?.status !== 403) {
        setFeedbacksGerais(prev => ({
          ...prev,
          [avaliacaoId]: { error: 'Erro ao carregar feedback geral' }
        }));
      }
    }
  };

  // Função para alternar expansão de agente (novo)
  const toggleAgentExpansion = (agenteId: string) => {
    const newExpandedAgents = new Set(expandedAgents);
    if (newExpandedAgents.has(agenteId)) {
      newExpandedAgents.delete(agenteId);
    } else {
      newExpandedAgents.add(agenteId);
    }
    setExpandedAgents(newExpandedAgents);
  };

  // Função para alternar o estado de expansão de uma ligação (agora por avaliação)
  const toggleCallExpansion = (avaliacaoId: string) => {
    const newExpandedCalls = new Set(expandedCalls);
    if (newExpandedCalls.has(avaliacaoId)) {
      newExpandedCalls.delete(avaliacaoId);
    } else {
      newExpandedCalls.add(avaliacaoId);
      // Buscar feedback geral quando expandir
      if (!feedbacksGerais[avaliacaoId]) {
        fetchFeedbackGeral(avaliacaoId);
      }
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
            <div className="flex gap-3">
              <button
                onClick={handleBuscarContestacoesPendentes}
                className="inline-flex items-center gap-3 px-6 py-3 bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 text-white rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 font-medium"
              >
                <MessageCircle className="h-5 w-5" />
                Contestações Pendentes
              </button>
              <button
                onClick={handleCriarFeedback}
                className="inline-flex items-center gap-3 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 font-medium"
              >
                <Plus className="h-5 w-5" />
                Criar Feedback
              </button>
            </div>
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
                  onChange={e => handleDateChange(e.target.value, filters.end || '')}
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
                  onChange={e => handleDateChange(filters.start || '', e.target.value)}
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
                    placeholder="Digite agente, critério ou número da ligação..."
                    value={searchTerm}
                    onChange={e => handleSearchChange(e.target.value)}
                    className="h-12 pl-12 pr-4 border-2 border-gray-200 rounded-xl text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 hover:border-gray-300"
                  />
                </div>
              </div>
              
              <div className="flex flex-col justify-end">
                <button
                  onClick={async () => {
                    console.log('🔄 Botão Atualizar clicado - iniciando refetch...');
                    try {
                      // Invalidar queries primeiro para forçar refetch
                      queryClient.invalidateQueries({ queryKey: ['feedbacks-agents-mixed'] });
                      queryClient.invalidateQueries({ queryKey: ['mixed-trend'] });
                      queryClient.invalidateQueries({ queryKey: ['feedbacks-with-scores'] });
                      queryClient.invalidateQueries({ queryKey: ['contestacoes-pendentes-stats'] });
                      
                      // Executar refetch
                      await Promise.all([
                        refetchAgents(),
                        refetchTrend(),
                        refetchFeedbacks()
                      ]);
                      
                      console.log('✅ Refetch concluído com sucesso');
                    } catch (error) {
                      console.error('❌ Erro no refetch:', error);
                    }
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6 mb-8">
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

          <div 
            className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-2xl shadow-lg border border-orange-200 p-6 hover:shadow-xl transition-all duration-300 group cursor-pointer"
            onClick={handleBuscarContestacoesPendentes}
            title="Clique para ver contestações pendentes"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-orange-600 uppercase tracking-wider">Revisão</p>
                <p className="text-3xl font-bold text-orange-900 mt-1">{stats.revisao}</p>
                <p className="text-xs text-orange-500 mt-1">Contestações pendentes</p>
              </div>
              <div className="p-3 bg-white/80 rounded-xl shadow-inner group-hover:scale-110 transition-transform duration-300">
                <AlertTriangle className="h-6 w-6 text-orange-600" />
                </div>
             </div>
            </div>
        </div>

        {/* Lista de Feedbacks - Por Agente (Admin) ou Por Ligação (Outros) */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
          <div className="px-8 py-6 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-white">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-2xl font-bold text-gray-900">
                  {isMonitor ? 'Feedbacks por Agente' : 'Feedbacks por Ligação'}
                </h3>
                <p className="text-gray-600 mt-2">
                  {isMonitor 
                    ? `${feedbacksPorAgente.length} agentes analisados • Organizados por conciliador`
                    : `${feedbacksAgrupados.length} ligações analisadas • Organizadas por contexto de chamada`
                  }
                </p>
              </div>
              <div className="flex items-center gap-3">
                <div className="px-4 py-2 bg-blue-100 rounded-full">
                  <span className="text-sm font-semibold text-blue-700">
                    {isMonitor 
                      ? `${feedbacksPorAgente.length} Agentes`
                      : `${feedbacksAgrupados.length} Ligações`
                    }
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
          {!agentsLoading && !trendLoading && !feedbacksLoading && !agentsError && !trendError && !feedbacksError && 
           (isMonitor ? feedbacksPorAgente.length === 0 : feedbacksAgrupados.length === 0) ? (
            <div className="text-center py-12">
              <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">Nenhum feedback encontrado para os filtros selecionados.</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {/* Exibição por Agente (Administradores) */}
              {isMonitor ? (
                feedbacksPorAgente.map((agente) => (
                  <div key={agente.agenteId} className="p-6">
                    {/* Card do Agente */}
                    <Collapsible 
                      open={expandedAgents.has(agente.agenteId)}
                      onOpenChange={() => toggleAgentExpansion(agente.agenteId)}
                    >
                      <CollapsibleTrigger asChild>
                        <div className="flex items-center justify-between mb-6 p-8 bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl border border-green-200 shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer group">
                          {/* Seção Esquerda - Informações do Agente */}
                          <div className="flex items-center gap-6 flex-1">
                            <div className="p-5 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl shadow-lg">
                              <User className="h-8 w-8 text-white" />
                            </div>
                            <div className="space-y-3">
                              <h4 className="text-3xl font-bold text-gray-900">
                                {agente.agenteNome}
                              </h4>
                              <div className="grid grid-cols-2 gap-x-8 gap-y-2">
                                <p className="text-sm font-medium text-gray-700">
                                  <span className="inline-flex items-center gap-2">
                                    <Users className="h-4 w-4 text-green-600" />
                                    Agente: {agente.agenteId}
                                  </span>
                                </p>
                                <p className="text-sm text-gray-600">
                                  <span className="inline-flex items-center gap-2">
                                    <Target className="h-4 w-4 text-emerald-600" />
                                    {agente.totalAvaliacoes} avaliações
                                  </span>
                                </p>
                                <p className="text-sm text-gray-600">
                                  <span className="inline-flex items-center gap-2">
                                    <TrendingUp className="h-4 w-4 text-green-600" />
                                    Performance: {agente.performanceMedia}%
                                  </span>
                                </p>
                                <p className="text-sm text-gray-600">
                                  <span className="inline-flex items-center gap-2">
                                    <MessageSquare className="h-4 w-4 text-gray-600" />
                                    {agente.totalFeedbacks} feedbacks
                                  </span>
                                </p>
                              </div>
                            </div>
                          </div>
                          
                          {/* Seção Central - Estatísticas do Agente */}
                          <div className="flex items-center gap-4 mx-8">
                            <div className="text-center bg-white/90 px-5 py-4 rounded-xl shadow-inner border border-gray-100">
                              <div className="text-3xl font-bold text-amber-600 mb-1">{agente.feedbacksPendentes}</div>
                              <div className="text-xs font-semibold text-amber-700 uppercase tracking-wider">Pendentes</div>
                            </div>
                            <div className="text-center bg-white/90 px-5 py-4 rounded-xl shadow-inner border border-gray-100">
                              <div className="text-3xl font-bold text-blue-600 mb-1">{agente.feedbacksAceitos}</div>
                              <div className="text-xs font-semibold text-blue-700 uppercase tracking-wider">Aceitos</div>
                            </div>
                            <div className="text-center bg-white/90 px-5 py-4 rounded-xl shadow-inner border border-gray-100">
                              <div className="text-3xl font-bold text-orange-600 mb-1">{agente.feedbacksRevisao}</div>
                              <div className="text-xs font-semibold text-orange-700 uppercase tracking-wider">Revisão</div>
                            </div>
                          </div>

                          {/* Seção Direita - Controle de Expansão */}
                          <div className="flex flex-col items-center gap-3 flex-shrink-0">
                            <div className="p-3 bg-white/90 rounded-xl shadow-inner border border-gray-100 group-hover:bg-white transition-all duration-200 group-hover:scale-110">
                              {expandedAgents.has(agente.agenteId) ? (
                                <ChevronDown className="h-6 w-6 text-green-600" />
                              ) : (
                                <ChevronRight className="h-6 w-6 text-green-600" />
                              )}
                            </div>
                            <div className="text-sm text-green-600 font-semibold">
                              {expandedAgents.has(agente.agenteId) ? 'Recolher' : 'Expandir'}
                            </div>
                          </div>
                        </div>
                      </CollapsibleTrigger>

                      {/* Conteúdo colapsável - Avaliações do Agente */}
                      <CollapsibleContent>
                        <div className="space-y-4 pl-8 pr-6">
                          {/* Cabeçalho das Avaliações */}
                          <div className="flex items-center gap-4 mb-6">
                            <div className="w-2 h-8 bg-gradient-to-b from-green-500 to-emerald-600 rounded-full"></div>
                            <h5 className="text-xl font-bold text-gray-800">
                              Avaliações do Agente
                            </h5>
                            <span className="px-4 py-2 bg-green-100 text-green-700 text-sm font-semibold rounded-full border border-green-200">
                              {agente.totalAvaliacoes} avaliações
                            </span>
                          </div>
                          
                          {/* Lista de Avaliações */}
                          <div className="space-y-4">
                            {agente.avaliacoes.map((avaliacao) => (
                              <div key={avaliacao.avaliacaoId} className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200 shadow-sm">
                                <Collapsible 
                                  open={expandedCalls.has(avaliacao.avaliacaoId)}
                                  onOpenChange={() => toggleCallExpansion(avaliacao.avaliacaoId)}
                                >
                                  <CollapsibleTrigger asChild>
                                    <div className="flex items-center justify-between p-6 cursor-pointer hover:bg-blue-100/50 transition-all duration-200 rounded-xl">
                                      <div className="flex items-center gap-4">
                                        <div className="p-3 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl shadow-sm">
                                          <Phone className="h-5 w-5 text-white" />
                                        </div>
                                        <div>
                                          <h6 className="text-lg font-bold text-gray-900">Avaliação #{avaliacao.avaliacaoId}</h6>
                                          <div className="flex items-center gap-6 mt-1">
                                            <span className="text-sm text-gray-600">{avaliacao.totalFeedbacks} critérios</span>
                                            <span className="text-sm text-gray-600">Performance: {avaliacao.performanceMedia}%</span>
                                            <span className="text-sm text-gray-500">{avaliacao.dataLigacao}</span>
                                          </div>
                                        </div>
                                      </div>
                                      
                                      <div className="flex items-center gap-3">
                                        {/* Botão de Transcrição */}
                                        <button
                                          onClick={() => handleShowTranscriptionSplit(avaliacao.avaliacaoId, avaliacao.avaliacaoId)}
                                          className="flex items-center gap-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white px-3 py-2 rounded-lg transition-all duration-300 text-xs font-semibold shadow-md hover:shadow-lg"
                                        >
                                          <Mic className="h-3 w-3" />
                                          Transcrição
                                        </button>
                                        
                                        <div className="flex items-center gap-2">
                                          <span className="text-xs font-semibold text-amber-600">{avaliacao.feedbacksPendentes}P</span>
                                          <span className="text-xs font-semibold text-blue-600">{avaliacao.feedbacksAceitos}C</span>
                                          <span className="text-xs font-semibold text-orange-600">{avaliacao.feedbacksRevisao}R</span>
                                        </div>
                                        
                                        {expandedCalls.has(avaliacao.avaliacaoId) ? (
                                          <ChevronDown className="h-4 w-4 text-blue-600" />
                                        ) : (
                                          <ChevronRight className="h-4 w-4 text-blue-600" />
                                        )}
                                      </div>
                                    </div>
                                  </CollapsibleTrigger>

                                  {/* Conteúdo da Avaliação - Feedback Geral + Critérios */}
                                  <CollapsibleContent>
                                    <div className="px-6 pb-6 space-y-4">
                                      {/* Feedback Geral da Ligação */}
                                      {feedbacksGerais[avaliacao.avaliacaoId] && !feedbacksGerais[avaliacao.avaliacaoId].error && (
                                        <div className="bg-gradient-to-r from-emerald-50 to-green-50 rounded-xl p-4 border border-emerald-200">
                                          <div className="flex items-start gap-3">
                                            <div className="p-2 bg-gradient-to-br from-emerald-500 to-green-600 rounded-lg">
                                              <Bot className="h-4 w-4 text-white" />
                                            </div>
                                            <div className="flex-1">
                                              <h6 className="text-sm font-bold text-emerald-900 mb-1">Feedback Geral da Ligação</h6>
                                              {feedbacksGerais[avaliacao.avaliacaoId].observacoes_gerais ? (
                                                <div className="bg-white/90 rounded-lg p-3 border border-emerald-200">
                                                  <p className="text-gray-800 text-sm leading-relaxed whitespace-pre-line">
                                                    {feedbacksGerais[avaliacao.avaliacaoId].observacoes_gerais}
                                                  </p>
                                                </div>
                                              ) : (
                                                <p className="text-gray-500 italic text-sm">Feedback geral não disponível.</p>
                                              )}
                                            </div>
                                          </div>
                                        </div>
                                      )}
                                      
                                      {/* Lista de Critérios */}
                                      <div className="grid gap-3">
                                        {avaliacao.feedbacks.map((feedback) => (
                                          <div key={feedback.id} id={`feedback-${feedback.id}`} className="bg-white border border-gray-200 rounded-xl p-4 hover:shadow-md transition-all duration-200">
                                            <div className="flex items-center justify-between">
                                              <div className="flex items-center gap-3 flex-1">
                                                <div className="p-2 bg-gray-100 rounded-lg">
                                                  <span className="text-lg">{getOrigemIcon(feedback.origem)}</span>
                                                </div>
                                                <div>
                                                  <h6 className="text-sm font-bold text-gray-900">{feedback.criterio}</h6>
                                                  <div className="flex items-center gap-4 mt-1">
                                                    <span className={`text-sm font-semibold ${getPerformanceColor(feedback.performanceAtual)}`}>
                                                      {feedback.performanceAtual}%
                                                    </span>
                                                    <span className={`text-xs font-semibold ${getStatusColor(feedback.status)}`}>
                                                      {feedback.status === 'pendente' ? 'Pendente' : 
                                                       feedback.status === 'aceito' ? 'Aceito' : 'Revisão'}
                                                    </span>
                                                  </div>
                                                </div>
                                              </div>
                                              <button
                                                onClick={() => handleVerDetalhes(feedback)}
                                                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-lg text-xs font-semibold transition-all duration-200"
                                              >
                                                <Eye className="h-3 w-3" />
                                                Ver
                                              </button>
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
                        </div>
                      </CollapsibleContent>
                    </Collapsible>
                  </div>
                ))
              ) : (
                /* Exibição original por Ligação (Agentes) */
                feedbacksAgrupados.map((ligacao) => (
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
                         {/* Feedback Geral da Ligação */}
                         {feedbacksGerais[ligacao.callId] && !feedbacksGerais[ligacao.callId].error && (
                           <div className="bg-gradient-to-r from-emerald-50 to-green-50 rounded-2xl p-6 border-2 border-emerald-200 shadow-lg mb-6">
                             <div className="flex items-start gap-4 mb-4">
                               <div className="p-3 bg-gradient-to-br from-emerald-500 to-green-600 rounded-2xl shadow-lg">
                                 <Bot className="h-6 w-6 text-white" />
                               </div>
                               <div className="flex-1">
                                 <h4 className="text-xl font-bold text-emerald-900 mb-2">Feedback Geral da Ligação</h4>
                                 <p className="text-sm text-emerald-700 mb-3">
                                   Análise inteligente completa da ligação #{ligacao.callId}
                                 </p>
                                 {feedbacksGerais[ligacao.callId].observacoes_gerais ? (
                                   <div className="bg-white/90 rounded-xl p-4 border border-emerald-200">
                                     <div className="prose prose-emerald max-w-none">
                                       <p className="text-gray-800 leading-relaxed whitespace-pre-line text-base">
                                         {feedbacksGerais[ligacao.callId].observacoes_gerais}
                                       </p>
                                     </div>
                                   </div>
                                 ) : (
                                   <div className="bg-white/90 rounded-xl p-4 border border-emerald-200">
                                     <p className="text-gray-500 italic">Feedback geral não disponível para esta ligação.</p>
                                   </div>
                                 )}
                               </div>
                             </div>
                           </div>
                         )}
                         
                         {/* Cabeçalho dos Critérios */}
                         <div className="flex items-center justify-between mb-6">
                           <div className="flex items-center gap-4">
                             <div className="w-2 h-8 bg-gradient-to-b from-blue-500 to-indigo-600 rounded-full"></div>
                             <h5 className="text-xl font-bold text-gray-800">
                               Critérios Analisados
                             </h5>
                             <span className="px-4 py-2 bg-blue-100 text-blue-700 text-sm font-semibold rounded-full border border-blue-200">
                               {ligacao.totalFeedbacks} critérios
                             </span>
                           </div>
                           
                           <div className="flex items-center gap-3">
                             {/* Botão de Transcrição */}
                             <button
                               onClick={() => handleShowTranscriptionSplit(ligacao.callId, ligacao.callId)}
                               className="flex items-center gap-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white px-4 py-2 rounded-xl transition-all duration-300 text-sm font-semibold shadow-lg hover:shadow-xl"
                             >
                               <Mic className="h-4 w-4" />
                               Ver Transcrição
                             </button>
                             
                             {/* Botão Aceitar Todos para agentes */}
                             {!isAdmin && ligacao.feedbacksPendentes > 0 && (
                               <button
                                 onClick={() => handleAceitarTodos(ligacao.callId)}
                                 className="flex items-center gap-2 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white px-4 py-2 rounded-xl transition-all duration-300 text-sm font-bold shadow-lg hover:shadow-xl"
                               >
                                 <CheckCheck className="h-4 w-4" />
                                 Aceitar Todos
                               </button>
                             )}
                           </div>
                         </div>
                         
                         {/* Grid de Critérios */}
                         <div className="grid gap-4">
                           {ligacao.feedbacks.map((feedback: FeedbackItem) => (
                             <div key={feedback.id} id={`feedback-${feedback.id}`} className="bg-white border-2 border-gray-100 rounded-2xl p-6 hover:shadow-xl hover:border-blue-200 transition-all duration-300">
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
                                       feedback.status === 'aceito' ? <CheckCircle className="h-4 w-4 mr-2" /> :
                                       <AlertTriangle className="h-4 w-4 mr-2" />}
                                      {feedback.status === 'pendente' ? 'Pendente' : 
                                       feedback.status === 'aceito' ? 'Aceito' : 'Revisão'}
                                    </span>
                                  </div>
                                </div>

                                 {/* Botões de Ação */}
                                 <div className="flex items-center gap-3">
                                   <button
                                     onClick={() => handleVerDetalhes(feedback)}
                                     className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-4 py-2 rounded-xl transition-all duration-300 text-sm font-bold shadow-lg hover:shadow-xl"
                                   >
                                     <Eye className="h-4 w-4" />
                                     Ver
                                   </button>
                                   
                                   {/* Botões específicos para agentes */}
                                   {!isAdmin && feedback.status === 'pendente' && !feedback.contestacaoId && (
                                     <>
                                       <button
                                         onClick={() => handleAceitarFeedback(feedback)}
                                         className="flex items-center gap-2 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white px-4 py-2 rounded-xl transition-all duration-300 text-sm font-bold shadow-lg hover:shadow-xl"
                                       >
                                         <CheckCircle className="h-4 w-4" />
                                         Aceitar
                                       </button>
                                       <button
                                         onClick={() => handleContestarFeedback(feedback)}
                                         className="flex items-center gap-2 bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 text-white px-4 py-2 rounded-xl transition-all duration-300 text-sm font-bold shadow-lg hover:shadow-xl"
                                       >
                                         <MessageCircle className="h-4 w-4" />
                                         Contestar
                                       </button>
                                     </>
                                   )}
                                   
                                   {/* Indicador de contestação */}
                                   {feedback.contestacaoId && (
                                     <div className="flex items-center gap-2 bg-gradient-to-r from-orange-100 to-red-100 text-orange-800 px-4 py-2 rounded-xl border border-orange-200">
                                       <MessageCircle className="h-4 w-4" />
                                       <span className="text-sm font-semibold">
                                         Contestado ({feedback.contestacaoStatus === 'PENDENTE' ? 'Pendente' :
                                                      feedback.contestacaoStatus === 'ACEITA' ? 'Aceito' : 'Rejeitado'})
                                       </span>
                                     </div>
                                   )}
                                 </div>
                               </div>
                             </div>
                           ))}
                         </div>
                       </div>
                     </CollapsibleContent>
                  </Collapsible>
                </div>
                ))
              )}
              {hasNextPage && (
                <div ref={bottomRef} className="py-6 text-center text-gray-500">
                  {isFetchingNextPage ? 'Carregando mais...' : 'Desça para carregar mais'}
                </div>
              )}
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

                  {/* Card de Contestação */}
                  {selectedFeedback.contestacaoId && (
                    <div className="bg-gradient-to-br from-orange-50 to-red-50 rounded-2xl p-6 border border-orange-200">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="p-2 bg-orange-100 rounded-xl">
                          <MessageCircle className="h-5 w-5 text-orange-600" />
                        </div>
                        <h4 className="text-lg font-bold text-orange-800">Contestação do Agente</h4>
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          selectedFeedback.contestacaoStatus === 'PENDENTE' 
                            ? 'bg-yellow-100 text-yellow-800' 
                            : selectedFeedback.contestacaoStatus === 'ACEITA'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {selectedFeedback.contestacaoStatus === 'PENDENTE' ? 'Pendente' :
                           selectedFeedback.contestacaoStatus === 'ACEITA' ? 'Aceita' : 'Rejeitada'}
                        </span>
                      </div>
                      <div className="bg-white rounded-xl p-4 border border-orange-200">
                        <p className="text-gray-700 leading-relaxed whitespace-pre-line text-base">
                          {selectedFeedback.contestacaoComentario}
                        </p>
                        {selectedFeedback.contestacaoCriadoEm && (
                          <p className="text-sm text-gray-500 mt-3">
                            Contestação enviada em: {new Date(selectedFeedback.contestacaoCriadoEm).toLocaleString('pt-BR')}
                          </p>
                        )}
                      </div>
                    </div>
                  )}
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
                         selectedFeedback.status === 'aceito' ? <CheckCircle className="h-5 w-5 text-blue-600" /> :
                         <AlertTriangle className="h-5 w-5 text-orange-600" />}
                      </div>
                      <h4 className="text-lg font-bold text-amber-800">Status</h4>
                    </div>
                    <span className={`inline-flex items-center px-4 py-2 rounded-xl text-sm font-bold ${getStatusColor(selectedFeedback.status)}`}>
                      {selectedFeedback.status === 'pendente' ? 'Pendente' : 
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

              {/* Ações - Só aparece se houver ações disponíveis */}
              {(isMonitor || (!isMonitor && selectedFeedback.status === 'pendente' && !selectedFeedback.contestacaoId)) && (
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
                      
                      {!isMonitor && selectedFeedback.status === 'pendente' && !selectedFeedback.contestacaoId && (
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
              )}

              {/* Ações para Contestação - Só aparece para monitores quando há contestação pendente */}
              {isMonitor && selectedFeedback.contestacaoId && selectedFeedback.contestacaoStatus === 'PENDENTE' && (
                <div className="bg-gradient-to-r from-orange-50 to-red-50 rounded-2xl p-6 border border-orange-200">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div className="text-sm text-orange-700">
                      <p className="font-medium">Analise a contestação do agente e tome uma decisão:</p>
                    </div>
                    
                    <div className="flex flex-wrap gap-3">
                      <button
                        onClick={() => {
                          // Criar objeto contestacao a partir do feedback selecionado
                          const contestacao = {
                            id: selectedFeedback.contestacaoId,
                            criterio_nome: selectedFeedback.criterio,
                            agent_name: selectedFeedback.agenteNome,
                            feedback_comentario: selectedFeedback.observacao,
                            comentario_agente: selectedFeedback.contestacaoComentario
                          };
                          handleAceitarContestacao(contestacao);
                        }}
                        className="flex items-center gap-3 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white px-6 py-3 rounded-xl transition-all duration-300 text-sm font-bold shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 border-2 border-transparent hover:border-green-500"
                      >
                        <CheckCircle className="h-5 w-5" />
                        Aceitar Contestação
                      </button>
                      <button
                        onClick={() => handleEnviarAnalise(false)}
                        className="flex items-center gap-3 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white px-6 py-3 rounded-xl transition-all duration-300 text-sm font-bold shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 border-2 border-transparent hover:border-red-500"
                      >
                        <XCircle className="h-5 w-5" />
                        Rejeitar Contestação
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal de Edição de Feedback */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-2xl mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Editar Feedback</h3>
              <button onClick={handleCancelarEdicao} className="text-gray-400 hover:text-gray-600">
                <X className="h-6 w-6" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select
                  value={editForm.status}
                  onChange={(e) => setEditForm((f) => ({ ...f, status: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="ENVIADO">Pendente</option>
                  <option value="ACEITO">Aceito</option>
                  <option value="REVISAO">Em Revisão</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Comentário</label>
                <textarea
                  value={editForm.comentario}
                  onChange={(e) => setEditForm((f) => ({ ...f, comentario: e.target.value }))}
                  rows={6}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Escreva o comentário do feedback..."
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  onClick={handleCancelarEdicao}
                  className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 bg-white hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSalvarEdicao}
                  className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
                >
                  <Edit3 className="h-4 w-4" />
                  Salvar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Contestação */}
      {showContestacaoModal && feedbackParaContestar && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl">
            <div className="bg-gradient-to-r from-orange-600 to-red-700 px-8 py-6 text-white rounded-t-3xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-sm">
                    <MessageCircle className="h-8 w-8 text-white" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold">
                      {tipoAcao === 'contestar' ? 'Contestar Feedback' : 'Rejeitar Feedback'}
                    </h3>
                    <p className="text-orange-100 text-lg">{feedbackParaContestar.criterio}</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowContestacaoModal(false)}
                  className="p-2 hover:bg-white/20 rounded-xl transition-all duration-200"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
            </div>

            <div className="p-8">
              <div className="mb-6">
                <h4 className="text-lg font-bold text-gray-800 mb-3">Feedback Original:</h4>
                <div className="bg-gray-50 rounded-xl p-4 border">
                  <p className="text-gray-700 leading-relaxed">{feedbackParaContestar.observacao}</p>
                </div>
              </div>

              <div className="mb-6">
                <label className="block text-lg font-bold text-gray-800 mb-3">
                  {tipoAcao === 'contestar' ? 'Sua Contestação:' : 'Motivo da Rejeição:'}
                </label>
                <textarea
                  value={comentarioContestacao}
                  onChange={(e) => setComentarioContestacao(e.target.value)}
                  rows={6}
                  className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all duration-200"
                  placeholder={tipoAcao === 'contestar' 
                    ? "Explique por que você não concorda com este feedback..."
                    : "Explique por que você está rejeitando este feedback..."
                  }
                />
              </div>

              <div className="flex justify-end gap-4">
                <button
                  onClick={() => setShowContestacaoModal(false)}
                  className="px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-all duration-200 font-semibold"
                >
                  Cancelar
                </button>
                <button
                  onClick={siarContestacao}
                  className="px-6 py-3 bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 text-white rounded-xl transition-all duration-200 font-semibold shadow-lg hover:shadow-xl"
                >
                  {tipoAcao === 'contestar' ? 'Enviar Contestação' : 'Enviar Rejeição'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Análise de Contestação (para admins) */}
      {showAnaliseModal && contestacaoParaAnalisar && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-3xl">
            <div className="bg-gradient-to-r from-purple-600 to-indigo-700 px-8 py-6 text-white rounded-t-3xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-sm">
                    <Shield className="h-8 w-8 text-white" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold">Analisar Contestação</h3>
                    <p className="text-purple-100 text-lg">{contestacaoParaAnalisar.criterio_nome}</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowAnaliseModal(false)}
                  className="p-2 hover:bg-white/20 rounded-xl transition-all duration-200"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
            </div>

            <div className="p-8">
              <div className="grid grid-cols-2 gap-6 mb-6">
                <div>
                  <h4 className="text-lg font-bold text-gray-800 mb-3">Feedback Original:</h4>
                  <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
                    <p className="text-gray-700 leading-relaxed">{contestacaoParaAnalisar.feedback_comentario}</p>
                  </div>
                </div>
                <div>
                  <h4 className="text-lg font-bold text-gray-800 mb-3">Contestação do Agente:</h4>
                  <div className="bg-orange-50 rounded-xl p-4 border border-orange-200">
                    <p className="text-gray-700 leading-relaxed">{contestacaoParaAnalisar.comentario_agente}</p>
                  </div>
                </div>
              </div>

              <div className="mb-6">
                <h4 className="text-lg font-bold text-gray-800 mb-3">Decisão:</h4>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <input
                      type="radio"
                      id="aceitar"
                      name="decisao"
                      checked={true}
                      className="w-4 h-4 text-green-600"
                    />
                    <label htmlFor="aceitar" className="text-gray-700 font-medium">
                      Aceitar contestação e alterar resultado
                    </label>
                  </div>
                  <div className="ml-7">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Novo resultado:
                    </label>
                    <select
                      value={novoResultado}
                      onChange={(e) => setNovoResultado(e.target.value as any)}
                      className="border-2 border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                    >
                      <option value="CONFORME">CONFORME</option>
                      <option value="NAO_SE_APLICA">NÃO SE APLICA</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="mb-6">
                <h4 className="text-lg font-bold text-gray-800 mb-3">Comentário do Monitor:</h4>
                <textarea
                  value={comentarioMonitor}
                  onChange={(e) => setComentarioMonitor(e.target.value)}
                  rows={4}
                  className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200"
                  placeholder="Digite suas observações sobre esta contestação (opcional)..."
                />
                <p className="text-sm text-gray-500 mt-2">
                  Este comentário será salvo junto com sua decisão e poderá ser visualizado pelo agente.
                </p>
              </div>

              <div className="flex justify-end gap-4">
                <button
                  onClick={() => {
                    setShowAnaliseModal(false);
                    setComentarioMonitor('');
                  }}
                  className="px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-all duration-200 font-semibold"
                >
                  Cancelar
                </button>
                <button
                  onClick={() => handleEnviarAnalise(false)}
                  className="px-6 py-3 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white rounded-xl transition-all duration-200 font-semibold shadow-lg hover:shadow-xl"
                >
                  Rejeitar Contestação
                </button>
                <button
                  onClick={() => handleEnviarAnalise(true)}
                  className="px-6 py-3 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white rounded-xl transition-all duration-200 font-semibold shadow-lg hover:shadow-xl"
                >
                  Aceitar Contestação
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Contestações Pendentes */}
      {showContestacoesModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-hidden">
            <div className="bg-gradient-to-r from-orange-600 to-red-700 px-8 py-6 text-white">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-sm">
                    <MessageCircle className="h-8 w-8 text-white" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold">Contestações Pendentes</h3>
                    <p className="text-orange-100 text-lg">{contestacoesPendentes.length} contestações aguardando análise</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowContestacoesModal(false)}
                  className="p-2 hover:bg-white/20 rounded-xl transition-all duration-200"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
            </div>

            <div className="p-8 overflow-y-auto max-h-[calc(90vh-120px)]">
              {contestacoesPendentes.length === 0 ? (
                <div className="text-center py-12">
                  <MessageCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">Nenhuma contestação pendente encontrada.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {contestacoesPendentes.map((contestacao) => (
                    <div key={contestacao.id} className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-2xl p-6 border border-gray-200 hover:shadow-lg transition-all duration-200">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-4 mb-4">
                            <div className="p-3 bg-gradient-to-br from-orange-500 to-red-600 rounded-xl">
                              <User className="h-6 w-6 text-white" />
                            </div>
                            <div>
                              <h4 className="text-xl font-bold text-gray-900">{contestacao.agent_name}</h4>
                              <p className="text-sm text-gray-600">Critério: {contestacao.criterio_nome}</p>
                              <p className="text-xs text-gray-500">Contestação #{contestacao.id} • {new Date(contestacao.criado_em).toLocaleString('pt-BR')}</p>
                            </div>
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                            <div>
                              <h5 className="text-sm font-bold text-gray-700 mb-2">Feedback Original:</h5>
                              <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
                                <p className="text-sm text-gray-700">{contestacao.feedback_comentario}</p>
                              </div>
                            </div>
                            <div>
                              <h5 className="text-sm font-bold text-gray-700 mb-2">Contestação do Agente:</h5>
                              <div className="bg-orange-50 rounded-lg p-3 border border-orange-200">
                                <p className="text-sm text-gray-700">{contestacao.comentario_agente}</p>
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        <div className="ml-4 flex flex-col gap-2">
                          <button
                            onClick={() => handleVerFeedback(contestacao)}
                            className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-4 py-2 rounded-xl transition-all duration-300 text-sm font-bold shadow-lg hover:shadow-xl"
                          >
                            <Eye className="h-4 w-4" />
                            Ver Feedback
                          </button>
                          <div className="flex gap-2">
                            <button
                              onClick={() => {
                                setShowContestacoesModal(false);
                                handleAceitarContestacao(contestacao);
                              }}
                              className="flex items-center gap-2 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white px-4 py-2 rounded-xl transition-all duration-300 text-sm font-bold shadow-lg hover:shadow-xl"
                            >
                              <CheckCircle className="h-4 w-4" />
                              Aceitar
                            </button>
                            <button
                              onClick={() => {
                                setShowContestacoesModal(false);
                                handleAnalisarContestacao(contestacao);
                              }}
                              className="flex items-center gap-2 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white px-4 py-2 rounded-xl transition-all duration-300 text-sm font-bold shadow-lg hover:shadow-xl"
                            >
                              <XCircle className="h-4 w-4" />
                              Rejeitar
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal de Aceitar Contestação */}
      {showAceitarModal && contestacaoParaAnalisar && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl">
            <div className="bg-gradient-to-r from-green-600 to-emerald-700 px-8 py-6 text-white rounded-t-3xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-sm">
                    <CheckCircle className="h-8 w-8 text-white" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold">Aceitar Contestação</h3>
                    <p className="text-green-100 text-lg">{contestacaoParaAnalisar.criterio_nome}</p>
                    <p className="text-green-200 text-sm">Agente: {contestacaoParaAnalisar.agent_name}</p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setShowAceitarModal(false);
                    setComentarioMonitor('');
                  }}
                  className="p-2 hover:bg-white/20 rounded-xl transition-all duration-200"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
            </div>

            <div className="p-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div>
                  <h4 className="text-lg font-bold text-gray-800 mb-3">Feedback Original:</h4>
                  <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
                    <p className="text-gray-700 leading-relaxed">{contestacaoParaAnalisar.feedback_comentario}</p>
                  </div>
                </div>
                <div>
                  <h4 className="text-lg font-bold text-gray-800 mb-3">Contestação do Agente:</h4>
                  <div className="bg-orange-50 rounded-xl p-4 border border-orange-200">
                    <p className="text-gray-700 leading-relaxed">{contestacaoParaAnalisar.comentario_agente}</p>
                  </div>
                </div>
              </div>

              <div className="mb-6">
                <h4 className="text-lg font-bold text-gray-800 mb-3">Novo Resultado:</h4>
                <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-4 border border-green-200">
                  <p className="text-sm text-green-700 mb-3">
                    Ao aceitar esta contestação, o resultado será alterado de <strong>NAO CONFORME</strong> para:
                  </p>
                  <select
                    value={novoResultado}
                    onChange={(e) => setNovoResultado(e.target.value as any)}
                    className="w-full border-2 border-green-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-200 bg-white"
                  >
                    <option value="CONFORME">CONFORME</option>
                    <option value="NAO_SE_APLICA">NÃO SE APLICA</option>
                  </select>
                  <p className="text-xs text-green-600 mt-2">
                    Esta alteração irá recalcular automaticamente a pontuação da avaliação.
                  </p>
                </div>
              </div>

              <div className="mb-6">
                <h4 className="text-lg font-bold text-gray-800 mb-3">Comentário do Monitor:</h4>
                <textarea
                  value={comentarioMonitor}
                  onChange={(e) => setComentarioMonitor(e.target.value)}
                  rows={4}
                  className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-200"
                  placeholder="Digite suas observações sobre esta decisão (opcional)..."
                />
                <p className="text-sm text-gray-500 mt-2">
                  Este comentário será salvo junto com sua decisão e poderá ser visualizado pelo agente.
                </p>
              </div>

              <div className="flex justify-end gap-4">
                <button
                  onClick={() => {
                    setShowAceitarModal(false);
                    setComentarioMonitor('');
                  }}
                  className="px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-all duration-200 font-semibold"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleConfirmarAceitacao}
                  className="px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white rounded-xl transition-all duration-200 font-semibold shadow-lg hover:shadow-xl flex items-center gap-2"
                >
                  <CheckCircle className="h-5 w-5" />
                  Confirmar Aceitação
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Aceitar Contestação */}
      {showAceitarModal && contestacaoParaAnalisar && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl">
            <div className="bg-gradient-to-r from-green-600 to-emerald-700 px-8 py-6 text-white rounded-t-3xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-sm">
                    <CheckCircle className="h-8 w-8 text-white" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold">Aceitar Contestação</h3>
                    <p className="text-green-100 text-lg">{contestacaoParaAnalisar.criterio_nome}</p>
                    <p className="text-green-200 text-sm">Agente: {contestacaoParaAnalisar.agent_name}</p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setShowAceitarModal(false);
                    setComentarioMonitor('');
                  }}
                  className="p-2 hover:bg-white/20 rounded-xl transition-all duration-200"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
            </div>

            <div className="p-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div>
                  <h4 className="text-lg font-bold text-gray-800 mb-3">Feedback Original:</h4>
                  <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
                    <p className="text-gray-700 leading-relaxed">{contestacaoParaAnalisar.feedback_comentario}</p>
                  </div>
                </div>
                <div>
                  <h4 className="text-lg font-bold text-gray-800 mb-3">Contestação do Agente:</h4>
                  <div className="bg-orange-50 rounded-xl p-4 border border-orange-200">
                    <p className="text-gray-700 leading-relaxed">{contestacaoParaAnalisar.comentario_agente}</p>
                  </div>
                </div>
              </div>

              <div className="mb-6">
                <h4 className="text-lg font-bold text-gray-800 mb-3">Novo Resultado:</h4>
                <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-4 border border-green-200">
                  <p className="text-sm text-green-700 mb-3">
                    Ao aceitar esta contestação, o resultado será alterado de <strong>NAO CONFORME</strong> para:
                  </p>
                  <select
                    value={novoResultado}
                    onChange={(e) => setNovoResultado(e.target.value as any)}
                    className="w-full border-2 border-green-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-200 bg-white"
                  >
                    <option value="CONFORME">CONFORME</option>
                    <option value="NAO_SE_APLICA">NÃO SE APLICA</option>
                  </select>
                  <p className="text-xs text-green-600 mt-2">
                    Esta alteração irá recalcular automaticamente a pontuação da avaliação.
                  </p>
                </div>
              </div>

              <div className="mb-6">
                <h4 className="text-lg font-bold text-gray-800 mb-3">Comentário do Monitor:</h4>
                <textarea
                  value={comentarioMonitor}
                  onChange={(e) => setComentarioMonitor(e.target.value)}
                  rows={4}
                  className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-200"
                  placeholder="Digite suas observações sobre esta decisão (opcional)..."
                />
                <p className="text-sm text-gray-500 mt-2">
                  Este comentário será salvo junto com sua decisão e poderá ser visualizado pelo agente.
                </p>
              </div>

              <div className="flex justify-end gap-4">
                <button
                  onClick={() => {
                    setShowAceitarModal(false);
                    setComentarioMonitor('');
                  }}
                  className="px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-all duration-200 font-semibold"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleConfirmarAceitacao}
                  className="px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white rounded-xl transition-all duration-200 font-semibold shadow-lg hover:shadow-xl flex items-center gap-2"
                >
                  <CheckCircle className="h-5 w-5" />
                  Confirmar Aceitação
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Transcrição Separado */}
      {expandedCallWithTranscription && (
        <div className="fixed inset-0 flex items-end justify-end z-50 p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
            {/* Header do Modal de Transcrição */}
            <div className="bg-gradient-to-r from-purple-600 to-indigo-700 px-8 py-6 text-white">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-sm">
                    <Mic className="h-8 w-8 text-white" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold">Transcrição da Ligação</h3>
                    <p className="text-purple-100 text-lg">Ligação #{expandedCallWithTranscription}</p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setExpandedCallWithTranscription(null);
                    setSelectedCallForTranscription(null);
                  }}
                  className="p-2 hover:bg-white/20 rounded-xl transition-all duration-200 group"
                >
                  <X className="h-6 w-6 group-hover:scale-110 transition-transform" />
                </button>
              </div>
            </div>

            {/* Conteúdo da Transcrição */}
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
              <TranscriptionModal
                isOpen={true}
                onClose={() => {
                  setExpandedCallWithTranscription(null);
                  setSelectedCallForTranscription(null);
                }}
                avaliacaoId={expandedCallWithTranscription}
                callId={expandedCallWithTranscription}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Feedback; 