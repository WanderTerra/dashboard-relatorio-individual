import { useState, useRef, useCallback } from 'react';

interface UseVoiceRecordingReturn {
  isRecording: boolean;
  isPaused: boolean;
  audioBlob: Blob | null;
  audioUrl: string | null;
  recordingDuration: number;
  error: string | null;
  startRecording: () => Promise<void>;
  stopRecording: () => void;
  pauseRecording: () => void;
  resumeRecording: () => void;
  clearRecording: () => void;
  transcribeAudio: () => Promise<string>;
}

export const useVoiceRecording = (): UseVoiceRecordingReturn => {
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const durationIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number>(0);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const startDurationTimer = useCallback(() => {
    startTimeRef.current = Date.now();
    durationIntervalRef.current = setInterval(() => {
      setRecordingDuration(Math.floor((Date.now() - startTimeRef.current) / 1000));
    }, 100);
  }, []);

  const stopDurationTimer = useCallback(() => {
    if (durationIntervalRef.current) {
      clearInterval(durationIntervalRef.current);
      durationIntervalRef.current = null;
    }
  }, []);

  const startRecording = useCallback(async () => {
    try {
      clearError();
      
      // Verificar se estamos em contexto seguro
      const isSecureContext = window.isSecureContext || 
                             window.location.hostname === 'localhost' ||
                             window.location.hostname.startsWith('192.168.') ||
                             window.location.hostname.startsWith('10.') ||
                             window.location.hostname.startsWith('172.');
      
      if (!isSecureContext) {
        throw new Error('Gravação requer HTTPS ou localhost');
      }

      // Verificar APIs básicas - ser mais permissivo
      if (!navigator.mediaDevices) {
        throw new Error('APIs de mídia não disponíveis - atualize seu navegador');
      }

      if (!navigator.mediaDevices.getUserMedia) {
        throw new Error('getUserMedia não disponível - navegador muito antigo');
      }

      // Solicitar acesso ao microfone
      let stream: MediaStream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
          }
        });
      } catch (audioError) {
        // Tentar configuração mais simples se falhar
        console.log('Tentando configuração de áudio mais simples...');
        stream = await navigator.mediaDevices.getUserMedia({
          audio: true
        });
      }

      streamRef.current = stream;

      // Verificar se MediaRecorder está disponível
      if (typeof MediaRecorder === 'undefined') {
        throw new Error('MediaRecorder não suportado - use Chrome, Firefox ou Edge atualizado');
      }

      // Configurar MediaRecorder com fallbacks - priorizar formatos aceitos pelo backend
      let mediaRecorder: MediaRecorder;
      const mimeTypes = [
        'audio/webm',           // Sem codecs - aceito pelo backend
        'audio/mp4',            // Aceito pelo backend
        'audio/ogg',            // Aceito pelo backend
        'audio/wav',            // Aceito pelo backend
        'audio/webm;codecs=opus', // Fallback se necessário
        'audio/ogg;codecs=opus'   // Fallback se necessário
      ];
      
      let selectedMimeType = '';
      for (const mimeType of mimeTypes) {
        if (MediaRecorder.isTypeSupported(mimeType)) {
          selectedMimeType = mimeType;
          break;
        }
      }
      
      if (selectedMimeType) {
        mediaRecorder = new MediaRecorder(stream, { mimeType: selectedMimeType });
        console.log('Usando formato de áudio:', selectedMimeType);
      } else {
        mediaRecorder = new MediaRecorder(stream);
        console.log('Usando formato padrão do navegador');
      }

      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      // Event listeners
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(chunksRef.current, { 
          type: selectedMimeType || 'audio/webm' 
        });
        
        setAudioBlob(audioBlob);
        
        // Criar URL para reprodução
        const audioUrl = URL.createObjectURL(audioBlob);
        setAudioUrl(audioUrl);
        
        console.log('Gravação finalizada:', {
          size: audioBlob.size,
          type: audioBlob.type,
          duration: recordingDuration
        });
      };

      mediaRecorder.onerror = (event) => {
        console.error('Erro no MediaRecorder:', event);
        setError('Erro durante a gravação');
      };

      // Iniciar gravação
      mediaRecorder.start(100); // Coletar dados a cada 100ms
      setIsRecording(true);
      setIsPaused(false);
      startDurationTimer();

    } catch (err) {
      console.error('Erro ao iniciar gravação:', err);
      
      let errorMessage = 'Erro ao acessar microfone';
      
      if (err instanceof Error) {
        if (err.name === 'NotAllowedError') {
          errorMessage = 'Permissão de microfone negada. Clique no ícone de cadeado na barra de endereço e permita o acesso ao microfone.';
        } else if (err.name === 'NotFoundError') {
          errorMessage = 'Nenhum microfone encontrado. Verifique se há um microfone conectado ao computador.';
        } else if (err.name === 'NotSupportedError') {
          errorMessage = 'Gravação não suportada neste navegador. Use Chrome, Firefox ou Edge atualizado.';
        } else if (err.name === 'SecurityError') {
          errorMessage = 'Erro de segurança. Use HTTPS ou localhost para gravação.';
        } else {
          errorMessage = err.message;
        }
      }
      
      setError(errorMessage);
    }
  }, [clearError, startDurationTimer, recordingDuration]);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      setIsPaused(false);
      stopDurationTimer();
    }
  }, [isRecording, stopDurationTimer]);

  const pauseRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording && !isPaused) {
      mediaRecorderRef.current.pause();
      setIsPaused(true);
      stopDurationTimer();
    }
  }, [isRecording, isPaused, stopDurationTimer]);

  const resumeRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording && isPaused) {
      mediaRecorderRef.current.resume();
      setIsPaused(false);
      startDurationTimer();
    }
  }, [isRecording, isPaused, startDurationTimer]);

  const clearRecording = useCallback(() => {
    // Parar gravação se estiver ativa
    if (isRecording) {
      stopRecording();
    }

    // Limpar recursos
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }

    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
    }

    // Resetar estado
    setAudioBlob(null);
    setAudioUrl(null);
    setRecordingDuration(0);
    setError(null);
    chunksRef.current = [];
  }, [isRecording, stopRecording, audioUrl]);

  const transcribeAudio = useCallback(async (): Promise<string> => {
    if (!audioBlob) {
      throw new Error('Nenhum áudio gravado para transcrever');
    }

    try {
      const token = localStorage.getItem('auth_token');
      if (!token) {
        throw new Error('Token de autenticação não encontrado');
      }

      // Criar FormData para upload com extensão correta
      const formData = new FormData();
      
      // Determinar extensão baseada no tipo do blob
      let extension = 'webm';
      if (audioBlob.type.includes('mp4')) extension = 'mp4';
      else if (audioBlob.type.includes('ogg')) extension = 'ogg';
      else if (audioBlob.type.includes('wav')) extension = 'wav';
      
      formData.append('audio', audioBlob, `recording.${extension}`);

      console.log('Enviando áudio para transcrição:', {
        size: audioBlob.size,
        type: audioBlob.type,
        extension: extension,
        filename: `recording.${extension}`
      });

      const response = await fetch('/api/ai/transcribe', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || `Erro na transcrição (${response.status})`);
      }

      const result = await response.json();
      console.log('Transcrição concluída:', result);

      return result.text || '';

    } catch (error) {
      console.error('Erro na transcrição:', error);
      throw error;
    }
  }, [audioBlob]);

  return {
    isRecording,
    isPaused,
    audioBlob,
    audioUrl,
    recordingDuration,
    error,
    startRecording,
    stopRecording,
    pauseRecording,
    resumeRecording,
    clearRecording,
    transcribeAudio
  };
};