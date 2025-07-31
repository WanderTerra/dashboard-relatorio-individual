import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Sidebar } from './components/Sidebar';

import Dashboard   from './pages/Dashboard';
import AgentDetail from './pages/AgentDetail';
import CallItems from './pages/CallItems';
import Transcription from './pages/Transcription'
import Login from './pages/Login';
import ProtectedRoute from './components/ProtectedRoute';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import AgentsAdmin from './pages/AgentsAdmin';
import UsersAdmin from './pages/UsersAdmin';
import Carteiras from './pages/Carteiras';
import Criterios from './pages/Criterios';

const AppContent: React.FC = () => {
  const [collapsed, setCollapsed] = useState(false); // Mudado para false para aparecer expandido
  const { user } = useAuth();
  const location = useLocation();

  // Não mostrar sidebar se estiver na tela de login ou não houver usuário
  const shouldShowSidebar = user && location.pathname !== '/login';

  // Debug logs
  console.log('🔍 AppRouter Debug:', {
    user: user ? `Usuário: ${user.full_name} (${user.username})` : 'Sem usuário',
    pathname: location.pathname,
    shouldShowSidebar,
    collapsed,
    userPermissions: user?.permissions || 'Nenhuma permissão'
  });

  return (
    <div className="flex">
      {shouldShowSidebar && <Sidebar collapsed={collapsed} setCollapsed={setCollapsed} />}
      <main className={`flex-1 min-h-screen bg-gray-50 transition-all duration-300 ease-out ${
        shouldShowSidebar && collapsed ? 'ml-16' : shouldShowSidebar ? 'ml-64' : 'ml-0'
      }`}>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          } />
          <Route path="/agent/:agentId" element={
            <ProtectedRoute>
              <AgentDetail />
            </ProtectedRoute>
          } />
          <Route path="/call/:avaliacaoId/items" element={
            <ProtectedRoute>
              <CallItems />
            </ProtectedRoute>
          } />
          <Route path="/call/:avaliacaoId/transcription" element={
            <ProtectedRoute>
              <Transcription />
            </ProtectedRoute>
          } />
          <Route path="/agents" element={
            <ProtectedRoute requiredPermission="admin">
              <AgentsAdmin />
            </ProtectedRoute>
          } />
          <Route path="/users" element={
            <ProtectedRoute requiredPermission="admin">
              <UsersAdmin />
            </ProtectedRoute>
          } />
          <Route path="/carteiras" element={
            <ProtectedRoute requiredPermission="admin">
              <Carteiras />
            </ProtectedRoute>
          } />
          <Route path="/criterios" element={
            <ProtectedRoute requiredPermission="admin">
              <Criterios />
            </ProtectedRoute>
          } />
        </Routes>
      </main>
    </div>
  );
};

const AppRouter: React.FC = () => {
  return (
    <AuthProvider>
      <Router>
        <AppContent />
      </Router>
    </AuthProvider>
  );
};

export default AppRouter;
