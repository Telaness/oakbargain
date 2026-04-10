import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./tests/setup.ts'],
    css: false,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname),
    },
  },
  // @ts-expect-error vitest 4 oxc jsx config
  oxc: {
    jsx: 'automatic',
  },
});
