import { useState, useCallback } from 'react';

interface LevelInfo {
  level: number;
  levelName: string;
  previousLevel: number;
  previousLevelName: string;
  xpGained: number;
  totalXp: number;
  color: string;
  bgColor: string;
  borderColor: string;
}

export const useLevelUpAnimation = () => {
  const [currentLevelUp, setCurrentLevelUp] = useState<LevelInfo | null>(null);
  const [isAnimating, setIsAnimating] = useState(false);
  const [queue, setQueue] = useState<LevelInfo[]>([]);

  const getLevelInfo = (level: number, xpGained: number, totalXp: number): LevelInfo => {
    const levelData = {
      1: { name: 'Bronze', color: '#CD7F32', bgColor: 'from-amber-600 to-orange-700', borderColor: '#B8860B' },
      2: { name: 'Prata', color: '#C0C0C0', bgColor: 'from-gray-400 to-gray-600', borderColor: '#A8A8A8' },
      3: { name: 'Ouro', color: '#FFD700', bgColor: 'from-yellow-400 to-yellow-600', borderColor: '#DAA520' },
      4: { name: 'Platina', color: '#E5E4E2', bgColor: 'from-blue-400 to-indigo-600', borderColor: '#B0C4DE' },
      5: { name: 'Diamante', color: '#B9F2FF', bgColor: 'from-purple-400 to-pink-600', borderColor: '#87CEEB' },
      6: { name: 'Lendário', color: '#FF6B6B', bgColor: 'from-red-500 to-pink-600', borderColor: '#FF4757' },
    };

    const current = levelData[level as keyof typeof levelData] || levelData[1];
    const previous = levelData[(level - 1) as keyof typeof levelData] || levelData[1];

    return {
      level,
      levelName: current.name,
      previousLevel: level - 1,
      previousLevelName: previous.name,
      xpGained,
      totalXp,
      color: current.color,
      bgColor: current.bgColor,
      borderColor: current.borderColor,
    };
  };

  const showLevelUp = useCallback((level: number, xpGained: number, totalXp: number) => {
    const levelInfo = getLevelInfo(level, xpGained, totalXp);
    
    if (isAnimating) {
      // Adicionar à fila se já estiver animando
      setQueue(prev => [...prev, levelInfo]);
    } else {
      setCurrentLevelUp(levelInfo);
      setIsAnimating(true);
    }
  }, [isAnimating]);

  const hideLevelUp = useCallback(() => {
    setIsAnimating(false);
    setCurrentLevelUp(null);
    
    // Processar próxima subida de nível da fila
    if (queue.length > 0) {
      const nextLevelUp = queue[0];
      setQueue(prev => prev.slice(1));
      setTimeout(() => {
        setCurrentLevelUp(nextLevelUp);
        setIsAnimating(true);
      }, 1000);
    }
  }, [queue]);

  const checkLevelUp = useCallback((previousLevel: number, currentLevel: number, xpGained: number, totalXp: number) => {
    if (currentLevel > previousLevel) {
      showLevelUp(currentLevel, xpGained, totalXp);
    }
  }, [showLevelUp]);

  return {
    currentLevelUp,
    isAnimating,
    showLevelUp,
    hideLevelUp,
    checkLevelUp,
    queueLength: queue.length,
  };
}; 