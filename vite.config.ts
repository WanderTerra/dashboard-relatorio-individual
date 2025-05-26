// vite.config.ts
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default ({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');  return defineConfig({
    plugins: [react()],
    define: { 'process.env': {} },
    server: {
      cors: true,
      proxy: {
        '/api': {
          target: 'http://10.100.20.242:8000',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api/, '')
        }
      }
    }
  });
};
