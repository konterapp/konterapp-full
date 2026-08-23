import { defineConfig } from 'vitest/config';
import { fileURLToPath, URL } from 'node:url';

// Config terpisah dari vitest.config.ts (unit test, prisma di-mock).
// Suite ini pakai Postgres beneran (DB konterapp_full_test, lihat
// .env.test / .env.test.example) -- jalankan lewat `npm run test:integration`.
// Setup DB pertama kali / setelah schema berubah: `npm run test:integration:db:push`.
export default defineConfig({
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./', import.meta.url)),
    },
  },
  test: {
    environment: 'node',
    include: ['**/*.integration.test.ts'],
    exclude: ['node_modules', '.next', 'dist'],
    setupFiles: ['./vitest.integration.setup.ts'],
    // Query real Postgres bisa lebih lambat dari unit test yang di-mock;
    // jalankan file test integration satu-satu (bukan paralel) supaya
    // tidak rebutan/interferensi data kalau nanti ada lebih dari 1 file.
    fileParallelism: false,
  },
});
