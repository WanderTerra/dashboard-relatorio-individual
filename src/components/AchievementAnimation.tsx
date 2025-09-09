import React, { useState, useEffect } from 'react';
import { Trophy, Star, Crown, Award, Zap, Sparkles, Gift, Target, CheckCircle, X } from 'lucide-react';

interface AchievementAnimationProps {
  achievement: {
    id: string;
    name: string;
    description: string;
    xp_reward: number;
    icon: string;
    category: string;
  };
  isVisible: boolean;
  onClose: () => void;
}

const AchievementAnimation: React.FC<AchievementAnimationProps> = ({
  achievement,
  isVisible,
  onClose
}) => {
  const [showConfetti, setShowConfetti] = useState(false);
  const [showGlow, setShowGlow] = useState(false);
  const [showSparkles, setShowSparkles] = useState(false);
  const [animationPhase, setAnimationPhase] = useState(0);
  const [showContent, setShowContent] = useState(false);

  useEffect(() => {
    if (isVisible) {
      // Sequência suavizada de animações
      setShowConfetti(true);
      
      setTimeout(() => setShowGlow(true), 200);
      setTimeout(() => setAnimationPhase(1), 300);
      setTimeout(() => setShowSparkles(true), 500);
      setTimeout(() => setShowContent(true), 700);
      
      // Auto close após 4 segundos
      const timer = setTimeout(() => {
        onClose();
      }, 4000);

      return () => clearTimeout(timer);
    } else {
      // Reset suave
      setShowConfetti(false);
      setShowGlow(false);
      setShowSparkles(false);
      setAnimationPhase(0);
      setShowContent(false);
    }
  }, [isVisible, onClose]);

  const getCategoryIcon = (category: string) => {
    const iconMap = {
      milestone: <Star className="w-10 h-10" />,
      performance: <Trophy className="w-10 h-10" />,
      consistency: <Target className="w-10 h-10" />,
      level: <Crown className="w-10 h-10" />,
      special: <Gift className="w-10 h-10" />,
      default: <Award className="w-10 h-10" />
    };
    return iconMap[category as keyof typeof iconMap] || iconMap.default;
  };

  const getCategoryGradient = (category: string) => {
    const gradients = {
      milestone: 'from-yellow-500 via-orange-600 to-red-600',
      performance: 'from-blue-500 via-purple-600 to-pink-600',
      consistency: 'from-green-500 via-emerald-600 to-teal-600',
      level: 'from-amber-500 via-yellow-600 to-orange-600',
      special: 'from-pink-500 via-rose-600 to-purple-600',
      default: 'from-indigo-500 via-blue-600 to-purple-600'
    };
    return gradients[category as keyof typeof gradients] || gradients.default;
  };

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm transition-opacity duration-500">
      {/* Confetti Effect */}
      {showConfetti && (
        <div className="absolute inset-0 pointer-events-none transition-opacity duration-1000">
          {[...Array(50)].map((_, i) => (
            <div
              key={i}
              className="absolute w-2 h-2 rounded-full animate-bounce"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                backgroundColor: ['#FFD700', '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7'][Math.floor(Math.random() * 6)],
                animationDelay: `${Math.random() * 2}s`,
                animationDuration: `${2.5 + Math.random() * 1.5}s`,
                animationTimingFunction: 'cubic-bezier(0.4, 0, 0.2, 1)'
              }}
            />
          ))}
        </div>
      )}

      {/* Main Card */}
      <div className={`relative transform transition-all duration-1000 ease-out ${
        animationPhase === 1 ? 'scale-100 rotate-0 opacity-100' : 'scale-75 rotate-6 opacity-0'
      }`}>
        {/* Glow Effect */}
        {showGlow && (
          <div className={`absolute -inset-4 bg-gradient-to-r ${getCategoryGradient(achievement.category)} rounded-3xl blur-xl opacity-60 transition-all duration-1000 ease-out animate-pulse`} />
        )}

        {/* Card Container */}
        <div className={`relative bg-gradient-to-br ${getCategoryGradient(achievement.category)} p-10 rounded-3xl shadow-2xl max-w-lg w-full mx-4 transition-all duration-1000 ease-out`}>
          {/* Sparkle Effects */}
          {showSparkles && (
            <>
              <div className="absolute top-6 right-6 animate-spin transition-opacity duration-1000 ease-out">
                <Sparkles className="w-8 h-8 text-white/70" />
              </div>
              <div className="absolute top-12 right-12 animate-pulse transition-opacity duration-1000 ease-out" style={{ animationDuration: '2s' }}>
                <Zap className="w-6 h-6 text-white/50" />
              </div>
              <div className="absolute bottom-8 left-8 animate-bounce transition-opacity duration-1000 ease-out" style={{ animationDuration: '3s' }}>
                <Star className="w-6 h-6 text-white/60" />
              </div>
            </>
          )}

          {/* Header */}
          <div className={`flex items-center justify-between mb-8 transition-all duration-800 ease-out delay-200 ${
            showContent ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'
          }`}>
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-white/30 rounded-full backdrop-blur-sm shadow-lg transition-all duration-500 ease-out hover:scale-110">
                {getCategoryIcon(achievement.category)}
              </div>
              <div className="text-white text-lg font-semibold drop-shadow-lg">
                Conquista Desbloqueada!
              </div>
            </div>
            <div className="p-3 bg-white/30 rounded-full backdrop-blur-sm shadow-lg transition-all duration-500 ease-out hover:scale-110">
              <CheckCircle className="w-8 h-8 text-white" />
            </div>
          </div>

          {/* Achievement Name */}
          <div className={`text-center mb-8 transition-all duration-800 ease-out delay-400 ${
            showContent ? 'translate-y-0 opacity-100' : 'translate-y-6 opacity-0'
          }`}>
            <h2 className="text-4xl font-bold text-white mb-4 drop-shadow-2xl transition-all duration-500 ease-out">
              {achievement.name}
            </h2>
            <p className="text-white text-xl leading-relaxed drop-shadow-lg transition-all duration-500 ease-out">
              {achievement.description}
            </p>
          </div>

          {/* XP Reward */}
          <div className={`flex items-center justify-center mb-8 transition-all duration-800 ease-out delay-600 ${
            showContent ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'
          }`}>
            <div className="bg-white/30 backdrop-blur-sm rounded-2xl px-8 py-4 flex items-center space-x-4 shadow-lg transition-all duration-500 ease-out hover:scale-105">
              <Star className="w-8 h-8 text-white transition-transform duration-300 ease-out" />
              <span className="text-white font-bold text-2xl drop-shadow-lg">
                +{achievement.xp_reward} XP
              </span>
            </div>
          </div>

          {/* Progress Indicator */}
          <div className={`flex items-center justify-center space-x-3 transition-all duration-800 ease-out delay-800 ${
            showContent ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'
          }`}>
            <div className="w-4 h-4 bg-white/80 rounded-full animate-pulse shadow-lg transition-all duration-500 ease-out" />
            <div className="w-4 h-4 bg-white/60 rounded-full animate-pulse shadow-lg transition-all duration-500 ease-out" style={{ animationDelay: '0.2s' }} />
            <div className="w-4 h-4 bg-white/40 rounded-full animate-pulse shadow-lg transition-all duration-500 ease-out" style={{ animationDelay: '0.4s' }} />
          </div>

          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-6 right-6 text-white/80 hover:text-white transition-all duration-300 ease-out p-2 rounded-full hover:bg-white/20 hover:scale-110"
          >
            <X className="w-8 h-8" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default AchievementAnimation; 