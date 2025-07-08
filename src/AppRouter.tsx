import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Sidebar } from './components/Sidebar';

import Dashboard   from './pages/Dashboard';
import AgentDetail from './pages/AgentDetail';
import CallItems from './pages/CallItems';
import Transcription from './pages/Transcription'
import Login from './pages/Login';
import ProtectedRoute from './components/ProtectedRoute';
import { AuthProvider } from './contexts/AuthContext';
import AgentsAdmin from './pages/AgentsAdmin';

const AppRouter: React.FC = () => {
  const [collapsed, setCollapsed] = useState(true);

  return (
    <AuthProvider>
      <Router>
        <div className="flex">
          <Sidebar collapsed={collapsed} setCollapsed={setCollapsed} />
          <main className={`flex-1 ml-0 bg-gray-50 min-h-screen lg:transition-all lg:duration-200 ${collapsed ? 'lg:ml-16' : 'lg:ml-64'}`}>
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
            </Routes>
          </main>
        </div>
      </Router>
    </AuthProvider>
  );
};

export default AppRouter;
