// Teste alternativo de APIs de mídia para Chrome
export const testMediaRecorderSupportAlternative = async (): Promise<{supported: boolean, error?: string, details?: any}> => {
  try {
    console.log('🔍 Iniciando teste alternativo de APIs de mídia...');
    
    // Verificar contexto seguro
    const isSecureContext = window.isSecureContext || 
                           window.location.hostname === 'localhost' ||
                           window.location.hostname.startsWith('192.168.') ||
                           window.location.hostname.startsWith('10.') ||
                           window.location.hostname.startsWith('172.');
    
    console.log('Contexto seguro:', isSecureContext);
    console.log('Hostname:', window.location.hostname);
    console.log('Protocolo:', window.location.protocol);
    
    if (!isSecureContext) {
      return { 
        supported: false, 
        error: 'Contexto não seguro - requer HTTPS ou localhost',
        details: { hostname: window.location.hostname, protocol: window.location.protocol }
      };
    }

    // Verificar se navigator existe
    if (!navigator) {
      return { 
        supported: false, 
        error: 'navigator não disponível',
        details: { userAgent: 'navigator não encontrado' }
      };
    }

    console.log('Navigator disponível:', !!navigator);
    console.log('Navigator keys:', Object.keys(navigator));

    // Verificar mediaDevices de forma mais robusta
    let mediaDevices = null;
    
    // Tentar diferentes formas de acessar mediaDevices
    if (navigator.mediaDevices) {
      mediaDevices = navigator.mediaDevices;
      console.log('✅ navigator.mediaDevices encontrado');
    } else if ((navigator as any).webkitGetUserMedia) {
      console.log('⚠️ Usando webkitGetUserMedia (Chrome antigo)');
      // Para Chrome muito antigo
      return { 
        supported: false, 
        error: 'Chrome muito antigo - atualize para versão 47+',
        details: { userAgent: navigator.userAgent }
      };
    } else if ((navigator as any).mozGetUserMedia) {
      console.log('⚠️ Usando mozGetUserMedia (Firefox antigo)');
      return { 
        supported: false, 
        error: 'Firefox muito antigo - atualize para versão 25+',
        details: { userAgent: navigator.userAgent }
      };
    } else {
      console.log('❌ Nenhuma API de mídia encontrada');
      return { 
        supported: false, 
        error: 'APIs de mídia não encontradas - navegador não suportado',
        details: { 
          userAgent: navigator.userAgent,
          hasNavigator: !!navigator,
          navigatorKeys: Object.keys(navigator),
          isSecureContext: window.isSecureContext
        }
      };
    }

    // Verificar getUserMedia
    if (!mediaDevices.getUserMedia) {
      return { 
        supported: false, 
        error: 'getUserMedia não disponível',
        details: { userAgent: navigator.userAgent }
      };
    }

    console.log('✅ getUserMedia disponível');

    // Verificar MediaRecorder
    if (typeof MediaRecorder === 'undefined') {
      return { 
        supported: false, 
        error: 'MediaRecorder não suportado',
        details: { userAgent: navigator.userAgent }
      };
    }

    console.log('✅ MediaRecorder disponível');

    // Testar acesso ao microfone
    console.log('🎤 Testando acesso ao microfone...');
    const stream = await mediaDevices.getUserMedia({ audio: true });
    console.log('✅ Acesso ao microfone OK');
    
    // Testar MediaRecorder
    console.log('🎙️ Testando MediaRecorder...');
    const mediaRecorder = new MediaRecorder(stream);
    console.log('✅ MediaRecorder OK');
    
    // Verificar formatos suportados
    const supportedFormats = [
      'audio/webm;codecs=opus',
      'audio/webm',
      'audio/mp4',
      'audio/ogg;codecs=opus',
      'audio/wav'
    ].filter(format => MediaRecorder.isTypeSupported(format));
    
    console.log('Formatos suportados:', supportedFormats);
    
    // Limpar recursos
    stream.getTracks().forEach(track => track.stop());
    
    return { 
      supported: true,
      details: {
        supportedFormats,
        userAgent: navigator.userAgent,
        hostname: window.location.hostname,
        protocol: window.location.protocol,
        isSecureContext: window.isSecureContext
      }
    };
    
  } catch (error) {
    console.error('❌ Erro no teste alternativo:', error);
    return { 
      supported: false, 
      error: error instanceof Error ? error.message : 'Erro desconhecido',
      details: { 
        errorName: error instanceof Error ? error.name : 'Unknown',
        userAgent: navigator.userAgent,
        hostname: window.location.hostname,
        protocol: window.location.protocol
      }
    };
  }
};




