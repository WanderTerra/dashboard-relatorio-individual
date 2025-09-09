import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default ({ mode }: { mode: string }) => {
  // carrega todas as variáveis VITE_… do .env
  const env = loadEnv(mode, process.cwd(), '');
  console.log('Configurando proxy para backend em: http://localhost:8001');
  
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
    },
    server: {
      host: true,
      port: 5174,
      proxy: {
        '/api': {
          target: 'http://localhost:8001',
          changeOrigin: true,
          secure: false,
          // rewrite: path => path.replace(/^\/api/, ''),
        },
        '/auth': {
          target: 'http://localhost:8001',
          changeOrigin: true,
          secure: false,
          rewrite: path => path.replace(/^\/auth/, '/auth'),
        },
        '/admin': {
          target: 'http://localhost:8001',
          changeOrigin: true,
          secure: false,
          // NÃO faça rewrite, pois o backend espera /admin mesmo!
        },
        '/carteiras-avaliacoes': {
          target: 'http://localhost:8001',
          changeOrigin: true,
          secure: false,
        },
      },
    },
    define: { 'process.env': {} },
  });
};
