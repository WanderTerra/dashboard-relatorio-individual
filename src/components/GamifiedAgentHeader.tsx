import React from 'react';
import { Trophy, Star, TrendingUp, Target, Award, User } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { getAgentGamification, type GamificationData } from '../lib/gamification-api';
import NotificationBell from './NotificationBell';

interface GamifiedAgentHeaderProps {
  agentName: string;
  agentId: string;
}

const GamifiedAgentHeader: React.FC<GamifiedAgentHeaderProps> = ({
  agentName,
  agentId
}) => {
  // Buscar dados de gamificação do banco
  const { data: gamificationData, isLoading, error } = useQuery({
    queryKey: ['agentGamification', agentId],
    queryFn: () => getAgentGamification(agentId),
    staleTime: 5 * 60 * 1000, // 5 minutos
    refetchOnWindowFocus: false
  });

  // Só mostrar dados se a API estiver funcionando e retornar dados válidos
  if (!gamificationData || gamificationData === null) {
    return (
      <div className="bg-gradient-to-br from-emerald-50 via-green-50 to-teal-50 border-b border-emerald-200">
        <div className="px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl lg:text-3xl font-bold text-gray-800 mb-1">
                {agentName}
              </h1>
              <p className="text-sm text-gray-600">
                Agente ID: {agentId}
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs text-gray-500 bg-white px-3 py-1 rounded-full border">
                Sistema de gamificação em desenvolvimento
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const data: GamificationData = gamificationData;

  // Configuração dos níveis com cores mais elegantes
  const levels = [
    { id: 1, name: 'Bronze', color: '#8B4513', bgColor: '#F5DEB3', borderColor: '#D2691E', gradient: 'from-amber-100 to-orange-100' },
    { id: 2, name: 'Prata', color: '#4A5568', bgColor: '#E2E8F0', borderColor: '#718096', gradient: 'from-gray-100 to-slate-100' },
    { id: 3, name: 'Ouro', color: '#B7791F', bgColor: '#FEF5E7', borderColor: '#D69E2E', gradient: 'from-yellow-100 to-amber-100' },
    { id: 4, name: 'Platina', color: '#2C5282', bgColor: '#EBF8FF', borderColor: '#3182CE', gradient: 'from-blue-100 to-indigo-100' },
    { id: 5, name: 'Diamante', color: '#553C9A', bgColor: '#FAF5FF', borderColor: '#805AD5', gradient: 'from-purple-100 to-pink-100' },
    { id: 6, name: '???', color: '#C53030', bgColor: '#FED7D7', borderColor: '#E53E3E', gradient: 'from-red-100 to-pink-100' }
  ];

  const currentLevelInfo = levels.find(level => level.id === data.current_level) || levels[0];
  const nextLevelInfo = levels.find(level => level.id === data.current_level + 1);
  
  // Calcular progresso para o próximo nível
  const getProgressPercentage = () => {
    if (!nextLevelInfo) return 100;
    
    let xpRequired = 0;
    let xpCurrent = 0;
    
    switch (nextLevelInfo.id) {
      case 2: // Prata
        xpRequired = 1000;
        xpCurrent = data.current_xp;
        break;
      case 3: // Ouro
        xpRequired = 4000;
        xpCurrent = data.current_xp - 1000;
        break;
      case 4: // Platina
        xpRequired = 5000;
        xpCurrent = data.current_xp - 5000;
        break;
      case 5: // Diamante
        xpRequired = 10000;
        xpCurrent = data.current_xp - 10000;
        break;
      case 6: // Nível Secreto
        xpRequired = 30000;
        xpCurrent = data.current_xp - 20000;
        break;
      default:
        return 100;
    }
    
    const percentage = Math.min(100, (xpCurrent / xpRequired) * 100);
    return Math.max(0, percentage);
  };

  const progressPercentage = getProgressPercentage();

  // Loading state
  if (isLoading) {
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
    <div className="bg-gradient-to-br from-emerald-50 via-green-50 to-teal-50 border-b border-emerald-200">
      <div className="px-4 sm:px-6 lg:px-8 py-8">
        {/* Header Principal */}
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between mb-8">
          {/* Informações do Agente */}
          <div className="flex items-center space-x-6 mb-6 lg:mb-0">
            {/* Avatar com Nível */}
            <div className="relative">
              <div 
                className={`w-20 h-20 rounded-full flex items-center justify-center text-white font-bold text-2xl shadow-xl border-4 transition-all duration-300 hover:scale-105`}
                style={{ 
                  backgroundColor: currentLevelInfo.bgColor,
                  borderColor: currentLevelInfo.borderColor,
                  color: currentLevelInfo.color
                }}
              >
                {currentLevelInfo.name.charAt(0)}
              </div>
              {/* Badge de Nível */}
              <div className="absolute -bottom-3 -right-3 bg-white rounded-full p-2 shadow-lg border-2 border-emerald-200">
                <Trophy className="w-5 h-5" style={{ color: currentLevelInfo.color }} />
              </div>
            </div>
            
            {/* Nome e Nível */}
            <div>
              <h1 className="text-3xl lg:text-4xl font-bold text-gray-800 mb-2">
                {agentName}
              </h1>
              <p className="text-lg text-gray-600 mb-3 font-medium">
                Agente ID: {agentId}
              </p>
              <div className="flex items-center space-x-3">
                <span 
                  className={`px-4 py-2 rounded-full text-sm font-semibold shadow-md transition-all duration-300 hover:scale-105`}
                  style={{ 
                    backgroundColor: currentLevelInfo.bgColor,
                    color: currentLevelInfo.color,
                    border: `2px solid ${currentLevelInfo.borderColor}`
                  }}
                >
                  Nível {data.current_level} - {currentLevelInfo.name}
                </span>
                {data.current_level === 6 && (
                  <span className="px-3 py-2 bg-red-100 text-red-800 text-xs font-bold rounded-full border-2 border-red-300 shadow-md">
                    🕵️‍♂️ Secreto!
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Estatísticas Rápidas */}
          <div className="flex justify-end">
            <div className="grid grid-cols-2 gap-3 sm:gap-4">
              <div className="bg-white rounded-xl p-3 sm:p-4 shadow-lg border border-emerald-200 hover:shadow-xl transition-all duration-300">
                <div className="flex items-center space-x-2 sm:space-x-3">
                  <div className="p-1.5 sm:p-2 bg-yellow-100 rounded-lg">
                    <Star className="w-5 h-5 sm:w-6 sm:h-6 text-yellow-600" />
                  </div>
                  <div>
                    <p className="text-xs sm:text-sm font-medium text-gray-600">Total XP</p>
                    <p className="text-lg sm:text-xl font-bold text-gray-800">{data.total_xp_earned.toLocaleString()}</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-white rounded-xl p-3 sm:p-4 shadow-lg border border-emerald-200 hover:shadow-xl transition-all duration-300">
                <div className="flex items-center space-x-2 sm:space-x-3">
                  <div className="p-1.5 sm:p-2 bg-green-100 rounded-lg">
                    <TrendingUp className="w-5 h-5 sm:w-6 sm:h-6 text-green-600" />
                  </div>
                  <div>
                    <p className="text-xs sm:text-sm font-medium text-gray-600">XP Atual</p>
                    <p className="text-lg sm:text-xl font-bold text-gray-800">{data.current_xp.toLocaleString()}</p>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Sino de Notificações */}
            <div className="ml-4">
              <NotificationBell agentId={agentId} />
            </div>
          </div>

        </div>

        {/* Barra de Progresso para Próximo Nível */}
        {nextLevelInfo && (
          <div className="bg-white rounded-2xl p-4 sm:p-6 shadow-lg border border-emerald-200">
            <div className="flex items-center justify-between mb-3 sm:mb-4">
              <h3 className="text-base sm:text-lg font-semibold text-gray-700 flex items-center space-x-2">
                <Target className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-600" />
                <span>Progresso para {nextLevelInfo.name}</span>
              </h3>
              <span className="text-base sm:text-lg font-bold text-emerald-600 bg-emerald-50 px-2 sm:px-3 py-1 rounded-full">
                {Math.round(progressPercentage)}%
              </span>
            </div>
            
            {/* Barra de Progresso VERDE */}
            <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden shadow-inner">
              <div 
                className="h-4 rounded-full transition-all duration-1000 ease-out shadow-lg"
                style={{ 
                  width: `${progressPercentage}%`,
                  background: 'linear-gradient(90deg, #10B981 0%, #059669 50%, #047857 100%)'
                }}
              />
            </div>
            
            <div className="flex justify-between text-xs sm:text-sm text-gray-600 mt-2 sm:mt-3">
              <span className="font-medium">{data.current_xp} XP</span>
              <span className="font-medium">{data.xp_for_next_level} XP</span>
            </div>
          </div>
        )}

        {/* Conquistas Rápidas */}
        <div className="mt-4 sm:mt-6 flex flex-wrap gap-2 sm:gap-3">
          {data.current_level >= 2 && (
            <span className="inline-flex items-center px-2 sm:px-3 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm font-medium bg-gray-100 text-gray-800 border border-gray-300 shadow-sm">
              <Award className="w-3 h-3 sm:w-4 sm:h-4 mr-1.5 sm:mr-2 text-gray-600" />
              �� Prata Desbloqueada
            </span>
          )}
          {data.current_level >= 3 && (
            <span className="inline-flex items-center px-2 sm:px-3 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm font-medium bg-yellow-100 text-yellow-800 border border-yellow-300 shadow-sm">
              <Award className="w-3 h-3 sm:w-4 sm:h-4 mr-1.5 sm:mr-2 text-gray-600" />
              �� Ouro Desbloqueado
            </span>
          )}
          {data.current_level >= 4 && (
            <span className="inline-flex items-center px-2 sm:px-3 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm font-medium bg-blue-100 text-blue-800 border border-blue-300 shadow-sm">
              <Award className="w-3 h-3 sm:w-4 sm:h-4 mr-1.5 sm:mr-2 text-gray-600" />
              💎 Platina Desbloqueada
            </span>
          )}
          {data.current_level >= 5 && (
            <span className="inline-flex items-center px-2 sm:px-3 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm font-medium bg-purple-100 text-purple-800 border border-purple-300 shadow-sm">
              <Award className="w-3 h-3 sm:w-4 sm:h-4 mr-1.5 sm:mr-2 text-gray-600" />
              �� Diamante Desbloqueado
            </span>
          )}
        </div>

      </div>
    </div>
  );
};

export default GamifiedAgentHeader; 