// Interfaces para tipagem
interface AISuggestionRequest {
  agentName: string;
  worstCriterion: {
    categoria: string;
    taxa_nao_conforme: number;
  };
  agentId: string;
  recentPerformance?: any[];
}

interface AISuggestionResponse {
  title: string;
  summary: string;
  specificActions: string[];
  expectedImprovement: string;
  priority: 'high' | 'medium' | 'low';
  timeToImplement: string;
}

// Configuração do backend - usando proxy do Vite
const BACKEND_URL = '';

// Função principal para gerar sugestões usando o backend
export const generateAISuggestion = async (request: AISuggestionRequest): Promise<AISuggestionResponse> => {
  try {
    const response = await fetch(`${BACKEND_URL}/api/ai/suggestions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        agentName: request.agentName,
        agentId: request.agentId,
        worstCriterion: request.worstCriterion,
        recentPerformance: request.recentPerformance,
        timestamp: new Date().toISOString()
      })
    });

    if (!response.ok) {
      throw new Error(`Backend retornou status ${response.status}`);
    }

    const data = await response.json();
    
    // Garantir que a resposta tenha o formato esperado
    return {
      title: data.title || 'Sugestão de Melhoria',
      summary: data.summary || 'Análise baseada nos dados de performance',
      specificActions: Array.isArray(data.specificActions) ? data.specificActions : [],
      expectedImprovement: data.expectedImprovement || 'Melhoria esperada baseada na análise',
      priority: data.priority || 'medium',
      timeToImplement: data.timeToImplement || '2-4 semanas'
    };
  } catch (error) {
    console.error('Erro ao chamar backend de IA:', error);
    throw new Error('Não foi possível gerar sugestões de IA. Verifique se o backend está rodando.');
  }
};

// Função para verificar se o backend está disponível
export const checkAIAvailability = async (): Promise<boolean> => {
  try {
    const response = await fetch(`${BACKEND_URL}/api/ai/health`);
    return response.ok;
  } catch {
    return false;
  }
};