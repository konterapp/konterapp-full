// Config Prisma CLI KHUSUS untuk operasi terhadap DB integration test
// (konterapp_full_test). Dipakai lewat --config, TIDAK dipakai otomatis
// oleh perintah Prisma biasa (npx prisma migrate reset, dst tetap pakai
// .env / konterapp_full seperti biasa).
//
// Prisma CLI secara default auto-load `.env` di root project dan itu
// mengalahkan env var apa pun yang sudah di-set lewat shell (`VAR=val npx
// prisma ...` diabaikan). Supaya operasi terhadap DB test tidak pernah
// salah nyasar ke DB dev, file config ini eksplisit load `.env.test`
// dengan override SEBELUM Prisma sempat auto-load `.env`.
import { config as loadEnv } from "dotenv";

loadEnv({ path: ".env.test", override: true });

import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
});
