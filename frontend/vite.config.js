import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// The backend runs on port 5000 (npm start). Requests to /api and /socket.io are proxied to it.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': 'https://skillswap-cign.onrender.com',
      '/socket.io': { target: 'https://skillswap-cign.onrender.com', ws: true }
    }
  }
});
