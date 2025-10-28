import React, { useState, useEffect } from 'react';
import { Mic, MicOff, Square, Play, Pause, Volume2, Loader2, AlertCircle } from 'lucide-react';
import { testMediaRecorderSupport } from '../utils/mediaRecorderTest';
import { testMediaRecorderSupportAlternative } from '../utils/mediaRecorderTestAlternative';

interface VoiceControlsProps {
  isRecording: boolean;
  isPaused: boolean;
  recordingDuration: number;
  error: string | null;
  onStartRecording: () => void;
  onStopRecording: () => void;
  onPauseRecording: () => void;
  onResumeRecording: () => void;
  onClearRecording: () => void;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  showTimer?: boolean;
  showWaveform?: boolean;
}

export const VoiceControls: React.FC<VoiceControlsProps> = ({
  isRecording,
  isPaused,
  recordingDuration,
  error,
  onStartRecording,
  onStopRecording,
  onPauseRecording,
  onResumeRecording,
  onClearRecording,
  className = '',
  size = 'md',
  showTimer = true,
  showWaveform = true
}) => {
  const [audioLevel, setAudioLevel] = useState(0);
  const [isSupported, setIsSupported] = useState(true);
  const [supportChecked, setSupportChecked] = useState(false);
  const [supportDetails, setSupportDetails] = useState<any>(null);

  // Verificar suporte ao MediaRecorder
  useEffect(() => {
    const checkSupport = async () => {
      try {
        // Primeiro tentar o teste padrão
        let result = await testMediaRecorderSupport();
        
        // Se falhar com "navigator.mediaDevices não disponível", tentar teste alternativo
        if (!result.supported && result.error?.includes('navigator.mediaDevices')) {
          console.log('🔄 Tentando teste alternativo...');
          result = await testMediaRecorderSupportAlternative();
        }
        
        setIsSupported(result.supported);
        setSupportDetails(result.details);
        
        if (!result.supported && result.error) {
          console.log('❌ Suporte não disponível:', result.error);
          console.log('📋 Detalhes:', result.details);
        } else if (result.supported) {
          console.log('✅ Suporte disponível:', result.details);
        }
      } catch (e) {
        console.log('❌ Erro ao verificar suporte:', e);
        setIsSupported(true); // Sempre mostrar botão, tratar erro no clique
      } finally {
        setSupportChecked(true);
      }
    };

    checkSupport();
  }, []);

  // Simular nível de áudio durante gravação
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (isRecording && !isPaused) {
      interval = setInterval(() => {
        setAudioLevel(Math.random() * 100);
      }, 100);
    } else {
      setAudioLevel(0);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRecording, isPaused]);

  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getSizeClasses = () => {
    switch (size) {
      case 'sm':
        return 'w-8 h-8 text-sm';
      case 'lg':
        return 'w-16 h-16 text-lg';
      default:
        return 'w-12 h-12 text-base';
    }
  };

  const getButtonSize = () => {
    switch (size) {
      case 'sm':
        return 16;
      case 'lg':
        return 32;
      default:
        return 24;
    }
  };

  // Sempre mostrar o botão, mas com estado diferente se não suportado
  const buttonDisabled = !isSupported && supportChecked;

  return (
    <div className={`flex flex-col items-center gap-3 ${className}`}>
      {/* Botão principal de gravação */}
      <div className="relative">
        <button
          onClick={isRecording ? onStopRecording : onStartRecording}
          disabled={buttonDisabled}
          className={`
            ${getSizeClasses()}
            rounded-full flex items-center justify-center
            transition-all duration-300 transform hover:scale-105 active:scale-95
            disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100
            ${buttonDisabled
              ? 'bg-gray-400 text-white shadow-lg'
              : isRecording 
                ? 'bg-red-500 hover:bg-red-600 text-white shadow-lg shadow-red-500/30' 
                : 'bg-blue-500 hover:bg-blue-600 text-white shadow-lg shadow-blue-500/30'
            }
          `}
          title={buttonDisabled ? "Gravação não suportada neste navegador" : (isRecording ? "Parar gravação" : "Iniciar gravação")}
        >
          {isRecording ? (
            <Square size={getButtonSize()} />
          ) : (
            <Mic size={getButtonSize()} />
          )}
        </button>

        {/* Indicador de gravação */}
        {isRecording && (
          <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full animate-pulse" />
        )}

        {/* Waveform animado */}
        {showWaveform && isRecording && !isPaused && (
          <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 flex gap-1">
            {[...Array(5)].map((_, i) => (
              <div
                key={i}
                className="w-1 bg-blue-500 rounded-full animate-pulse"
                style={{
                  height: `${Math.max(4, audioLevel / 20 + Math.random() * 10)}px`,
                  animationDelay: `${i * 0.1}s`,
                  animationDuration: '0.5s'
                }}
              />
            ))}
          </div>
        )}
      </div>

      {/* Controles secundários */}
      {isRecording && (
        <div className="flex items-center gap-2">
          <button
            onClick={isPaused ? onResumeRecording : onPauseRecording}
            className="w-8 h-8 rounded-full bg-gray-500 hover:bg-gray-600 text-white flex items-center justify-center transition-colors"
          >
            {isPaused ? (
              <Play size={16} />
            ) : (
              <Pause size={16} />
            )}
          </button>

          <button
            onClick={onClearRecording}
            className="w-8 h-8 rounded-full bg-gray-500 hover:bg-gray-600 text-white flex items-center justify-center transition-colors"
          >
            <MicOff size={16} />
          </button>
        </div>
      )}

      {/* Timer */}
      {showTimer && (isRecording || recordingDuration > 0) && (
        <div className="text-sm text-gray-600 font-mono">
          {formatDuration(recordingDuration)}
        </div>
      )}

      {/* Mensagem de erro */}
      {error && (
        <div className="flex items-center gap-2 text-red-500 text-sm max-w-xs">
          <AlertCircle size={16} />
          <span className="text-center">{error}</span>
        </div>
      )}

      {/* Status */}
      <div className="text-xs text-gray-500 text-center">
        {buttonDisabled && (
          <div className="space-y-1">
            <div>Gravação não suportada</div>
            {supportDetails?.userAgent && (
              <div className="text-xs text-gray-400">
                {supportDetails.userAgent.includes('Chrome') && 'Use Chrome atualizado'}
                {supportDetails.userAgent.includes('Firefox') && 'Use Firefox atualizado'}
                {supportDetails.userAgent.includes('Safari') && 'Safari tem suporte limitado'}
                {supportDetails.userAgent.includes('Edge') && 'Use Edge atualizado'}
                {!supportDetails.userAgent.includes('Chrome') && 
                 !supportDetails.userAgent.includes('Firefox') && 
                 !supportDetails.userAgent.includes('Safari') && 
                 !supportDetails.userAgent.includes('Edge') && 'Navegador não suportado'}
              </div>
            )}
          </div>
        )}
        {!buttonDisabled && isRecording && !isPaused && 'Gravando...'}
        {!buttonDisabled && isRecording && isPaused && 'Pausado'}
        {!buttonDisabled && !isRecording && recordingDuration === 0 && 'Clique para gravar'}
        {!buttonDisabled && !isRecording && recordingDuration > 0 && 'Gravação concluída'}
      </div>
    </div>
  );
};

