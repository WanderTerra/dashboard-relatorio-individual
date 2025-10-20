import React, { useState, useEffect } from 'react';
import { Link, useParams, useLocation } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { getMixedCallItems, getMixedAgentSummary, getMixedCallerInfo, getFeedbacksByAvaliacao, getAvaliacaoById } from '../lib/api';
import { formatItemName, formatAgentName, organizeItemsByCategory, formatDate } from '../lib/format';
import ItemEditModal from '../components/ItemEditModal';
import TranscriptionModal from '../components/TranscriptionModal';
import PageHeader from '../components/PageHeader';
import { useFilters } from '../hooks/use-filters';
import { useAuth } from '../contexts/AuthContext';

interface Item {
  id: string;
  categoria:  string;
  descricao:  string;
  resultado:  'CONFORME' | 'NAO CONFORME' | 'NAO SE APLICA';
}

const cor = (r: Item['resultado']) =>
  r === 'CONFORME'      ? 'text-green-600'
  : r === 'NAO SE APLICA'? 'text-gray-600'
  :                       'text-red-600';

export default function CallItems() {  const { avaliacaoId } = useParams();
  const location = useLocation();
  const agentId = location.state?.agentId;
  const [callData, setCallData] = useState(location.state?.callData); // Dados da ligação passados da página anterior
  const { filters } = useFilters();
  
  // Construir objeto de filtros para a API (incluindo apenas parâmetros com valores)
  const apiFilters = { 
    ...(filters.start ? { start: filters.start } : {}),
    ...(filters.end ? { end: filters.end } : {}),
    ...(filters.carteira ? { carteira: filters.carteira } : {}) 
  };
    // Estado para controlar o modal de edição
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editedItems, setEditedItems] = useState<Set<string>>(new Set());
  const [isTranscriptionModalOpen, setIsTranscriptionModalOpen] = useState(false);
  const { data = [], isLoading } = useQuery<Item[]>({
    queryKey: ['mixed-callItems', avaliacaoId],
    queryFn : async () => {
      const items = await getMixedCallItems(avaliacaoId!);
      console.log(`📋 Itens recebidos para avaliação ${avaliacaoId}:`, items);
      if (items && items.length > 0) {
        console.log(`🔍 Primeiro item:`, items[0]);
        console.log(`📝 Campos disponíveis no primeiro item:`, Object.keys(items[0]));
      }
      return items;
    },
  });

  // Buscar critérios para obter os nomes corretos
  const { data: criterios = [] } = useQuery({
    queryKey: ['criterios'],
    queryFn: async () => {
      try {
        const response = await fetch('/api/criterios/', {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('auth_token')}` }
        });
        if (response.ok) {
          const criterios = await response.json();
          console.log(`📚 Critérios carregados:`, criterios);
          console.log(`🔍 Primeiros 5 critérios:`, criterios.slice(0, 5));
          return criterios;
        }
        return [];
      } catch (error) {
        console.warn('Erro ao carregar critérios:', error);
        return [];
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutos
  });

  // Buscar a estrutura da carteira baseada no avaliacaoId
  const { data: carteiraStructure } = useQuery({
    queryKey: ['carteiraStructure', avaliacaoId],
    queryFn: async () => {
      try {
        // Tentar buscar a estrutura da carteira para obter a ordem e categorização
        const response = await fetch(`/api/carteiras/structure-by-avaliacao/${avaliacaoId}`);
        if (!response.ok) {
          // Se o endpoint não existir, retornar null para usar fallback
          console.warn('Endpoint de estrutura de carteira não disponível, usando organização padrão');
          return null;
        }
        return response.json();
      } catch (error) {
        console.warn('Erro ao buscar estrutura da carteira, usando organização padrão:', error);
        return null;
      }
    },
    enabled: !!avaliacaoId,
    retry: false // Não tentar novamente se falhar
  });

  // Função para encontrar o nome correto do critério
  const getCriterioName = (item: any) => {
    console.log(`🔍 Processando item:`, item);
    
    // Se categoria contém underscore (nome técnico específico), usar ela
    if (item.categoria && item.categoria.includes('_')) {
      console.log(`✅ Usando categoria técnica: ${item.categoria}`);
      return formatItemName(item.categoria);
    }
    
    // Tentar encontrar o critério na lista de critérios pelo ID ou categoria
    if (criterios && criterios.length > 0) {
      console.log(`🔍 Buscando critério para categoria: ${item.categoria}`);
      
      // Buscar por categoria exata
      let criterio = criterios.find((c: any) => c.categoria === item.categoria);
      if (criterio) {
        console.log(`✅ Encontrado por categoria:`, criterio);
        return formatItemName(criterio.nome);
      }
      
      // Buscar por nome exato
      criterio = criterios.find((c: any) => c.nome === item.categoria);
      if (criterio) {
        console.log(`✅ Encontrado por nome:`, criterio);
        return formatItemName(criterio.nome);
      }
      
      // Buscar por ID se existir
      if (item.criterio_id) {
        criterio = criterios.find((c: any) => c.id === item.criterio_id);
        if (criterio) {
          console.log(`✅ Encontrado por ID:`, criterio);
          return formatItemName(criterio.nome);
        }
      }
      
      console.log(`❌ Critério não encontrado para: ${item.categoria}`);
    }
    
    // Se categoria é uma categoria ampla, usar a descrição
    if (item.descricao) {
      console.log(`📝 Usando descrição como fallback: ${item.descricao}`);
      return formatItemName(item.descricao);
    }
    
    // Fallback final
    console.log(`🔄 Fallback final: ${item.categoria}`);
    return formatItemName(item.categoria);
  };

  // Função para organizar itens baseado na estrutura da carteira
  const organizeItemsByCarteiraStructure = (items: any[], carteiraStructure: any) => {
    if (!carteiraStructure || !carteiraStructure.categories) {
      // Fallback para organização padrão se não houver estrutura
      return organizeItemsByCategory(items);
    }

    // Criar um mapa dos itens por ID do critério
    const itemsById = items.reduce((acc, item) => {
      acc[item.id] = item;
      return acc;
    }, {});

    // Organizar baseado na estrutura da carteira
    const organizedCategories = carteiraStructure.categories
      .map(category => {
        const categoryItems = category.criteria
          .map(criteria => itemsById[criteria.id])
          .filter(Boolean); // Remove itens não encontrados

        return {
          category: category.name,
          items: categoryItems,
          order: category.order || 0
        };
      })
      .filter(category => category.items.length > 0) // Remove categorias vazias
      .sort((a, b) => a.order - b.order);

    return organizedCategories;
  };


  // Buscar informações do agente para obter o nome
  const { data: agentInfo } = useQuery({
    queryKey: ['mixed-agentSummary', agentId, apiFilters],
    queryFn: () => getMixedAgentSummary(agentId!, apiFilters),
    enabled: !!agentId
  });

  // Buscar avaliação individual
  const { data: avaliacao, refetch: refetchAvaliacao } = useQuery({
    queryKey: ['avaliacao', avaliacaoId],
    queryFn: () => getAvaliacaoById(avaliacaoId!),
    enabled: !!avaliacaoId
  });

  // Nova query para buscar informações do caller (telefone)
  const { data: callerInfo } = useQuery({
    queryKey: ['mixed-callerInfo', avaliacaoId],
    queryFn: () => getMixedCallerInfo(avaliacaoId!),
    enabled: !!avaliacaoId
  });
  
  const { user } = useAuth();
  const isAdmin = user?.permissions?.includes('admin');
  const isMonitor = user && (user.permissions?.includes('admin') || user.permissions?.includes('monitor'));
  
  // Estado do feedback
  const [feedbackStatus, setFeedbackStatus] = useState<string>('...');
  const [feedbackComentario, setFeedbackComentario] = useState<string>('');
  const [feedbackId, setFeedbackId] = useState<number | null>(null);
  useEffect(() => {
    async function fetchFeedback() {
      if (!avaliacaoId) return;
      try {
        const feedbacks = await getFeedbacksByAvaliacao(avaliacaoId);
        if (feedbacks && feedbacks.length > 0) {
          setFeedbackStatus(feedbacks[0].status || 'Enviado');
          setFeedbackComentario(feedbacks[0].comentario || '');
          setFeedbackId(feedbacks[0].id || null);
        } else {
          setFeedbackStatus('Sem feedback');
          setFeedbackComentario('');
          setFeedbackId(null);
        }
      } catch {
        setFeedbackStatus('Erro');
        setFeedbackComentario('');
        setFeedbackId(null);
      }
    }
    fetchFeedback();
  }, [avaliacaoId]);

  // Modal feedback
  const [modalOpen, setModalOpen] = useState(false);
  const [comentario, setComentario] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [sucesso, setSucesso] = useState(false);

  async function handleEnviarFeedback() {
    if (!avaliacaoId || !user) return;
    setEnviando(true);
    setErro(null);
    setSucesso(false);
    try {
      const res = await fetch('/api/feedbacks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        },
        body: JSON.stringify({
          avaliacao_id: avaliacaoId,
          agent_id: agentId,
          comentario,
          status: 'ENVIADO',
          origem: 'monitoria',
          criado_por: user.id
        })
      });
      if (!res.ok) throw new Error('Erro ao enviar feedback');
      setSucesso(true);
      setModalOpen(false);
      setComentario('');
      // Atualizar status/comentário localmente
      setFeedbackStatus('ENVIADO');
      setFeedbackComentario(comentario);
    } catch (e: any) {
      setErro(e.message || 'Erro desconhecido');
    } finally {
      setEnviando(false);
    }
  }

  // Abrir modal de edição para um item específico
  const handleEditItem = (item: Item) => {
    // Verificar se o item tem ID antes de abrir o modal
    if (!item.id) {
      console.error('❌ Item sem ID:', item);
      return;
    }
    console.log('✅ Item selecionado com ID:', item.id);
    setSelectedItem(item);
    setIsModalOpen(true);
  };

  // Fechar o modal de edição
  const handleCloseModal = (itemEdited = false, categoria?: string) => {
    if (itemEdited && categoria) {
      setEditedItems(prev => {
        const newSet = new Set(prev);
        newSet.add(categoria);
        return newSet;
      });
      refetchAvaliacao(); // Atualiza a nota após edição
    }
    setIsModalOpen(false);
    setSelectedItem(null);
  };

  // Gerenciar o clique no botão de transcrição
  const handleTranscriptionClick = () => {
    setIsTranscriptionModalOpen(true);
  };
  
  // Fechar o modal de transcrição
  const handleCloseTranscriptionModal = () => {
    setIsTranscriptionModalOpen(false);
  };

  // Atualizar callData com a avaliação individual
  useEffect(() => {
    if (avaliacao) {
      setCallData((currentCallData: any) => ({
        ...currentCallData,
        pontuacao: avaliacao.pontuacao,
        status_avaliacao: avaliacao.status_avaliacao
      }));
    }
  }, [avaliacao]);

  const breadcrumbs = isAdmin
    ? [
        { label: 'Dashboard', href: '/' },
        { label: 'Detalhes do Agente', href: agentId ? `/agent/${agentId}` : '#' },
        { label: 'Itens da Avaliação', isActive: true }
      ]
    : [
        { label: 'Detalhes do Agente', href: agentId ? `/agent/${agentId}` : '#' },
        { label: 'Itens da Avaliação', isActive: true }
      ];

  return (
    <div className={`min-h-screen transition-all duration-300 ${isTranscriptionModalOpen ? 'flex' : ''}`}>
      {/* Área principal dos itens */}
      <div className={`transition-all duration-300 ${isTranscriptionModalOpen ? 'w-1/2 border-r border-gray-200' : 'w-full'}`}>
        <PageHeader 
          title="Itens da Avaliação"
          subtitle={`Análise detalhada da avaliação ${avaliacaoId}`}
          breadcrumbs={breadcrumbs}
          actions={
            <div className="flex items-center space-x-4">
              {!isTranscriptionModalOpen && (
                <button
                  onClick={handleTranscriptionClick}
                  className="inline-flex items-center rounded-full bg-blue-600/70 hover:bg-blue-700/80 px-4 py-2 text-sm font-light text-white transition-all duration-200 shadow-sm backdrop-blur-sm border border-blue-300/50 group"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2 group-hover:scale-110 transition-transform" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8a1 1 0 10-2 0A5 5 0 015 8a1 1 0 00-2 0 7.001 7.001 0 006 6.93V17H6a1 1 0 100 2h8a1 1 0 100-2h-3v-2.07z" clipRule="evenodd" />
                  </svg>
                  <span className="group-hover:translate-x-0.5 transition-transform">Ver Transcrição</span>
                </button>
              )}
              
              <Link 
                to={-1 as any} 
                className="inline-flex items-center px-6 py-2.5 border border-blue-200/60 rounded-full text-sm font-light text-blue-700 bg-white/80 backdrop-blur-sm hover:bg-blue-50/80 hover:border-blue-300/70 focus:outline-none focus:ring-2 focus:ring-blue-500/30 transition-all duration-200 shadow-md hover:shadow-lg"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
                </svg>
                Voltar
              </Link>
            </div>
          }
        />

        <div className="p-6 space-y-6">          {/* Informações da ligação */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Informações da Ligação</h3>
            {/* Caixa de feedback para monitor/admin */}
            {isMonitor && (
              <div className="mb-6 p-4 rounded-xl border border-gray-100 bg-white shadow-sm">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-semibold text-blue-900">Feedback desta ligação</span>
                  <span className={`text-xs px-2 py-1 rounded-full font-semibold ${feedbackStatus === 'ENVIADO' ? 'bg-green-100 text-green-700' : feedbackStatus === 'Sem feedback' ? 'bg-gray-100 text-gray-700' : 'bg-yellow-100 text-yellow-800'}`}>{feedbackStatus}</span>
                </div>
                {feedbackComentario && (
                  <div className="mb-2 text-sm text-blue-900"><strong>Comentário:</strong> {feedbackComentario}</div>
                )}
                <button
                  className="mt-2 bg-blue-600/70 hover:bg-blue-700/80 text-white px-3 py-1.5 rounded-full font-light shadow-sm transition-all duration-200 backdrop-blur-sm border border-blue-300/50"
                  onClick={() => setModalOpen(true)}
                >
                  {feedbackStatus === 'Sem feedback' ? 'Aplicar Feedback' : 'Editar Feedback'}
                </button>
              </div>
            )}
            <div className="mb-4">
              <span className="text-sm font-medium text-gray-700">Status do Feedback: </span>
              <span className="text-sm font-semibold text-blue-700">{feedbackStatus}</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {agentInfo && (
                <div className="flex items-center space-x-3">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-blue-600" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                      </svg>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Agente</p>
                    <p className="font-medium text-gray-900">{formatAgentName(agentInfo)}</p>
                  </div>
                </div>
              )}
              {/* Data da Ligação */}
              {callData?.data_ligacao && (
                <div className="flex items-center space-x-3">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-yellow-600" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                      </svg>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Data da Ligação</p>
                    <p className="font-medium text-gray-900">
                      {formatDate(callData.data_ligacao)}
                    </p>
                  </div>
                </div>
              )}
              {/* Nome da Fila */}
              {callerInfo?.queue_id && (
                <div className="flex items-center space-x-3">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-pink-100 rounded-full flex items-center justify-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-pink-600" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm0 2h12v10H4V5zm2 2v2h2V7H6zm4 0v2h2V7h-2z" />
                      </svg>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Fila</p>
                    <p className="font-medium text-gray-900">{callerInfo.queue_id}</p>
                  </div>
                </div>
              )}
              <div className="flex items-center space-x-3">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-green-600" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                    </svg>
                  </div>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Avaliação ID</p>
                  <p className="font-medium text-gray-900">{avaliacaoId}</p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-purple-600" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
                    </svg>
                  </div>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Cliente</p>
                  <p className="font-medium text-gray-900">
                    {callerInfo?.callerid || 'Não disponível'}
                  </p>
                </div>
              </div>
              {/* Pontuação da Avaliação */}
              {callData && (
                <div className="flex items-center space-x-3">
                  <div className="flex-shrink-0">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      callData.pontuacao >= 80 ? 'bg-green-100' : 
                      callData.pontuacao >= 60 ? 'bg-yellow-100' : 'bg-red-100'
                    }`}>
                      <svg xmlns="http://www.w3.org/2000/svg" className={`h-4 w-4 ${
                        callData.pontuacao >= 80 ? 'text-green-600' : 
                        callData.pontuacao >= 60 ? 'text-yellow-600' : 'text-red-600'
                      }`} viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" />
                      </svg>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Pontuação</p>
                    <div className="flex items-center space-x-2">
                      <p className={`font-bold text-lg ${
                        callData.pontuacao >= 80 ? 'text-green-600' : 
                        callData.pontuacao >= 60 ? 'text-yellow-600' : 'text-red-600'
                      }`}>
                        {callData.pontuacao.toFixed(1)}%
                      </p>
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        callData.status_avaliacao === 'APROVADA' 
                          ? 'bg-green-100 text-green-700' 
                          : 'bg-red-100 text-red-700'
                      }`}>
                        {callData.status_avaliacao}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {isTranscriptionModalOpen && (
              <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                  </div>
                  <p className="ml-3 text-sm text-blue-800 font-medium">
                    Comparando avaliação com transcrição...
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Status legend bar */}
          <div className="flex items-center justify-between bg-white p-4 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-all duration-200">
            <h3 className="text-sm font-medium text-gray-700">Status dos itens:</h3>
            <div className="flex space-x-5">
              <div className="flex items-center">
                <div className="w-3 h-3 rounded-full bg-green-500 mr-2 shadow-sm shadow-green-200"></div>
                <span className="text-xs font-medium text-gray-600">Conforme</span>
              </div>
              <div className="flex items-center">
                <div className="w-3 h-3 rounded-full bg-red-500 mr-2 shadow-sm shadow-red-200"></div>
                <span className="text-xs font-medium text-gray-600">Não Conforme</span>
              </div>
              <div className="flex items-center">
                <div className="w-3 h-3 rounded-full bg-gray-400 mr-2 shadow-sm shadow-gray-200"></div>
                <span className="text-xs font-medium text-gray-600">Não se Aplica</span>
              </div>
            </div>
          </div>

          {isLoading ? (
            <div className="flex justify-center items-center py-12">
              <div className="relative">
                <div className="animate-spin rounded-full h-10 w-10 border-2 border-blue-600 border-t-transparent"></div>
                <div className="animate-spin rounded-full h-10 w-10 border-2 border-blue-300 border-t-transparent absolute top-0 left-0" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }}></div>
              </div>
              <span className="ml-4 text-sm font-medium text-gray-600">Carregando itens...</span>
            </div>
          ) : (
            <div className="space-y-6">
              {organizeItemsByCarteiraStructure(data, carteiraStructure).map((categoryGroup) => (
                <div key={categoryGroup.category} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                  {/* Header da categoria */}
                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-6 py-4 border-b border-gray-200">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                        <div className="w-3 h-3 bg-blue-500 rounded-full mr-3"></div>
                        {categoryGroup.category}
                      </h3>
                      <span className="text-sm text-gray-600 bg-white px-3 py-1 rounded-full border border-gray-200">
                        {categoryGroup.items.length} {categoryGroup.items.length === 1 ? 'critério' : 'critérios'}
                      </span>
                    </div>
                  </div>
                  
                  {/* Itens da categoria */}
                  <div className="p-6">
                    <ul className="space-y-4">
                      {categoryGroup.items.map((it, idx) => (
                        <li 
                          key={idx} 
                          className={`rounded-xl bg-gray-50 p-5 shadow-sm hover:shadow-md transition-all duration-300 ${
                            editedItems.has(it.categoria) ? 'border-l-4 border-blue-500' : 'border border-gray-100'
                          }`}
                        >
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <div className="flex items-center mb-2">
                                <div className={`w-2.5 h-2.5 rounded-full mr-2 ${
                                  it.resultado === 'CONFORME' ? 'bg-green-500 shadow-sm shadow-green-200' :
                                  it.resultado === 'NAO CONFORME' ? 'bg-red-500 shadow-sm shadow-red-200' : 'bg-gray-400 shadow-sm shadow-gray-200'
                                }`}></div>
                                <span className="text-sm font-semibold text-gray-800">
                                  {getCriterioName(it)}
                                </span>
                              </div>
                              <div className="text-xs text-gray-600 mb-2 leading-relaxed">{it.descricao}</div>
                              <span className={`text-xs font-medium px-2.5 py-1 rounded-full inline-flex items-center ${
                                it.resultado === 'CONFORME' ? 'bg-green-100 text-green-700' :
                                it.resultado === 'NAO CONFORME' ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-700'
                              }`}>
                                {formatItemName(it.resultado)}
                              </span>
                            </div>
                            {isAdmin && (
                              <button
                                onClick={() => handleEditItem(it)}
                                className="ml-2 flex items-center text-xs px-3.5 py-1.5 bg-blue-600/70 hover:bg-blue-700/80 text-white rounded-full transition-all duration-200 font-light shadow-sm backdrop-blur-sm border border-blue-300/50 group"
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 mr-1.5 group-hover:scale-110 transition-transform" viewBox="0 0 20 20" fill="currentColor">
                                  <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                                </svg>
                                <span className="group-hover:translate-x-0.5 transition-transform">Editar</span>
                              </button>
                            )}
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Modal de edição */}
          {isAdmin && selectedItem && selectedItem.id && (
            <ItemEditModal
              isOpen={isModalOpen}
              onClose={handleCloseModal}
              item={selectedItem}
              avaliacaoId={avaliacaoId!}
              itemId={selectedItem.id}
            />
          )}
        </div>
      </div>

      {/* Modal de transcrição como painel lateral */}
      {isTranscriptionModalOpen && (
        <div className="w-1/2 bg-white">
          <TranscriptionModal
            isOpen={isTranscriptionModalOpen}
            onClose={handleCloseTranscriptionModal}
            avaliacaoId={avaliacaoId!}
            callId={callerInfo?.call_id}
            isInline={true}
          />
        </div>
      )}

      {/* Modal de feedback */}
      {modalOpen && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-40 z-50">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">Aplicar Feedback</h3>
            <label className="block mb-2 text-sm font-medium">Comentário</label>
            <textarea
              className="w-full border border-gray-200 rounded-xl p-2 mb-4 shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
              rows={3}
              value={comentario}
              onChange={e => setComentario(e.target.value)}
              disabled={enviando}
            />
            {erro && <div className="text-red-600 mb-2 text-sm">{erro}</div>}
            {sucesso && <div className="text-green-600 mb-2 text-sm">Feedback enviado com sucesso!</div>}
            <div className="flex justify-end gap-2">
              <button
                className="px-4 py-2 rounded-full bg-gray-300/80 hover:bg-gray-300/90 text-gray-700 border border-gray-400/30 font-light backdrop-blur-sm transition-all duration-200"
                onClick={() => setModalOpen(false)}
                disabled={enviando}
              >
                Cancelar
              </button>
              <button
                className="px-4 py-2 rounded-full bg-blue-600/80 hover:bg-blue-600/90 text-white font-light backdrop-blur-sm transition-all duration-200 border border-blue-500/30"
                onClick={handleEnviarFeedback}
                disabled={enviando || !comentario}
              >
                {enviando ? 'Enviando...' : 'Enviar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
