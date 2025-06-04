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
  // Função para ser executada após uma atualização bem-sucedida
  const handleSuccess = () => {
    // Mostrar notificação de sucesso
    toast({
      title: "Sucesso",
      description: `Item "${formatItemName(item.categoria)}" atualizado com sucesso!`,
      variant: "default",
    });
    
    // Invalidar queries para recarregar os dados
    queryClient.invalidateQueries({ queryKey: ['callItems', avaliacaoId] });
    
    // Invalidar potencialmente outras queries afetadas
    queryClient.invalidateQueries({ queryKey: ['kpis'] });
    queryClient.invalidateQueries({ queryKey: ['agents'] });
    queryClient.invalidateQueries({ queryKey: ['agentCalls'] });
    queryClient.invalidateQueries({ queryKey: ['agentSummary'] });
    queryClient.invalidateQueries({ queryKey: ['agentWorstItem'] });
    queryClient.invalidateQueries({ queryKey: ['trend'] });
    
    // Fechar o modal após o sucesso e indicar que o item foi editado
    onClose(true, item.categoria);
  };

  // Usar React Query para gerenciar a mutação de atualização
  const updateMutation = useMutation({
    mutationFn: () => {
      console.log('Atualizando item:', {
        avaliacaoId,
        categoria: item.categoria,
        resultado: selectedStatus,
        descricao
      });
      
      return updateItem(avaliacaoId, item.categoria, selectedStatus, descricao);
    },
    onSuccess: () => handleSuccess(),
    onError: (error) => {
      // Determinar mensagem de erro baseada no tipo de erro
      let errorMessage = 'Erro desconhecido';
      
      if (error instanceof Error) {
        errorMessage = error.message;
      }
      // Verificar se é um erro do Axios com resposta do servidor
      if (axios.isAxiosError(error) && error.response) {
        // Extrair mensagem do servidor se disponível
        if (error.response.data && error.response.data.message) {
          errorMessage = error.response.data.message;
        } else {
          // Ou usar o código de status HTTP
          errorMessage = `Erro ${error.response.status}: ${error.response.statusText}`;
        }      }
      // Mostrar notificação de erro
      toast({
        title: "Erro",
        description: `Erro ao atualizar item: ${errorMessage}`,
        variant: "destructive",
      });
    }
  });

  // Função para salvar as alterações
  const handleSave = () => {
    updateMutation.mutate();
  };

  // Opções de status disponíveis
  const statusOptions = [
    { id: 'CONFORME', label: 'Conforme' },
    { id: 'NAO CONFORME', label: 'Não Conforme' },
    { id: 'NAO SE APLICA', label: 'Não se Aplica' }
  ];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg p-6 max-w-md w-full mx-4">
        <h2 className="text-xl font-bold mb-4">Editar Item</h2>
        <div className="mb-4">
          <h3 className="font-semibold">{formatItemName(item.categoria)}</h3>
        </div>
        
        <div className="mb-6">
          <h3 className="font-medium mb-2">Status:</h3>
          <div className="space-y-2">
            {statusOptions.map(option => {
              // Determinar a cor para cada opção
              let textColor = '';
              if (option.id === 'CONFORME') textColor = 'text-green-600';
              else if (option.id === 'NAO CONFORME') textColor = 'text-red-600';
              else if (option.id === 'NAO SE APLICA') textColor = 'text-gray-600';
              
              return (
                <label key={option.id} className="flex items-center space-x-2 cursor-pointer p-2 rounded hover:bg-gray-50">
                  <input 
                    type="radio" 
                    name="status" 
                    value={option.id} 
                    checked={selectedStatus === option.id}
                    onChange={() => setSelectedStatus(option.id)}
                    className="h-4 w-4 text-blue-600" 
                  />
                  <span className={`text-sm font-medium ${textColor}`}>{option.label}</span>
                </label>
              );
            })}
          </div>
        </div>
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Descrição:
          </label>
          <textarea
            value={descricao}
            onChange={(e) => setDescricao(e.target.value)}
            className="w-full p-2 text-sm border rounded-md focus:ring-1 focus:ring-blue-500 focus:outline-none resize-none h-20"
            placeholder="Digite a descrição do item"
          />
        </div>
        <div className="flex justify-end space-x-3">
          <button 
            onClick={handleClose}
            className="px-4 py-2 text-sm font-medium rounded-md border border-gray-300 hover:bg-gray-50"
          >
            Cancelar
          </button>
          <button 
            onClick={handleSave}
            disabled={updateMutation.isPending || !hasChanges}
            className={`px-4 py-2 text-sm font-medium rounded-md text-white ${hasChanges ? 'bg-blue-600 hover:bg-blue-700' : 'bg-gray-400'} disabled:opacity-70 flex items-center`}
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
          <div className="mt-4 p-3 bg-red-50 text-red-700 rounded-md text-sm">
            Erro ao atualizar item. Por favor, tente novamente ou contate o suporte.
          </div>
        )}
      </div>
    </div>
  );
};

export default ItemEditModal;
