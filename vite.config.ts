import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default ({ mode }: { mode: string }) => {
  // carrega todas as variáveis VITE_… do .env
  const env = loadEnv(mode, process.cwd(), '');
  console.log('Configurando proxy para backend em: http://10.100.20.242:8080');
  
  return defineConfig({
    plugins: [react()],
    server: {
      host: true, // Habilita acesso de outros dispositivos na rede
      proxy: {
        // intercepta /api/kpis, /api/agent, etc e encaminha para o BACKEND
        '/api': {
          target: 'http://10.100.20.242:8080',
          changeOrigin: true,
          secure: false,
          // remove o prefixo /api antes de enviar pro FastAPI
          rewrite: path => path.replace(/^\/api/, ''),
        },
      },
    },
    define: { 'process.env': {} },
  });
};
