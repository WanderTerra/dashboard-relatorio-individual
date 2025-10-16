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

  // Verificar se é um agente (tem permissão agent_{id})
  const agentPerm = user.permissions?.find((p: string) => p.startsWith('agent_'));
  const agentId = agentPerm ? agentPerm.replace('agent_', '') : null;
  const isAgent = agentId && !user.permissions?.includes('admin');

  // Se é agente e está tentando acessar o dashboard, redirecionar para sua página
  if (isAgent && location.pathname === '/') {
    return <Navigate to={`/agent/${agentId}`} replace />;
  }

  // Se é agente e está tentando acessar página de outro agente, redirecionar para sua própria página
  if (isAgent && location.pathname.startsWith('/agent/')) {
    const pathAgentId = location.pathname.split('/')[2];
    if (pathAgentId !== agentId) {
      return <Navigate to={`/agent/${agentId}`} replace />;
    }
  }

  // Verificar permissões específicas (para admin)
  if (requiredPermission && !user.permissions?.includes(requiredPermission)) {
    return <div className="p-8 text-red-600 font-bold">Acesso restrito a administradores.</div>;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
