import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig(({ mode }) => ({
  publicDir: mode.startsWith('android') ? false : 'public',
  plugins: [react(), tailwindcss()],
  // cap sync copies the built site into the native projects; watching those
  // copies only triggers needless full reloads during development.
  server: { watch: { ignored: ['**/android/**', '**/ios/**', '**/dist-android/**'] } },
  build: {
    minify: 'esbuild',
    cssCodeSplit: true,
  },
}))
