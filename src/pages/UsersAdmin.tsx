import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getAllUsers, resetUserPassword, updateUser, createUser, getUserPermissions, updateUserPermissions } from '../lib/api';
import {
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalTrigger,
  useModal,
} from '../components/ui/animated-modal';

interface User {
  id: number;
  username: string;
  full_name: string;
  active: boolean;
}

// Componente interno para o modal de criação de usuário
function CreateUserModalContent({ 
  newUsername, 
  setNewUsername, 
  newFullName, 
  setNewFullName, 
  isAdmin, 
  setIsAdmin, 
  creating, 
  handleCreateUser 
}: {
  newUsername: string;
  setNewUsername: (value: string) => void;
  newFullName: string;
  setNewFullName: (value: string) => void;
  isAdmin: boolean;
  setIsAdmin: (value: boolean) => void;
  creating: boolean;
  handleCreateUser: () => void;
}) {
  const { setOpen } = useModal();

  const handleCancel = () => {
    setOpen(false);
    setNewUsername('');
    setNewFullName('');
    setIsAdmin(false);
  };

  return (
    <ModalBody>
      <ModalContent>
        <h2 className="text-xl font-bold mb-4">Novo Usuário</h2>
        <div className="mb-4">
          <label className="block mb-1">Nome de usuário</label>
          <input
            className="border border-gray-200 px-2 py-1 rounded-xl w-full shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
            value={newUsername}
            onChange={e => setNewUsername(e.target.value)}
            disabled={creating}
          />
        </div>
        <div className="mb-4">
          <label className="block mb-1">Nome completo</label>
          <input
            className="border border-gray-200 px-2 py-1 rounded-xl w-full shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
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
      </ModalContent>
      <ModalFooter className="gap-4">
        <button
          className="px-3 py-1 bg-gray-300/80 text-gray-700 border border-gray-400/30 rounded-full text-sm font-light backdrop-blur-sm hover:bg-gray-300/90 transition-all duration-200"
          onClick={handleCancel}
          disabled={creating}
        >
          Cancelar
        </button>
        <button
          className="bg-green-600/80 text-white text-sm px-3 py-1 rounded-full border border-green-500/30 font-light backdrop-blur-sm hover:bg-green-600/90 transition-all duration-200"
          onClick={async () => {
            await handleCreateUser();
            setOpen(false);
          }}
          disabled={creating || !newUsername.trim() || !newFullName.trim()}
        >
          {creating ? 'Criando...' : 'Criar'}
        </button>
      </ModalFooter>
    </ModalBody>
  );
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
  const [editModalOpen, setEditModalOpen] = React.useState(false);
  const [saving, setSaving] = React.useState(false);

  const [createModalOpen, setCreateModalOpen] = React.useState(false);
  const [newUsername, setNewUsername] = React.useState('');
  const [newFullName, setNewFullName] = React.useState('');
  const [creating, setCreating] = React.useState(false);
  const [createdPassword, setCreatedPassword] = React.useState<string | null>(null);
  const [isAdmin, setIsAdmin] = React.useState(false);
  const [agentId, setAgentId] = React.useState('');

  const [editIsAdmin, setEditIsAdmin] = React.useState(false);
  const [loadingPerms, setLoadingPerms] = React.useState(false);
  const [userPermissions, setUserPermissions] = React.useState<string[]>([]);

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
  const openEditModal = async (user: User) => {
    setEditingUser(user);
    setEditName(user.full_name);
    setEditActive(user.active);
    setEditUsername(user.username);
    setLoadingPerms(true);
    try {
      const perms = await getUserPermissions(user.id);
      setUserPermissions(perms);
      setEditIsAdmin(perms.includes('admin'));
      // Abrir o modal após carregar as permissões
      setEditModalOpen(true);
    } catch {
      setUserPermissions([]);
      setEditIsAdmin(false);
      setEditModalOpen(true);
    } finally {
      setLoadingPerms(false);
    }
  };

  // Função para salvar edição
  const handleSave = async () => {
    if (!editingUser) return;
    setSaving(true);
    try {
      await updateUser(editingUser.id, { full_name: editName, active: editActive, username: editUsername });
      // Atualizar permissões - manter as existentes e adicionar/remover admin
      const perms = userPermissions.filter(p => p !== 'admin');
      if (editIsAdmin) perms.push('admin');
      await updateUserPermissions(editingUser.id, perms);
      setEditModalOpen(false);
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
      {/* Modal de criação de usuário */}
      <Modal>
        <ModalTrigger className="mb-4 bg-green-600/80 text-white px-4 py-1.5 rounded-full font-light shadow-sm hover:bg-green-600/90 transition-all duration-200 backdrop-blur-sm border border-green-500/30">
          Novo Usuário
        </ModalTrigger>
        <CreateUserModalContent 
          newUsername={newUsername}
          setNewUsername={setNewUsername}
          newFullName={newFullName}
          setNewFullName={setNewFullName}
          isAdmin={isAdmin}
          setIsAdmin={setIsAdmin}
          creating={creating}
          handleCreateUser={handleCreateUser}
        />
      </Modal>
      {isLoading && <div>Carregando usuários...</div>}
      {error && <div className="text-red-600">Erro ao carregar usuários.</div>}
      <table className="min-w-full bg-white rounded-xl shadow-sm border border-gray-100">
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
                  className="bg-blue-600/70 text-white px-3 py-1 rounded-full font-light shadow-sm hover:bg-blue-600/80 transition-all duration-200 backdrop-blur-sm border border-blue-500/30"
                  onClick={() => openEditModal(user)}
                >Editar</button>
                <button
                  className="bg-gray-500/70 text-white px-3 py-1 rounded-full font-light shadow-sm hover:bg-gray-500/80 transition-all duration-200 backdrop-blur-sm border border-gray-400/30"
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

      {/* Modal de edição */}
      {editModalOpen && editingUser && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-40 z-50">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 min-w-[320px]">
            <h2 className="text-xl font-bold mb-4">Editar Usuário</h2>
            <div className="mb-4">
              <label className="block mb-1">Nome de usuário</label>
              <input
                className="border border-gray-200 px-2 py-1 rounded-xl w-full shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                value={editUsername}
                onChange={e => setEditUsername(e.target.value)}
                disabled={saving}
              />
            </div>
            <div className="mb-4">
              <label className="block mb-1">Nome completo</label>
              <input
                className="border border-gray-200 px-2 py-1 rounded-xl w-full shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
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
            <div className="mb-4">
              <label className="block mb-1 font-bold">Permissões atuais:</label>
              <div className="text-sm text-gray-600 mb-2">
                {userPermissions.map(perm => (
                  <span key={perm} className="inline-block bg-blue-100 text-blue-800 px-2 py-1 rounded mr-2 mb-1">
                    {perm}
                  </span>
                ))}
              </div>
            </div>
            <div className="mb-4 flex items-center">
              <input
                type="checkbox"
                checked={editIsAdmin}
                onChange={e => setEditIsAdmin(e.target.checked)}
                id="edit-admin-checkbox"
                disabled={saving || loadingPerms}
              />
              <label htmlFor="edit-admin-checkbox" className="ml-2">Tornar Administrador</label>
            </div>
            <div className="flex justify-end space-x-2">
              <button
                className="px-3 py-1 rounded-full bg-gray-300/80 text-gray-700 border border-gray-400/30 font-light backdrop-blur-sm hover:bg-gray-300/90 transition-all duration-200"
                onClick={() => { setEditModalOpen(false); setEditingUser(null); }}
                disabled={saving}
              >Cancelar</button>
              <button
                className="px-3 py-1 rounded-full bg-blue-600/80 text-white font-light backdrop-blur-sm hover:bg-blue-600/90 transition-all duration-200 border border-blue-500/30"
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