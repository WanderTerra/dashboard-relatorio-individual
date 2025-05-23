import React from 'react';
import { Link, useParams, useLocation } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { getTranscription, getAgentCalls } from '../lib/api';

export default function Transcription() {
  const { avaliacaoId } = useParams();
  const location = useLocation();
  const agentId = location.state?.agentId;
  
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

  return (
    <div className="mx-auto max-w-3xl p-6">
      <Link to={-1 as any} className="inline-block mb-4 rounded bg-blue-600 px-4 py-2 text-white font-semibold shadow hover:bg-blue-700 transition-colors">&larr; Voltar</Link>
      <h2 className="text-2xl font-bold mb-4">Transcrição da Ligação</h2>
      {isLoading ? (
        <p>Carregando transcrição…</p>
      ) : data ? (
        <>          {callInfo?.call_id && (
            <a
              href={`http://127.0.0.1:8000/call/${callInfo.call_id}/audio`}
              className="inline-block mb-4 rounded bg-green-600 px-4 py-2 text-white font-semibold shadow hover:bg-green-700 transition-colors"
              download={`audio-${callInfo.call_id}.mp3`}
            >
              &#128190; Baixar Áudio
            </a>
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
