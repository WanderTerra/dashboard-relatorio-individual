import * as React from 'react';
import { useNavigate } from 'react-router-dom';

interface Agent {
  agent_id: string;
  nome: string;
  ligacoes: number;
  media: number;
}

interface Props {
  agents: Agent[];
  filters: Record<string, string>;
}

const cor = (v: number) => (v < 50 ? 'text-red-600' : v < 70 ? 'text-yellow-600' : 'text-green-600');

const AgentsTable: React.FC<Props> = ({ agents, filters }) => {
  const navigate = useNavigate();
  return (
    <div className="overflow-x-auto bg-white shadow rounded-xl">
      <table className="min-w-full text-sm">
        <thead>
          <tr className="bg-gray-100 text-left">
            <th className="p-3">Nome</th>
            <th className="p-3">ID</th>
            <th className="p-3">Pontuação</th>
            <th className="p-3">Ligações</th>
            <th className="p-3"></th>
          </tr>
        </thead>
        <tbody>
          {agents.map((a) => (
            <tr key={a.agent_id} className="border-b last:border-none">
              <td className="p-3">{a.nome}</td>
              <td className="p-3">{a.agent_id}</td>
              <td className={`p-3 font-semibold ${cor(a.media)}`}>{a.media}</td>
              <td className="p-3">{a.ligacoes}</td>
              <td className="p-3">
                <button
                  className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors"
                  onClick={() => navigate(`/agent/${a.agent_id}`, { state: filters })}
                >
                  DETALHAR
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default AgentsTable;