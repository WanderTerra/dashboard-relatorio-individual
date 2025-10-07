// Sistema de conquistas automáticas baseadas no desempenho
import { getAgentAchievements, ACHIEVEMENT_CONFIGS } from './achievements-api';

export interface AutomaticAchievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: 'performance' | 'streak' | 'milestone' | 'special';
  xp_reward: number;
  condition: (agentData: any) => boolean;
  is_unlocked: boolean;
  unlocked_at?: string;
}

// Dados do agente para verificar conquistas
interface AgentData {
  agent_id: string;
  current_level: number;
  current_xp: number;
  total_xp_earned: number;
  calls: any[];
  criteria: any[];
  summary: any;
}

// Função para obter conquistas reais do backend
export const getRealAchievements = async (agentId: string): Promise<AutomaticAchievement[]> => {
  try {
    const achievements = await getAgentAchievements(agentId);
    
    return achievements.map(achievement => ({
      id: achievement.id.toString(),
      name: achievement.achievement_name,
      description: achievement.description,
      icon: getAchievementIcon(achievement.achievement_type),
      category: getAchievementCategory(achievement.achievement_type),
      xp_reward: achievement.xp_reward,
      condition: () => true, // Já desbloqueada
      is_unlocked: true,
      unlocked_at: achievement.unlocked_at
    }));
  } catch (error) {
    console.error('Erro ao buscar conquistas reais:', error);
    return [];
  }
};

// Função para calcular conquistas automáticas baseadas na performance
export const getAutomaticAchievements = async (agentId: string, agentData: AgentData): Promise<AutomaticAchievement[]> => {
  try {
    // Buscar conquistas já desbloqueadas do backend
    const realAchievements = await getRealAchievements(agentId);
    
    // Calcular conquistas locais baseadas na performance atual
    const localAchievements = getLocalAchievements(agentData);
    
    // Combinar as duas listas
    const allAchievements = [...realAchievements, ...localAchievements];
    
    // Remover duplicatas baseado no ID
    const uniqueAchievements = allAchievements.filter((achievement, index, self) => 
      index === self.findIndex(a => a.id === achievement.id)
    );
    
    return uniqueAchievements;
  } catch (error) {
    console.error('Erro ao calcular conquistas automáticas:', error);
    return [];
  }
};

