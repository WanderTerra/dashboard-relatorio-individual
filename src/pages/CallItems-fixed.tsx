import React, { useState } from 'react';
import { Link, useParams, useLocation } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { getCallItems, getAgentSummary, getCallerInfo } from '../lib/api';
import { formatItemName, formatAgentName } from '../lib/format';
import ItemEditModal from '../components/ItemEditModal';
import TranscriptionModal from '../components/TranscriptionModal';
import PageHeader from '../components/PageHeader';
import { useFilters } from '../hooks/use-filters';

interface Item {
  categoria:  string;
  descricao:  string;
  resultado:  'CONFORME' | 'NAO CONFORME' | 'NAO SE APLICA';
}

const cor = (r: Item['resultado']) =>
  r === 'CONFORME'      ? 'text-green-600'
  : r === 'NAO SE APLICA'? 'text-gray-600'
  :                       'text-red-600';

export default function CallItems() {
  const { avaliacaoId } = useParams();
  const location = useLocation();
  const agentId = location.state?.agentId;
  const { filters } = useFilters();
  
  // Construir objeto de filtros para a API
  const apiFilters = { 
    start: filters.start, 
    end: filters.end, 
    ...(filters.carteira ? { carteira: filters.carteira } : {}) 
  };
    // Estado para controlar o modal de edição
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editedItems, setEditedItems] = useState<Set<string>>(new Set());
  const [isTranscriptionModalOpen, setIsTranscriptionModalOpen] = useState(false);
  const { data = [], isLoading } = useQuery<Item[]>({
    queryKey: ['callItems', avaliacaoId],
    queryFn : () => getCallItems(avaliacaoId!),
  });
  // Buscar informações do agente para obter o nome
  const { data: agentInfo } = useQuery({
    queryKey: ['agentSummary', agentId, apiFilters],
    queryFn: () => getAgentSummary(agentId!, apiFilters),
    enabled: !!agentId
  });
  // Nova query para buscar informações do caller (telefone)
  const { data: callerInfo } = useQuery({
    queryKey: ['callerInfo', avaliacaoId],
    queryFn: () => getCallerInfo(avaliacaoId!),
    enabled: !!avaliacaoId
  });
  
  // Abrir modal de edição para um item específico
  const handleEditItem = (item: Item) => {
    setSelectedItem(item);
    setIsModalOpen(true);
  };

  // Fechar o modal de edição
  const handleCloseModal = (itemEdited = false, categoria?: string) => {
    if (itemEdited && categoria) {
      // Adicionar o item à lista de itens editados
      setEditedItems(prev => {
        const newSet = new Set(prev);
        newSet.add(categoria);
        return newSet;
      });
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

  return (
    <div className={`min-h-screen transition-all duration-300 ${isTranscriptionModalOpen ? 'flex' : ''}`}>
      {/* Área principal dos itens */}
      <div className={`transition-all duration-300 ${isTranscriptionModalOpen ? 'w-1/2 border-r border-gray-200' : 'w-full'}`}>
        <PageHeader 
          title="Itens da Avaliação"
          subtitle={`Análise detalhada da avaliação ${avaliacaoId}`}
          breadcrumbs={[
            { label: 'Dashboard', href: '/' },
            { label: 'Detalhes do Agente', href: agentId ? `/agent/${agentId}` : '#' },
            { label: 'Itens da Avaliação', isActive: true }
          ]}
          actions={
            <div className="flex items-center space-x-4">
              <button
                onClick={handleTranscriptionClick}
                className="inline-flex items-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 transition-all duration-200 shadow-sm hover:shadow group"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2 group-hover:scale-110 transition-transform" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8a1 1 0 10-2 0A5 5 0 015 8a1 1 0 00-2 0 7.001 7.001 0 006 6.93V17H6a1 1 0 100 2h8a1 1 0 100-2h-3v-2.07z" clipRule="evenodd" />
                </svg>
                <span className="group-hover:translate-x-0.5 transition-transform">Ver Transcrição</span>
              </button>
              
              <Link 
                to={-1 as any} 
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
                </svg>
                Voltar
              </Link>
            </div>
          }
        />

        <div className="p-6 space-y-6">
          {/* Informações da ligação */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Informações da Ligação</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
              </div>              <div className="flex items-center space-x-3">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-purple-600" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
                    </svg>
                  </div>
                </div>                <div>
                  <p className="text-sm text-gray-500">Cliente</p>
                  <p className="font-medium text-gray-900">
                    {callerInfo?.callerid || 'Não disponível'}
                  </p>
                </div>
              </div>
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
          <div className="flex items-center justify-between bg-white p-4 rounded-lg shadow-sm border border-gray-100 hover:shadow-md transition-all duration-200">
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
            <ul className="space-y-4">
              {data.map((it, idx) => (
                <li 
                  key={idx} 
                  className={`rounded-xl bg-white p-5 shadow-sm hover:shadow-md transition-all duration-300 ${
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
                        <span className="text-sm font-semibold text-gray-800">{formatItemName(it.categoria)}</span>
                      </div>
                      <div className="text-xs text-gray-600 mb-2 leading-relaxed">{it.descricao}</div>
                      <span className={`text-xs font-medium px-2.5 py-1 rounded-full inline-flex items-center ${
                        it.resultado === 'CONFORME' ? 'bg-green-100 text-green-700' :
                        it.resultado === 'NAO CONFORME' ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-700'
                      }`}>
                        {formatItemName(it.resultado)}
                      </span>
                    </div>
                    <button
                      onClick={() => handleEditItem(it)}
                      className="ml-2 flex items-center text-xs px-3.5 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-full transition-all duration-200 font-medium shadow-sm hover:shadow-md group"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 mr-1.5 group-hover:scale-110 transition-transform" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                      </svg>
                      <span className="group-hover:translate-x-0.5 transition-transform">Editar</span>
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}

          {/* Modal de edição */}
          {selectedItem && (
            <ItemEditModal
              isOpen={isModalOpen}
              onClose={handleCloseModal}
              item={selectedItem}
              avaliacaoId={avaliacaoId!}
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
    </div>
  );
}
