// vite.config.override.ts
import { defineConfig } from 'vite';

export default defineConfig({
  optimizeDeps: {
    force: true,
    include: [
      'react',
      'react-dom',
      'react-dom/client',
      '@tanstack/react-query',
      'sonner',
      'lucide-react',
      'use-callback-ref'
    ]
  },
  server: {
    fs: {
      strict: false
    }
  }
});




