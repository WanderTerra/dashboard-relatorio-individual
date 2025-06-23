import * as React from 'react';
import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { updateItem } from '../lib/api';
import { formatItemName } from '../lib/format';
import { toast } from '../hooks/use-toast';
import axios from 'axios';

interface ItemEditModalProps {
  isOpen: boolean;
  onClose: (itemEdited?: boolean, categoria?: string) => void;
  item: {
    categoria: string;
    descricao: string;
    resultado: string;
  };
  avaliacaoId: string;
}

const ItemEditModal: React.FC<ItemEditModalProps> = ({ isOpen, onClose, item, avaliacaoId }) => {
  const [selectedStatus, setSelectedStatus] = useState(item.resultado);
  const [descricao, setDescricao] = useState(item.descricao);
  const [originalStatus] = useState(item.resultado);
  const [originalDescricao] = useState(item.descricao);
  const queryClient = useQueryClient();
  
  // Verificar se houve alterações
  const hasChanges = selectedStatus !== originalStatus || descricao !== originalDescricao;
  
  // Função para lidar com o fechamento do modal
  const handleClose = () => {
    if (hasChanges) {
      // Perguntar ao usuário se ele realmente deseja descartar as alterações
      if (window.confirm('Você tem alterações não salvas. Deseja realmente sair?')) {
        onClose(false);
      }
    } else {
      onClose(false);
    }
  };

  // Usar React Query para gerenciar a mutação de atualização
  const updateMutation = useMutation({
    mutationFn: () => updateItem(avaliacaoId, item.categoria, selectedStatus, descricao),
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: ['callItems', avaliacaoId] });
      const previousItems = queryClient.getQueryData(['callItems', avaliacaoId]);
      queryClient.setQueryData(['callItems', avaliacaoId], (old: any[] | undefined) =>
        old ? old.map(oldItem =>
          oldItem.categoria === item.categoria
            ? { ...oldItem, resultado: selectedStatus, descricao }
            : oldItem
        ) : []
      );
      return { previousItems };
    },
    onError: (error: Error, variables: void, context: { previousItems: any; } | undefined) => {
      if (context?.previousItems) {
        queryClient.setQueryData(['callItems', avaliacaoId], context.previousItems);
      }
      let errorMessage = 'Erro desconhecido';
      if (error instanceof Error) {
        errorMessage = error.message;
      }
      if (axios.isAxiosError(error) && error.response) {
        if (error.response.data && error.response.data.message) {
          errorMessage = error.response.data.message;
        } else {
          errorMessage = `Erro ${error.response.status}: ${error.response.statusText}`;
        }
      }
      toast({
        title: "Erro",
        description: `Erro ao atualizar item: ${errorMessage}`,
        variant: "destructive",
      });
    },
    onSuccess: () => {
      toast({
        title: "Sucesso",
        description: `Item "${formatItemName(item.categoria)}" atualizado com sucesso!`,
        variant: "default",
      });
      onClose(true, item.categoria);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['callItems', avaliacaoId] });
      queryClient.invalidateQueries({ queryKey: ['agentSummary'] });
      queryClient.invalidateQueries({ queryKey: ['kpis'] });
      queryClient.invalidateQueries({ queryKey: ['agents'] });
      queryClient.invalidateQueries({ queryKey: ['agentCalls'] });
      queryClient.invalidateQueries({ queryKey: ['agentWorstItem'] });
      queryClient.invalidateQueries({ queryKey: ['trend'] });
    },
  });

  // Função para salvar as alterações
  const handleSave = () => {
    updateMutation.mutate();
  };
  // Opções de status disponíveis
  const statusOptions = [
    { id: 'CONFORME', label: 'Conforme', color: 'green' },
    { id: 'NAO CONFORME', label: 'Não Conforme', color: 'red' },
    { id: 'NAO SE APLICA', label: 'Não se Aplica', color: 'gray' }
  ];
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-xl shadow-xl p-6 max-w-md w-full mx-4 animate-in slide-in-from-bottom-5 zoom-in-95 duration-300">
        <div className="flex justify-between items-center mb-5">
          <h2 className="text-xl font-bold text-gray-800">Editar Item</h2>
          <button 
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-full hover:bg-gray-100"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        </div>        <div className="mb-5">
          <div className="inline-block px-3.5 py-1.5 bg-blue-50 text-blue-700 rounded-md text-sm font-medium border border-blue-100 shadow-sm">
            {formatItemName(item.categoria)}
          </div>
        </div>
          <div className="mb-6">
          <h3 className="font-medium mb-3 text-gray-700">Status:</h3>
          <div className="grid grid-cols-1 gap-3">            {statusOptions.map(option => {
              // Determinar o estilo baseado na seleção
              const bgColor = selectedStatus === option.id 
                ? option.id === 'CONFORME' ? 'bg-green-50 border-green-400 shadow-md shadow-green-100/50' :
                  option.id === 'NAO CONFORME' ? 'bg-red-50 border-red-400 shadow-md shadow-red-100/50' :
                  'bg-gray-50 border-gray-400 shadow-md shadow-gray-100/50'
                : 'bg-gray-50 border-gray-200 hover:bg-gray-100';
              
              // Determinar a cor do texto
              const textColor = option.id === 'CONFORME' ? 'text-green-700' :
                               option.id === 'NAO CONFORME' ? 'text-red-700' :
                               'text-gray-700';
              
              return (
                <label 
                  key={option.id} 
                  className={`flex items-center p-3.5 rounded-lg border cursor-pointer transition-all ${bgColor}`}
                >
                  <input 
                    type="radio" 
                    name="status" 
                    value={option.id} 
                    checked={selectedStatus === option.id}
                    onChange={() => setSelectedStatus(option.id)}
                    className="h-4 w-4 text-blue-600 hidden" 
                  />
                  <div className={`w-5 h-5 rounded-full mr-3 flex items-center justify-center border ${
                    selectedStatus === option.id 
                      ? option.id === 'CONFORME' ? 'border-green-500 bg-green-500' :
                        option.id === 'NAO CONFORME' ? 'border-red-500 bg-red-500' :
                        'border-gray-500 bg-gray-500'
                      : 'border-gray-300'
                  }`}>
                    {selectedStatus === option.id && (
                      <div className="w-2 h-2 rounded-full bg-white animate-pulse"></div>
                    )}
                  </div>
                  <div>
                    <span className={`text-sm font-medium ${textColor}`}>
                      {option.label}
                    </span>
                  </div>
                </label>
              );
            })}
          </div>
        </div>        <div className="mb-5">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Descrição:
          </label>
          <textarea
            value={descricao}
            onChange={(e) => setDescricao(e.target.value)}
            className="w-full p-3 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none resize-none h-24 transition-all shadow-sm"
            placeholder="Digite a descrição do item"
          />
        </div>        <div className="flex justify-end space-x-3">
          <button 
            onClick={handleClose}
            className="px-4 py-2 text-sm font-medium rounded-lg border border-gray-300 hover:bg-gray-50 transition-all shadow-sm hover:shadow"
          >
            Cancelar
          </button>
          <button 
            onClick={handleSave}
            disabled={updateMutation.isPending || !hasChanges}
            className={`px-5 py-2 text-sm font-medium rounded-lg text-white transition-all ${hasChanges ? 'bg-blue-600 hover:bg-blue-700 shadow-sm hover:shadow' : 'bg-gray-400'} disabled:opacity-70 flex items-center`}
          >
            {updateMutation.isPending && (
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            )}
            {updateMutation.isPending ? 'Salvando...' : 'Salvar'}
          </button>
        </div>
          {updateMutation.isError && (
          <div className="mt-4 p-3.5 bg-red-50 text-red-700 rounded-lg text-sm border border-red-200 shadow-sm animate-in fade-in slide-in-from-top-3 duration-300">
            <div className="flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-red-500" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              Erro ao atualizar item. Por favor, tente novamente ou contate o suporte.
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ItemEditModal;
