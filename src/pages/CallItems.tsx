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
      <Link to={-1 as any} className="inline-block mb-4 rounded bg-blue-600 px-4 py-2 text-white font-semibold shadow hover:bg-blue-700 transition-colors">&larr; Voltar</Link>
      <h2 className="text-xl font-bold">
        Itens da ligação {avaliacaoId}
      </h2>
      <Link
        to={`/call/${avaliacaoId}/transcription`}
        state={{ agentId }}
        className="inline-block rounded bg-blue-700 px-3 py-1 mb-4 text-xs font-semibold text-white hover:bg-blue-600"
      >
        TRANSCRIÇÃO
      </Link>      {isLoading ? (
        <p>Carregando…</p>
      ) : (
        <ul className="space-y-3">
          {data.map((it, idx) => (
            <li 
              key={idx} 
              className={`rounded-xl bg-white p-4 shadow flex flex-col gap-1 ${
                editedItems.has(it.categoria) ? 'border-l-4 border-blue-500' : ''
              }`}
            >
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <span className="text-sm font-semibold">{formatItemName(it.categoria)}</span>
                  <div className="text-xs text-gray-500">{it.descricao}</div>
                  <span className={`text-xs font-medium ${cor(it.resultado)}`}>
                    {formatItemName(it.resultado)}
                  </span>
                </div>
                <button
                  onClick={() => handleEditItem(it)}
                  className="ml-2 flex items-center text-xs px-2 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded transition-colors"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 mr-1" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                  </svg>
                  Editar
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
