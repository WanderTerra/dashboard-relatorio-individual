import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredPermission?: string;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, requiredPermission }) => {
  const { user } = useAuth();
  const location = useLocation();

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
