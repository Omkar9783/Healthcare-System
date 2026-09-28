import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // Load .env for the current mode (development / production)
  const env = loadEnv(mode, process.cwd(), '');

  const API_PORT    = env.VITE_API_PORT    || '5001';
  const API_BASE    = env.VITE_API_BASE_URL || `http://localhost:${API_PORT}`;

  return {
    plugins: [react(), tailwindcss()],
    server: {
      port: 5173,
      proxy: {
        // All /api/* requests are forwarded to the backend
        '/api': {
          target: API_BASE,
          changeOrigin: true,
          secure: false,
          rewrite: (path) => path, // keep /api prefix as-is
        },
      },
    },
    // Expose env vars to the app
    define: {
      __APP_VERSION__: JSON.stringify(env.VITE_APP_VERSION || '1.0.0'),
    },
  };
});
