import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  base: './', // Electron / Capacitor 用に相対パスにする
  server: {
    port: 5173,
    host: '0.0.0.0' // スマホの実機からもIP指定でアクセス可能に
  }
});
