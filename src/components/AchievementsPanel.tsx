import React, { useState, useEffect } from 'react';
import { Trophy, Star, Target, Award, CheckCircle, Clock, Lock, TrendingUp, Zap, Gift, Crown, Flame, Shield } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { getAgentAchievements, checkAgentAchievements, type Achievement, type AchievementUnlocked } from '../lib/api';
import { useToast } from '../hooks/use-toast';
import AchievementAnimation from './AchievementAnimation';
import ConfettiEffect from './ConfettiEffect';
import { useAchievementAnimation } from '../hooks/useAchievementAnimation';

interface AchievementsPanelProps {
  agentId: string;
}

const AchievementsPanel: React.FC<AchievementsPanelProps> = ({ agentId }) => {
  const { toast } = useToast();
  const [selectedTab, setSelectedTab] = useState<'achievements' | 'progress'>('achievements');
  const [recentlyUnlocked, setRecentlyUnlocked] = useState<AchievementUnlocked[]>([]);
  
  // Hook para animações de conquistas
  const {
    currentAchievement,
    isAnimating,
    showAchievement,
    hideAchievement,
    showMultipleAchievements,
  } = useAchievementAnimation();

  // Buscar conquistas do agente
  const { data: achievements = [], isLoading: achievementsLoading, refetch } = useQuery({
    queryKey: ['achievements', agentId],
    queryFn: () => getAgentAchievements(agentId),
    refetchInterval: 30000,
  });

  // Verificar conquistas automaticamente
  useEffect(() => {
    const checkAchievements = async () => {
      try {
        const result = await checkAgentAchievements(agentId);
        if (result.achievements_unlocked && result.achievements_unlocked.length > 0) {
          setRecentlyUnlocked(result.achievements_unlocked);
          
          // Mostrar animações das conquistas desbloqueadas
          const newAchievements = result.achievements_unlocked.map((unlocked: AchievementUnlocked) => ({
            id: unlocked.achievement.id,
            name: unlocked.achievement.name,
            description: unlocked.achievement.description,
            xp_reward: unlocked.xp_gained,
            icon: unlocked.achievement.icon || '🏆',
            category: unlocked.achievement.category || 'special',
          }));
          
          showMultipleAchievements(newAchievements);
          
          // Atualizar a lista de conquistas
          refetch();
        }
      } catch (error) {
        console.error('Erro ao verificar conquistas:', error);
      }
    };

    checkAchievements();
  }, [agentId, refetch, showMultipleAchievements]);

  // Calcular estatísticas
  const totalXp = achievements.reduce((sum, achievement) => sum + achievement.xp_reward, 0);
  const unlockedCount = achievements.filter(a => a.is_unlocked).length;
  const lockedCount = achievements.filter(a => !a.is_unlocked).length;

  // Agrupar conquistas por categoria
  const achievementsByCategory = achievements.reduce((acc, achievement) => {
    const category = achievement.category;
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(achievement);
    return acc;
  }, {} as Record<string, Achievement[]>);

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'evaluation': return <Target className="h-5 w-5" />;
      case 'performance': return <Star className="h-5 w-5" />;
      case 'consistency': return <TrendingUp className="h-5 w-5" />;
      case 'milestone': return <Crown className="h-5 w-5" />;
      default: return <Award className="h-5 w-5" />;
    }
  };

  const getCategoryName = (category: string) => {
    switch (category) {
      case 'evaluation': return 'Avaliações';
      case 'performance': return 'Performance';
      case 'consistency': return 'Consistência';
      case 'milestone': return 'Marcos';
      default: return 'Outros';
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'evaluation': return 'blue';
      case 'performance': return 'green';
      case 'consistency': return 'purple';
      case 'milestone': return 'yellow';
      default: return 'gray';
    }
  };

  if (achievementsLoading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-16 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Efeito de confete */}
      <ConfettiEffect isActive={isAnimating} duration={3000} />
      
      {/* Animação de conquista */}
      {currentAchievement && (
        <AchievementAnimation
          achievement={currentAchievement}
          isVisible={isAnimating}
          onClose={hideAchievement}
        />
      )}

      {/* Painel de conquistas existente */}
      <div className="bg-white rounded-lg shadow">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center">
              <Trophy className="h-5 w-5 text-yellow-500 mr-2" />
              Conquistas
            </h3>
            <div className="text-sm text-gray-500">
              {unlockedCount}/{achievements.length} desbloqueadas
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="px-6 py-3 border-b border-gray-200">
          <div className="flex space-x-1">
            {[
              { key: 'achievements', label: 'Conquistas', icon: Trophy },
              { key: 'progress', label: 'Progresso', icon: Target }
            ].map(tab => (
              <button
                key={tab.key}
                onClick={() => setSelectedTab(tab.key as any)}
                className={`flex items-center px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                  selectedTab === tab.key
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <tab.icon className="h-4 w-4 mr-2" />
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Conteúdo das abas */}
        <div className="p-6">
          {selectedTab === 'achievements' && (
            <div className="space-y-6">
              {/* Estatísticas gerais */}
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-green-50 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-green-600">{unlockedCount}</div>
                  <div className="text-sm text-green-700">Desbloqueadas</div>
                </div>
                <div className="bg-blue-50 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-blue-600">{totalXp}</div>
                  <div className="text-sm text-blue-700">XP Total</div>
                </div>
                <div className="bg-gray-50 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-gray-600">{lockedCount}</div>
                  <div className="text-sm text-gray-700">Bloqueadas</div>
                </div>
              </div>

              {/* Conquistas por categoria */}
              {Object.entries(achievementsByCategory).map(([category, categoryAchievements]) => (
                <div key={category} className="space-y-3">
                  <div className="flex items-center gap-2">
                    {getCategoryIcon(category)}
                    <h4 className="font-semibold text-gray-900">
                      {getCategoryName(category)}
                    </h4>
                    <span className="text-sm text-gray-500">
                      ({categoryAchievements.filter(a => a.is_unlocked).length}/{categoryAchievements.length})
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {categoryAchievements.map((achievement) => (
                      <div
                        key={achievement.id}
                        className={`p-4 rounded-lg border-2 transition-all ${
                          achievement.is_unlocked
                            ? 'border-green-200 bg-green-50'
                            : 'border-gray-200 bg-gray-50'
                        }`}
                      >
                        <div className="flex items-start space-x-3">
                          <div className={`p-2 rounded-full ${
                            achievement.is_unlocked
                              ? 'bg-green-100'
                              : 'bg-gray-100'
                          }`}>
                            {achievement.is_unlocked ? (
                              <CheckCircle className="h-5 w-5 text-green-600" />
                            ) : (
                              <Lock className="h-5 w-5 text-gray-400" />
                            )}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center justify-between">
                              <h5 className={`font-semibold ${
                                achievement.is_unlocked ? 'text-green-900' : 'text-gray-700'
                              }`}>
                                {achievement.name}
                              </h5>
                              <div className="flex items-center space-x-2">
                                <span className={`text-sm font-medium ${
                                  achievement.is_unlocked ? 'text-green-600' : 'text-gray-500'
                                }`}>
                                  +{achievement.xp_reward} XP
                                </span>
                              </div>
                            </div>
                            <p className={`text-sm mt-1 ${
                              achievement.is_unlocked ? 'text-green-700' : 'text-gray-600'
                            }`}>
                              {achievement.description}
                            </p>
                            
                            {/* Progresso para conquistas bloqueadas */}
                            {!achievement.is_unlocked && achievement.progress !== undefined && (
                              <div className="mt-3">
                                <div className="flex justify-between text-xs text-gray-500 mb-1">
                                  <span>Progresso</span>
                                  <span>{Math.round(achievement.progress)}%</span>
                                </div>
                                <div className="w-full bg-gray-200 rounded-full h-2">
                                  <div
                                    className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                                    style={{ width: `${achievement.progress}%` }}
                                  ></div>
                                </div>
                              </div>
                            )}
                            
                            {/* Data de desbloqueio */}
                            {achievement.is_unlocked && achievement.unlocked_at && (
                              <div className="mt-2 text-xs text-green-600 flex items-center">
                                <Clock className="h-3 w-3 mr-1" />
                                Desbloqueado em {new Date(achievement.unlocked_at).toLocaleDateString('pt-BR')}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {selectedTab === 'progress' && (
            <div className="space-y-6">
              {/* Conquistas recentemente desbloqueadas */}
              {recentlyUnlocked.length > 0 && (
                <div className="bg-gradient-to-r from-yellow-400 to-orange-500 rounded-lg p-6 text-white">
                  <h4 className="text-lg font-semibold mb-4 flex items-center">
                    <Gift className="h-5 w-5 mr-2" />
                    Conquistas Recentes
                  </h4>
                  <div className="space-y-3">
                    {recentlyUnlocked.map((unlocked, index) => (
                      <div key={index} className="bg-white bg-opacity-20 rounded-lg p-3">
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="font-semibold">{unlocked.achievement.name}</div>
                            <div className="text-sm opacity-90">{unlocked.achievement.description}</div>
                          </div>
                          <div className="text-right">
                            <div className="text-lg font-bold">+{unlocked.xp_gained} XP</div>
                            <div className="text-sm opacity-90">Nível {unlocked.new_level}</div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Estatísticas de progresso */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-gray-50 rounded-lg p-6">
                  <h4 className="font-semibold text-gray-900 mb-4">Distribuição por Categoria</h4>
                  <div className="space-y-3">
                    {Object.entries(achievementsByCategory).map(([category, categoryAchievements]) => {
                      const unlocked = categoryAchievements.filter(a => a.is_unlocked).length;
                      const total = categoryAchievements.length;
                      const percentage = total > 0 ? (unlocked / total) * 100 : 0;
                      
                      return (
                        <div key={category}>
                          <div className="flex justify-between text-sm mb-1">
                            <span className="text-gray-600">{getCategoryName(category)}</span>
                            <span className="font-medium">{unlocked}/{total}</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                              className={`h-2 rounded-full transition-all duration-300 bg-${getCategoryColor(category)}-500`}
                              style={{ width: `${percentage}%` }}
                            ></div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="bg-gray-50 rounded-lg p-6">
                  <h4 className="font-semibold text-gray-900 mb-4">Próximas Conquistas</h4>
                  <div className="space-y-3">
                    {achievements
                      .filter(a => !a.is_unlocked)
                      .slice(0, 3)
                      .map((achievement) => (
                        <div key={achievement.id} className="flex items-center space-x-3">
                          <div className="p-2 bg-gray-100 rounded-full">
                            <Lock className="h-4 w-4 text-gray-400" />
                          </div>
                          <div className="flex-1">
                            <div className="font-medium text-gray-900 text-sm">
                              {achievement.name}
                            </div>
                            <div className="text-xs text-gray-500">
                              {achievement.requirements.description}
                            </div>
                          </div>
                          <div className="text-xs text-gray-500">
                            +{achievement.xp_reward} XP
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default AchievementsPanel; 