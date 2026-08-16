---
name: delegate-to-opencode
description: Pertimbangkan OTOMATIS di setiap task coding baru di project ini, TANPA perlu diminta user -- putuskan sendiri apakah task dikerjakan langsung (cepat, kecil) atau didelegasikan ke CLI opencode yang terinstall lokal (mekanis, banyak file, scope jelas, berpotensi boros token). Baca skill ini SEBELUM mulai kerjakan task non-trivial apa pun.
---

# Delegate to opencode

## Kenapa ini ada

User eksplisit minta: keputusan delegasi ke opencode TIDAK perlu
menunggu instruksi user setiap kali. Sebelum mulai task coding yang
lumayan besar, pertimbangkan dulu (langkah "Kapan delegasi otomatis"
di bawah) -- kalau kriteria terpenuhi, langsung delegasikan tanpa
nanya dulu ke user. Kalau task-nya kecil, kerjakan sendiri langsung,
jangan delegasikan (delegasi ke agent baru yang harus di-briefing
dari nol justru lebih lambat & lebih boros untuk task kecil).

Tujuan pakai opencode adalah supaya Claude (aku) hemat token. Itu
HANYA benar kalau verifikasi hasil kerja opencode dilakukan lewat
cara murah & deterministik (tsc, eslint, test runner, git diff
--stat), BUKAN dengan membaca ulang & re-derive semua logic yang
opencode kerjakan baris per baris -- kalau itu yang dilakukan,
biayanya sama saja (bahkan bisa lebih mahal: bayar plan + opencode +
re-derive ulang).

Prinsip: bagian yang paling boros token adalah EKSPLORASI & ITERASI
(baca banyak file, coba edit, ketemu error, edit lagi, ulang). Kalau
itu terjadi di context opencode, itu yang beneran hemat context
Claude. Verifikasi tetap wajib, tapi ringan.

## Kapan delegasi OTOMATIS (tanpa nanya user dulu)

Delegasikan ke opencode kalau task barunya memenuhi SEMUA ini:
- Scope bisa dijabarkan jadi instruksi konkret & self-contained
  (kalau perlu, tulis dulu rencananya sebagai teks singkat sebelum
  dikirim ke opencode -- tidak harus file terpisah kalau task-nya
  cukup dijelaskan dalam beberapa kalimat).
- Mekanis: menyentuh banyak file (perkiraan kasar >= 5-6 file) atau
  butuh eksplorasi luas (grep/baca berulang) untuk nemuin semua
  tempat yang perlu diubah -- pola rename/refactor lintas file,
  bukan nulis fitur baru dari nol yang butuh banyak keputusan desain.
- TIDAK butuh banyak keputusan desain/judgment call di tengah jalan
  (kalau ternyata butuh, itu tanda harus dikerjakan Claude sendiri
  atau didiskusikan ke user dulu, bukan didelegasikan).
- TIDAK menyentuh hal sensitif keamanan atau tindakan destruktif
  (migrasi database, push ke remote, hapus data) -- itu tetap harus
  lewat Claude & consent user seperti biasa, jangan didelegasikan
  dengan `--auto`.

## Kapan kerjakan LANGSUNG (jangan delegasikan)

- Task kecil (perkiraan kasar < 5 file, atau perubahan sederhana) --
  briefing agent baru dari nol lebih mahal/lambat daripada
  ngerjain sendiri.
- Task ambigu / butuh klarifikasi bolak-balik dengan user.
- Perlu keputusan arsitektur yang belum disepakati.
- Tindakan berisiko/destruktif (lihat di atas).

## Kalau ragu

Kalau tidak yakin task-nya masuk kategori mana, default-nya kerjakan
sendiri (lebih aman & lebih terkontrol) -- delegasi cuma dilakukan
kalau kriterianya jelas terpenuhi, bukan tebak-tebakan.

## Langkah eksekusi

### 1. Pastikan opencode bisa dipakai

```bash
command -v opencode || echo "cari binary manual, contoh: ~/.opencode/bin/opencode"
opencode providers list   # HARUS ada minimal 1 credential/provider
```

Kalau `0 credentials` atau command tidak ketemu: **STOP, jangan asumsikan
bisa jalan**. Kabari user, opencode perlu di-setup dulu
(`opencode providers login`) sebelum bisa dipakai.

### 2. Susun instruksi yang self-contained

opencode adalah agent baru, TIDAK punya konteks percakapan Claude ini.
Instruksi yang dikirim wajib:
- Path file & direktori project yang eksplisit (`/var/www/konterapp/konterapp-full`).
- Rujukan ke plan file kalau ada (contoh: "Ikuti rencana di
  plan-bersihkan-user-fields.txt, kerjakan semua langkahnya").
- Aturan project dari CLAUDE.md yang relevan (jangan diasumsikan
  opencode otomatis baca CLAUDE.md -- sebutkan eksplisit aturan
  yang krusial, misal: "update migrasi yang sudah ada, jangan bikin
  migrasi baru").
- Definisi "selesai" yang jelas & bisa diverifikasi (contoh:
  "`npx tsc --noEmit` harus balik ke jumlah error semula, jangan
  nambah error baru").

### 3. Jalankan non-interaktif

```bash
cd /var/www/konterapp/konterapp-full
opencode run "<instruksi lengkap di atas>" --auto
```

`--auto` diperlukan supaya tidak macet nunggu approval interaktif,
TAPI karena itu "dangerous" (auto-approve semua permission), pastikan
instruksinya TIDAK menyuruh opencode melakukan hal destruktif
(migrate reset, git push, hapus file besar-besaran) -- kalau task-nya
butuh itu, itu bagian yang Claude tangani sendiri setelah opencode
selesai dengan bagian mekanisnya.

### 4. Verifikasi ringan (BUKAN re-derive dari nol)

Sebelum delegasi, catat baseline: `npx tsc --noEmit 2>&1 | grep -c "error TS"`.

Setelah opencode selesai, jalankan cek yang sama & bandingkan:

```bash
npx tsc --noEmit 2>&1 | grep -c "error TS"   # harus = baseline, bukan lebih
npx eslint <file-file yang diubah>
npx vitest run
git status --short && git diff --stat
```

Baca `git diff --stat` + skim cepat diff-nya (bukan telusuri logic
baris-per-baris). Kalau semua cek di atas hijau dan diff-nya masuk
akal, itu cukup -- tidak perlu re-derive.

### 5. Kalau verifikasi gagal

Diagnosis spesifik dari pesan error (tsc/eslint/test), lalu:
- Kalau kecil (1-2 file): perbaiki langsung, jangan buang kerjaan
  opencode.
- Kalau besar/salah paham task: kirim instruksi koreksi balik ke
  opencode (`opencode run --continue "..."` atau sesi baru dengan
  konteks apa yang salah), jangan langsung redo semuanya sendiri.

### 6. Transparansi biaya

```bash
opencode stats
```

Laporkan ke user kalau diminta, supaya keputusan "opencode vs Claude
langsung" untuk task berikutnya bisa berdasarkan data nyata, bukan
asumsi.
