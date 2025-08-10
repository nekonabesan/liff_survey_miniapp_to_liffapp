/// <reference types="vitest" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
  },
  server: {
    port: 3000,
    host: '0.0.0.0', // Docker対応
    open: false, // Dockerでは自動ブラウザ起動を無効
    watch: {
      usePolling: true, // Docker環境でのファイル監視
    },
    hmr: {
      port: 24678, // HMRポート
    },
  },
})
