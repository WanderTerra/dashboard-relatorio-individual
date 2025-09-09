import { api } from './api';

export interface Achievement {
  id: number;
  agent_id: string;
  achievement_type: string;
  achievement_name: string;
  description: string;
  xp_reward: number;
  achievement_triggered_by: number | null;
  unlocked_at: string;
}

// Configurações das conquistas (definidas no código, não no banco)
export const ACHIEVEMENT_CONFIGS = {
  'primeira_ligacao': {
    name: 'Primeira Ligação',
    description: 'Complete sua primeira ligação',
    xp_reward: 25,
    icon: '⚡'
  },
  'dedicacao': {
    name: 'Dedicação',
    description: 'Realize mais de 50 ligações',
    xp_reward: 100,
    icon: '⭐'
  },
  'veterano': {
    name: 'Veterano',
    description: 'Realize mais de 100 ligações',
    xp_reward: 250,
    icon: '🏆'
  },
  'perfeccionista': {
    name: 'Perfeccionista',
    description: 'Alcance 100% de pontuação',
    xp_reward: 100,
    icon: '🎯'
  },
  'consistencia': {
    name: 'Consistência',
    description: 'Média acima de 80% por 7 dias',
    xp_reward: 200,
    icon: '📈'
  },
  'excelencia': {
    name: 'Excelência',
    description: 'Média acima de 90% por 30 dias',
    xp_reward: 500,
    icon: '🌟'
  },
  'primeira_semana': {
    name: 'Primeira Semana',
    description: 'Complete 7 ligações em uma semana',
    xp_reward: 150,
    icon: '📅'
  },
  'maratonista': {
    name: 'Maratonista',
    description: 'Complete 10 ligações em um dia',
    xp_reward: 300,
    icon: '🏃'
  },
  'jogador_equipe': {
    name: 'Jogador de Equipe',
    description: 'Complete 100 ligações em equipe',
    xp_reward: 200,
    icon: '👥'
  },
  'mentor': {
    name: 'Mentor',
    description: 'Ajude 5 colegas a melhorar',
    xp_reward: 400,
    icon: '👥'
  },
  'campeao': {
    name: 'Campeão',
    description: 'Seja o melhor do mês',
    xp_reward: 1000,
    icon: '🏆'
  }
} as const;

// Buscar conquistas de um agente
export const getAgentAchievements = async (agentId: string): Promise<Achievement[]> => {
  try {
    const response = await api.get(`/achievements/agent/${agentId}`);
    return response.data;
  } catch (error) {
    console.error('Erro ao buscar conquistas do agente:', error);
    throw error;
  }
};

// Verificar e desbloquear conquistas automaticamente
export const checkAgentAchievements = async (agentId: string): Promise<{
  achievements_unlocked: Achievement[];
  total_xp_earned: number;
}> => {
  try {
    const response = await api.post(`/achievements/check/${agentId}`);
    return response.data;
  } catch (error) {
    console.error('Erro ao verificar conquistas:', error);
    throw error;
  }
};

// Desbloquear conquista
export const unlockAchievement = async (agentId: string, achievementType: string, triggeredBy?: number): Promise<Achievement> => {
  try {
    const config = ACHIEVEMENT_CONFIGS[achievementType as keyof typeof ACHIEVEMENT_CONFIGS];
    if (!config) {
      throw new Error('Tipo de conquista inválido');
    }

    const response = await api.post(`/achievements/unlock/${agentId}`, {
      achievement_type: achievementType,
      achievement_name: config.name,
      description: config.description,
      xp_reward: config.xp_reward,
      achievement_triggered_by: triggeredBy
    });
    return response.data;
  } catch (error) {
    console.error('Erro ao desbloquear conquista:', error);
    throw error;
  }
};

// Buscar ranking de conquistas
export const getAchievementsLeaderboard = async (): Promise<{
  agent_id: string;
  agent_name: string;
  total_achievements: number;
  total_xp: number;
}[]> => {
  try {
    const response = await api.get('/achievements/leaderboard');
    return response.data;
  } catch (error) {
    console.error('Erro ao buscar ranking de conquistas:', error);
    throw error;
  }
};