export interface GamificationData {
  agent_id: string;
  current_level: number;
  current_xp: number;
  total_xp_earned: number;
  xp_for_next_level: number;
  level_name: string;
  level_color: string;
  level_icon: string;
}

export const getAgentGamification = async (agentId: string): Promise<GamificationData | null> => {
  try {
    const response = await fetch(`/api/gamification/agent/${agentId}`);
    
    if (!response.ok) {
      if (response.status === 404) {
        // Retornar dados padrão se o agente não tiver dados de gamificação
        return {
          agent_id: agentId,
          current_level: 1,
          current_xp: 0,
          total_xp_earned: 0,
          xp_for_next_level: 1000,
          level_name: 'Bronze',
          level_color: '#8B4513',
          level_icon: '🥉'
        };
      }
      throw new Error('Erro ao buscar dados de gamificação');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Erro na API de gamificação:', error);
    // Retornar dados padrão em caso de erro
    return {
      agent_id: agentId,
      current_level: 1,
      current_xp: 0,
      total_xp_earned: 0,
      xp_for_next_level: 1000,
      level_name: 'Bronze',
      level_color: '#8B4513',
      level_icon: '🥉'
    };
  }
};