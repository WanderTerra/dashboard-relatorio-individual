import React from 'react';
import { Link, useParams } from 'react-router-dom';
import { formatItemName } from '../lib/format';
import { getFeedbacksByAvaliacao } from '../lib/api';
import type { UserInfo } from '../lib/api';

export interface CallRow {
  call_id: string;
  avaliacao_id: string;
  data_ligacao: string;
  pontuacao: number;
  status_avaliacao: string;
}

interface CallListProps {
  calls: CallRow[];
  user?: UserInfo | null;
}

const CallList: React.FC<CallListProps> = ({ calls, user }) => {
  const { agentId } = useParams<{ agentId: string }>();
  const [feedbackStatus, setFeedbackStatus] = React.useState<Record<string, string>>({});
  const [modalOpen, setModalOpen] = React.useState(false);
  const [selectedAvaliacao, setSelectedAvaliacao] = React.useState<string | null>(null);

  // Permissão: admin ou monitor
  const isMonitor = user && (user.permissions?.includes('admin') || user.permissions?.includes('monitor'));

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

  // Modal de feedback (simples)
  const [comentario, setComentario] = React.useState('');
  // Status fixo: ENVIADO
  const [enviando, setEnviando] = React.useState(false);
  const [erro, setErro] = React.useState<string | null>(null);
  const [sucesso, setSucesso] = React.useState(false);

  async function handleEnviarFeedback() {
    if (!selectedAvaliacao || !user) return;
    setEnviando(true);
    setErro(null);
    setSucesso(false);
    try {
      // Chamar endpoint de criar feedback
      const res = await fetch('/api/feedbacks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        },
        body: JSON.stringify({
          avaliacao_id: selectedAvaliacao,
          agent_id: agentId,
          comentario,
          status: 'ENVIADO',
          origem: 'monitoria',
          criado_por: user.id
        })
      });
      if (!res.ok) throw new Error('Erro ao enviar feedback');
      setSucesso(true);
      setComentario('');
      setModalOpen(false);
      // Atualizar status do feedback na tabela
      setFeedbackStatus(prev => ({ ...prev, [selectedAvaliacao]: 'ENVIADO' }));
    } catch (e: any) {
      setErro(e.message || 'Erro desconhecido');
    } finally {
      setEnviando(false);
    }
  }

  return (
  <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 overflow-auto">
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
                className="bg-blue-600/70 hover:bg-blue-700/80 text-white px-2 py-1 rounded-full shadow-sm transition-all duration-200 backdrop-blur-sm border border-blue-300/50 font-light text-xs"
              >
                &#128203; Itens
              </Link>
            </td>
            <td className="px-2 py-1">
              <Link
                to={`/call/${c.avaliacao_id}/transcription`}
                state={{ agentId }}
                className="bg-blue-600/70 hover:bg-blue-700/80 text-white px-2 py-1 rounded-full shadow-sm transition-all duration-200 backdrop-blur-sm border border-blue-300/50 font-light text-xs"
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
    {/* Modal de feedback */}
    {modalOpen && (
      <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-40 z-50">
        <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md">
          <h3 className="text-lg font-semibold mb-4">Aplicar Feedback</h3>
          <label className="block mb-2 text-sm font-medium">Comentário</label>
          <textarea
            className="w-full border border-gray-300 rounded p-2 mb-4"
            rows={3}
            value={comentario}
            onChange={e => setComentario(e.target.value)}
            disabled={enviando}
          />
          {erro && <div className="text-red-600 mb-2 text-sm">{erro}</div>}
          {sucesso && <div className="text-green-600 mb-2 text-sm">Feedback enviado com sucesso!</div>}
          <div className="flex justify-end gap-2">
            <button
              className="px-4 py-2 rounded-lg bg-gray-300/80 text-gray-700 border border-gray-400/30 font-light backdrop-blur-sm hover:bg-gray-300/90 transition-all duration-200"
              onClick={() => setModalOpen(false)}
              disabled={enviando}
            >
              Cancelar
            </button>
            <button
              className="px-4 py-2 rounded-lg bg-blue-600/80 text-white font-light backdrop-blur-sm hover:bg-blue-600/90 transition-all duration-200 border border-blue-500/30"
              onClick={handleEnviarFeedback}
              disabled={enviando || !comentario}
            >
              {enviando ? 'Enviando...' : 'Enviar'}
            </button>
          </div>
        </div>
      </div>
    )}
  </div>
  );
}

export default CallList;

