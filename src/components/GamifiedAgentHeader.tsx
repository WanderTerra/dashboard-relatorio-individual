import React, { useState, useEffect } from 'react';
import { Trophy, Star, TrendingUp, Target, Award, User } from 'lucide-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { getAgentGamification, type GamificationData } from '../lib/gamification-api';
import { getAgentSummary, getAgentCalls, getAgentCriteria } from '../lib/api';
import { getLocalAchievements } from '../lib/achievements';
import { getAgentAchievements } from '../lib/achievements-api';
import { useToast } from '../hooks/use-toast';
import NotificationBell from './NotificationBell';
import ConfettiEffect from './ConfettiEffect';
import LevelUpAnimation from './LevelUpAnimation';
import { useLevelUpAnimation } from '../hooks/useLevelUpAnimation';

interface GamifiedAgentHeaderProps {
  agentName: string;
  agentId: string;
}

const GamifiedAgentHeader: React.FC<GamifiedAgentHeaderProps> = ({
  agentName,
  agentId
}) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [previousLevel, setPreviousLevel] = useState<number | null>(null);
  const [previousXp, setPreviousXp] = useState<number | null>(null);
  const [achievementXp, setAchievementXp] = useState(0);
  
  // Hook para animações de subida de nível
  const {
    currentLevelUp,
    isAnimating: isLevelUpAnimating,
    showLevelUp,
    hideLevelUp,
  } = useLevelUpAnimation();

  // Buscar dados de gamificação
  const { data: gamificationData, isLoading: isLoadingGamification } = useQuery({
    queryKey: ['agent-gamification', agentId],
    queryFn: () => getAgentGamification(agentId),
    enabled: !!agentId,
    refetchInterval: 30000, // Atualizar a cada 30 segundos
  });

  // Buscar conquistas do backend
  const { data: backendAchievements = [] } = useQuery({
    queryKey: ['agent-achievements', agentId],
    queryFn: () => getAgentAchievements(agentId),
    enabled: !!agentId,
    refetchInterval: 30000, // Atualizar a cada 30 segundos
  });

  // Buscar dados do agente para calcular conquistas locais
  // Usar os mesmos filtros do AgentDetail (sem filtro de data para pegar todas as ligações)
  const { data: summary } = useQuery({
    queryKey: ['agent-summary', agentId],
    queryFn: () => getAgentSummary(agentId, {
      start: '2024-01-01', // Data bem antiga para pegar todas as ligações
      end: '2025-12-31'    // Data futura para pegar todas as ligações
    }),
    enabled: !!agentId,
  });

  const { data: calls } = useQuery({
    queryKey: ['agent-calls', agentId],
    queryFn: () => getAgentCalls(agentId, {
      start: '2024-01-01', // Data bem antiga para pegar todas as ligações
      end: '2025-12-31'    // Data futura para pegar todas as ligações
    }),
    enabled: !!agentId,
  });

  const { data: criteria } = useQuery({
    queryKey: ['agent-criteria', agentId],
    queryFn: () => getAgentCriteria(agentId, {
      start: '2024-01-01', // Data bem antiga para pegar todas as ligações
      end: '2025-12-31'    // Data futura para pegar todas as ligações
    }),
    enabled: !!agentId,
  });

  // Calcular conquistas do backend (fonte real das conquistas)
  useEffect(() => {
    if (backendAchievements && backendAchievements.length > 0) {
      console.log('🏆 Conquistas do Backend:', {
        agentId,
        backendAchievements,
        totalAchievements: backendAchievements.length
      });
      
      const totalXp = backendAchievements.reduce((sum, achievement) => sum + achievement.xp_reward, 0);
      setAchievementXp(totalXp);
      
      console.log('🏆 XP Total das Conquistas do Backend:', {
        totalXp,
        individualXp: backendAchievements.map(a => ({ 
          name: a.achievement_name, 
          xp: a.xp_reward,
          type: a.achievement_type 
        }))
      });
    } else {
      setAchievementXp(0);
    }
  }, [backendAchievements, agentId]);

  // ✅ CORREÇÃO: Usar apenas XP do backend (fonte única da verdade)
  // O backend já deve incluir XP das conquistas após sincronização
  const currentXp = gamificationData?.current_xp || 0;
  const totalXpEarned = gamificationData?.total_xp_earned || 0;
  
  // XP das conquistas locais (apenas para debug/comparação)
  const localAchievementXp = achievementXp;
  
  // Sistema de níveis baseado nos dados reais da API
  const levelThresholds = [
    { level: 1, name: 'Bronze', xp: 0, color: '#8B4513', bgColor: '#F5DEB3', borderColor: '#D2691E', gradient: 'from-amber-100 to-orange-100' },
    { level: 2, name: 'Prata', xp: 1000, color: '#4A5568', bgColor: '#E2E8F0', borderColor: '#718096', gradient: 'from-gray-100 to-slate-100' },
    { level: 3, name: 'Ouro', xp: 2500, color: '#B7791F', bgColor: '#FEF5E7', borderColor: '#D69E2E', gradient: 'from-yellow-100 to-amber-100' },
    { level: 4, name: 'Platina', xp: 5000, color: '#2C5282', bgColor: '#EBF8FF', borderColor: '#3182CE', gradient: 'from-blue-100 to-indigo-100' },
    { level: 5, name: 'Diamante', xp: 10000, color: '#553C9A', bgColor: '#FAF5FF', borderColor: '#805AD5', gradient: 'from-purple-100 to-pink-100' },
  ];

  // ✅ CORREÇÃO: Usar nível do backend como fonte oficial
  const backendLevel = gamificationData?.current_level || 1;
  const currentLevelInfo = levelThresholds.find(level => level.level === backendLevel) || levelThresholds[0];
  const nextLevelInfo = levelThresholds.find(level => level.level === backendLevel + 1) || levelThresholds[levelThresholds.length - 1];
  
  // Calcular progresso para o próximo nível
  const xpForCurrentLevel = currentLevelInfo.xp;
  const xpForNextLevel = nextLevelInfo.xp;
  const xpNeeded = xpForNextLevel - xpForCurrentLevel;
  const xpProgress = currentXp - xpForCurrentLevel;
  const progressPercentage = Math.min((xpProgress / xpNeeded) * 100, 100);

  // Debug logs
  useEffect(() => {
    if (gamificationData) {
      console.log('🎮 Dados de Gamificação (Backend):', gamificationData);
      console.log('🏆 XP Conquistas Locais (não somado):', localAchievementXp);
      console.log('📊 XP Oficial do Backend:', currentXp);
      console.log('🎯 Nível do Backend:', backendLevel, currentLevelInfo.name);
      console.log('📈 Progresso para próximo nível:', `${progressPercentage.toFixed(1)}%`);
      console.log('🔍 Cálculo Detalhado:', {
        backendLevel,
        currentXpFromBackend: gamificationData.current_xp,
        localAchievementXp,
        totalXpEarned,
        currentLevelName: currentLevelInfo.name,
        xpForCurrentLevel,
        xpForNextLevel,
        xpNeeded,
        xpProgress,
        progressPercentage
      });
    }
  }, [gamificationData, localAchievementXp, currentXp, progressPercentage, backendLevel, currentLevelInfo]);

  // ✅ CORREÇÃO: Detectar subida de nível apenas quando o backend atualizar
  useEffect(() => {
    if (!gamificationData) return;
    
    // Usar nível do backend como fonte oficial
    const officialLevel = gamificationData.current_level || 1;
    const currentXpAmount = gamificationData.current_xp || 0;
    
    // Validação extra: só disparar se realmente atingiu o XP necessário
    const levelXpThresholds = [0, 1000, 2500, 5000, 10000, 20000];
    const requiredXp = levelXpThresholds[officialLevel - 1] || 0;
    const hasEnoughXp = currentXpAmount >= requiredXp;
    
    if (previousLevel !== null && officialLevel > previousLevel && hasEnoughXp) {
      console.log('🎉 LEVEL UP detectado (backend):', {
        de: previousLevel,
        para: officialLevel,
        xpGanho: currentXp - (previousXp || 0),
        xpTotal: currentXp,
        requiredXp,
        hasEnoughXp
      });
      
      showLevelUp(
        officialLevel,
        currentXp - (previousXp || 0),
        currentXp
      );
    } else if (previousLevel !== null && officialLevel > previousLevel && !hasEnoughXp) {
      console.warn('⚠️ Backend reportou level up, mas XP insuficiente:', {
        nivel: officialLevel,
        xpAtual: currentXpAmount,
        xpNecessario: requiredXp
      });
    }
    
    setPreviousLevel(officialLevel);
    setPreviousXp(currentXp);
  }, [gamificationData?.current_level, currentXp, previousLevel, previousXp, showLevelUp]);

  // Se não há dados de gamificação, não renderizar nada
  if (!gamificationData) {
    return null;
  }

  // Loading state
  if (isLoadingGamification) {
    return (
      <div className="bg-gradient-to-br from-emerald-50 via-green-50 to-teal-50 border-b border-emerald-200">
        <div className="px-4 sm:px-6 lg:px-8 py-8">
          <div className="animate-pulse">
            <div className="flex items-center space-x-6 mb-8">
              <div className="w-20 h-20 bg-gray-300 rounded-full"></div>
              <div className="space-y-3">
                <div className="h-8 bg-gray-300 rounded w-64"></div>
                <div className="h-6 bg-gray-300 rounded w-32"></div>
                <div className="h-8 bg-gray-300 rounded w-40"></div>
              </div>
            </div>
            <div className="h-32 bg-gray-300 rounded-xl"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Efeito de confete */}
      <ConfettiEffect isActive={isLevelUpAnimating} duration={4000} />
      
      {/* Animação de subida de nível */}
      {currentLevelUp && (
        <LevelUpAnimation
          levelInfo={currentLevelUp}
          isVisible={isLevelUpAnimating}
          onClose={hideLevelUp}
        />
      )}

      {/* Header existente */}
      <div className="bg-gradient-to-br from-emerald-50 via-green-50 to-teal-50 border-b border-emerald-200">
        <div className="px-4 sm:px-6 lg:px-8 py-8">
          {/* Header Principal */}
          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between mb-8">
            {/* Informações do Agente */}
            <div className="flex items-center space-x-6 mb-6 lg:mb-0">
              {/* Avatar com Nível */}
              <div className="relative">
                <div 
                  className={`w-20 h-20 rounded-full flex items-center justify-center text-white font-bold text-2xl shadow-xl border-4 transition-all duration-300 hover:scale-105 bg-gradient-to-br ${currentLevelInfo.gradient}`}
                  style={{ 
                    borderColor: currentLevelInfo.borderColor,
                    backgroundColor: currentLevelInfo.bgColor,
                    color: currentLevelInfo.color
                  }}
                >
                  {currentLevelInfo.name.charAt(0)}
                </div>
                {/* Badge de nível */}
                <div 
                  className="absolute -top-2 -right-2 w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-lg"
                  style={{ backgroundColor: currentLevelInfo.color }}
                >
                  {currentLevelInfo.level}
                </div>
              </div>

              {/* Informações do Agente */}
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">{agentName}</h1>
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2">
                    <Trophy className="w-5 h-5" style={{ color: currentLevelInfo.color }} />
                    <span className="text-lg font-semibold" style={{ color: currentLevelInfo.color }}>
                      {currentLevelInfo.name}
                    </span>
                  </div>
                  <div className="text-gray-600">
                    Nível {currentLevelInfo.level}
                  </div>
                </div>
              </div>
            </div>

            {/* Notificações */}
            <div className="flex items-center space-x-4">
              <NotificationBell agentId={agentId} />
            </div>
          </div>

          {/* Barra de Progresso */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Progresso para {nextLevelInfo.name}</h3>
              <div className="text-right">
                <div className="text-2xl font-bold text-gray-900">{currentXp.toLocaleString()} XP</div>
                <div className="text-sm text-gray-600">
                  {xpProgress.toLocaleString()}/{xpNeeded.toLocaleString()} XP
                </div>
              </div>
            </div>
            
            {/* Barra de progresso */}
            <div className="w-full bg-gray-200 rounded-full h-3 mb-2">
              <div 
                className="h-3 rounded-full transition-all duration-500 ease-out"
                style={{ 
                  width: `${progressPercentage}%`,
                  background: `linear-gradient(90deg, ${currentLevelInfo.color} 0%, ${nextLevelInfo.color} 100%)`
                }}
              ></div>
            </div>
            
            <div className="flex justify-between text-sm text-gray-600">
              <span className="font-medium">{currentLevelInfo.name}</span>
              <span className="font-medium">{nextLevelInfo.name}</span>
            </div>
          </div>

          {/* Estatísticas */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200 text-center">
              <div className="flex items-center justify-center mb-2">
                <Star className="w-6 h-6 text-yellow-500" />
              </div>
              <div>
                <p className="text-xs sm:text-sm font-medium text-gray-600">Total XP</p>
                <p className="text-lg sm:text-xl font-bold text-gray-800">{totalXpEarned.toLocaleString()}</p>
              </div>
            </div>
            
            <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200 text-center">
              <div className="flex items-center justify-center mb-2">
                <Award className="w-6 h-6 text-purple-500" />
              </div>
              <div>
                <p className="text-xs sm:text-sm font-medium text-gray-600">XP Conquistas</p>
                <p className="text-lg sm:text-xl font-bold text-gray-800">{achievementXp.toLocaleString()}</p>
              </div>
            </div>
            
            <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200 text-center">
              <div className="flex items-center justify-center mb-2">
                <TrendingUp className="w-6 h-6 text-green-500" />
              </div>
              <div>
                <p className="text-xs sm:text-sm font-medium text-gray-600">XP Atual</p>
                <p className="text-lg sm:text-xl font-bold text-gray-800">{currentXp.toLocaleString()}</p>
              </div>
            </div>
            
            <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200 text-center">
              <div className="flex items-center justify-center mb-2">
                <Target className="w-6 h-6 text-blue-500" />
              </div>
              <div>
                <p className="text-xs sm:text-sm font-medium text-gray-600">Progresso</p>
                <p className="text-lg sm:text-xl font-bold text-gray-800">{progressPercentage.toFixed(1)}%</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default GamifiedAgentHeader; 