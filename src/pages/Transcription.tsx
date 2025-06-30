import * as React from 'react';
import { useState } from 'react';
import { Link, useParams, useLocation } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { getTranscription, getAgentCalls, downloadAudio, getAgentSummary } from '../lib/api';
import { formatAgentName } from '../lib/format';
import { useAuth } from '../contexts/AuthContext';

export default function Transcription() {
  const { avaliacaoId } = useParams();
  const location = useLocation();
  const agentId = location.state?.agentId;
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadError, setDownloadError] = useState<string | null>(null);
  
  const { data: calls, error: callsError } = useQuery({
    queryKey: ['calls', agentId],
    queryFn: () => getAgentCalls(agentId, {
      start: '2024-01-01',
      end: '2025-12-31'
    }),
    enabled: !!agentId  });

  // Buscar informações do agente para obter o nome
  const { data: agentInfo } = useQuery({
    queryKey: ['agentSummary', agentId],
    queryFn: () => getAgentSummary(agentId!, {
      start: '2024-01-01',
      end: '2025-12-31'
    }),
    enabled: !!agentId
  });

  // Encontrar o call_id correspondente ao avaliacaoId
  const callInfo = calls?.find((c: any) => {
    return String(c.avaliacao_id) === String(avaliacaoId);
  });
  
  // Depois buscar a transcrição
  const { data, isLoading } = useQuery({
    queryKey: ['transcription', avaliacaoId],
    queryFn: () => getTranscription(avaliacaoId!),
  });

  const { user } = useAuth();
  const isAdmin = user?.permissions?.includes('admin');

  const handleDownloadClick = async (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    
    if (!callInfo?.call_id) {
      setDownloadError('ID da ligação não encontrado');
      return;
    }
    
    setIsDownloading(true);
    setDownloadError(null);
      try {
      // Usar a função de API para download do áudio
      const audioBlob = await downloadAudio(callInfo.call_id);
      
      // Criar URL do blob e link de download
      const url = window.URL.createObjectURL(new Blob([audioBlob]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `audio-${callInfo.call_id}.mp3`);
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

  return (
    <div className="mx-auto max-w-3xl p-6 space-y-6">
      <Link 
        to={-1 as any} 
        className="inline-flex items-center px-4 py-2 rounded-lg text-sm font-medium text-white bg-blue-600 shadow-sm hover:bg-blue-700 transition-all duration-200 group"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2 group-hover:-translate-x-0.5 transition-transform" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
        </svg>
        Voltar
      </Link>
      
      <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100">
        <h2 className="text-2xl font-bold mb-6 text-gray-800">Transcrição da Ligação</h2>
        
        {isLoading ? (
          <div className="flex justify-center items-center py-12">
            <div className="relative">
              <div className="animate-spin rounded-full h-10 w-10 border-2 border-blue-600 border-t-transparent"></div>
              <div className="animate-spin rounded-full h-10 w-10 border-2 border-blue-300 border-t-transparent absolute top-0 left-0" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }}></div>
            </div>
            <span className="ml-4 text-sm font-medium text-gray-600">Carregando transcrição...</span>
          </div>        ) : data ? (
          <>            {/* Informações do agente e ligação */}
            <div className="mb-6 bg-white rounded-lg shadow-sm p-6 border border-gray-200">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {agentInfo && (
                  <div className="flex items-center text-gray-600">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                    </svg>
                    <div>
                      <p className="text-xs text-gray-500">Agente</p>
                      <p className="font-medium text-gray-800">{formatAgentName(agentInfo)}</p>
                    </div>
                  </div>
                )}
                {callInfo?.call_id && (
                  <div className="flex items-center text-gray-600">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M2 3.5A1.5 1.5 0 013.5 2h1.148a1.5 1.5 0 011.465 1.175l.716 3.223a1.5 1.5 0 01-1.052 1.767l-.933.267c-.41.117-.643.555-.48.95a11.542 11.542 0 006.254 6.254c.395.163.833-.07.95-.48l.267-.933a1.5 1.5 0 011.767-1.052l3.223.716A1.5 1.5 0 0118 15.352V16.5a1.5 1.5 0 01-1.5 1.5H15c-1.149 0-2.263-.15-3.326-.43A13.022 13.022 0 012.43 8.326 13.019 13.019 0 012 5V3.5z" clipRule="evenodd" />
                    </svg>
                    <div>
                      <p className="text-xs text-gray-500">ID da Ligação</p>
                      <p className="font-medium text-gray-800">{callInfo.call_id}</p>
                    </div>
                  </div>
                )}
                {callInfo?.callerid && (
                  <div className="flex items-center text-gray-600">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
                    </svg>
                    <div>
                      <p className="text-xs text-gray-500">Cliente</p>
                      <p className="font-medium text-gray-800">{callInfo.callerid}</p>
                    </div>
                  </div>
                )}
                <div className="flex items-center text-gray-600">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                  </svg>
                  <div>
                    <p className="text-xs text-gray-500">ID da Avaliação</p>
                    <p className="font-medium text-gray-800">{avaliacaoId}</p>
                  </div>
                </div>
              </div>
            </div>

            {callInfo?.call_id && (
              <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gray-50 p-4 rounded-lg">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Controles de Áudio</p>
                  <p className="text-xs text-gray-500">Faça o download do arquivo de áudio desta ligação</p>
                </div>
                {isAdmin && (
                  <button
                    className={`inline-flex items-center rounded-lg px-4 py-2 text-white font-medium shadow transition-all ${isDownloading ? 'bg-gray-500 cursor-not-allowed' : 'bg-green-600 hover:bg-green-700'}`}
                    onClick={handleDownloadClick}
                    disabled={isDownloading}
                  >
                    {isDownloading ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Baixando...
                      </>
                    ) : (
                      <>
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
                        </svg>
                        Baixar Áudio
                      </>
                    )}
                  </button>
                )}
              </div>
            )}
            
            {downloadError && (
              <div className="mb-4 p-3.5 bg-red-50 text-red-700 rounded-lg text-sm border border-red-200 shadow-sm animate-in fade-in slide-in-from-top-3 duration-300">
                <div className="flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-red-500" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                  {downloadError}
                </div>
              </div>
            )}
            
            <div className="bg-gray-50 rounded-xl p-5 text-gray-800 whitespace-pre-wrap shadow-inner border border-gray-200 leading-relaxed">
              {data.conteudo || 'Sem transcrição disponível.'}
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center py-12 text-gray-500">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-gray-400 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-lg font-medium">Transcrição não encontrada.</p>
            <p className="text-sm mt-2">Não foi possível localizar a transcrição desta ligação.</p>
          </div>
        )}
      </div>
    </div>
  );
}
