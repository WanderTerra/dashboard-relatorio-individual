import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { getAllAgents } from '../lib/api';

interface Agent {
  id: string;
  name: string;
}

export default function AgentsAdmin() {
  const { data = [], isLoading, error } = useQuery<Agent[]>({
    queryKey: ['allAgents'],
    queryFn: getAllAgents,
  });

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Gestão de Agentes</h1>
      <p className="text-gray-600 mb-6">Aqui você poderá visualizar, editar e resetar senhas dos agentes.</p>
      {isLoading && <div>Carregando agentes...</div>}
      {error && <div className="text-red-600">Erro ao carregar agentes.</div>}
      <table className="min-w-full bg-white rounded-xl shadow-sm border border-gray-100">
        <thead>
          <tr>
            <th className="px-4 py-2 text-left">ID</th>
            <th className="px-4 py-2 text-left">Nome</th>
          </tr>
        </thead>
        <tbody>
          {data.map((ag) => (
            <tr key={ag.id}>
              <td className="px-4 py-2">{ag.id}</td>
              <td className="px-4 py-2">{ag.name}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
} 