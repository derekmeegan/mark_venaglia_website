import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';
import { VitePWA } from 'vite-plugin-pwa';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'masked-icon.svg'],
      manifest: {
        name: 'Mark Venaglia',
        short_name: 'Venaglia',
        description: 'Mark Venaglia - Artist & Cultural Curator',
        theme_color: '#f4b305',
        icons: [
          {
            src: 'logo.png',
            sizes: '192x192',
            type: 'image/png'
          }
        ]
      }
    })
  ],
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
  build: {
    sourcemap: false, 
    minify: 'terser', 
    terserOptions: {
      compress: {
        drop_console: true, 
        drop_debugger: true
      }
    },
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'supabase-vendor': ['@supabase/supabase-js'],
          'cal-vendor': ['@calcom/embed-react']
        }
      }
    }
  },
  server: {
    open: true,
    cors: true
  }
});
