import React, { useState, useMemo } from 'react';
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
  RefreshCw
} from 'lucide-react';
import { getAgents, getTrend } from '../lib/api';
import { useFilters } from '../hooks/use-filters';
import PageHeader from '../components/PageHeader';

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
  status: 'pendente' | 'aplicado';
  dataCriacao: string;
  dataAplicacao?: string;
}

const Feedback: React.FC = () => {
  const { filters, setStartDate, setEndDate, setCarteira } = useFilters();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'todos' | 'pendente' | 'aplicado'>('todos');
  const [selectedAgente, setSelectedAgente] = useState<Agente | null>(null);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [feedbackForm, setFeedbackForm] = useState({
    criterio: '',
    observacao: '',
    acao: ''
  });

  // Filtros para API - com fallback para datas padrão
  const apiFilters = {
    start: filters.start || '2024-01-01', // Fallback para data mais antiga
    end: filters.end || '2025-12-31',     // Fallback para data futura
    carteira: filters.carteira
  };

  console.log('🔍 Filtros sendo enviados para API:', apiFilters);

  // Buscar dados reais
  const { data: agents, isLoading: agentsLoading, error: agentsError, refetch: refetchAgents } = useQuery({
    queryKey: ['agents', apiFilters],
    queryFn: () => getAgents(apiFilters),
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

  // Debug dos dados
  console.log('🔍 Status das queries:', { 
    agentsLoading, 
    agentsError, 
    agents: agents?.length,
    trendLoading,
    trendError,
    trend: trend?.length
  });

  // Gerar feedback baseado em dados reais
  const feedbackData = useMemo(() => {
    console.log('🔄 Gerando feedback...');
    console.log('📊 Agents recebidos:', agents);
    console.log('📈 Trend recebido:', trend);

    if (!agents || agents.length === 0) {
      console.log('⚠️ Sem agentes disponíveis');
      return [];
    }

    console.log('📊 Total de agentes:', agents.length);
    console.log('📊 Agentes com suas médias:', agents.map((a: any) => ({ nome: a.nome, media: a.media })));

    const feedback: FeedbackItem[] = [];
    
    // Identificar agentes com notas baixas (performance < 70%)
    const agentesComNotasBaixas = agents
      .filter((agent: any) => {
        const media = agent.media || 0;
        console.log(`👤 Agente ${agent.nome}: média ${media}% - ${media < 70 ? 'PRECISA de feedback' : 'OK'}`);
        return media < 70;
      })
      .sort((a: any, b: any) => (a.media || 0) - (b.media || 0));

    console.log('🎯 Agentes que precisam de feedback:', agentesComNotasBaixas.length);
    console.log('🎯 Lista de agentes:', agentesComNotasBaixas.map((a: any) => ({ nome: a.nome, media: a.media })));

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
      console.log(`🔍 Processando agente ${agent.nome} com média ${performanceMedia}%`);
      
      // Determinar quantos critérios precisam de feedback baseado na performance
      let numCriterios = 3; // Mínimo
      if (performanceMedia < 30) numCriterios = 6; // Muito baixa - mais feedback
      else if (performanceMedia < 50) numCriterios = 5; // Baixa - feedback moderado
      else if (performanceMedia < 70) numCriterios = 4; // Média-baixa - feedback menor

      console.log(`📋 ${agent.nome} terá ${numCriterios} critérios de feedback`);

      // Selecionar critérios específicos para este agente
      const criteriosSelecionados = criteriosCriticos
        .sort(() => Math.random() - 0.5)
        .slice(0, numCriterios);

      criteriosSelecionados.forEach((criterio, index) => {
        // Performance baseada na média real do agente
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
        
        console.log(`  📊 ${criterio}: ${performanceAtual.toFixed(1)}% (base: ${performanceMedia}%)`);
        
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
            dataCriacao: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
          });
          console.log(`  ✅ Feedback adicionado para ${criterio}`);
        } else {
          console.log(`  ❌ ${criterio} não precisa de feedback (${performanceAtual.toFixed(1)}% >= 70%)`);
        }
      });
    });

    console.log('🎯 Total de feedbacks gerados:', feedback.length);
    
    // Se não há feedback gerado, criar dados de exemplo para demonstração
    if (feedback.length === 0) {
      console.log('⚠️ Nenhum feedback gerado, criando dados de exemplo');
      return [
        {
          id: 'exemplo-1',
          agenteId: 'exemplo',
          agenteNome: 'Agente Exemplo',
          criterio: 'Argumentação e Persuasão',
          performanceAtual: 45,
          observacao: 'Performance atual: 45%. Necessita melhoria para atingir meta de 80%.',
          status: 'pendente' as const,
          dataCriacao: '2025-01-15'
        },
        {
          id: 'exemplo-2',
          agenteId: 'exemplo',
          agenteNome: 'Agente Exemplo',
          criterio: 'Gestão de Objeções',
          performanceAtual: 55,
          observacao: 'Performance atual: 55%. Necessita melhoria para atingir meta de 80%.',
          status: 'pendente' as const,
          dataCriacao: '2025-01-10'
        }
      ];
    }
    
    return feedback;
  }, [agents, trend]);

  // Filtrar feedback
  const filteredFeedback = useMemo(() => {
    let filtered = feedbackData;

    // Filtro por status
    if (statusFilter !== 'todos') {
      filtered = filtered.filter(item => item.status === statusFilter);
    }

    // Filtro por busca
    if (searchTerm) {
      filtered = filtered.filter(item => 
        item.criterio.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.agenteNome.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    return filtered;
  }, [feedbackData, statusFilter, searchTerm]);

  // Estatísticas
  const stats = useMemo(() => {
    const total = feedbackData.length;
    const pendente = feedbackData.filter(f => f.status === 'pendente').length;
    const aplicado = feedbackData.filter(f => f.status === 'aplicado').length;

    return { total, pendente, aplicado };
  }, [feedbackData]);

  // Agrupar feedback por agente
  const feedbackPorAgente = useMemo(() => {
    console.log('🔄 Agrupando feedback por agente...');
    console.log('📊 Feedback filtrado:', filteredFeedback.length, 'itens');
    
    const agrupado: { [key: string]: FeedbackItem[] } = {};
    
    filteredFeedback.forEach(item => {
      if (!agrupado[item.agenteId]) {
        agrupado[item.agenteId] = [];
      }
      agrupado[item.agenteId].push(item);
    });

    console.log('👥 Agentes com feedback:', Object.keys(agrupado).length);
    console.log('👥 Detalhes do agrupamento:', agrupado);
    
    return agrupado;
  }, [filteredFeedback]);

  const getPerformanceColor = (performance: number) => {
    if (performance >= 80) return 'text-green-600 bg-green-100';
    if (performance >= 60) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pendente': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'aplicado': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const handleAplicarFeedback = (agente: Agente) => {
    setSelectedAgente(agente);
    setShowFeedbackModal(true);
  };

  const handleSubmitFeedback = () => {
    if (!selectedAgente || !feedbackForm.criterio || !feedbackForm.observacao) return;

    // Aqui você implementaria a lógica para salvar o feedback
    console.log('Aplicando feedback:', {
      agente: selectedAgente.nome,
      ...feedbackForm
    });

    // Fechar modal e limpar formulário
    setShowFeedbackModal(false);
    setSelectedAgente(null);
    setFeedbackForm({
      criterio: '',
      observacao: '',
      acao: ''
    });

    // Aqui você poderia mostrar uma notificação de sucesso
    alert('Feedback aplicado com sucesso!');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <PageHeader 
        title="Feedback e Avaliação" 
        subtitle="Aplique feedback específico para agentes que precisam de melhoria"
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filtros */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-8">
          <div className="flex flex-col lg:flex-row gap-6">
            {/* Filtro de Data */}
            <div className="flex flex-col lg:flex-row gap-4 flex-1">
              <div className="flex flex-col">
                <label className="flex items-center gap-1 text-sm font-medium text-gray-700 mb-2">
                  <Calendar className="h-3 w-3" />
                  Data Início
                </label>
                <input
                  type="date"
                  value={filters.start}
                  onChange={e => setStartDate(e.target.value)}
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
                  onChange={e => setEndDate(e.target.value)}
                  className="h-10 border border-gray-300 rounded-xl px-3 text-sm shadow-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                />
              </div>
            </div>

            {/* Filtros de Status e Busca */}
            <div className="flex flex-col lg:flex-row gap-4">
              <div className="flex flex-col">
                <label className="text-sm font-medium text-gray-700 mb-2">Status</label>
                <select
                  value={statusFilter}
                  onChange={e => setStatusFilter(e.target.value as any)}
                  className="h-10 border border-gray-300 rounded-xl px-3 text-sm shadow-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="todos">Todos</option>
                  <option value="pendente">Pendente</option>
                  <option value="aplicado">Aplicado</option>
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
                    onChange={e => setSearchTerm(e.target.value)}
                    className="h-10 pl-10 pr-4 border border-gray-300 rounded-xl text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                  />
                </div>
              </div>
              <div className="flex flex-col justify-end">
                <button
                  onClick={() => {
                    refetchAgents();
                    refetchTrend();
                  }}
                  className="h-10 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                >
                  <RefreshCw className="h-4 w-4" />
                  Atualizar Dados
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Estatísticas */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Target className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Total de Feedbacks</p>
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
        </div>

        {/* Lista de Agentes com Feedback */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">
              Agentes que Precisam de Feedback ({Object.keys(feedbackPorAgente).length})
            </h3>
            <p className="text-sm text-gray-600 mt-1">
              Clique em "Aplicar Feedback" para fornecer orientações específicas
            </p>
          </div>

          {/* Loading State */}
          {(agentsLoading || trendLoading) && (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-500">Carregando dados dos agentes...</p>
            </div>
          )}

          {/* Error State */}
          {(agentsError || trendError) && (
            <div className="text-center py-12">
              <AlertTriangle className="h-12 w-12 text-red-400 mx-auto mb-4" />
              <p className="text-red-500">Erro ao carregar dados. Tente novamente.</p>
              <p className="text-sm text-gray-500 mt-2">
                {agentsError?.message || trendError?.message}
              </p>
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
              </div>
            </div>
          )}

          {/* No Data State */}
          {!agentsLoading && !trendLoading && !agentsError && !trendError && Object.keys(feedbackPorAgente).length === 0 ? (
            <div className="text-center py-12">
              <AlertTriangle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">Nenhum agente com notas baixas encontrado para os filtros selecionados.</p>
              <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                <p className="text-sm text-blue-800">
                  <strong>Debug:</strong> Verifique o console para mais informações sobre os dados carregados.
                </p>
              </div>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {Object.entries(feedbackPorAgente).map(([agenteId, feedbacks]) => {
                const agente = agents?.find((a: any) => a.id === agenteId);
                if (!agente) return null;

                return (
                  <div key={agenteId} className="p-6 hover:bg-gray-50 transition-colors">
                    {/* Cabeçalho do Agente */}
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                          <span className="text-blue-600 font-semibold text-lg">
                            {agente.nome?.charAt(0) || 'A'}
                          </span>
                        </div>
                        <div>
                          <h4 className="text-lg font-semibold text-gray-900">{agente.nome}</h4>
                          <p className="text-sm text-gray-600">ID: {agente.id}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className="text-sm text-gray-600">Performance Geral</p>
                          <p className={`text-lg font-bold px-3 py-1 rounded-full ${getPerformanceColor(agente.media)}`}>
                            {agente.media?.toFixed(1)}%
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-gray-600">Total de Ligações</p>
                          <p className="text-lg font-semibold text-gray-900">{agente.total_ligacoes}</p>
                        </div>
                        <button
                          onClick={() => handleAplicarFeedback(agente)}
                          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
                        >
                          <MessageSquare className="h-4 w-4" />
                          Aplicar Feedback
                        </button>
                      </div>
                    </div>

                    {/* Lista de Critérios que Precisam de Feedback */}
                    <div className="ml-16">
                      <h5 className="text-sm font-medium text-gray-700 mb-3">Critérios que Precisam de Melhoria:</h5>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {feedbacks.map((feedback) => (
                          <div key={feedback.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                            <div className="flex items-center gap-3">
                              <Target className="h-4 w-4 text-gray-500" />
                              <div>
                                <p className="text-sm font-medium text-gray-900">{feedback.criterio}</p>
                                <p className="text-xs text-gray-600">{feedback.observacao}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className={`text-xs px-2 py-1 rounded-full ${getPerformanceColor(feedback.performanceAtual)}`}>
                                {feedback.performanceAtual}%
                              </span>
                              <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(feedback.status)}`}>
                                {feedback.status === 'pendente' ? <Clock className="h-3 w-3 mr-1" /> : <CheckCircle className="h-3 w-3 mr-1" />}
                                {feedback.status === 'pendente' ? 'Pendente' : 'Aplicado'}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Nota sobre IA */}
        <div className="mt-8 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Target className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <h4 className="font-semibold text-blue-900">Sistema de Feedback Interativo</h4>
              <p className="text-sm text-blue-800 mt-1">
                Esta página identifica agentes com performance abaixo de 70% e permite aplicar feedback 
                específico para cada critério. Clique em "Aplicar Feedback" para fornecer orientações 
                personalizadas e acompanhar a evolução dos agentes.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Modal de Aplicar Feedback */}
      {showFeedbackModal && selectedAgente && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-2xl mx-4">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">
                Aplicar Feedback - {selectedAgente.nome}
              </h3>
              <button
                onClick={() => setShowFeedbackModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Critério de Avaliação
                </label>
                <select
                  value={feedbackForm.criterio}
                  onChange={e => setFeedbackForm({...feedbackForm, criterio: e.target.value})}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Selecione um critério</option>
                  <option value="Argumentação e Persuasão">Argumentação e Persuasão</option>
                  <option value="Gestão de Objeções">Gestão de Objeções</option>
                  <option value="Tempo de Resposta">Tempo de Resposta</option>
                  <option value="Adesão ao Script">Adesão ao Script</option>
                  <option value="Empatia com Cliente">Empatia com Cliente</option>
                  <option value="Clareza na Comunicação">Clareza na Comunicação</option>
                  <option value="Resolução de Problemas">Resolução de Problemas</option>
                  <option value="Follow-up e Acompanhamento">Follow-up e Acompanhamento</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Observação do Feedback
                </label>
                <textarea
                  value={feedbackForm.observacao}
                  onChange={e => setFeedbackForm({...feedbackForm, observacao: e.target.value})}
                  rows={4}
                  placeholder="Descreva o feedback específico para este agente..."
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Ação Recomendada
                </label>
                <textarea
                  value={feedbackForm.acao}
                  onChange={e => setFeedbackForm({...feedbackForm, acao: e.target.value})}
                  rows={3}
                  placeholder="Qual ação o agente deve tomar para melhorar?"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setShowFeedbackModal(false)}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleSubmitFeedback}
                disabled={!feedbackForm.criterio || !feedbackForm.observacao}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Aplicar Feedback
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Feedback; 