import React, { useState } from 'react';
import { Link, useParams, useLocation } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { getCallItems } from '../lib/api';
import { formatItemName } from '../lib/format';
import ItemEditModal from '../components/ItemEditModal';

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
  
  // Estado para controlar o modal de edição
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editedItems, setEditedItems] = useState<Set<string>>(new Set());

  const { data = [], isLoading } = useQuery<Item[]>({
    queryKey: ['callItems', avaliacaoId],
    queryFn : () => getCallItems(avaliacaoId!),
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
  return (
    <div className="mx-auto max-w-4xl space-y-6 p-4 md:p-6">
      <Link 
        to={-1 as any} 
        className="inline-flex items-center px-4 py-2 rounded-md text-sm font-medium text-white bg-blue-600 shadow-sm hover:bg-blue-700 transition-colors duration-200"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
        </svg>
        Voltar
      </Link>
      <h2 className="text-xl font-bold text-gray-800 mt-4">
        Itens da ligação {avaliacaoId}
      </h2><Link
        to={`/call/${avaliacaoId}/transcription`}
        state={{ agentId }}
        className="inline-block rounded-md bg-blue-700 px-4 py-1.5 mb-6 text-sm font-semibold text-white hover:bg-blue-600 transition-colors shadow-sm"
      >
        Ver Transcrição
      </Link>      {/* Status legend bar */}
      <div className="flex items-center justify-between bg-white p-4 rounded-lg shadow-sm mb-4 border border-gray-100 hover:shadow-md transition-all duration-200">
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
      </div>      {isLoading ? (
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
  );
}
