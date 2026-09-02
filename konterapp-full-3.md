# Konteks Sesi: konterapp-full-3

Catatan serah-terima (handoff) dari sesi Claude Code bernama **konterapp-full-3**.
Tujuannya supaya konteks tidak hilang saat pindah sesi atau pindah mesin.

> Ada sesi paralel lain di repo yang sama: **konterapp-full-1** dan **konterapp-full-2**.
> Lihat file `konterapp-full-1.md` di root project untuk catatan mereka (kalau masih ada).
> Aturan dasarnya: JANGAN commit file yang bukan hasil kerja sesi ini — cek `git diff`
> per file dulu sebelum `git add`, karena working tree bisa berisi campuran perubahan
> beberapa sesi sekaligus (lihat bagian 5).

Terakhir diperbarui: 2026-09-03. Versi app saat ini: `0.20.0` (versi ini dibump oleh
sesi lain setelah commit terakhir sesi ini — commit terakhir sesi ini sendiri ada di
versi `0.8.2`, lihat tabel di bagian 2).

---

## 1. Ringkasan: apa yang dikerjakan sesi ini

Lima perbaikan/fitur, semua sudah selesai & ter-commit, plus satu riset fitur yang
**belum diimplementasikan** (baru tahap investigasi, lihat bagian 4):

1. Hapus fitur "berita" (news) — tidak dipakai lagi, dihapus total dari semua layer.
2. Hapus data default "Walk In Customer" — transaksi POS tanpa pelanggan sekarang
   cukup simpan `customer_uuid = null`.
3. Fix bug "Email sudah terdaftar" saat admin tenant menambah user dengan email yang
   sudah jadi user di company lain — sekaligus menambahkan alur invitation (undangan
   email) untuk penambahan user ke company.
4. Fix bug akses: role Kasir (dan role lain tanpa izin) bisa melihat & memanggil API
   menu Langganan/Billing.
5. Fix bug: akun yang sudah dihapus tapi cookie sesinya masih ada bikin shell
   "Guest User" nyangkut di `/app`; sekalian fix efek samping fix ini yang sempat
   mengganggu landing page.

---

## 2. Yang sudah selesai & di-commit

| Commit | Isi |
|---|---|
| `38fd9c5` | Hapus fitur berita: model, migrasi, API, halaman admin, service, seeder, permission, route mapping, label role, i18n — dihapus total lintas semua layer |
| `2e63e48` | Hapus default walk-in customer: provisioning company baru tidak lagi auto-create customer "Walk In Customer"; guard update/hapus customer default dicabut; kolom `is_default` dihapus dari `app_pos_customers` |
| `a3538bb` | Fix "email sudah terdaftar": kalau email sudah ada sebagai user di company lain & belum jadi member company ini → digabungkan (bukan bikin User baru). Sekaligus fitur invitation: `CompanyUser.invitation_accepted_at` (nullable, pola sama seperti `email_verified_at`), tabel baru `company_invitation_tokens`, halaman `/accept-invitation` + API-nya |
| `d146403` | Fix menu "Langganan" & 5 API billing (status/coupon/checkout/plans/cancel-invoice) tidak punya permission gate sama sekali → Kasir bisa akses. Tambah permission `billing.index` + helper `withPermissionNoSubscriptionGate` (khusus dipakai di sini, BUKAN `withPermission` biasa — lihat bagian 3) |
| `bfd0604` | Fix akun terhapus (soft-delete) tapi cookie sesi JWT masih valid → `/api/auth/user` sekarang balas 401 (bukan 404) + hapus cookie; redirect ke `/login` dipindah ke `UserContext.tsx` (bukan interceptor global) supaya tidak ikut memicu redirect di halaman publik; `Header.tsx` landing/register/login dihapus total pengecekan status login-nya (selalu tampil "Masuk/Daftar", tidak perlu tahu status login) |

Menu "Referral" **sengaja TIDAK** ikut dibatasi permission (beda dengan Langganan) —
sudah dikonfirmasi ke user bahwa itu memang program personal per-user (siapa pun boleh
referral orang lain & dapat komisi sendiri sendiri), bukan bug.

---

## 3. Detail teknis penting (jangan disalahpahami ulang)

### Kenapa `withPermissionNoSubscriptionGate`, bukan `withPermission`
`withPermission` (di `lib/api-middleware.ts`) mensyaratkan subscription company aktif
SEBELUM cek permission. Route billing (`/api/app/billing/*`) justru dipakai company
untuk **memulihkan** subscription yang sedang lapse/expired — kalau dipasangi
`withPermission` biasa, company yang subscription-nya mati malah terkunci total dari
halaman billing-nya sendiri. Makanya dibuat helper terpisah
`withPermissionNoSubscriptionGate(permission, handler)` yang cek permission TANPA
gate subscription. Jangan "disederhanakan" balik ke `withPermission` biasa.

