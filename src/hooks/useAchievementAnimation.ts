import { useState, useCallback } from 'react';

interface Achievement {
  id: string;
  name: string;
  description: string;
  xp_reward: number;
  icon: string;
  category: string;
}

export const useAchievementAnimation = () => {
  const [currentAchievement, setCurrentAchievement] = useState<Achievement | null>(null);
  const [isAnimating, setIsAnimating] = useState(false);
  const [queue, setQueue] = useState<Achievement[]>([]);

  const showAchievement = useCallback((achievement: Achievement) => {
    if (isAnimating) {
      // Adicionar à fila se já estiver animando
      setQueue(prev => [...prev, achievement]);
    } else {
      setCurrentAchievement(achievement);
      setIsAnimating(true);
    }
  }, [isAnimating]);

  const hideAchievement = useCallback(() => {
    setIsAnimating(false);
    setCurrentAchievement(null);
    
    // Processar próxima conquista da fila
    if (queue.length > 0) {
      const nextAchievement = queue[0];
      setQueue(prev => prev.slice(1));
      setTimeout(() => {
        setCurrentAchievement(nextAchievement);
        setIsAnimating(true);
      }, 500);
    }
  }, [queue]);

  const showMultipleAchievements = useCallback((achievements: Achievement[]) => {
    if (achievements.length === 0) return;
    
    if (achievements.length === 1) {
      showAchievement(achievements[0]);
    } else {
      // Mostrar primeira conquista imediatamente
      setCurrentAchievement(achievements[0]);
      setIsAnimating(true);
      
      // Adicionar resto à fila
      setQueue(achievements.slice(1));
    }
  }, [showAchievement]);

  return {
    currentAchievement,
    isAnimating,
    showAchievement,
    hideAchievement,
    showMultipleAchievements,
    queueLength: queue.length,
  };
}; 