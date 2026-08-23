import { defineConfig } from 'vitest/config';
import { fileURLToPath, URL } from 'node:url';

export default defineConfig({
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./', import.meta.url)),
    },
  },
  test: {
    environment: 'node',
    include: ['**/*.test.ts'],
    // *.integration.test.ts punya config & setup terpisah (vitest.integration.config.ts)
    // -- pakai DB Postgres beneran, bukan mock prisma seperti unit test biasa.
    exclude: ['node_modules', '.next', 'dist', '**/*.integration.test.ts'],
    setupFiles: ['./vitest.setup.ts'],
  },
});