### Kenapa redirect-ke-login dipindah ke `UserContext.tsx`, bukan di interceptor global
`/api/auth/user` dipanggil dari DUA konteks berbeda:
- Publik (`components/Header.tsx` — landing/login/register, cuma buat tahu status
  login untuk pilih tombol CTA).
- Terproteksi (`app/[locale]/app/_context/UserContext.tsx`, cuma di-mount di dalam
  `/app`).

Redirect otomatis-ke-login saat 401 di `lib/api/api.ts` (interceptor axios global)
TIDAK BISA membedakan dua konteks ini cuma dari URL endpoint-nya (endpoint-nya sama
persis: `/api/auth/user`). Solusinya: `/api/auth/user` dikecualikan dari redirect
otomatis interceptor, dan `UserContext.tsx` menangani redirect-nya sendiri secara
eksplisit (karena provider ini cuma pernah di-mount di area terproteksi, gagal fetch
di situ SELALU berarti sesi invalid). Kalau nanti mau menyentuh alur ini lagi, jangan
kembalikan redirect ke interceptor global — itu balik lagi ke bug lama (landing page
ikut ke-redirect untuk visitor anonim).

### Model invitation (fitur poin 3)
- `CompanyUser.invitationAcceptedAt` — `null` = undangan belum diterima (tidak
  muncul di company switcher / tidak bisa jadi company aktif saat login, lihat
  `lib/company-access.ts`), timestamp = sudah diterima.
- Self-signup (buat company sendiri, baik lewat register maupun "buat company baru"
  saat sudah login) auto-accepted (`invitationAcceptedAt: new Date()` langsung) —
  BUKAN kasus "diundang orang lain", jadi tidak lewat alur token email.
- User yang dibuat oleh administrator platform (`/api/administrator/users`, beda
  dari `/app/users`) juga auto-accepted — dibuat langsung oleh superadmin, bukan
  alur undangan tenant.
- Klik link terima undangan sekalian mengisi `emailVerifiedAt` kalau masih kosong
  (satu klik cukup untuk akun baru, tidak perlu dua email terpisah).

---

## 4. Riset yang BELUM diimplementasikan (baru investigasi)

User minta: di `/app/pos/shifts`, tambah aksi "lihat detail saldo" per shift (riwayat
mutasi saldo yang terjadi selama shift itu). Sudah dilakukan riset lewat subagent
(hasil lengkap ada di riwayat percakapan sesi ini), kesimpulan pentingnya:

- `AppPosCashierShift` **tidak** punya FK langsung ke `AppPosSaldoMutation` — harus
  direkonstruksi lewat kombinasi `branchUuid` shift + rentang waktu
  (`openedAt` s.d. `closedAt ?? now()`), join ke `AppPosSaldoAccountBalanceBranch`
  untuk tahu grup saldo mana yang terhubung ke cabang itu.
- Pattern read (`posSaldoRepository.findMutations`/`countMutations` +
  `mapSaldoMutation`) sudah reusable, tinggal beda `where`-nya.
- UI detail terbaik mengikuti pola `app/[locale]/app/pos/saldo/[uuid]/page.tsx`
  (tabel histori manual, bukan `DataTable`, plus `REFERENCE_LABELS` map).
- Permission: pakai `pos.sale.create` yang sudah ada (shift memang belum punya
  permission `pos.shift.*` sendiri), JANGAN bikin permission baru untuk ini kecuali
  diminta eksplisit — akan menambah scope migrasi role yang tidak perlu.

**Belum ada satu baris kode pun ditulis untuk fitur ini.** Percakapan dialihkan user
ke diskusi lain (build APK/Capacitor, opsi AI gratis buat auto-catat transaksi dari
struk) sebelum implementasi dimulai. Item checklist terkait: cek `checklist.txt`
bagian konterapp-full-2 — "menu Shift Kasir detail saldo" kemungkinan sudah/sedang
dikerjakan sesi lain, KONFIRMASI DULU ke user sebelum mulai supaya tidak dobel kerja
dengan sesi paralel.

---

## 5. Koordinasi dengan sesi lain & teknik staging git

Repo ini dikerjakan **beberapa sesi Claude Code paralel** sekaligus (konterapp-full-1,
-2, -3, kadang juga sesi `opencode`). Berkali-kali ditemukan working tree berisi
campuran perubahan sesi lain di file yang sama yang perlu disentuh sesi ini
(`prisma/schema.prisma`, `lib/modules/auth/provisioning.ts`, `checklist.txt`,
`package.json` paling sering).

**Teknik surgical staging yang dipakai berulang kali (kalau ketemu situasi sama):**
1. `git show HEAD:<file>` untuk ambil baseline bersih terakhir ter-commit.
2. Terapkan HANYA perubahan milik sesi ini di atas baseline itu (assert dulu isi yang
   diharapkan ada sebelum diganti — pakai script Python/sed kecil, bukan edit manual
   di file yang sudah campur).
