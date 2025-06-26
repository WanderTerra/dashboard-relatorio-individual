import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

import Dashboard   from './pages/Dashboard';
import AgentDetail from './pages/AgentDetail';
import CallItems from './pages/CallItems';
import Transcription from './pages/Transcription'
import Login from './pages/Login';
import ProtectedRoute from './components/ProtectedRoute';
import { AuthProvider } from './contexts/AuthContext';

const AppRouter: React.FC = () => (
  <AuthProvider>
    <Router>
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
      </Routes>
    </Router>
  </AuthProvider>
);

export default AppRouter;
