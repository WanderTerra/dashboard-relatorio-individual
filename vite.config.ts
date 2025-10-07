import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default ({ mode }: { mode: string }) => {
  // carrega todas as variáveis VITE_… do .env
  const env = loadEnv(mode, process.cwd(), '');
  console.log('Configurando proxy para backend em: http://localhost:8000');

  return defineConfig({
    plugins: [react()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    optimizeDeps: {
      include: ['use-callback-ref'],
      exclude: [],
      force: true,
    },
    cacheDir: false,
    server: {
      host: true,
      port: 5174,
      proxy: {
        '/api': {
          target: 'http://localhost:8000',
          changeOrigin: true,
          secure: false,
          // Removido o rewrite para manter /api no path
        },
        // '/auth' removido - agora é coberto pelo proxy '/api'
        '/admin': {
          target: 'http://localhost:8000',
          changeOrigin: true,
          secure: false,
          // NÃO faça rewrite, pois o backend espera /admin mesmo!
        },
        '/carteiras-avaliacoes': {
          target: 'http://localhost:8000',
          changeOrigin: true,
          secure: false,
        },
      },
    },
    define: { 'process.env': {} },
  });
};