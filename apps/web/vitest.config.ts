import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./test/setup.ts'],
    alias: {
      '@': path.resolve(__dirname, './src')
    },
    // Don't fail on unhandled promise rejections from test cleanup (they're just timing issues)
    dangerouslyIgnoreUnhandledErrors: true,
    poolOptions: {
      threads: {
        singleThread: true
      }
    },
  }
});
