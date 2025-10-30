// Teste simples de MediaRecorder
export const testMediaRecorderSupport = async (): Promise<{supported: boolean, error?: string, details?: any}> => {
  try {
    // Verificar contexto seguro
    const isSecureContext = window.isSecureContext || 
                           window.location.hostname === 'localhost' ||
                           window.location.hostname.startsWith('192.168.') ||
                           window.location.hostname.startsWith('10.') ||
                           window.location.hostname.startsWith('172.');
    
    if (!isSecureContext) {
      return { 
        supported: false, 
        error: 'Contexto não seguro - requer HTTPS ou localhost',
        details: { hostname: window.location.hostname, protocol: window.location.protocol }
      };
    }

    // Verificar navigator.mediaDevices - pode estar undefined em alguns contextos
    if (!navigator.mediaDevices) {
      // Tentar inicializar se não estiver disponível
      if (navigator.mediaDevices === undefined) {
        return { 
          supported: false, 
          error: 'navigator.mediaDevices é undefined - pode ser problema de contexto ou configuração',
          details: { 
            userAgent: navigator.userAgent,
            hasNavigator: !!navigator,
            navigatorKeys: Object.keys(navigator),
            isSecureContext: window.isSecureContext,
            protocol: window.location.protocol
          }
        };
      }
      return { 
        supported: false, 
        error: 'navigator.mediaDevices não disponível',
        details: { userAgent: navigator.userAgent }
      };
    }

    // Verificar getUserMedia
    if (!navigator.mediaDevices.getUserMedia) {
      return { 
        supported: false, 
        error: 'getUserMedia não disponível - navegador muito antigo',
        details: { userAgent: navigator.userAgent }
      };
    }

    // Verificar MediaRecorder
    if (typeof MediaRecorder === 'undefined') {
      return { 
        supported: false, 
        error: 'MediaRecorder não suportado - use Chrome, Firefox ou Edge atualizado',
        details: { userAgent: navigator.userAgent }
      };
    }

    // Testar acesso ao microfone
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    
    // Testar MediaRecorder
    const mediaRecorder = new MediaRecorder(stream);
    
    // Verificar formatos suportados
    const supportedFormats = [
      'audio/webm;codecs=opus',
      'audio/webm',
      'audio/mp4',
      'audio/ogg;codecs=opus',
      'audio/wav'
    ].filter(format => MediaRecorder.isTypeSupported(format));
    
    // Limpar recursos
    stream.getTracks().forEach(track => track.stop());
    
    return { 
      supported: true,
      details: {
        supportedFormats,
        userAgent: navigator.userAgent,
        hostname: window.location.hostname
      }
    };
    
  } catch (error) {
    console.error('Erro no teste de suporte:', error);
    return { 
      supported: false, 
      error: error instanceof Error ? error.message : 'Erro desconhecido',
      details: { 
        errorName: error instanceof Error ? error.name : 'Unknown',
        userAgent: navigator.userAgent,
        hostname: window.location.hostname
      }
    };
  }
};
