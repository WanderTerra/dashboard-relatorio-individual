import React from 'react';
import { createRoot } from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'sonner';

import AppRouter from './AppRouter';
import './index.css';

const qc = new QueryClient();

createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryClientProvider client={qc}>
      <AppRouter />
      <Toaster position="top-right" richColors />
    </QueryClientProvider>
  </React.StrictMode>,
);
