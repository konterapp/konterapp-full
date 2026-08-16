- kalau mau tambah kolom, update langsung pada migrasi yang ada jangan buat add_migration, saya bisa migrate:fresh
- setiap buat fitur, sediakan data dummy /Users/didikabdulmukmin/projects/www/konterapp/konterapp-be/database/seeders/Dummy/DummyDataSeeder.php
- validasi form harus di API (pakai zod + validationError), client hanya menampilkan message/errors dari API (jangan bikin validasi manual di client)
- semua seeder WAJIB set `uuid` secara eksplisit pakai `uuidv7()` (jangan default `cuid`)
- semua elemen UI yang bisa di-click (button, icon action, select, checkbox, clickable row/card) WAJIB pakai `cursor-pointer` agar konsisten UX.
- tabel untuk tenant app (data operasional per-perusahaan, misal domain POS: products, sales, purchases, branches, dst) WAJIB pakai prefix `app_` (tabel fisik & model Prisma, contoh `AppPosProduct` -> `@@map("app_pos_products")`), dan WAJIB punya kolom `company_uuid` untuk scoping tenant. Tabel administrator SaaS (users, roles, permissions, administrators, companies, company_users, berita) TIDAK pakai prefix ini karena bukan data operasional tenant. Kolom `company_uuid` jangan diganti jadi `tenant_id` -- sudah konsep yang sama, tidak perlu nama baru.

## Architecture Rules (Backend Next.js)
- Gunakan pola modular: `route.ts -> service -> (repository jika perlu)`.
- `route.ts` harus tipis: auth/permission, parse request, panggil service, return response.
- Business logic wajib di `service` (bukan di route).
- `repository` dipakai hanya jika query Prisma kompleks atau reusable lintas service (hindari repository berlebihan untuk query sederhana).
- Validasi input tetap di API pakai schema domain (zod + `validationError`), jangan dipindah ke client.
- Refactor dilakukan bertahap per domain (mulai dari `users` sebagai template), hindari big-bang rewrite.

## Architecture Notes (Tambahan)
- Struktur modul domain untuk sekarang pakai: `lib/modules/<domain>/repository.ts`, `admin.service.ts`, dan `*.mapper.ts` (tanpa `shared/` dulu biar simpel).
- Jika nanti ada endpoint publik, pisahkan service per konteks: `admin.service.ts` vs `public.service.ts`, repository tetap bisa dipakai bersama.
- Mapping response API wajib lewat `mapper` (jangan inline mapping panjang di service/route).
- Error flow backend wajib terpusat:
  - lempar `ApiError` / `ValidationApiError` di service,
  - tangani di wrapper `withApiErrorHandling` pada route,
  - hindari `try/catch` berulang di setiap route kecuali ada kebutuhan khusus.
- Upload file wajib lewat helper `lib/utils/file-upload.ts` (save/remove/build url), jangan duplikasi logic upload di service lain.
- Konsistensi layer:
  - `route`: transport layer only,
  - `service`: business rule + orkestrasi,
  - `repository`: akses data (Prisma),
  - `mapper`: kontrak output API.
- API response/request gunakan `snake_case` (best practice untuk API publik/lintas bahasa), mapping ke `camelCase` dilakukan di boundary (route <-> service).
