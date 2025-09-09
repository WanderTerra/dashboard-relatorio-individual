import React from 'react';
import { createRoot } from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'sonner';

import AppRouter from './AppRouter';
import './index.css';
import { queryClientConfig } from './lib/performance';

// Configuração otimizada do QueryClient para performance
const qc = new QueryClient(queryClientConfig);

createRoot(document.getElementById('root')!).render(
  <QueryClientProvider client={qc}>
    <AppRouter />
    <Toaster position="top-right" richColors />
  </QueryClientProvider>,
);
