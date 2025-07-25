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
    server: {
      host: true,
      proxy: {
        '/api': {
          target: 'http://localhost:8000',
          changeOrigin: true,
          secure: false,
          rewrite: path => path.replace(/^\/api/, ''),
        },
        '/admin': {
          target: 'http://localhost:8000',
          changeOrigin: true,
          secure: false,
          // NÃO faça rewrite, pois o backend espera /admin mesmo!
        },
      },
    },
    define: { 'process.env': {} },
  });
};
