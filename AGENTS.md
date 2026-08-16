# Instruksi tambahan untuk agent (opencode)

Ini melengkapi `CLAUDE.md` (aturan arsitektur & konvensi kode project
konterapp-full) yang sudah otomatis dibaca opencode -- baca dan ikuti
`CLAUDE.md` juga, jangan cuma file ini.

File ini fokus ke **disiplin workflow** yang terbukti penting selama
pengembangan project ini (dipraktikkan konsisten oleh Claude Code
sepanjang sesi-sesi sebelumnya).

## Wajib verifikasi sebelum bilang "selesai"

Jangan laporkan task selesai hanya berdasarkan "kodenya kelihatan
benar". Selalu jalankan, dan laporkan hasilnya:

```bash
npx tsc --noEmit 2>&1 | grep -c "error TS"
```

Project ini punya beberapa error TypeScript pre-existing yang TIDAK
terkait pekerjaanmu (masalah typing Prisma `$extends`, dependency
`bwip-js` tanpa types, dll). Sebelum mulai kerja, catat jumlah error
saat ini sebagai baseline. Setelah selesai, jumlahnya harus **sama
atau lebih kecil**, tidak boleh lebih besar. Kalau lebih besar, cari
tahu file mana yang baru error (`npx tsc --noEmit 2>&1 | grep "error TS"`)
dan perbaiki sebelum melapor selesai.

Juga jalankan sebelum melapor selesai:

```bash
npx eslint <file-file yang diubah>
npx vitest run
```

## Migrasi database

- **Jangan buat file migrasi baru.** Kalau perlu ubah kolom/tabel,
  edit langsung file migration.sql yang sudah ada di
  `prisma/migrations/`, sesuai aturan di CLAUDE.md. Database dev
  boleh di-reset ulang (`prisma migrate reset --force`), bukan
  migrasi incremental.
- **Perhatikan urutan tabel di migration.sql.** Kalau menambah
  foreign key baru, pastikan tabel yang direferensikan sudah dibuat
  di migration file yang SAMA sebelumnya (atau di migration file
  sebelumnya secara kronologis) -- jangan taruh FK ke tabel yang baru
  dibuat belakangan di file yang sama.
- `prisma migrate reset --force` itu destruktif (hapus semua data
  lokal). Config `opencode.jsonc` di project ini sudah set permission
  `ask` untuk command ini -- kalau muncul prompt approval, itu
  memang disengaja, bukan bug.
- Setelah reset, jalankan ulang seeder dummy supaya ada data untuk
  testing:
  ```bash
  npm run seed:dummy prisma/seeders/dummy/berita.ts
  ```
  (file `berita.ts` dipilih sembarang -- `dummy/index.ts` menjalankan
  SEMUA seeder dummy terlepas dari file yang disebut di argumen).

## Restart dev server setelah ubah schema Prisma

Kalau `prisma/schema.prisma` berubah dan sudah `npx prisma generate`
+ migrate reset, dev server Next.js yang sedang jalan (`npm run dev`)
**wajib di-restart**. Next.js/Turbopack tetap pegang Prisma Client
versi lama di memori sampai proses-nya benar-benar dimatikan dan
dijalankan ulang -- ini penyebab paling umum error
`PrismaClientValidationError` / "Cannot read properties of undefined"
yang membingungkan padahal kodenya sudah benar.

```bash
# cari proses yang listen di port 3002
ss -tlnp | grep 3002
# matikan pakai PID yang didapat, lalu jalankan ulang
npm run dev
```

## Konvensi lain yang penting (ringkasan, detail di CLAUDE.md)

- Tabel tenant app (data operasional per-perusahaan) wajib prefix
  `app_` dan kolom `company_uuid`. Tabel administrator SaaS (users,
  roles, companies, dll) tidak pakai prefix ini.
- Seeder wajib set `uuid` eksplisit pakai `uuidv7()` dari package
  `uuid`, jangan andalkan default.
- Validasi form di API pakai zod + `validationError`, bukan validasi
  manual di client.
- Semua elemen UI yang bisa diklik wajib `cursor-pointer`.

## Kalau ragu

Task ambigu atau butuh keputusan yang belum jelas (arsitektur, UX,
data yang mau dihapus/diubah secara destruktif) -- tanya dulu ke
user, jangan menebak dan jalan terus.

## Laporan akhir

Setiap selesai task, laporkan ringkas: file apa yang berubah, hasil
verifikasi (tsc/eslint/test), dan langkah manual yang masih perlu
dilakukan user (kalau ada, misal "perlu restart dev server" atau
"perlu jalankan seeder ulang").
