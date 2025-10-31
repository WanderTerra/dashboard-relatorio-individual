import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getTranscription, downloadAudio, getAgentCalls, getCallInfo } from '../lib/api';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

interface TranscriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  avaliacaoId: string;
  callId?: string;
  isInline?: boolean;
}

const TranscriptionModal: React.FC<TranscriptionModalProps> = ({ 
  isOpen, 
  onClose, 
  avaliacaoId,
  callId,
  isInline = false
}) => {
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadError, setDownloadError] = useState<string | null>(null);  const location = useLocation();
  const agentId = location.state?.agentId;
  const { user } = useAuth();
  const isAdmin = user?.permissions?.includes('admin');
  
  // Buscar informações da ligação para obter o call_id se não foi fornecido
  const { data: calls } = useQuery({
    queryKey: ['calls', agentId],
    queryFn: () => getAgentCalls(agentId, {
      start: '2024-01-01',
      end: '2025-12-31'
    }),
    enabled: !!agentId && isOpen && !callId // Só buscar se não temos callId e o modal está aberto
  });  // Encontrar o call_id correspondente ao avaliacaoId
  const callInfo = calls?.find((c: any) => String(c.avaliacao_id) === String(avaliacaoId));
  const resolvedCallId = callId || callInfo?.call_id;
  
  // Buscar informações da avaliação (incluindo carteira)
  const { data: avaliacaoInfo } = useQuery({
    queryKey: ['avaliacao-info', avaliacaoId],
    queryFn: () => getCallInfo(avaliacaoId),
    enabled: !!avaliacaoId,
    staleTime: 5 * 60 * 1000 // Cache por 5 minutos
  });

  // Buscar a transcrição
  const { data, isLoading, error } = useQuery({
    queryKey: ['transcription', avaliacaoId],
    queryFn: () => getTranscription(avaliacaoId),
    enabled: isOpen // Só buscar quando o modal estiver aberto
  });
  const handleDownloadClick = async (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    
    if (!resolvedCallId) {
      setDownloadError('ID da ligação não encontrado');
      return;
    }
    
    setIsDownloading(true);
    setDownloadError(null);
    
    try {
      // Usar a função de API para download do áudio
      const audioBlob = await downloadAudio(resolvedCallId);
      
      // Criar URL do blob e link de download
      const url = window.URL.createObjectURL(new Blob([audioBlob]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `audio-${resolvedCallId}.mp3`);
      document.body.appendChild(link);
      link.click();
      
      // Limpar recursos
      window.URL.revokeObjectURL(url);
      document.body.removeChild(link);
    } catch (error) {
      console.error('Erro ao baixar áudio:', error);
      setDownloadError('Falha ao baixar o áudio. Tente novamente mais tarde.');
    } finally {
      setIsDownloading(false);
    }
  };

  // Função para processar a transcrição e separar mensagens
  const processTranscription = (content: string) => {
    const lines = content.split('\n').filter(line => line.trim());
    const messages: Array<{ speaker: 'Agente' | 'Cliente'; text: string }> = [];
    
    lines.forEach(line => {
      if (line.startsWith('Agente:')) {
        messages.push({
          speaker: 'Agente',
          text: line.replace('Agente:', '').trim()
        });
      } else if (line.startsWith('Cliente:')) {
        messages.push({
          speaker: 'Cliente',
          text: line.replace('Cliente:', '').trim()
        });
      }
    });
    
    return messages;
  };

  // Função para renderizar o conteúdo da transcrição
  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="flex justify-center items-center h-full">
          <div className="relative">
            <div className="animate-spin rounded-full h-10 w-10 border-2 border-blue-600 border-t-transparent"></div>
            <div className="animate-spin rounded-full h-10 w-10 border-2 border-blue-300 border-t-transparent absolute top-0 left-0" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }}></div>
          </div>
          <span className="ml-4 text-sm font-medium text-gray-600">Carregando transcrição...</span>
        </div>
      );
    }

    if (error) {
      return (
        <div className="flex flex-col items-center justify-center h-full text-gray-500">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-gray-400 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-lg font-medium">Erro ao carregar transcrição</p>
          <p className="text-sm mt-2">Não foi possível carregar a transcrição desta ligação.</p>
        </div>
      );
    }

    if (data) {
      return (
        <>
          <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gray-50 p-5 rounded-xl border border-gray-200">
            <div>
              <p className="text-sm text-gray-600 mb-1">ID da Avaliação: <span className="font-medium">{avaliacaoId}</span></p>
              <p className="text-sm text-gray-600 mb-1">Carteira: <span className="font-medium">{avaliacaoInfo?.carteira || ''}</span></p>
                {callInfo?.callerid && (
                  <p className="text-sm text-gray-600">Cliente: <span className="font-medium">{callInfo.callerid}</span></p>
                )}
                {data?.callerid && !callInfo?.callerid && (
                  <p className="text-sm text-gray-600">Cliente: <span className="font-medium">{data.callerid}</span></p>
                )}
              </div>
              {isAdmin && resolvedCallId && (
                <button
                  className={`flex items-center gap-3 bg-gradient-to-r ${isDownloading ? 'from-gray-600 to-gray-700 cursor-not-allowed' : 'from-green-600 to-green-700 hover:from-green-700 hover:to-green-800'} text-white px-6 py-3 rounded-xl transition-all duration-300 text-sm font-bold shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 border-2 border-transparent ${!isDownloading && 'hover:border-green-500'}`}
                  onClick={handleDownloadClick}
                  disabled={isDownloading}
                >
                  {isDownloading ? (
                    <>
                      <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Baixando...
                    </>
                  ) : (
                    <>
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
                      Baixar Áudio
                    </>
                  )}
                </button>
              )}
            </div>
          
          {downloadError && (
            <div className="mb-4 p-3.5 bg-red-50 text-red-700 rounded-xl text-sm border border-red-200 shadow-sm animate-in fade-in slide-in-from-top-3 duration-300">
              <div className="flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-red-500" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                {downloadError}
              </div>
            </div>
          )}
          
          <div className="bg-gray-100 rounded-2xl p-5 space-y-3 min-h-[400px] pb-6">
            {data.conteudo ? (
              <>
                {processTranscription(data.conteudo).map((message, index) => (
                  <div
                    key={index}
                    className={`flex ${message.speaker === 'Agente' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[70%] px-4 py-2 rounded-2xl shadow-sm ${
                        message.speaker === 'Agente'
                          ? 'bg-blue-500 text-white'
                          : 'bg-white text-gray-800 border border-gray-200'
                      }`}
                    >
                      <div className="text-xs font-medium mb-1 opacity-70">
                        {message.speaker}
                      </div>
                      <div className="text-sm leading-relaxed">
                        {message.text}
                      </div>
                    </div>
                  </div>
                ))}
                <div className="h-4"></div>
              </>
            ) : (
              <div className="flex items-center justify-center h-full text-gray-500">
                <p>Sem transcrição disponível.</p>
              </div>
            )}
          </div>
        </>
      );
    }

    return (
      <div className="flex flex-col items-center justify-center h-full text-gray-500">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-gray-400 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <p className="text-lg font-medium">Transcrição não encontrada</p>
        <p className="text-sm mt-2">Não foi possível localizar a transcrição desta ligação.</p>
      </div>
    );
  };
  
  if (!isOpen) return null;

  // Renderização inline para divisão de tela
  if (isInline) {
    return (
      <div className="flex flex-col h-full bg-white min-h-0 relative z-10 rounded-3xl overflow-hidden">
        <div className="bg-gradient-to-r from-blue-600 to-indigo-700 px-8 py-6 text-white flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-sm">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-8 w-8 text-white">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                </svg>
              </div>
              <div>
                <h2 className="text-2xl font-bold">Transcrição da Ligação</h2>
              </div>
            </div>
            <button 
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-xl transition-all duration-200 group"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6 group-hover:scale-110 transition-transform">
                <path d="M18 6 6 18"></path>
                <path d="m6 6 12 12"></path>
              </svg>
            </button>
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto p-8 pr-10 min-h-0">
          {renderContent()}
        </div>
      </div>
    );
  }  // Renderização modal tradicional
  return (
    <>
      {/* Background overlay para mostrar que é um modal */}
      <div 
        className="fixed inset-0 bg-black/30 z-40 transition-opacity duration-300 animate-in fade-in"
        onClick={onClose}
      ></div>
      
      {/* Sidebar modal */}
      <div className="fixed inset-y-0 right-0 z-50 w-full max-w-xl flex flex-col h-full bg-white shadow-xl transform transition-all duration-300 ease-in-out animate-in slide-in-from-right-10">
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-xl font-bold text-gray-800">Transcrição da Ligação</h2>
          <button 
            onClick={onClose}
            className="p-2 rounded-full hover:bg-gray-100 transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-500" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4">
          {renderContent()}
        </div>
        
        <div className="border-t p-4">
          <button
            onClick={onClose}
            className="w-full flex justify-center items-center px-4 py-2 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700 transition-colors"
          >
            Fechar
          </button>
        </div>
      </div>
    </>
  );
};

export default TranscriptionModal;
