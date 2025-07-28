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
  const [collapsed, setCollapsed] = useState(true);
  const { user } = useAuth();
  const location = useLocation();

  // Se estiver na tela de login ou não houver usuário, não mostrar sidebar
  const shouldShowSidebar = user && location.pathname !== '/login';

  return (
    <div className="flex">
      {shouldShowSidebar && <Sidebar collapsed={collapsed} setCollapsed={setCollapsed} />}
      <main className={`flex-1 ml-0 bg-gray-50 min-h-screen lg:transition-all lg:duration-200 ${shouldShowSidebar ? (collapsed ? 'lg:ml-16' : 'lg:ml-64') : ''}`}>
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