// Função síncrona para calcular conquistas baseadas em dados locais (para compatibilidade)
export const getLocalAchievements = (agentData: AgentData): AutomaticAchievement[] => {
  const achievements: AutomaticAchievement[] = [
    // Conquistas de Performance
    {
      id: 'perfect_call',
      name: 'Ligação Perfeita',
      description: 'Realize uma ligação com 100% de conformidade',
      icon: '🎯',
      category: 'performance',
      xp_reward: 50,
      condition: (data) => {
        return data.calls?.some((call: any) => call.nota === 100) || false;
      },
      is_unlocked: false
    },
    {
      id: 'high_performance',
      name: 'Alta Performance',
      description: 'Mantenha uma média acima de 90% por 5 ligações',
      icon: '⭐',
      category: 'performance',
      xp_reward: 100,
      condition: (data) => {
        if (!data.calls || data.calls.length < 5) return false;
        const last5Calls = data.calls.slice(-5);
        const average = last5Calls.reduce((sum: number, call: any) => sum + (call.nota || 0), 0) / last5Calls.length;
        return average >= 90;
      },
      is_unlocked: false
    },
    {
      id: 'consistency',
      name: 'Consistência',
      description: 'Mantenha uma média acima de 80% por 10 ligações',
      icon: '📈',
      category: 'performance',
      xp_reward: 150,
      condition: (data) => {
        if (!data.calls || data.calls.length < 10) return false;
        const last10Calls = data.calls.slice(-10);
        const average = last10Calls.reduce((sum: number, call: any) => sum + (call.nota || 0), 0) / last10Calls.length;
        return average >= 80;
      },
      is_unlocked: false
    },
    
    // Conquistas de Sequência
    {
      id: 'streak_3',
      name: 'Sequência de 3',
      description: 'Realize 3 ligações consecutivas com nota acima de 85%',
      icon: '🔥',
      category: 'streak',
      xp_reward: 75,
      condition: (data) => {
        if (!data.calls || data.calls.length < 3) return false;
        const last3Calls = data.calls.slice(-3);
        return last3Calls.every((call: any) => (call.nota || 0) >= 85);
      },
      is_unlocked: false
    },
    {
      id: 'streak_5',
      name: 'Sequência de 5',
      description: 'Realize 5 ligações consecutivas com nota acima de 80%',
      icon: '🔥',
      category: 'streak',
      xp_reward: 150,
      condition: (data) => {
        if (!data.calls || data.calls.length < 5) return false;
        const last5Calls = data.calls.slice(-5);
        return last5Calls.every((call: any) => (call.nota || 0) >= 80);
      },
      is_unlocked: false
    },
    
    // Conquistas de Marco
    {
      id: 'first_call',
      name: 'Primeira Ligação',
      description: 'Complete sua primeira ligação',
      icon: '🎉',
      category: 'milestone',
      xp_reward: 25,
      condition: (data) => {
        return data.calls && data.calls.length >= 1;
      },
      is_unlocked: false
    },
    {
      id: 'calls_10',
      name: 'Dedicação Inicial',
      description: 'Complete 10 ligações',
      icon: '📞',
      category: 'milestone',
      xp_reward: 25, // ✅ CORRIGIDO: era 50, agora 25 para bater com ACHIEVEMENT_CONFIGS
      condition: (data) => {
        return data.calls && data.calls.length >= 10;
      },
      is_unlocked: false
    },
    {
      id: 'calls_50',
      name: 'Dedicação',
      description: 'Complete 50 ligações',
      icon: '⭐',
      category: 'milestone',
      xp_reward: 100,
      condition: (data) => {
        return data.calls && data.calls.length >= 50;
      },
      is_unlocked: false
    },
    {
      id: 'calls_100',
      name: 'Veterano',
      description: 'Complete 100 ligações',
      icon: '🏆',
      category: 'milestone',
      xp_reward: 250,
      condition: (data) => {
        return data.calls && data.calls.length >= 100;
      },
      is_unlocked: false
    },
    
    // Conquistas Especiais
    {
      id: 'perfect_week',
      name: 'Semana Perfeita',
      description: 'Realize 5 ligações em uma semana com média acima de 95%',
      icon: '🌟',
      category: 'special',
      xp_reward: 200,
      condition: (data) => {
        if (!data.calls || data.calls.length < 5) return false;
        const lastWeek = data.calls.filter((call: any) => {
          const callDate = new Date(call.data_ligacao || call.created_at);
          const weekAgo = new Date();
          weekAgo.setDate(weekAgo.getDate() - 7);
          return callDate >= weekAgo;
        });
        
        if (lastWeek.length < 5) return false;
        const average = lastWeek.reduce((sum: number, call: any) => sum + (call.nota || 0), 0) / lastWeek.length;
        return average >= 95;
      },
      is_unlocked: false
    },
    {
      id: 'improvement',
      name: 'Melhoria Contínua',
      description: 'Melhore sua média em 10% comparado ao mês anterior',
      icon: '📊',
      category: 'special',
      xp_reward: 300,
      condition: (data) => {
        // Esta seria uma lógica mais complexa que precisaria de dados históricos
        return false; // Por enquanto, sempre false
      },
      is_unlocked: false
    }
  ];

  // Verificar quais conquistas foram desbloqueadas
  return achievements.map(achievement => ({
    ...achievement,
    is_unlocked: achievement.condition(agentData)
  }));
};

// Função para obter conquistas por categoria
export const getAchievementsByCategory = (achievements: AutomaticAchievement[]) => {
  const categories = {
    performance: achievements.filter(a => a.category === 'performance'),
    streak: achievements.filter(a => a.category === 'streak'),
    milestone: achievements.filter(a => a.category === 'milestone'),
    special: achievements.filter(a => a.category === 'special')
  };
  
  return categories;
};

// Função auxiliar para obter ícone da conquista
function getAchievementIcon(achievementType: string): string {
  const config = ACHIEVEMENT_CONFIGS[achievementType as keyof typeof ACHIEVEMENT_CONFIGS];
  return config?.icon || '🏆';
}

// Função auxiliar para obter categoria da conquista
function getAchievementCategory(achievementType: string): 'performance' | 'streak' | 'milestone' | 'special' {
  const categoryMap: Record<string, 'performance' | 'streak' | 'milestone' | 'special'> = {
    'primeira_ligacao': 'milestone',
    'dedicacao': 'milestone',
    'veterano': 'milestone',
    'perfeccionista': 'performance',
    'consistencia': 'performance',
    'excelencia': 'performance',
    'primeira_semana': 'streak',
    'maratonista': 'streak',
    'jogador_equipe': 'special',
    'mentor': 'special',
    'campeao': 'special'
  };
  
  return categoryMap[achievementType] || 'milestone';
}