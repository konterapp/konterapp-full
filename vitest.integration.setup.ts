import { config as loadEnv } from 'dotenv';

// Override, bukan cuma load kalau belum ada -- supaya DATABASE_URL dari
// .env.test SELALU menang di suite integration test ini, tidak peduli
// apa yang sudah ke-load duluan dari .env.
loadEnv({ path: '.env.test', override: true });

if (!process.env.DATABASE_URL?.includes('_test')) {
  throw new Error(
    'DATABASE_URL untuk integration test harus mengarah ke DB bernama "*_test" ' +
    '(cek file .env.test). Ini pengaman supaya integration test tidak pernah ' +
    'nyasar TRUNCATE/DROP data di DB dev/production.'
  );
}