// Componente para controles de reprodução de áudio
interface AudioPlaybackControlsProps {
  isPlaying: boolean;
  isSynthesizing: boolean;
  error: string | null;
  onPlay: () => void;
  onStop: () => void;
  onPause: () => void;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const AudioPlaybackControls: React.FC<AudioPlaybackControlsProps> = ({
  isPlaying,
  isSynthesizing,
  error,
  onPlay,
  onStop,
  onPause,
  className = '',
  size = 'md'
}) => {
  const getSizeClasses = () => {
    switch (size) {
      case 'sm':
        return 'w-8 h-8 text-sm';
      case 'lg':
        return 'w-12 h-12 text-lg';
      default:
        return 'w-10 h-10 text-base';
    }
  };

  const getButtonSize = () => {
    switch (size) {
      case 'sm':
        return 16;
      case 'lg':
        return 24;
      default:
        return 20;
    }
  };

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {/* Botão principal */}
      <button
        onClick={isSynthesizing ? undefined : (isPlaying ? onPause : onPlay)}
        disabled={isSynthesizing}
        className={`
          ${getSizeClasses()}
          rounded-full flex items-center justify-center
          transition-all duration-300 transform hover:scale-105 active:scale-95
          disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100
          ${isSynthesizing
            ? 'bg-gray-400 text-white'
            : isPlaying
            ? 'bg-orange-500 hover:bg-orange-600 text-white'
            : 'bg-green-500 hover:bg-green-600 text-white'
          }
        `}
      >
        {isSynthesizing ? (
          <Loader2 size={getButtonSize()} className="animate-spin" />
        ) : isPlaying ? (
          <Pause size={getButtonSize()} />
        ) : (
          <Volume2 size={getButtonSize()} />
        )}
      </button>

      {/* Botão de parar */}
      {(isPlaying || isSynthesizing) && (
        <button
          onClick={onStop}
          className={`
            ${getSizeClasses()}
            rounded-full flex items-center justify-center
            bg-red-500 hover:bg-red-600 text-white
            transition-all duration-300 transform hover:scale-105 active:scale-95
          `}
        >
          <Square size={getButtonSize()} />
        </button>
      )}

      {/* Mensagem de erro */}
      {error && (
        <div className="flex items-center gap-1 text-red-500 text-xs">
          <AlertCircle size={12} />
          <span>{error}</span>
        </div>
      )}

      {/* Status */}
      <div className="text-xs text-gray-500">
        {isSynthesizing && 'Sintetizando...'}
        {isPlaying && 'Reproduzindo'}
        {!isPlaying && !isSynthesizing && 'Clique para ouvir'}
      </div>
    </div>
  );
};
