import React from 'react';
import { Link, useParams } from 'react-router-dom';
import { formatItemName } from '../lib/format';
import { getFeedbacksByAvaliacao } from '../lib/api';

export interface CallRow {
  call_id: string;
  avaliacao_id: string;
  data_ligacao: string;
  pontuacao: number;
  status_avaliacao: string;
}

interface CallListProps {
  calls: CallRow[];
}

const CallList: React.FC<CallListProps> = ({ calls }) => {
  const { agentId } = useParams<{ agentId: string }>();
  const [feedbackStatus, setFeedbackStatus] = React.useState<Record<string, string>>({});

  React.useEffect(() => {
    async function fetchFeedbacks() {
      const statusMap: Record<string, string> = {};
      await Promise.all(
        calls.map(async (c) => {
          try {
            const feedbacks = await getFeedbacksByAvaliacao(c.avaliacao_id);
            if (feedbacks && feedbacks.length > 0) {
              // Pega o feedback mais recente
              const latest = feedbacks[0];
              statusMap[c.avaliacao_id] = latest.status || 'Enviado';
            } else {
              statusMap[c.avaliacao_id] = 'Sem feedback';
            }
          } catch (e) {
            statusMap[c.avaliacao_id] = 'Erro';
          }
        })
      );
      setFeedbackStatus(statusMap);
    }
    if (calls.length > 0) fetchFeedbacks();
  }, [calls]);

  return (
  <div className="bg-white p-4 rounded shadow overflow-auto">
    <h2 className="text-lg font-semibold mb-2">Lista de Chamadas</h2>
    <table className="min-w-full text-left">
      <thead>
        <tr className="border-b">
          <th className="px-2 py-1">Data</th>
          <th className="px-2 py-1">Pontuação</th>
          <th className="px-2 py-1">Status</th>
          <th className="px-2 py-1">Itens</th>
          <th className="px-2 py-1">Transcrição</th>
          <th className="px-2 py-1">Feedback</th>
        </tr>
      </thead>
      <tbody>
        {calls.map(c => (
          <tr key={c.call_id} className="border-b last:border-0">            
          <td className="px-2 py-1">{new Date(c.data_ligacao).toLocaleDateString()}</td>
            <td className="px-2 py-1">
              <span className={
                c.pontuacao >= 80 ? 'text-green-600 font-medium' :
                c.pontuacao >= 60 ? 'text-yellow-600 font-medium' :
                'text-red-600 font-medium'
              }>
                {c.pontuacao.toFixed(1)}
              </span>
            </td>            
            <td className="px-2 py-1">              <span className={c.status_avaliacao === 'APROVADA' ? 'text-green-600 font-medium' : 
                             c.status_avaliacao === 'REPROVADA' ? 'text-red-600 font-medium' : 
                             'text-gray-600'}>
                {formatItemName(c.status_avaliacao)}
              </span>
            </td>            <td className="px-2 py-1">
              <Link
                to={`/call/${c.avaliacao_id}/items`}
                state={{ 
                  agentId, 
                  callData: {
                    pontuacao: c.pontuacao,
                    status_avaliacao: c.status_avaliacao,
                    data_ligacao: c.data_ligacao,
                    call_id: c.call_id,
                    avaliacao_id: c.avaliacao_id
                  }
                }}
                className="bg-blue-600 text-white px-2 py-1 rounded shadow hover:bg-blue-700 transition-colors font-medium text-xs"
              >
                &#128203; Itens
              </Link>
            </td>
            <td className="px-2 py-1">
              <Link
                to={`/call/${c.avaliacao_id}/transcription`}
                state={{ agentId }}
                className="bg-blue-600 text-white px-2 py-1 rounded shadow hover:bg-blue-700 transition-colors font-medium text-xs"
              >
                &#128172; Transcrição
              </Link>
            </td>
            <td className="px-2 py-1">
              {feedbackStatus[c.avaliacao_id] || '...'}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
  );
}

export default CallList;

