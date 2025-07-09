import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getAllUsers, resetUserPassword, updateUser, createUser } from '../lib/api';

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

  // Estado para modal de edição
  const [editingUser, setEditingUser] = React.useState<User | null>(null);
  const [editName, setEditName] = React.useState('');
  const [editActive, setEditActive] = React.useState(true);
  const [editUsername, setEditUsername] = React.useState('');
  const [modalOpen, setModalOpen] = React.useState(false);
  const [saving, setSaving] = React.useState(false);

  const [createModalOpen, setCreateModalOpen] = React.useState(false);
  const [newUsername, setNewUsername] = React.useState('');
  const [newFullName, setNewFullName] = React.useState('');
  const [creating, setCreating] = React.useState(false);
  const [createdPassword, setCreatedPassword] = React.useState<string | null>(null);
  const [isAdmin, setIsAdmin] = React.useState(false);
  const [agentId, setAgentId] = React.useState('');

  const resetPasswordMutation = useMutation({
    mutationFn: (userId: number) => resetUserPassword(userId),
    onSuccess: (data) => {
      alert(`Senha resetada para: ${data.temporary_password}`);
      queryClient.invalidateQueries({ queryKey: ['allUsers'] });
    },
    onError: () => {
      alert('Erro ao resetar senha');
    }
  });

  // Função para abrir modal e preencher dados
  const openEditModal = (user: User) => {
    setEditingUser(user);
    setEditName(user.full_name);
    setEditActive(user.active);
    setEditUsername(user.username);
    setModalOpen(true);
  };

  // Função para salvar edição
  const handleSave = async () => {
    if (!editingUser) return;
    setSaving(true);
    try {
      await updateUser(editingUser.id, { full_name: editName, active: editActive, username: editUsername });
      setModalOpen(false);
      setEditingUser(null);
      queryClient.invalidateQueries({ queryKey: ['allUsers'] });
    } catch (e) {
      alert('Erro ao salvar alterações');
    } finally {
      setSaving(false);
    }
  };

  const handleCreateUser = async () => {
    setCreating(true);
    setCreatedPassword(null);
    try {
      const permissions: string[] = [];
      if (isAdmin) permissions.push('admin');
      if (agentId.trim()) permissions.push(`agent_${agentId.trim()}`);
      
      const result = await createUser(newUsername, newFullName, permissions.length > 0 ? permissions : undefined);
      setCreatedPassword('Temp@2025'); // senha padrão, ou result.temporary_password se backend retornar
      setCreateModalOpen(false);
      setNewUsername('');
      setNewFullName('');
      setIsAdmin(false);
      setAgentId('');
      queryClient.invalidateQueries({ queryKey: ['allUsers'] });
      alert(`Usuário criado com sucesso!\nUsuário: ${newUsername}\nSenha temporária: Temp@2025`);
    } catch (e) {
      alert('Erro ao criar usuário');
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Administração de Usuários</h1>
      <p className="text-gray-600 mb-6">Gerencie usuários do sistema: editar nome/status e resetar senha.</p>
      <button
        className="mb-4 bg-green-600 text-white px-4 py-2 rounded"
        onClick={() => setCreateModalOpen(true)}
      >
        Novo Usuário
      </button>
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
                <button
                  className="bg-blue-500 text-white px-2 py-1 rounded"
                  onClick={() => openEditModal(user)}
                >Editar</button>
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

      {/* Modal de criação de usuário */}
      {createModalOpen && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-40 z-50">
          <div className="bg-white p-6 rounded shadow-lg min-w-[320px]">
            <h2 className="text-xl font-bold mb-4">Novo Usuário</h2>
            <div className="mb-4">
              <label className="block mb-1">Nome de usuário</label>
              <input
                className="border px-2 py-1 rounded w-full"
                value={newUsername}
                onChange={e => setNewUsername(e.target.value)}
                disabled={creating}
              />
            </div>
            <div className="mb-4">
              <label className="block mb-1">Nome completo</label>
              <input
                className="border px-2 py-1 rounded w-full"
                value={newFullName}
                onChange={e => setNewFullName(e.target.value)}
                disabled={creating}
              />
            </div>
            <div className="mb-4 flex items-center">
              <input
                type="checkbox"
                checked={isAdmin}
                onChange={e => setIsAdmin(e.target.checked)}
                id="is-admin-checkbox"
                disabled={creating}
              />
              <label htmlFor="is-admin-checkbox" className="ml-2">Admin</label>
            </div>
            <div className="mb-4">
              <label className="block mb-1">ID do Agente (opcional)</label>
              <input
                className="border px-2 py-1 rounded w-full"
                value={agentId}
                onChange={e => setAgentId(e.target.value)}
                disabled={creating}
              />
            </div>
            <div className="flex justify-end space-x-2">
              <button
                className="px-3 py-1 rounded bg-gray-300"
                onClick={() => setCreateModalOpen(false)}
                disabled={creating}
              >Cancelar</button>
              <button
                className="px-3 py-1 rounded bg-green-600 text-white"
                onClick={handleCreateUser}
                disabled={creating || !newUsername.trim() || !newFullName.trim()}
              >{creating ? 'Criando...' : 'Criar'}</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de edição */}
      {modalOpen && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-40 z-50">
          <div className="bg-white p-6 rounded shadow-lg min-w-[320px]">
            <h2 className="text-xl font-bold mb-4">Editar Usuário</h2>
            <div className="mb-4">
              <label className="block mb-1">Nome de usuário</label>
              <input
                className="border px-2 py-1 rounded w-full"
                value={editUsername}
                onChange={e => setEditUsername(e.target.value)}
                disabled={saving}
              />
            </div>
            <div className="mb-4">
              <label className="block mb-1">Nome completo</label>
              <input
                className="border px-2 py-1 rounded w-full"
                value={editName}
                onChange={e => setEditName(e.target.value)}
                disabled={saving}
              />
            </div>
            <div className="mb-4 flex items-center">
              <input
                type="checkbox"
                checked={editActive}
                onChange={e => setEditActive(e.target.checked)}
                id="active-checkbox"
                disabled={saving}
              />
              <label htmlFor="active-checkbox" className="ml-2">Ativo</label>
            </div>
            <div className="flex justify-end space-x-2">
              <button
                className="px-3 py-1 rounded bg-gray-300"
                onClick={() => { setModalOpen(false); setEditingUser(null); }}
                disabled={saving}
              >Cancelar</button>
              <button
                className="px-3 py-1 rounded bg-blue-600 text-white"
                onClick={handleSave}
                disabled={saving || !editName.trim() || !editUsername.trim()}
              >{saving ? 'Salvando...' : 'Salvar'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 