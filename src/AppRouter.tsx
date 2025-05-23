import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

import Dashboard   from './pages/Dashboard';
import AgentDetail from './pages/AgentDetail';
import CallItems from './pages/CallItems';
import Transcription from './pages/Transcription'

const AppRouter: React.FC = () => (
  <Router>
    <Routes>
      <Route path="/" element={<Dashboard />} />
      <Route path="/agent/:agentId" element={<AgentDetail />} />
      <Route path="/call/:avaliacaoId/items" element={<CallItems />} />
      <Route path="/call/:avaliacaoId/transcription" element={<Transcription />} />
    </Routes>
  </Router>
);

export default AppRouter;
