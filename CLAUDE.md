- kalau mau tambah kolom, update langsung pada migrasi yang ada jangan buat add_migration, saya bisa migrate:fresh
- setiap buat fitur, sediakan data dummy /Users/didikabdulmukmin/projects/www/konterapp/konterapp-be/database/seeders/Dummy/DummyDataSeeder.php
- validasi form harus di API (pakai zod + validationError), client hanya menampilkan message/errors dari API (jangan bikin validasi manual di client)
- semua seeder WAJIB set `uuid` secara eksplisit pakai `uuidv7()` (jangan default `cuid`)
- semua elemen UI yang bisa di-click (button, icon action, select, checkbox, clickable row/card) WAJIB pakai `cursor-pointer` agar konsisten UX.
- tabel untuk tenant app (data operasional per-perusahaan, misal domain POS: products, sales, purchases, branches, dst) WAJIB pakai prefix `app_` (tabel fisik & model Prisma, contoh `AppPosProduct` -> `@@map("app_pos_products")`), dan WAJIB punya kolom `company_uuid` untuk scoping tenant. Tabel administrator SaaS (users, roles, permissions, administrators, companies, company_users) TIDAK pakai prefix ini karena bukan data operasional tenant. Kolom `company_uuid` jangan diganti jadi `tenant_id` -- sudah konsep yang sama, tidak perlu nama baru.
- rule `company_uuid` di atas berlaku TANPA KECUALI, termasuk tabel anak/line-item yang sekilas kelihatan "cukup di-scope lewat parent" (contoh: `app_pos_sale_items`, `app_pos_purchase_items`, `app_pos_product_barcodes`, `app_pos_product_images`, `app_pos_product_unit_conversions`, `app_pos_product_branch_prices`). Alasannya: (1) rencana ke depan ada fitur offline/online sync dan kemungkinan scale ke 1 DB per tenant, jadi tiap baris perlu "self-describing" company_uuid-nya sendiri tanpa perlu join ke parent buat tahu itu punya siapa; (2) begitu tabel baru dibuat dengan `company_uuid`, WAJIB didaftarkan juga ke `TENANT_MODELS` di `lib/tenant-context.ts` -- kolom doang tidak cukup, kalau lupa didaftarkan di situ maka Prisma extension di `lib/prisma.ts` tidak akan auto-filter/auto-isi tenant-nya, padahal query tetap jalan tanpa error (bocor data lintas tenant secara diam-diam, baru ketahuan pas user lapor "kok datanya banyak"). Ini pernah kejadian nyata di tabel `app_pos_product_stocks` yang kelewat saat migrasi multi-tenant dulu.
- kalau satu fungsi service melakukan LEBIH DARI SATU write ke database (create/update/delete/upsert -- baik lewat repository maupun langsung `tx`/`prisma`) dan write-write itu saling terkait (row parent+child, atau dua row yang harus konsisten satu sama lain), WAJIB dibungkus satu transaction, jangan biarkan tiap write jalan sendiri-sendiri. Kalau write ke-2 gagal setelah write ke-1 sukses, write ke-1 nyangkut jadi data yatim/sampah dan retry sering gagal lagi (mis. kena unique constraint) -- sudah pernah kejadian nyata (lihat `lib/modules/auth/provisioning.ts`, `lib/modules/billing/webhook.service.ts`, `lib/modules/pos/products/admin.service.ts`, `lib/modules/roles/admin.service.ts` untuk contoh pola yang benar). Pola standarnya: repository punya `runInTransaction(cb)` yang manggil `prisma.$transaction(cb)`, method-method write di repository nerima `tx` (bukan `prisma`) sebagai parameter pertama, service manggil semuanya di dalam satu `repository.runInTransaction(async (tx) => {...})`. JANGAN dibungkus otomatis per-route/global (banyak route itu read-only atau manggil API eksternal di tengah proses seperti Midtrans/Digiflazz -- transaction global bikin koneksi DB nganggur lama nunggu API eksternal, resiko connection pool habis). Sebelum commit yang nambah/ubah service, jalankan `npm run check:transactions` -- heuristik pengecek (bukan gate/CI, cuma checklist) yang nemuin kandidat fungsi dengan >1 write tanpa transaction.
- setiap bikin commit, sesuaikan juga field `version` di `package.json` (semver: patch untuk fix kecil, minor untuk fitur baru, major untuk perubahan besar/breaking). Versi ini TIDAK auto-update -- dipakai sebagai sumber angka versi yang ditampilkan di UI (sidebar app, lewat `NEXT_PUBLIC_APP_VERSION` di `next.config.ts`), jadi kalau lupa di-bump, tampilan versi di app jadi basi.

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
