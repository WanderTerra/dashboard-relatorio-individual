import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  avaliarTranscricaoAutomatica, 
  getCriteriosCarteira, 
  getCriterios,
  AvaliacaoAutomaticaRequest,
  AvaliacaoAutomaticaResponse
} from '../lib/api';
import { useToast } from './use-toast';

export const useAvaliacaoAutomatica = () => {
  const [selectedCarteira, setSelectedCarteira] = useState<number | null>(null);
  const [avaliacaoResult, setAvaliacaoResult] = useState<AvaliacaoAutomaticaResponse | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Buscar critérios de uma carteira específica
  const { data: criteriosCarteira, isLoading: isLoadingCriterios } = useQuery({
    queryKey: ['criterios-carteira', selectedCarteira],
    queryFn: () => getCriteriosCarteira(selectedCarteira!),
    enabled: !!selectedCarteira,
  });

  // Buscar todos os critérios
  const { data: todosCriterios, isLoading: isLoadingTodosCriterios } = useQuery({
    queryKey: ['criterios'],
    queryFn: getCriterios,
  });

  // Mutação para avaliação automática
  const avaliacaoMutation = useMutation({
    mutationFn: (data: AvaliacaoAutomaticaRequest) => avaliarTranscricaoAutomatica(data),
    onSuccess: (data: AvaliacaoAutomaticaResponse) => {
      setAvaliacaoResult(data);
      toast({
        title: "Avaliação Concluída",
        description: `Pontuação: ${data.pontuacao_percentual.toFixed(1)}% - ${data.pontuacao_percentual >= 70 ? 'APROVADA' : 'REPROVADA'}`,
        variant: data.pontuacao_percentual >= 70 ? "default" : "destructive",
      });
    },
    onError: (error: any) => {
      console.error('Erro na avaliação automática:', error);
      toast({
        title: "Erro na Avaliação",
        description: error?.response?.data?.detail || "Erro ao processar avaliação automática",
        variant: "destructive",
      });
    },
  });

  const avaliarTranscricao = useCallback(async (
    transcricao: string, 
    carteiraId: number, 
    callId?: string, 
    agentId?: string
  ) => {
    if (!transcricao.trim()) {
      toast({
        title: "Erro",
        description: "Transcrição é obrigatória para avaliação",
        variant: "destructive",
      });
      return;
    }

    if (!carteiraId) {
      toast({
        title: "Erro",
        description: "Selecione uma carteira para avaliação",
        variant: "destructive",
      });
      return;
    }

    const requestData: AvaliacaoAutomaticaRequest = {
      transcricao,
      carteira_id: carteiraId,
      call_id: callId,
      agent_id: agentId,
    };

    avaliacaoMutation.mutate(requestData);
  }, [avaliacaoMutation, toast]);

  const limparResultado = useCallback(() => {
    setAvaliacaoResult(null);
    // Limpar também o estado da mutação
    avaliacaoMutation.reset();
  }, [avaliacaoMutation]);

  const isAprovada = avaliacaoResult ? avaliacaoResult.pontuacao_percentual >= 70 : false;

  return {
    // Estados
    selectedCarteira,
    setSelectedCarteira,
    avaliacaoResult,
    isAprovada,
    
    // Dados
    criteriosCarteira,
    todosCriterios,
    
    // Estados de loading
    isLoadingCriterios,
    isLoadingTodosCriterios,
    isAvaliando: avaliacaoMutation.isPending,
    
    // Funções
    avaliarTranscricao,
    limparResultado,
    
    // Erro
    error: avaliacaoMutation.error,
  };
}; 