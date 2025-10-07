import { useEffect, useRef } from 'react';
import { checkAgentAchievements, unlockAchievement } from '../lib/achievements-api';
import { getLocalAchievements } from '../lib/achievements';

interface AgentData {
  agent_id: string;
  current_level: number;
  current_xp: number;
  total_xp_earned: number;
  calls: any[];
  criteria: any[];
  summary: any;
}

// Mapeamento de IDs locais para tipos do backend
const ACHIEVEMENT_ID_TO_TYPE: Record<string, string> = {
  // Conquistas de Milestone
  'first_call': 'primeira_ligacao',
  'calls_10': 'dedicacao_inicial', // ✅ CORRIGIDO: era primeira_ligacao
  'calls_50': 'dedicacao',
  'calls_100': 'veterano',
  
  // Conquistas de Performance
  'perfect_call': 'perfeccionista',
  'high_performance': 'excelencia',
  'consistency': 'consistencia',
  
  // Conquistas de Streak
  'streak_3': 'primeira_semana',
  'streak_5': 'primeira_semana',
  
  // Conquistas Especiais
  'perfect_week': 'excelencia',
  'improvement': 'consistencia'
};

/**
 * Hook para sincronizar conquistas locais com o backend
 * Verifica conquistas desbloqueadas localmente e as registra no backend
 */
export const useSyncAchievements = (agentId: string, agentData: AgentData | null) => {
  const lastSyncRef = useRef<string>('');
  const syncedAchievementsRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    console.log('🔄 useSyncAchievements: verificando dados...', {
      hasAgentData: !!agentData,
      agentId,
      callsCount: agentData?.calls?.length || 0
    });
    
    if (!agentData || !agentId) {
      console.warn('⚠️ Sync cancelado: dados insuficientes', {
        hasAgentData: !!agentData,
        hasAgentId: !!agentId
      });
      return;
    }

    const syncAchievements = async () => {
      try {
        // Criar chave única para detectar mudanças nos dados
        const dataKey = JSON.stringify({
          calls: agentData.calls?.length || 0,
          level: agentData.current_level,
          xp: agentData.current_xp
        });

        // Se os dados não mudaram, não fazer nada
        if (lastSyncRef.current === dataKey) {
          console.log('⏭️ Sync já executado, pulando... (calls:', agentData.calls?.length, ')');
          return;
        }
        lastSyncRef.current = dataKey;

        // Verificar conquistas localmente
        const localAchievements = getLocalAchievements(agentData);
        const unlockedAchievements = localAchievements.filter(a => a.is_unlocked);

        console.log('🎯 Sincronizando conquistas...', {
          total: localAchievements.length,
          unlocked: unlockedAchievements.length,
          unlockedNames: unlockedAchievements.map(a => `${a.name} (${a.xp_reward}XP)`),
          agentId
        });

        // Para cada conquista desbloqueada localmente
        for (const achievement of unlockedAchievements) {
          // Se já foi sincronizada, pular
          if (syncedAchievementsRef.current.has(achievement.id)) {
            continue;
          }

          // Mapear ID local para tipo do backend
          const achievementType = ACHIEVEMENT_ID_TO_TYPE[achievement.id];
          
          if (!achievementType) {
            console.warn('⚠️ Conquista sem mapeamento para o backend:', achievement.id, achievement.name);
            continue;
          }

          try {
            // Tentar desbloquear no backend usando o tipo correto
            console.log('🏆 Tentando desbloquear conquista:', {
              name: achievement.name,
              localId: achievement.id,
              backendType: achievementType,
              xpReward: achievement.xp_reward,
              agentId
            });
            
            const result = await unlockAchievement(agentId, achievementType);
            
            // Marcar como sincronizada
            syncedAchievementsRef.current.add(achievement.id);
            
            console.log('✅ Conquista sincronizada com sucesso:', {
              name: achievement.name,
              result
            });
          } catch (error: any) {
            // Se o erro for 400, provavelmente a conquista já existe
            if (error?.response?.status === 400 || error?.message?.includes('já desbloqueada')) {
              console.log('ℹ️ Conquista já existe no backend:', {
                name: achievement.name,
                status: error?.response?.status,
                message: error?.message
              });
              syncedAchievementsRef.current.add(achievement.id);
            } else {
              console.error('❌ Erro ao sincronizar conquista:', {
                name: achievement.name,
                error: error?.message || error,
                status: error?.response?.status,
                data: error?.response?.data,
                fullError: error
              });
            }
          }
        }

        // Verificar conquistas no backend (pode haver conquistas manuais)
        await checkAgentAchievements(agentId);
        
      } catch (error) {
        console.error('❌ Erro geral na sincronização de conquistas:', error);
      }
    };

    // Executar sincronização com debounce
    const timeoutId = setTimeout(syncAchievements, 1000);
    
    return () => clearTimeout(timeoutId);
  }, [agentId, agentData]);

  return {
    syncedCount: syncedAchievementsRef.current.size
  };
};

