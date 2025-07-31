import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getAllUsers, resetUserPassword, updateUser, createUser, getUserPermissions, updateUserPermissions } from '../lib/api';
import { Plus, Edit, RotateCcw, User, Shield, CheckCircle, XCircle, Search, ChevronLeft, ChevronRight } from 'lucide-react';
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
          <div className="p-2 bg-blue-100 rounded-lg">
            <User className="h-5 w-5 text-blue-600" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900">Novo Usuário</h2>
        </div>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Nome de usuário</label>
            <input
              className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-400 focus:border-blue-400 text-gray-900 placeholder-gray-500 transition-all duration-200"
              value={newUsername}
              onChange={e => setNewUsername(e.target.value)}
              disabled={creating}
              placeholder="Digite o nome de usuário"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Nome completo</label>
            <input
              className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-400 focus:border-blue-400 text-gray-900 placeholder-gray-500 transition-all duration-200"
              value={newFullName}
              onChange={e => setNewFullName(e.target.value)}
              disabled={creating}
              placeholder="Digite o nome completo"
            />
          </div>
          
          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
            <input
              type="checkbox"
              checked={isAdmin}
              onChange={e => setIsAdmin(e.target.checked)}
              id="is-admin-checkbox"
              disabled={creating}
              className="h-4 w-4 text-blue-600 focus:ring-blue-400 border-gray-300 rounded"
            />
            <label htmlFor="is-admin-checkbox" className="flex items-center gap-2 text-sm font-medium text-gray-700">
              <Shield className="h-4 w-4 text-blue-600" />
              Conceder permissões de administrador
            </label>
          </div>
        </div>
      </ModalContent>
      
      <ModalFooter className="gap-3">
        <button
          className="px-4 py-2 bg-gray-100 text-gray-700 rounded-full text-sm font-medium hover:bg-gray-200 transition-all duration-200"
          onClick={handleCancel}
          disabled={creating}
        >
          Cancelar
        </button>
        <button
          className="px-4 py-2 bg-blue-600 text-white rounded-full text-sm font-medium hover:bg-blue-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          onClick={async () => {
            await handleCreateUser();
            setOpen(false);
          }}
          disabled={creating || !newUsername.trim() || !newFullName.trim()}
        >
          {creating ? 'Criando...' : 'Criar Usuário'}
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

  // Estado para pesquisa
  const [searchTerm, setSearchTerm] = React.useState('');

  // Estado para paginação
  const [currentPage, setCurrentPage] = React.useState(1);
  const usersPerPage = 15;

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
  const [userPermissions, setUserPermissions] = React.useState<string[]>([]);

  const resetPasswordMutation = useMutation({
    mutationFn: (userId: number) => resetUserPassword(userId),
    onSuccess: (data) => {
      alert(`Senha resetada para: ${data.temporary_password}`);
      // Invalidar cache para manter consistência
      queryClient.invalidateQueries({ queryKey: ['allUsers'] });
      queryClient.invalidateQueries({ queryKey: ['all-agents'] }); // Para o dashboard
      queryClient.invalidateQueries({ queryKey: ['agents'] }); // Para o dashboard
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
      await updateUser(editingUser.id, {
        username: editUsername,
        full_name: editName,
        active: editActive
      });
      
      // Atualizar permissões se necessário
      if (editIsAdmin) {
        await updateUserPermissions(editingUser.id, ['admin']);
      }
      
      // Invalidar cache para atualizar dashboard e lista de usuários
      queryClient.invalidateQueries({ queryKey: ['allUsers'] });
      queryClient.invalidateQueries({ queryKey: ['all-agents'] }); // Para o dashboard
      queryClient.invalidateQueries({ queryKey: ['agents'] }); // Para o dashboard
      
      setEditModalOpen(false);
      setEditingUser(null);
      alert('Usuário atualizado com sucesso!');
    } catch (e) {
      alert('Erro ao atualizar usuário');
    } finally {
      setSaving(false);
    }
  };

  const handleCreateUser = async () => {
    setCreating(true);
    try {
      const permissions = isAdmin ? ['admin'] : [];
      await createUser(newUsername, newFullName, permissions);
      
      // Invalidar cache para atualizar dashboard e lista de usuários
      queryClient.invalidateQueries({ queryKey: ['allUsers'] });
      queryClient.invalidateQueries({ queryKey: ['all-agents'] }); // Para o dashboard
      queryClient.invalidateQueries({ queryKey: ['agents'] }); // Para o dashboard
      
      setNewUsername('');
      setNewFullName('');
      setIsAdmin(false);
      alert(`Usuário criado com sucesso!\nUsuário: ${newUsername}\nSenha temporária: Temp@2025`);
    } catch (e) {
      alert('Erro ao criar usuário');
    } finally {
      setCreating(false);
    }
  };

  // Filtrar usuários baseado na pesquisa
  const filteredUsers = React.useMemo(() => {
    if (!searchTerm.trim()) return data;
    
    const term = searchTerm.toLowerCase().trim();
    return data.filter(user => 
      user.id.toString().includes(term) ||
      user.username.toLowerCase().includes(term) ||
      user.full_name.toLowerCase().includes(term)
    );
  }, [data, searchTerm]);

  // Calcular paginação
  const totalPages = Math.ceil(filteredUsers.length / usersPerPage);
  const startIndex = (currentPage - 1) * usersPerPage;
  const endIndex = startIndex + usersPerPage;
  const currentUsers = filteredUsers.slice(startIndex, endIndex);

  // Resetar página quando mudar a pesquisa
  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Administração de Usuários
              </h1>
              <p className="text-gray-600 text-lg">
                Gerencie usuários do sistema: editar nome/status e resetar senha.
              </p>
            </div>
            <Modal>
              <ModalTrigger className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-full font-medium hover:bg-blue-700 transition-all duration-200 shadow-sm">
                <Plus className="h-5 w-5" />
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
          </div>
        </div>

        {/* Campo de Pesquisa */}
        <div className="mb-6">
          <div className="relative max-w-md">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              className="block w-full pl-10 pr-4 py-3 border border-gray-300 rounded-full shadow-sm focus:ring-2 focus:ring-blue-400 focus:border-blue-400 text-gray-900 placeholder-gray-500 transition-all duration-200"
              placeholder="Pesquisar por ID, usuário ou nome..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          {searchTerm && (
            <p className="mt-2 text-sm text-gray-600">
              {filteredUsers.length} usuário{filteredUsers.length !== 1 ? 's' : ''} encontrado{filteredUsers.length !== 1 ? 's' : ''}
            </p>
          )}
        </div>

        {/* Loading e Error States */}
        {isLoading && (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Carregando usuários...</p>
            </div>
          </div>
        )}
        
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <div className="flex items-center gap-2">
              <XCircle className="h-5 w-5 text-red-600" />
              <p className="text-red-800 font-medium">Erro ao carregar usuários.</p>
            </div>
          </div>
        )}

        {/* Table */}
        {!isLoading && !error && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      ID
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Usuário
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Nome
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Ações
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {currentUsers.length > 0 ? (
                    currentUsers.map((user) => (
                      <tr key={user.id} className="hover:bg-gray-50 transition-colors duration-150">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {user.id}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {user.username}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                              <span className="text-sm font-semibold text-blue-600">
                                {user.full_name ? user.full_name.charAt(0).toUpperCase() : user.username.charAt(0).toUpperCase()}
                              </span>
                            </div>
                            <span className="text-sm font-medium text-gray-900">{user.full_name}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${
                            user.active 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {user.active ? (
                              <>
                                <CheckCircle className="h-3 w-3" />
                                Ativo
                              </>
                            ) : (
                              <>
                                <XCircle className="h-3 w-3" />
                                Inativo
                              </>
                            )}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                          <button
                            className="inline-flex items-center gap-1 px-3 py-2 bg-blue-600 text-white rounded-full text-xs font-medium hover:bg-blue-700 transition-all duration-200"
                            onClick={() => openEditModal(user)}
                          >
                            <Edit className="h-3 w-3" />
                            Editar
                          </button>
                          <button
                            className="inline-flex items-center gap-1 px-3 py-2 bg-gray-100 text-gray-700 rounded-full text-xs font-medium hover:bg-gray-200 transition-all duration-200"
                            onClick={() => {
                              if(window.confirm('Deseja resetar a senha deste usuário?')) {
                                resetPasswordMutation.mutate(user.id);
                              }
                            }}
                          >
                            <RotateCcw className="h-3 w-3" />
                            Resetar Senha
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} className="px-6 py-12 text-center">
                        <div className="flex flex-col items-center gap-3">
                          <Search className="h-12 w-12 text-gray-400" />
                          <div>
                            <p className="text-lg font-medium text-gray-900 mb-1">
                              Nenhum usuário encontrado
                            </p>
                            <p className="text-gray-600">
                              {searchTerm ? `Nenhum resultado para "${searchTerm}"` : 'Não há usuários cadastrados'}
                            </p>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Controles de Paginação */}
        {!isLoading && !error && filteredUsers.length > 0 && (
          <div className="mt-6 flex items-center justify-between">
            {/* Informações da página */}
            <div className="text-sm text-gray-700">
              Mostrando {startIndex + 1} a {Math.min(endIndex, filteredUsers.length)} de {filteredUsers.length} usuário{filteredUsers.length !== 1 ? 's' : ''}
              {searchTerm && (
                <span className="ml-2 text-gray-500">
                  (filtrado por "{searchTerm}")
                </span>
              )}
            </div>

            {/* Controles de navegação */}
            {totalPages > 1 && (
              <div className="flex items-center gap-2">
                {/* Botão Anterior */}
                <button
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="flex items-center gap-1 px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-full hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                >
                  <ChevronLeft className="h-4 w-4" />
                  Anterior
                </button>

                {/* Números das páginas */}
                <div className="flex items-center gap-1">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => {
                    // Mostrar apenas algumas páginas para não sobrecarregar
                    if (
                      page === 1 ||
                      page === totalPages ||
                      (page >= currentPage - 1 && page <= currentPage + 1)
                    ) {
                      return (
                        <button
                          key={page}
                          onClick={() => setCurrentPage(page)}
                          className={`px-3 py-2 text-sm font-medium rounded-full transition-all duration-200 ${
                            page === currentPage
                              ? 'bg-blue-600 text-white'
                              : 'text-gray-500 bg-white border border-gray-300 hover:bg-gray-50'
                          }`}
                        >
                          {page}
                        </button>
                      );
                    } else if (
                      page === currentPage - 2 ||
                      page === currentPage + 2
                    ) {
                      return (
                        <span key={page} className="px-2 text-gray-400">
                          ...
                        </span>
                      );
                    }
                    return null;
                  })}
                </div>

                {/* Botão Próximo */}
                <button
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="flex items-center gap-1 px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-full hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                >
                  Próximo
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            )}
          </div>
        )}

        {/* Modal de edição */}
        {editModalOpen && editingUser && (
          <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50 p-4">
            <div className="bg-white rounded-xl shadow-lg border border-gray-200 max-w-md w-full">
              <div className="p-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Edit className="h-5 w-5 text-blue-600" />
                  </div>
                  <h2 className="text-xl font-semibold text-gray-900">Editar Usuário</h2>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Nome de usuário</label>
                    <input
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-400 focus:border-blue-400 text-gray-900 placeholder-gray-500 transition-all duration-200"
                      value={editUsername}
                      onChange={e => setEditUsername(e.target.value)}
                      disabled={saving}
                      placeholder="Digite o nome de usuário"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Nome completo</label>
                    <input
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-400 focus:border-blue-400 text-gray-900 placeholder-gray-500 transition-all duration-200"
                      value={editName}
                      onChange={e => setEditName(e.target.value)}
                      disabled={saving}
                      placeholder="Digite o nome completo"
                    />
                  </div>
                  
                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <input
                      type="checkbox"
                      checked={editActive}
                      onChange={e => setEditActive(e.target.checked)}
                      id="active-checkbox"
                      disabled={saving}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-400 border-gray-300 rounded"
                    />
                    <label htmlFor="active-checkbox" className="flex items-center gap-2 text-sm font-medium text-gray-700">
                      {editActive ? <CheckCircle className="h-4 w-4 text-green-600" /> : <XCircle className="h-4 w-4 text-red-600" />}
                      Usuário ativo
                    </label>
                  </div>
                  
                  {userPermissions.length > 0 && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Permissões atuais:</label>
                      <div className="flex flex-wrap gap-2">
                        {userPermissions.map(perm => (
                          <span key={perm} className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-800 rounded-md text-xs font-medium">
                            <Shield className="h-3 w-3" />
                            {perm}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <input
                      type="checkbox"
                      checked={editIsAdmin}
                      onChange={e => setEditIsAdmin(e.target.checked)}
                      id="edit-admin-checkbox"
                      disabled={saving || loadingPerms}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-400 border-gray-300 rounded"
                    />
                    <label htmlFor="edit-admin-checkbox" className="flex items-center gap-2 text-sm font-medium text-gray-700">
                      <Shield className="h-4 w-4 text-blue-600" />
                      Tornar Administrador
                    </label>
                  </div>
                </div>
              </div>
              
              <div className="flex justify-end gap-3 p-6 bg-gray-50 rounded-b-xl">
                <button
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-full text-sm font-medium hover:bg-gray-200 transition-all duration-200"
                  onClick={() => { setEditModalOpen(false); setEditingUser(null); }}
                  disabled={saving}
                >
                  Cancelar
                </button>
                <button
                  className="px-4 py-2 bg-blue-600 text-white rounded-full text-sm font-medium hover:bg-blue-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  onClick={handleSave}
                  disabled={saving || !editName.trim() || !editUsername.trim()}
                >
                  {saving ? 'Salvando...' : 'Salvar Alterações'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 