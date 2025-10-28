import { useState, useRef, useCallback } from 'react';

interface UseTextToSpeechReturn {
  isPlaying: boolean;
  isSynthesizing: boolean;
  error: string | null;
  speak: (text: string, voice?: string, speed?: number, assistantType?: string) => Promise<void>;
  stop: () => void;
  pause: () => void;
  resume: () => void;
}

export const useTextToSpeech = (): UseTextToSpeechReturn => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isSynthesizing, setIsSynthesizing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const currentAudioUrlRef = useRef<string | null>(null);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const cleanupAudio = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    
    if (currentAudioUrlRef.current) {
      URL.revokeObjectURL(currentAudioUrlRef.current);
      currentAudioUrlRef.current = null;
    }
    
    setIsPlaying(false);
  }, []);

  const speak = useCallback(async (
    text: string, 
    voice?: string, 
    speed: number = 1.0,
    assistantType?: string
  ): Promise<void> => {
    try {
      clearError();
      setIsSynthesizing(true);

      // Validar entrada
      if (!text || !text.trim()) {
        throw new Error('Texto não pode estar vazio');
      }

      // Limpar áudio anterior
      cleanupAudio();

      // Obter token de autenticação
      const token = localStorage.getItem('auth_token');
      if (!token) {
        throw new Error('Token de autenticação não encontrado');
      }

      // Preparar dados da requisição
      const requestData = {
        text: text.trim(),
        voice: voice || 'nova',
        speed: Math.max(0.25, Math.min(4.0, speed)), // Limitar velocidade
        assistant_type: assistantType
      };

      console.log('Solicitando síntese de voz:', requestData);

      // Chamar endpoint de síntese
      const response = await fetch('/api/ai/synthesize', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(requestData)
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || `Erro na síntese (${response.status})`);
      }

      // Converter resposta para blob
      const audioBlob = await response.blob();
      
      // Criar URL do áudio
      const audioUrl = URL.createObjectURL(audioBlob);
      currentAudioUrlRef.current = audioUrl;

      // Criar elemento de áudio
      const audio = new Audio(audioUrl);
      audioRef.current = audio;

      // Configurar event listeners
      audio.onloadstart = () => {
        console.log('Carregando áudio...');
      };

      audio.oncanplay = () => {
        console.log('Áudio pronto para reprodução');
        setIsSynthesizing(false);
      };

      audio.onplay = () => {
        console.log('Iniciando reprodução');
        setIsPlaying(true);
      };

      audio.onpause = () => {
        console.log('Reprodução pausada');
        setIsPlaying(false);
      };

      audio.onended = () => {
        console.log('Reprodução finalizada');
        setIsPlaying(false);
        cleanupAudio();
      };

      audio.onerror = (event) => {
        console.error('Erro na reprodução:', event);
        setError('Erro na reprodução do áudio');
        setIsPlaying(false);
        setIsSynthesizing(false);
        cleanupAudio();
      };

      // Iniciar reprodução
      await audio.play();

    } catch (err) {
      console.error('Erro na síntese de voz:', err);
      const errorMessage = err instanceof Error ? err.message : 'Erro na síntese de voz';
      setError(errorMessage);
      setIsSynthesizing(false);
      setIsPlaying(false);
      cleanupAudio();
    }
  }, [clearError, cleanupAudio]);

  const stop = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    cleanupAudio();
  }, [cleanupAudio]);

  const pause = useCallback(() => {
    if (audioRef.current && isPlaying) {
      audioRef.current.pause();
    }
  }, [isPlaying]);

  const resume = useCallback(() => {
    if (audioRef.current && !isPlaying) {
      audioRef.current.play().catch((err) => {
        console.error('Erro ao retomar reprodução:', err);
        setError('Erro ao retomar reprodução');
      });
    }
  }, [isPlaying]);

  return {
    isPlaying,
    isSynthesizing,
    error,
    speak,
    stop,
    pause,
    resume
  };
};




