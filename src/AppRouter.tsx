import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Sidebar } from './components/Sidebar';
import { useAuth } from './contexts/AuthContext';

import Dashboard   from './pages/Dashboard';
import AgentDetail from './pages/AgentDetail';
import CallItems from './pages/CallItems';
import Transcription from './pages/Transcription'
import Login from './pages/Login';
import ProtectedRoute from './components/ProtectedRoute';
import { AuthProvider } from './contexts/AuthContext';
import Agents from './pages/Agents';
import UsersAdmin from './pages/UsersAdmin';
import Carteiras from './pages/Carteiras';
import Criterios from './pages/Criterios';
import AudioUpload from './pages/AudioUpload';
import CarteiraCriterios from './pages/CarteiraCriterios';
import Correcoes from './pages/Correcoes';
import Downloads from './pages/Downloads';
import Feedback from './pages/Feedback';
import SeuGuruPage from './pages/SeuGuru';
import KnowledgeBase from './pages/KnowledgeBase';
import TestPage from './pages/TestPage';
import RelatorioProdutividade from './pages/RelatorioProdutividade';
import RelatorioNotas from './pages/RelatorioNotas';
import RelatorioAcordos from './pages/RelatorioAcordos';
import DashboardCarteiras from './pages/DashboardCarteiras';

const AppContent: React.FC = () => {
  const [collapsed, setCollapsed] = useState(true);
  const location = useLocation();
  const isLoginPage = location.pathname === '/login';
  const { isLoading } = useAuth();

  if (isLoginPage) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Routes>
          <Route path="/login" element={<Login />} />
        </Routes>
      </div>
    );
  }

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

  return (
    <div className="flex">
      <Sidebar collapsed={collapsed} setCollapsed={setCollapsed} />
      <main className={`flex-1 ml-0 bg-gray-50 min-h-screen lg:transition-all lg:duration-200 ${collapsed ? 'lg:ml-16' : 'lg:ml-64'} overflow-x-hidden`}>
        <Routes>
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
              <Agents />
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
          <Route path="/upload" element={
            <ProtectedRoute>
              <AudioUpload />
            </ProtectedRoute>
          } />
          <Route path="/carteira-criterios" element={
            <ProtectedRoute requiredPermission="admin">
              <CarteiraCriterios />
            </ProtectedRoute>
          } />
          <Route path="/correcoes" element={
            <ProtectedRoute requiredPermission="admin">
              <Correcoes />
            </ProtectedRoute>
          } />
          <Route path="/downloads" element={
            <ProtectedRoute requiredPermission="admin">
              <Downloads />
            </ProtectedRoute>
          } />
          <Route path="/feedback" element={
            <ProtectedRoute>
              <Feedback />
            </ProtectedRoute>
          } />
          <Route path="/seu-guru" element={
            <ProtectedRoute>
              <SeuGuruPage />
            </ProtectedRoute>
          } />
          <Route path="/knowledge-base" element={
            <ProtectedRoute requiredPermission="admin">
              <KnowledgeBase />
            </ProtectedRoute>
          } />
          <Route path="/relatorios/produtividade" element={
            <ProtectedRoute requiredPermission="admin">
              <RelatorioProdutividade />
            </ProtectedRoute>
          } />
          <Route path="/relatorios/notas" element={
            <ProtectedRoute requiredPermission="admin">
              <RelatorioNotas />
            </ProtectedRoute>
          } />
            <Route path="/relatorios/acordos" element={
              <ProtectedRoute requiredPermission="admin">
                <RelatorioAcordos />
              </ProtectedRoute>
            } />
            <Route path="/dashboard-carteiras" element={
              <ProtectedRoute requiredPermission="admin">
                <DashboardCarteiras />
              </ProtectedRoute>
            } />
          <Route path="/test" element={<TestPage />} />
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
