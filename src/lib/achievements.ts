// Sistema de conquistas automáticas baseadas no desempenho
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

// Conquistas automáticas baseadas em critérios reais
export const getAutomaticAchievements = (agentData: AgentData): AutomaticAchievement[] => {
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
      id: 'excellent_performance',
      name: 'Excelência em Performance',
      description: 'Mantenha média acima de 90% por 5 ligações consecutivas',
      icon: '⭐',
      category: 'performance',
      xp_reward: 100,
      condition: (data) => {
        if (!data.calls || data.calls.length < 5) return false;
        const last5Calls = data.calls.slice(-5);
        const average = last5Calls.reduce((sum: number, call: any) => sum + (call.nota || 0), 0) / 5;
        return average >= 90;
      },
      is_unlocked: false
    },
    {
      id: 'consistency_master',
      name: 'Mestre da Consistência',
      description: 'Mantenha média acima de 80% por 10 ligações consecutivas',
      icon: '🏅',
      category: 'performance',
      xp_reward: 150,
      condition: (data) => {
        if (!data.calls || data.calls.length < 10) return false;
        const last10Calls = data.calls.slice(-10);
        const average = last10Calls.reduce((sum: number, call: any) => sum + (call.nota || 0), 0) / 10;
        return average >= 80;
      },
      is_unlocked: false
    },

    // Conquistas de Milestone
    {
      id: 'first_100_xp',
      name: 'Primeiros Passos',
      description: 'Alcance 100 XP total',
      icon: '👶',
      category: 'milestone',
      xp_reward: 25,
      condition: (data) => data.total_xp_earned >= 100,
      is_unlocked: false
    },
    {
      id: 'bronze_level',
      name: 'Nível Bronze',
      description: 'Alcance o nível Bronze',
      icon: '🥉',
      category: 'milestone',
      xp_reward: 50,
      condition: (data) => data.current_level >= 1,
      is_unlocked: false
    },
    {
      id: 'silver_level',
      name: 'Nível Prata',
      description: 'Alcance o nível Prata',
      icon: '🥈',
      category: 'milestone',
      xp_reward: 100,
      condition: (data) => data.current_level >= 2,
      is_unlocked: false
    },
    {
      id: 'gold_level',
      name: 'Nível Ouro',
      description: 'Alcance o nível Ouro',
      icon: '🥇',
      category: 'milestone',
      xp_reward: 200,
      condition: (data) => data.current_level >= 3,
      is_unlocked: false
    },
    {
      id: 'platinum_level',
      name: 'Nível Platina',
      description: 'Alcance o nível Platina',
      icon: '💎',
      category: 'milestone',
      xp_reward: 500,
      condition: (data) => data.current_level >= 4,
      is_unlocked: false
    },
    {
      id: 'diamond_level',
      name: 'Nível Diamante',
      description: 'Alcance o nível Diamante',
      icon: '💎',
      category: 'milestone',
      xp_reward: 1000,
      condition: (data) => data.current_level >= 5,
      is_unlocked: false
    },
    {
      id: 'legendary_level',
      name: 'Nível Lendário',
      description: 'Alcance o nível Secreto',
      icon: '🕵️‍♂️',
      category: 'milestone',
      xp_reward: 2000,
      condition: (data) => data.current_level >= 6,
      is_unlocked: false
    },

    // Conquistas de Sequência
    {
      id: 'streak_3',
      name: 'Sequência de 3',
      description: 'Mantenha 3 ligações consecutivas acima de 85%',
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
      description: 'Mantenha 5 ligações consecutivas acima de 80%',
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
    {
      id: 'streak_10',
      name: 'Sequência de 10',
      description: 'Mantenha 10 ligações consecutivas acima de 75%',
      icon: '🔥',
      category: 'streak',
      xp_reward: 300,
      condition: (data) => {
        if (!data.calls || data.calls.length < 10) return false;
        const last10Calls = data.calls.slice(-10);
        return last10Calls.every((call: any) => (call.nota || 0) >= 75);
      },
      is_unlocked: false
    },

    // Conquistas Especiais
    {
      id: 'improvement_master',
      name: 'Mestre da Melhoria',
      description: 'Melhore sua média em 20% comparado ao mês anterior',
      icon: '📈',
      category: 'special',
      xp_reward: 200,
      condition: (data) => {
        // Esta seria uma lógica mais complexa que precisaria de dados históricos
        // Por enquanto, vamos simular baseado no total de XP
        return data.total_xp_earned >= 500;
      },
      is_unlocked: false
    },
    {
      id: 'dedication',
      name: 'Dedicação',
      description: 'Realize mais de 50 ligações',
      icon: '💪',
      category: 'special',
      xp_reward: 100,
      condition: (data) => (data.calls?.length || 0) >= 50,
      is_unlocked: false
    },
    {
      id: 'veteran',
      name: 'Veterano',
      description: 'Realize mais de 100 ligações',
      icon: '🏆',
      category: 'special',
      xp_reward: 250,
      condition: (data) => (data.calls?.length || 0) >= 100,
      is_unlocked: false
    }
  ];

  // Verificar quais conquistas foram desbloqueadas
  return achievements.map(achievement => ({
    ...achievement,
    is_unlocked: achievement.condition(agentData),
    unlocked_at: achievement.condition(agentData) ? new Date().toISOString() : undefined
  }));
};

// Função para calcular XP total baseado nas conquistas desbloqueadas
export const calculateTotalXpFromAchievements = (achievements: AutomaticAchievement[]): number => {
  return achievements
    .filter(achievement => achievement.is_unlocked)
    .reduce((total, achievement) => total + achievement.xp_reward, 0);
};

// Função para obter conquistas por categoria
export const getAchievementsByCategory = (achievements: AutomaticAchievement[]) => {
  return achievements.reduce((acc, achievement) => {
    if (!acc[achievement.category]) {
      acc[achievement.category] = [];
    }
    acc[achievement.category].push(achievement);
    return acc;
  }, {} as Record<string, AutomaticAchievement[]>);
}; 