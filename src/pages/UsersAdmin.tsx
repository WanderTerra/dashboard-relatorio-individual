import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getAllUsers, resetUserPassword, updateUser, createUser, getUserPermissions, updateUserPermissions } from '../lib/api';
import { Users, UserPlus, Edit, Key, Shield, CheckCircle, XCircle, AlertCircle, Search } from 'lucide-react';
import PageHeader from '../components/PageHeader';
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
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-blue-100 rounded-xl">
            <UserPlus className="h-6 w-6 text-blue-600" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">Novo Usuário</h2>
            <p className="text-sm text-gray-600">Crie um novo usuário no sistema</p>
          </div>
        </div>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Nome de usuário</label>
            <input
              className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm bg-white text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
              placeholder="Digite o nome de usuário"
              value={newUsername}
              onChange={e => setNewUsername(e.target.value)}
              disabled={creating}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Nome completo</label>
            <input
              className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm bg-white text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
              placeholder="Digite o nome completo"
              value={newFullName}
              onChange={e => setNewFullName(e.target.value)}
              disabled={creating}
            />
          </div>
          
          <div className="flex items-center p-3 bg-gray-50 rounded-lg border border-gray-200">
            <input
              type="checkbox"
              checked={isAdmin}
              onChange={e => setIsAdmin(e.target.checked)}
              id="is-admin-checkbox"
              disabled={creating}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="is-admin-checkbox" className="ml-3 flex items-center gap-2">
              <Shield className="h-4 w-4 text-gray-600" />
              <span className="text-sm font-medium text-gray-700">Conceder privilégios de administrador</span>
            </label>
          </div>
        </div>
      </ModalContent>
      <ModalFooter className="gap-3">
        <button
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-full hover:bg-gray-50 transition-all duration-200"
          onClick={handleCancel}
          disabled={creating}
        >
          Cancelar
        </button>
        <button
          className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-full hover:bg-blue-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          onClick={async () => {
            await handleCreateUser();
            setOpen(false);
          }}
          disabled={creating || !newUsername.trim() || !newFullName.trim()}
        >
          {creating ? (
            <div className="flex items-center gap-2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              Criando...
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <UserPlus className="h-4 w-4" />
              Criar Usuário
            </div>
          )}
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

  const [newUsername, setNewUsername] = React.useState('');
  const [newFullName, setNewFullName] = React.useState('');
  const [creating, setCreating] = React.useState(false);
  const [createdPassword, setCreatedPassword] = React.useState<string | null>(null);
  const [isAdmin, setIsAdmin] = React.useState(false);
  const [agentId, setAgentId] = React.useState('');

  const [editIsAdmin, setEditIsAdmin] = React.useState(false);
  const [loadingPerms, setLoadingPerms] = React.useState(false);
  const [userPermissions, setUserPermissions] = React.useState<Record<number, string[]>>({});
  
  // Estados para pesquisa e paginação
  const [searchTerm, setSearchTerm] = React.useState('');
  const [currentPage, setCurrentPage] = React.useState(1);
  const [roleFilter, setRoleFilter] = React.useState<'todos' | 'admin' | 'agente'>('todos');
  const [statusFilter, setStatusFilter] = React.useState<'todos' | 'ativo' | 'inativo'>('todos');
  const itemsPerPage = 10;

  // Filtrar usuários baseado na pesquisa, papel e status
  const filteredUsers = React.useMemo(() => {
    let filtered = data;
    
    // Filtro por texto
    if (searchTerm) {
      filtered = filtered.filter(user => 
        user.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.username.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    // Filtro por papel
    if (roleFilter !== 'todos') {
      filtered = filtered.filter(user => {
        const permissions = userPermissions[user.id] || [];
        if (roleFilter === 'admin') {
          return permissions.includes('admin');
        } else if (roleFilter === 'agente') {
          return permissions.some(p => p.startsWith('agent_'));
        }
        return true;
      });
    }
    
    // Filtro por status
    if (statusFilter !== 'todos') {
      filtered = filtered.filter(user => {
        if (statusFilter === 'ativo') {
          return user.active;
        } else if (statusFilter === 'inativo') {
          return !user.active;
        }
        return true;
      });
    }
    
    return filtered;
  }, [data, searchTerm, roleFilter, statusFilter, userPermissions]);

  // Calcular paginação
  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedUsers = filteredUsers.slice(startIndex, endIndex);

  // Reset página quando filtro muda
  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, roleFilter, statusFilter]);

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
      setUserPermissions(prev => ({ ...prev, [user.id]: perms }));
      setEditIsAdmin(perms.includes('admin'));
      setEditModalOpen(true);
    } catch {
      setUserPermissions(prev => ({ ...prev, [user.id]: [] }));
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
      const currentPerms = userPermissions[editingUser.id] || [];
      const perms = currentPerms.filter(p => p !== 'admin');
      if (editIsAdmin) perms.push('admin');
      await updateUserPermissions(editingUser.id, perms);
      
      // Atualizar o estado local com as novas permissões
      setUserPermissions(prev => ({ ...prev, [editingUser.id]: perms }));
      
      setEditModalOpen(false);
      setEditingUser(null);
      
      // Recarregar as permissões para garantir que estão atualizadas
      try {
        const updatedPerms = await getUserPermissions(editingUser.id);
        setUserPermissions(prev => ({ ...prev, [editingUser.id]: updatedPerms }));
      } catch (error) {
        console.error('Erro ao recarregar permissões:', error);
      }
      
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
      
      await createUser(newUsername, newFullName, permissions.length > 0 ? permissions : undefined);
      
      setCreatedPassword('Temp@2025');
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

  // Carregar permissões de todos os usuários quando os dados carregam
  React.useEffect(() => {
    if (data && data.length > 0) {
      data.forEach(async (user) => {
        if (!userPermissions[user.id]) {
          try {
            const perms = await getUserPermissions(user.id);
            setUserPermissions(prev => ({ ...prev, [user.id]: perms }));
          } catch {
            setUserPermissions(prev => ({ ...prev, [user.id]: [] }));
          }
        }
      });
    }
  }, [data]);

  // Estatísticas (baseadas nos dados originais, não filtrados)
  const totalUsers = data.length;
  const activeUsers = data.filter(user => user.active).length;
  const adminUsers = data.filter(user => (userPermissions[user.id] || []).includes('admin')).length;

  return (
    <div className="min-h-screen bg-gray-50">
      <PageHeader 
        title="Administração de Usuários"
        subtitle="Gerencie usuários do sistema, permissões e configurações de acesso"
        actions={
          <Modal>
            <ModalTrigger className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-all duration-200 font-medium">
              <UserPlus className="h-4 w-4" />
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
        }
      />

      <div className="p-6 space-y-6">
        {/* Cards de estatísticas */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100 hover:shadow-xl transition-shadow duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total de Usuários</p>
                <p className="text-2xl font-bold text-gray-900">{totalUsers}</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-xl">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100 hover:shadow-xl transition-shadow duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Usuários Ativos</p>
                <p className="text-2xl font-bold text-green-600">{activeUsers}</p>
              </div>
              <div className="p-3 bg-green-100 rounded-xl">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100 hover:shadow-xl transition-shadow duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Administradores</p>
                <p className="text-2xl font-bold text-blue-600">{adminUsers}</p>
              </div>
                              <div className="p-3 bg-blue-100 rounded-xl">
                  <Shield className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Tabela de usuários */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden hover:shadow-xl transition-shadow duration-300">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Lista de Usuários</h3>
                <p className="text-sm text-gray-600 mt-1">Gerencie informações e permissões dos usuários</p>
              </div>
                              <div className="flex items-center gap-3">
                  <div className="relative w-80">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <Search className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="text"
                      placeholder="Pesquisar usuários..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="block w-full pl-12 pr-4 py-3 border border-gray-300 rounded-full shadow-sm bg-white text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm font-medium"
                    />
                  </div>
                  
                  {/* Filtro por papel */}
                  <div className="flex items-center bg-gray-100 rounded-full p-1 shadow-sm">
                    <button
                      onClick={() => setRoleFilter('todos')}
                      className={`px-4 py-2 text-sm font-medium rounded-full transition-all duration-200 ${
                        roleFilter === 'todos'
                          ? 'bg-white text-gray-900 shadow-sm'
                          : 'text-gray-600 hover:text-gray-900'
                      }`}
                    >
                      Todos
                    </button>
                    <button
                      onClick={() => setRoleFilter('admin')}
                      className={`px-4 py-2 text-sm font-medium rounded-full transition-all duration-200 flex items-center gap-1 ${
                        roleFilter === 'admin'
                          ? 'bg-white text-gray-900 shadow-sm'
                          : 'text-gray-600 hover:text-gray-900'
                      }`}
                    >
                      <Shield className="h-3 w-3" />
                      Admin
                    </button>
                    <button
                      onClick={() => setRoleFilter('agente')}
                      className={`px-4 py-2 text-sm font-medium rounded-full transition-all duration-200 flex items-center gap-1 ${
                        roleFilter === 'agente'
                          ? 'bg-white text-gray-900 shadow-sm'
                          : 'text-gray-600 hover:text-gray-900'
                      }`}
                    >
                      <Users className="h-3 w-3" />
                      Agentes
                    </button>
                  </div>
                  
                  {/* Filtro por status */}
                  <div className="flex items-center bg-gray-100 rounded-full p-1 shadow-sm">
                    <button
                      onClick={() => setStatusFilter('todos')}
                      className={`px-4 py-2 text-sm font-medium rounded-full transition-all duration-200 ${
                        statusFilter === 'todos'
                          ? 'bg-white text-gray-900 shadow-sm'
                          : 'text-gray-600 hover:text-gray-900'
                      }`}
                    >
                      Todos
                    </button>
                    <button
                      onClick={() => setStatusFilter('ativo')}
                      className={`px-4 py-2 text-sm font-medium rounded-full transition-all duration-200 flex items-center gap-1 ${
                        statusFilter === 'ativo'
                          ? 'bg-white text-gray-900 shadow-sm'
                          : 'text-gray-600 hover:text-gray-900'
                      }`}
                    >
                      <CheckCircle className="h-3 w-3" />
                      Ativo
                    </button>
                    <button
                      onClick={() => setStatusFilter('inativo')}
                      className={`px-4 py-2 text-sm font-medium rounded-full transition-all duration-200 flex items-center gap-1 ${
                        statusFilter === 'inativo'
                          ? 'bg-white text-gray-900 shadow-sm'
                          : 'text-gray-600 hover:text-gray-900'
                      }`}
                    >
                      <XCircle className="h-3 w-3" />
                      Inativo
                    </button>
                  </div>
                </div>
            </div>
          </div>
          
          {isLoading && (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="text-gray-600 mt-2">Carregando usuários...</p>
            </div>
          )}
          
          {error && (
            <div className="p-8 text-center">
              <AlertCircle className="h-8 w-8 text-red-500 mx-auto" />
              <p className="text-red-600 mt-2">Erro ao carregar usuários</p>
            </div>
          )}
          
          {!isLoading && !error && (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Usuário
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Permissões
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Ações
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {paginatedUsers.map((user) => (
                    <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10">
                            <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
                              <span className="text-sm font-bold text-white">
                                {user.full_name ? user.full_name.charAt(0).toUpperCase() : user.username.charAt(0).toUpperCase()}
                              </span>
                            </div>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">{user.full_name}</div>
                            <div className="text-sm text-gray-500">@{user.username}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          user.active 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {user.active ? (
                            <>
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Ativo
                            </>
                          ) : (
                            <>
                              <XCircle className="h-3 w-3 mr-1" />
                              Inativo
                            </>
                          )}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex flex-wrap gap-1">
                          {(userPermissions[user.id] || []).includes('admin') && (
                            <span className="inline-flex items-center px-2 py-1 rounded-xl text-xs font-medium bg-blue-100 text-blue-800">
                              <Shield className="h-3 w-3 mr-1" />
                              Admin
                            </span>
                          )}
                                                      {(userPermissions[user.id] || []).filter((p: string) => p.startsWith('agent_')).map((perm: string) => (
                              <span key={perm} className="inline-flex items-center px-2 py-1 rounded-xl text-xs font-medium bg-green-100 text-green-800">
                              <Users className="h-3 w-3 mr-1" />
                              Agente
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center gap-2">
                                                     <button
                             onClick={() => openEditModal(user)}
                             className="inline-flex items-center px-3 py-1.5 border border-gray-300 shadow-sm text-xs font-medium rounded-full text-gray-700 bg-white hover:bg-gray-50 transition-all duration-200"
                           >
                             <Edit className="h-3 w-3 mr-1" />
                             Editar
                           </button>
                                                     <button
                             onClick={() => {
                               if(window.confirm('Deseja resetar a senha deste usuário?')) {
                                 resetPasswordMutation.mutate(user.id);
                               }
                             }}
                             className="inline-flex items-center px-3 py-1.5 border border-gray-300 shadow-sm text-xs font-medium rounded-full text-gray-700 bg-white hover:bg-gray-50 transition-all duration-200"
                           >
                             <Key className="h-3 w-3 mr-1" />
                             Resetar Senha
                           </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          
          {/* Controles de paginação */}
          {!isLoading && !error && totalPages > 1 && (
            <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-700">
                  Mostrando <span className="font-medium">{startIndex + 1}</span> até{' '}
                  <span className="font-medium">{Math.min(endIndex, filteredUsers.length)}</span> de{' '}
                  <span className="font-medium">{filteredUsers.length}</span> usuários
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                    className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                  >
                    Anterior
                  </button>
                  
                  <div className="flex items-center space-x-1">
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                      <button
                        key={page}
                        onClick={() => setCurrentPage(page)}
                        className={`inline-flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
                          currentPage === page
                            ? 'bg-blue-600 text-white shadow-sm'
                            : 'text-gray-700 bg-white border border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        {page}
                      </button>
                    ))}
                  </div>
                  
                  <button
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                    className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                  >
                    Próxima
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modal de edição */}
      {editModalOpen && editingUser && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div className="bg-white rounded-xl shadow-lg max-w-md w-full mx-4">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-xl">
                  <Edit className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-gray-900">Editar Usuário</h2>
                  <p className="text-sm text-gray-600">Atualize as informações do usuário</p>
                </div>
              </div>
            </div>
            
            <div className="px-6 py-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Nome de usuário</label>
                <input
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm bg-white text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                  value={editUsername}
                  onChange={e => setEditUsername(e.target.value)}
                  disabled={saving}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Nome completo</label>
                <input
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm bg-white text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                  value={editName}
                  onChange={e => setEditName(e.target.value)}
                  disabled={saving}
                />
              </div>
              
              <div className="flex items-center p-3 bg-gray-50 rounded-lg border border-gray-200">
                <input
                  type="checkbox"
                  checked={editActive}
                  onChange={e => setEditActive(e.target.checked)}
                  id="active-checkbox"
                  disabled={saving}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="active-checkbox" className="ml-3 text-sm font-medium text-gray-700">
                  Usuário ativo
                </label>
              </div>
              
              <div className="flex items-center p-3 bg-gray-50 rounded-lg border border-gray-200">
                <input
                  type="checkbox"
                  checked={editIsAdmin}
                  onChange={e => setEditIsAdmin(e.target.checked)}
                  id="edit-admin-checkbox"
                  disabled={saving || loadingPerms}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="edit-admin-checkbox" className="ml-3 flex items-center gap-2">
                  <Shield className="h-4 w-4 text-gray-600" />
                  <span className="text-sm font-medium text-gray-700">Privilégios de administrador</span>
                </label>
              </div>
            </div>
            
            <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-3">
                             <button
                 className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-full hover:bg-gray-50 transition-all duration-200"
                 onClick={() => { setEditModalOpen(false); setEditingUser(null); }}
                 disabled={saving}
               >
                 Cancelar
               </button>
                             <button
                 className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-full hover:bg-blue-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                 onClick={handleSave}
                 disabled={saving || !editName.trim() || !editUsername.trim()}
               >
                {saving ? (
                  <div className="flex items-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Salvando...
                  </div>
                ) : (
                  'Salvar Alterações'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 