import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
const seoHeadersPlugin = () => {
  return {
    name: 'seo-headers',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        res.setHeader('X-Robots-Tag', 'index, follow');
        next();
      });
    },
    configurePreviewServer(server) {
      server.middlewares.use((req, res, next) => {
        res.setHeader('X-Robots-Tag', 'index, follow');
        next();
      });
    }
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss(), seoHeadersPlugin()],
  server: {
    fs: {
      // Allow importing the repo-root ../shared modules (e.g. shared/linkSemantics.js)
      // that are shared between the Frontend and Backend.
      allow: ['..'],
    },
  },
})

