import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredPermission?: string;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, requiredPermission }) => {
  const { user, isLoading } = useAuth();
  const location = useLocation();

  // ✅ Mostrar loading enquanto verifica autenticação
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando...</p>
        </div>
      </div>
    );
  }

  // ✅ Só redirecionar para login se não estiver carregando E não tiver usuário
  if (!user) return <Navigate to="/login" />;

  // ✅ Verificar se usuário tem permissões - se não tem nenhuma, bloquear acesso
  if (!user.permissions || user.permissions.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center p-8 bg-white rounded-lg shadow-lg max-w-md">
          <div className="text-red-500 text-6xl mb-4">🚫</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Acesso Negado</h2>
          <p className="text-gray-600 mb-4">
            Você não possui permissões para acessar este sistema.
          </p>
          <p className="text-sm text-gray-500">
            Entre em contato com o administrador para solicitar acesso.
          </p>
        </div>
      </div>
    );
  }

  // Verificar se é um agente (tem permissão agent_{id} ou agent genérica)
  const agentPerm = user.permissions?.find((p: string) => p.startsWith('agent_'));
  const hasGenericAgent = user.permissions?.includes('agent');
  const agentId = agentPerm ? agentPerm.replace('agent_', '') : null;
  const isAgent = (agentId || hasGenericAgent) && !user.permissions?.includes('admin');

  // Se é agente e está tentando acessar o dashboard, redirecionar para sua página
  if (isAgent && location.pathname === '/') {
    // Se tem permissão específica, usar o ID da permissão
    if (agentId) {
      return <Navigate to={`/agent/${agentId}`} replace />;
    }
    // Se tem permissão genérica, extrair ID do username (só para agent.XXXX)
    if (hasGenericAgent && user.username.startsWith('agent.')) {
      const usernameAgentId = user.username.replace('agent.', '');
      return <Navigate to={`/agent/${usernameAgentId}`} replace />;
    }
    // Se tem permissão genérica mas não é agent.XXXX, mostrar página de acesso restrito
    if (hasGenericAgent && !user.username.startsWith('agent.')) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="text-center p-8 bg-white rounded-lg shadow-lg max-w-md">
            <div className="text-blue-500 text-6xl mb-4">👤</div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Acesso de Agente</h2>
            <p className="text-gray-600 mb-4">
              Você tem permissão de agente, mas não possui um ID específico.
            </p>
            <p className="text-sm text-gray-500">
              Entre em contato com o administrador para configurar seu acesso.
            </p>
          </div>
        </div>
      );
    }
  }

  // Se não é admin nem agente, mostrar mensagem de erro
  if (!user.permissions?.includes('admin') && !isAgent) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center max-w-md mx-auto p-8">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <div className="flex items-center justify-center w-12 h-12 mx-auto mb-4 bg-red-100 rounded-full">
              <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 19.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-red-800 mb-2">Acesso Restrito</h3>
            <p className="text-red-700 mb-4">
              Você não possui permissões para acessar este sistema. 
              Entre em contato com o administrador para obter acesso.
            </p>
            <div className="text-sm text-red-600">
              <p><strong>Usuário:</strong> {user.username}</p>
              <p><strong>Permissões:</strong> {user.permissions?.length ? user.permissions.join(', ') : 'Nenhuma'}</p>
            </div>
            <button 
              onClick={() => window.location.href = '/login'}
              className="mt-4 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
            >
              Fazer Logout
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Se é agente e está tentando acessar página de outro agente, redirecionar para sua própria página
  if (isAgent && location.pathname.startsWith('/agent/')) {
    const pathAgentId = location.pathname.split('/')[2];
    let userAgentId = null;
    
    if (agentId) {
      userAgentId = agentId;
    } else if (hasGenericAgent && user.username.startsWith('agent.')) {
      userAgentId = user.username.replace('agent.', '');
    }
    
    if (userAgentId && pathAgentId !== userAgentId) {
      return <Navigate to={`/agent/${userAgentId}`} replace />;
    }
  }

  // Verificar permissões específicas (para admin)
  if (requiredPermission && !user.permissions?.includes(requiredPermission)) {
    return <div className="p-8 text-red-600 font-bold">Acesso restrito a administradores.</div>;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
