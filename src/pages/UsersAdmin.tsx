import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getAllUsers, resetUserPassword } from '../lib/api';

interface User {
  id: number;
  username: string;
  full_name: string;
  active: boolean;
}

export default function UsersAdmin() {
  const queryClient = useQueryClient();
  const { data = [], isLoading, error } = useQuery<User[]>({
    queryKey: ['allUsers'],
    queryFn: getAllUsers,
  });

  const resetPasswordMutation = useMutation({
    mutationFn: (userId: number) => resetUserPassword(userId),
    onSuccess: (data) => {
      alert(`Senha resetada para: ${data.temporary_password}`);
      queryClient.invalidateQueries(['allUsers']);
    },
    onError: () => {
      alert('Erro ao resetar senha');
    }
  });

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Administração de Usuários</h1>
      <p className="text-gray-600 mb-6">Gerencie usuários do sistema: editar nome/status e resetar senha.</p>
      {isLoading && <div>Carregando usuários...</div>}
      {error && <div className="text-red-600">Erro ao carregar usuários.</div>}
      <table className="min-w-full bg-white rounded shadow">
        <thead>
          <tr>
            <th className="px-4 py-2 text-left">ID</th>
            <th className="px-4 py-2 text-left">Usuário</th>
            <th className="px-4 py-2 text-left">Nome</th>
            <th className="px-4 py-2 text-left">Ativo</th>
            <th className="px-4 py-2 text-left">Ações</th>
          </tr>
        </thead>
        <tbody>
          {data.map((user) => (
            <tr key={user.id}>
              <td className="px-4 py-2">{user.id}</td>
              <td className="px-4 py-2">{user.username}</td>
              <td className="px-4 py-2">{user.full_name}</td>
              <td className="px-4 py-2">{user.active ? 'Sim' : 'Não'}</td>
              <td className="px-4 py-2 space-x-2">
                <button className="bg-blue-500 text-white px-2 py-1 rounded" /*onClick={...}*/>Editar</button>
                <button
                  className="bg-yellow-500 text-white px-2 py-1 rounded"
                  onClick={() => {
                    if(window.confirm('Deseja resetar a senha deste usuário?')) {
                      resetPasswordMutation.mutate(user.id);
                    }
                  }}
                >Resetar Senha</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
} 