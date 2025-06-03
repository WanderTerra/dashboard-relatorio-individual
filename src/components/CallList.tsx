import React from 'react';
import { Link, useParams } from 'react-router-dom';

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
        </tr>
      </thead>
      <tbody>
        {calls.map(c => (
          <tr key={c.call_id} className="border-b last:border-0">
            <td className="px-2 py-1">{new Date(c.data_ligacao).toLocaleDateString()}</td>
            <td className="px-2 py-1">{c.pontuacao.toFixed(1)}</td>
            <td className="px-2 py-1">{c.status_avaliacao}</td>
            <td className="px-2 py-1">
              <Link
                to={`/call/${c.avaliacao_id}/items`}
                state={{ agentId }}
                className="text-blue-600 hover:underline"
              >
                Itens
              </Link>
            </td>
            <td className="px-2 py-1">
              <Link
                to={`/call/${c.avaliacao_id}/transcription`}
                state={{ agentId }}
                className="text-blue-600 hover:underline"
              >
                Transcrição
              </Link>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
  );
}

export default CallList;

