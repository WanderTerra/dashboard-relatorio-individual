import * as React from 'react';
import { useState } from 'react';
import { Link, useParams, useLocation } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { getTranscription, getAgentCalls, downloadAudio } from '../lib/api';
import axios from 'axios';

export default function Transcription() {
  const { avaliacaoId } = useParams();
  const location = useLocation();
  const agentId = location.state?.agentId;
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadError, setDownloadError] = useState<string | null>(null);
  
  console.log('Estado recebido:', location.state); 
  console.log('Agent ID:', agentId);
  console.log('Avaliacao ID:', avaliacaoId);
    const { data: calls, error: callsError } = useQuery({
    queryKey: ['calls', agentId],
    queryFn: () => getAgentCalls(agentId, {
      start: '2024-01-01',
      end: '2025-12-31'
    }),
    enabled: !!agentId
  });

  console.log('Calls error:', callsError);
  console.log('Calls data:', calls);
  
  // Encontrar o call_id correspondente ao avaliacaoId
  const callInfo = calls?.find(c => {
    console.log('Comparando:', typeof c.avaliacao_id, c.avaliacao_id, typeof avaliacaoId, avaliacaoId);
    return String(c.avaliacao_id) === String(avaliacaoId);
  });
  console.log('Call Info encontrado:', callInfo);
  
  // Depois buscar a transcrição
  const { data, isLoading } = useQuery({
    queryKey: ['transcription', avaliacaoId],
    queryFn: () => getTranscription(avaliacaoId!),
  });
  const handleDownloadClick = async (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    
    if (!callInfo?.call_id) {
      setDownloadError('ID da ligação não encontrado');
      return;
    }
    
    setIsDownloading(true);
    setDownloadError(null);
    
    try {
      console.log('Iniciando download do áudio...');
      console.log('Call ID:', callInfo.call_id);
      
      const response = await axios.get(`/api/call/${callInfo.call_id}/audio`, {
        responseType: 'blob'
      });
      
      // Criar URL do blob e link de download
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `audio-${callInfo.call_id}.mp3`);
      document.body.appendChild(link);
      link.click();
      
      // Limpar recursos
      window.URL.revokeObjectURL(url);
      document.body.removeChild(link);
      console.log('Download concluído com sucesso');
    } catch (error) {
      console.error('Erro ao baixar áudio:', error);
      setDownloadError('Falha ao baixar o áudio. Tente novamente mais tarde.');
    } finally {
      setIsDownloading(false);
    }
  };
  return (
    <div className="mx-auto max-w-3xl p-6">
      <Link to={-1 as any} className="inline-block mb-4 rounded bg-blue-600 px-4 py-2 text-white font-semibold shadow hover:bg-blue-700 transition-colors">&larr; Voltar</Link>
      <h2 className="text-2xl font-bold mb-4">Transcrição da Ligação</h2>
      {isLoading ? (
        <p>Carregando transcrição…</p>
      ) : data ? (
        <>            {callInfo?.call_id && (
            <div className="mb-4">
              <button
                className={`inline-block rounded px-4 py-2 text-white font-semibold shadow transition-colors ${isDownloading ? 'bg-gray-500 cursor-not-allowed' : 'bg-green-600 hover:bg-green-700'}`}
                onClick={handleDownloadClick}
                disabled={isDownloading}
              >
                {isDownloading ? (
                  <>⏳ Baixando...</>
                ) : (
                  <>&#128190; Baixar Áudio da Ligação</>
                )}
              </button>
              {downloadError && (
                <p className="mt-2 text-sm text-red-600">{downloadError}</p>
              )}
              <p className="mt-2 text-sm text-gray-600">ID da Ligação: {callInfo.call_id}</p>
            </div>
          )}
          <pre className="bg-gray-100 rounded-xl p-4 text-gray-800 whitespace-pre-wrap">
            {data.conteudo || 'Sem transcrição disponível.'}
          </pre>
        </>
      ) : (
        <p>Transcrição não encontrada.</p>
      )}
    </div>
  );
}