3. Backup file working-tree saat ini, timpa dengan versi "target" (baseline + edit
   sendiri), `git add` file itu (jadi cuma diff milik sesi ini yang ke-stage).
4. Kembalikan file working-tree dari backup (supaya perubahan sesi lain tetap ada di
   disk, tidak hilang, tapi tidak ikut ke-commit — dibiarkan untuk sesi lain commit
   sendiri nanti).
5. Verifikasi `git status --short` (pola `MM` = staged sebagian) dan
   `git diff --cached --stat` sebelum commit.

**Selalu commit dengan pathspec eksplisit** (`git add <file1> <file2> ...` lalu
`git commit`), JANGAN `git add -A` / `git commit -a` — resiko ikut commit pekerjaan
sesi lain yang belum siap/belum disetujui user mereka. Ini sempat kejadian nyata:
sebagian perubahan invitation feature (kolom `invitationAcceptedAt` di schema + 2
baris di `provisioning.ts`) ikut ke-commit oleh sesi lain di commit `66b74da` karena
working tree tumpang tindih saat mereka `git add -A` — sisanya baru di-commit
terpisah oleh sesi ini di `a3538bb`. Kalau nanti ketemu commit yang isinya cuma
sebagian dari yang diharapkan, ini kemungkinan penyebabnya — cek dulu sebelum panik
"kok hilang".

File yang PERNAH terlihat di `git status` tapi BUKAN milik sesi ini (jangan disentuh):
`app/[locale]/login/_components/LoginClient.tsx`, `app/[locale]/login/page.tsx`
(punya konterapp-full-1), `note.txt` (untracked, punya sesi lain — LIHAT memori
personal soal file ini sebelum menyentuhnya sama sekali, pernah ada insiden terhapus).

---

## 6. Lingkungan (ringkas — detail lengkap ada di `konterapp-full-1.md`)

- Dev server = **systemd user service**, JANGAN `kill` proses `next` mentah:
  ```bash
  systemctl --user restart konterapp-dev.service
  ```
  Port 3002.
- `.env` `MAIL_HOST` **sudah terisi** (SMTP Gmail asli) — email undangan/verifikasi
  BENERAN terkirim ke inbox asli saat testing, bukan cuma log ke console.
- Domain publik: `konterapp-wsl.linkinvite.id` (lewat Cloudflare Tunnel).

---

## 7. Catatan jujur: kesalahan/koreksi yang terjadi di sesi ini

1. Sempat mengasumsikan `MAIL_HOST` kosong (mode dev log-only) padahal user sudah isi
   SMTP asli — dikoreksi user, langsung diperbaiki infonya.
2. Fix redirect-ke-login (poin 5 di bagian 2) awalnya dibuat TERLALU LUAS (semua
   endpoint `/api/auth/*` kecuali submit-login ikut auto-redirect) — efek sampingnya
   visitor anonim di landing page ikut ke-redirect ke `/login`. Dikoreksi user
   ("di landing tidak perlu cek user"), baru disadari bahwa `/api/auth/user` dipakai
   lintas konteks publik & terproteksi jadi tidak bisa diputuskan cuma dari URL.
   Pelajaran: kalau satu endpoint dipanggil dari halaman publik DAN halaman
   terproteksi, keputusan "redirect atau tidak saat gagal" harus ada di pemanggil
   (context-aware), bukan di layer HTTP generik yang cuma lihat URL.
3. Setelah fix di atas, user masih harus tegaskan ulang: bukan cuma hilangkan efek
   redirect-nya, tapi **hapus total** pengecekan `getUser()` di `Header.tsx` — karena
   landing page memang tidak butuh tahu status login sama sekali, bukan cuma "jangan
   sampai redirect". Pelajaran: kalau user bilang "X tidak perlu dilakukan", jangan
   buru-buru menerjemahkan itu jadi "atasi efek sampingnya" — cek dulu apakah
   maksudnya lebih literal (hapus X sepenuhnya) sebelum berasumsi.

---

## 8. Langkah berikutnya yang disarankan

1. Kalau user minta lanjut fitur "detail saldo per shift" (bagian 4): **tanya dulu**
   apakah sesi konterapp-full-2 sudah/sedang mengerjakan item checklist yang sama,
   baru mulai implementasi memakai rancangan yang sudah diriset.
2. Tidak ada pekerjaan kode yang menggantung dari sesi ini sendiri — semua yang
   diimplementasikan sudah ter-commit bersih (lihat bagian 2).
3. File ini (`konterapp-full-3.md`) sebaiknya di-commit sendiri (terpisah, pathspec
   eksplisit) begitu user minta, jangan digabung dengan commit fitur lain.
