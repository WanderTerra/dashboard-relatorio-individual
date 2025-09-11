const API_BASE_URL = import.meta.env.VITE_API_URL || '';

export interface GamificationData {
  agent_id: string;
  current_level: number;
  current_xp: number;
  total_xp_earned: number;
  total_xp_lost: number;
  level_progress: number;
  xp_for_next_level: number;
  level_name: string;
  level_color: string;
  level_icon: string;
}

// Função para calcular nome e informações do nível
export const getLevelInfo = (level: number) => {
  const levels = [
    { name: 'Bronze', color: '#CD7F32', icon: '🥉' },
    { name: 'Prata', color: '#C0C0C0', icon: '🥈' },
    { name: 'Ouro', color: '#FFD700', icon: '🥇' },
    { name: 'Platina', color: '#E5E4E2', icon: '💎' },
    { name: 'Diamante', color: '#B9F2FF', icon: '💠' },
    { name: 'Lendário', color: '#FF6B35', icon: '⚡' }
  ];

  const levelIndex = Math.min(level - 1, levels.length - 1);
  return levels[levelIndex] || levels[0];
};

export const getAgentGamification = async (agentId: string): Promise<GamificationData | null> => {
  try {
    const response = await fetch(`/api/gamification/agent/${agentId}`);

    if (!response.ok) {
      if (response.status === 404) {
        // Retornar dados padrão se o agente não tiver dados de gamificação
        const levelInfo = getLevelInfo(1);
        return {
          agent_id: agentId,
          current_level: 1,
          current_xp: 0,
          total_xp_earned: 0,
          total_xp_lost: 0,
          level_progress: 0,
          xp_for_next_level: 1000,
          level_name: levelInfo.name,
          level_color: levelInfo.color,
          level_icon: levelInfo.icon
        };
      }
      throw new Error('Erro ao buscar dados de gamificação');
    }

    const data = await response.json();
    const levelInfo = getLevelInfo(data.current_level || 1);

    return {
      agent_id: agentId,
      current_level: data.current_level || 1,
      current_xp: data.current_xp || 0,
      total_xp_earned: data.total_xp_earned || 0,
      total_xp_lost: data.total_xp_lost || 0,
      level_progress: data.level_progress || 0,
      xp_for_next_level: data.xp_for_next_level || 1000,
      level_name: levelInfo.name,
      level_color: levelInfo.color,
      level_icon: levelInfo.icon
    };
  } catch (error) {
    console.error('Erro na API de gamificação:', error);
    // Retornar dados padrão em caso de erro
    const levelInfo = getLevelInfo(1);
    return {
      agent_id: agentId,
      current_level: 1,
      current_xp: 0,
      total_xp_earned: 0,
      total_xp_lost: 0,
      level_progress: 0,
      xp_for_next_level: 1000,
      level_name: levelInfo.name,
      level_color: levelInfo.color,
      level_icon: levelInfo.icon
    };
  }
};