import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default ({ mode }: { mode: string }) => {
  // carrega todas as variáveis VITE_… do .env
  const env = loadEnv(mode, process.cwd(), '');
  
  // Configuração do backend remoto - AJUSTE O IP AQUI
  const BACKEND_URL = 'http://10.100.20.188:8000'; // ✅ IP da máquina do backend
  
  console.log(`Configurando proxy para backend em: ${BACKEND_URL}`);
  
  return defineConfig({
    plugins: [react()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    server: {
      host: true,
      port: 5175,
      proxy: {
        '/api': {
          target: BACKEND_URL,
          changeOrigin: true,
          secure: false,
          rewrite: path => path.replace(/^\/api/, ''),
        },
        '/admin': {
          target: BACKEND_URL,
          changeOrigin: true,
          secure: false,
          // NÃO faça rewrite, pois o backend espera /admin mesmo!
        },
        '/auth': {
          target: BACKEND_URL,
          changeOrigin: true,
          secure: false,
        },
      },
    },
    define: { 'process.env': {} },
  });
};
