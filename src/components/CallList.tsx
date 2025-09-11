import React from 'react';
import { Link, useParams } from 'react-router-dom';
import { Calendar, FileText, MessageSquare, ChevronLeft, ChevronRight, Search, CheckCircle, XCircle } from 'lucide-react';
import { formatItemName, formatDate } from '../lib/format';
import { getFeedbacksByAvaliacao } from '../lib/api';
import { useFeedbacks } from '../hooks/useFeedbacks';
import type { UserInfo } from '../lib/api';

export interface CallRow {
  call_id: string;
  avaliacao_id: string;
  data_ligacao: string;
  pontuacao: number;
  status_avaliacao: string;
}

interface CallListProps {
  calls: CallRow[];
  user?: UserInfo | null;
}

const CallList: React.FC<CallListProps> = ({ calls, user }) => {
  const { agentId } = useParams<{ agentId: string }>();
  const [modalOpen, setModalOpen] = React.useState(false);
  const [selectedAvaliacao, setSelectedAvaliacao] = React.useState<string | null>(null);
  
  // Estados para paginação e filtros
  const [currentPage, setCurrentPage] = React.useState(1);
  const [searchTerm, setSearchTerm] = React.useState('');
  const [statusFilter, setStatusFilter] = React.useState<'todos' | 'aprovada' | 'reprovada'>('todos');
  const [scoreFilter, setScoreFilter] = React.useState<'todos' | 'alta' | 'media' | 'baixa'>('todos');
  const itemsPerPage = 10;

  // Permissão: admin ou monitor
  const isMonitor = user && (user.permissions?.includes('admin') || user.permissions?.includes('monitor'));

  // ✅ NOVA IMPLEMENTAÇÃO - Usar o hook otimizado
  const {
    feedbacks,
    loading: feedbacksLoading,
    error: feedbacksError,
    currentPage: feedbacksPage,
    paginationData: feedbacksPagination,
    nextPage: nextFeedbacksPage,
    prevPage: prevFeedbacksPage,
    goToPage: goToFeedbacksPage,
    refresh: refreshFeedbacks
  } = useFeedbacks({
    avaliacaoIds: calls.map(c => c.avaliacao_id),
    pageSize: 20,
    enablePagination: true
  });

  // Filtrar e paginar chamadas
  const filteredCalls = React.useMemo(() => {
    let filtered = calls;
    
    // Filtro por status
    if (statusFilter !== 'todos') {
      filtered = filtered.filter(call => 
        call.status_avaliacao.toLowerCase() === statusFilter
      );
    }
    
    // Filtro por pontuação
    if (scoreFilter !== 'todos') {
      filtered = filtered.filter(call => {
        const pontuacao = call.pontuacao || 0;
        if (scoreFilter === 'alta') {
          return pontuacao >= 80;
        } else if (scoreFilter === 'media') {
          return pontuacao >= 60 && pontuacao < 80;
        } else if (scoreFilter === 'baixa') {
          return pontuacao < 60;
        }
        return true;
      });
    }
    
    // Filtro por pesquisa (data ou pontuação)
    if (searchTerm) {
      filtered = filtered.filter(call => 
        formatDate(call.data_ligacao).includes(searchTerm) ||
        (call.pontuacao || 0).toString().includes(searchTerm)
      );
    }
    
    // Ordenar por data mais recente primeiro
    return filtered.sort((a, b) => new Date(b.data_ligacao).getTime() - new Date(a.data_ligacao).getTime());
  }, [calls, statusFilter, scoreFilter, searchTerm]);

  // Calcular paginação
  const totalPages = Math.ceil(filteredCalls.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedCalls = filteredCalls.slice(startIndex, endIndex);

  // Reset página quando filtros mudam
  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter, scoreFilter]);

  // ✅ FUNÇÃO OTIMIZADA - Obter status do feedback
  const getFeedbackStatus = (avaliacaoId: string): string => {
    const avaliacaoFeedbacks = feedbacks[avaliacaoId] || [];
    if (avaliacaoFeedbacks.length === 0) {
      return 'Sem feedback';
    }
    // Pega o feedback mais recente
    const latest = avaliacaoFeedbacks[0];
    return latest.status || 'Enviado';
  };

  // Função para gerar números de página visíveis
  const getVisiblePages = () => {
    const delta = 2; // Número de páginas antes e depois da página atual
    const range = [];
    const rangeWithDots = [];

    for (let i = Math.max(2, currentPage - delta); i <= Math.min(totalPages - 1, currentPage + delta); i++) {
      range.push(i);
    }

    if (currentPage - delta > 2) {
      rangeWithDots.push(1, '...');
    } else {
      rangeWithDots.push(1);
    }

    rangeWithDots.push(...range);

    if (currentPage + delta < totalPages - 1) {
      rangeWithDots.push('...', totalPages);
    } else if (totalPages > 1) {
      rangeWithDots.push(totalPages);
    }

    return rangeWithDots;
  };

  // Função para ir para página específica
  const goToPage = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  // Função para ir para próxima página
  const goToNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  // Função para ir para página anterior
  const goToPreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  // Modal de feedback (simples)
  const [comentario, setComentario] = React.useState('');
  const [enviando, setEnviando] = React.useState(false);
  const [erro, setErro] = React.useState<string | null>(null);
  const [sucesso, setSucesso] = React.useState(false);

  async function handleEnviarFeedback() {
    if (!selectedAvaliacao || !user) return;
    setEnviando(true);
    setErro(null);
    setSucesso(false);
    try {
      // Chamar endpoint de criar feedback
      const res = await fetch('/api/feedbacks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        },
        body: JSON.stringify({
          avaliacao_id: selectedAvaliacao,
          agent_id: agentId,
          comentario,
          status: 'ENVIADO',
          origem: 'monitoria',
          criado_por: user.id
        })
      });
      if (!res.ok) throw new Error('Erro ao enviar feedback');
      setSucesso(true);
      setComentario('');
      setModalOpen(false);
      // Atualizar feedbacks
      refreshFeedbacks();
    } catch (e: any) {
      setErro(e.message || 'Erro desconhecido');
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden hover:shadow-xl transition-shadow duration-300">
      {/* Header com filtros */}
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Lista de Chamadas</h3>
            <p className="text-sm text-gray-600 mt-1">Gerencie e visualize as chamadas do agente</p>
            {/* ✅ NOVO - Status dos feedbacks */}
            {feedbacksLoading && (
              <div className="flex items-center gap-2 mt-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
                <span className="text-sm text-blue-600">Carregando feedbacks...</span>
              </div>
            )}
            {feedbacksError && (
              <div className="text-sm text-red-600 mt-2">
                Erro ao carregar feedbacks: {feedbacksError}
                <button 
                  onClick={refreshFeedbacks}
                  className="ml-2 text-blue-600 underline hover:text-blue-800"
                >
                  Tentar novamente
                </button>
              </div>
            )}
          </div>
          <div className="flex items-center gap-3">
            <div className="relative w-80">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Pesquisar chamadas..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="block w-full pl-12 pr-4 py-3 border border-gray-300 rounded-full shadow-sm bg-white text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm font-medium"
              />
            </div>
            
            {/* Filtro por status */}
            <div className="flex items-center bg-gray-100 rounded-full p-1 shadow-sm">
              <button
                onClick={() => setStatusFilter('todos')}
                className={`px-4 py-2 text-sm font-medium rounded-full transition-all duration-200 ${
                  statusFilter === 'todos'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Todos
              </button>
              <button
                onClick={() => setStatusFilter('aprovada')}
                className={`px-4 py-2 text-sm font-medium rounded-full transition-all duration-200 flex items-center gap-1 ${
                  statusFilter === 'aprovada'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <CheckCircle className="h-3 w-3" />
                Aprovada
              </button>
              <button
                onClick={() => setStatusFilter('reprovada')}
                className={`px-4 py-2 text-sm font-medium rounded-full transition-all duration-200 flex items-center gap-1 ${
                  statusFilter === 'reprovada'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <XCircle className="h-3 w-3" />
                Reprovada
              </button>
            </div>
            
            {/* Filtro por pontuação */}
            <div className="flex items-center bg-gray-100 rounded-full p-1 shadow-sm">
              <button
                onClick={() => setScoreFilter('todos')}
                className={`px-4 py-2 text-sm font-medium rounded-full transition-all duration-200 ${
                  scoreFilter === 'todos'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Todos
              </button>
              <button
                onClick={() => setScoreFilter('alta')}
                className={`px-4 py-2 text-sm font-medium rounded-full transition-all duration-200 flex items-center gap-1 ${
                  scoreFilter === 'alta'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                Alta
              </button>
              <button
                onClick={() => setScoreFilter('media')}
                className={`px-4 py-2 text-sm font-medium rounded-full transition-all duration-200 flex items-center gap-1 ${
                  scoreFilter === 'media'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <span className="w-2 h-2 bg-yellow-500 rounded-full"></span>
                Média
              </button>
              <button
                onClick={() => setScoreFilter('baixa')}
                className={`px-4 py-2 text-sm font-medium rounded-full transition-all duration-200 flex items-center gap-1 ${
                  scoreFilter === 'baixa'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                Baixa
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Tabela */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Data
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Pontuação
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                Ações
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Feedback
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {paginatedCalls.map((c, index) => (
              <tr key={`${c.call_id}-${c.avaliacao_id}-${index}`} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {formatDate(c.data_ligacao)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`inline-flex items-center px-3 py-1 rounded-xl text-xs font-medium shadow-sm ${
                    (c.pontuacao || 0) >= 80 
                      ? 'bg-green-100 text-green-800' 
                      : (c.pontuacao || 0) >= 60 
                      ? 'bg-yellow-100 text-yellow-800'
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {(c.pontuacao || 0).toFixed(1)}%
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`inline-flex items-center px-3 py-1 rounded-xl text-xs font-medium shadow-sm ${
                    c.status_avaliacao === 'APROVADA' 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {formatItemName(c.status_avaliacao)}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-center">
                  <div className="flex items-center justify-center gap-2">
                    <Link
                      to={`/call/${c.avaliacao_id}/items`}
                      state={{ 
                        agentId,
                        callData: {
                          pontuacao: c.pontuacao,
                          status_avaliacao: c.status_avaliacao,
                          data_ligacao: c.data_ligacao,
                          call_id: c.call_id,
                          avaliacao_id: c.avaliacao_id
                        }
                      }}
                      className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded-full text-white bg-blue-600 hover:bg-blue-700 transition-all duration-200 shadow-sm"
                    >
                      <FileText className="h-3 w-3" />
                      Itens
                    </Link>
                    <Link
                      to={`/call/${c.avaliacao_id}/transcription`}
                      state={{ agentId }}
                      className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded-full text-white bg-gray-600 hover:bg-gray-700 transition-all duration-200 shadow-sm"
                    >
                      <MessageSquare className="h-3 w-3" />
                      Transcrição
                    </Link>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {/* ✅ NOVA IMPLEMENTAÇÃO - Usar função otimizada */}
                  {getFeedbackStatus(c.avaliacao_id)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Controles de paginação melhorados */}
      {totalPages > 1 && (
        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-700">
              Mostrando <span className="font-medium">{startIndex + 1}</span> até{' '}
              <span className="font-medium">{Math.min(endIndex, filteredCalls.length)}</span> de{' '}
              <span className="font-medium">{filteredCalls.length}</span> chamadas
            </div>
            <div className="flex items-center space-x-2">
              {/* Botão Anterior */}
              <button
                onClick={goToPreviousPage}
                disabled={currentPage === 1}
                className="inline-flex items-center gap-1 px-3 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
              >
                <ChevronLeft className="h-4 w-4" />
                Anterior
              </button>
              
              {/* Números de página com navegação inteligente */}
              <div className="flex items-center space-x-1">
                {getVisiblePages().map((page, index) => (
                  <React.Fragment key={index}>
                    {page === '...' ? (
                      <span className="px-3 py-2 text-sm text-gray-500">...</span>
                    ) : (
                      <button
                        onClick={() => goToPage(page as number)}
                        className={`inline-flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
                          currentPage === page
                            ? 'bg-blue-600 text-white shadow-sm'
                            : 'text-gray-700 bg-white border border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        {page}
                      </button>
                    )}
                  </React.Fragment>
                ))}
              </div>
              
              {/* Botão Próxima */}
              <button
                onClick={goToNextPage}
                disabled={currentPage === totalPages}
                className="inline-flex items-center gap-1 px-3 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
              >
                Próxima
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    
    {/* Modal de feedback */}
    {modalOpen && (
      <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-40 z-50">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 w-full max-w-md">
          <h3 className="text-lg font-semibold mb-4">Aplicar Feedback</h3>
          <label className="block mb-2 text-sm font-medium">Comentário</label>
          <textarea
            className="w-full border border-gray-300 rounded-xl p-2 mb-4 shadow-sm bg-white !text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
            rows={3}
            value={comentario}
            onChange={e => setComentario(e.target.value)}
            disabled={enviando}
          />
          {erro && <div className="text-red-600 mb-2 text-sm">{erro}</div>}
          {sucesso && <div className="text-green-600 mb-2 text-sm">Feedback enviado com sucesso!</div>}
          <div className="flex justify-end gap-2">
            <button
              className="px-4 py-2 rounded-lg bg-gray-300/80 text-gray-700 border border-gray-400/30 font-light backdrop-blur-sm hover:bg-gray-300/90 transition-all duration-200"
              onClick={() => setModalOpen(false)}
              disabled={enviando}
            >
              Cancelar
            </button>
            <button
              className="px-4 py-2 rounded-lg bg-blue-600/80 text-white font-light backdrop-blur-sm hover:bg-blue-600/90 transition-all duration-200 border border-blue-500/30"
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

export default CallList;