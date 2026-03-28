# Konterapp Full (Next.js + Prisma)

Ringkas developer setup untuk `konterapp-full` (port `3002`).

## Prasyarat
- Node.js (LTS)
- PostgreSQL 16
- Redis

Disarankan pakai Homebrew services (lebih ringan dari Docker/Colima):
```
brew install postgresql@16 redis
brew services start postgresql@16
brew services start redis
```

## Database (PostgreSQL lokal)
```
psql postgres
CREATE ROLE postgres WITH LOGIN SUPERUSER PASSWORD 'postgres';
CREATE DATABASE konterapp_full OWNER postgres;
\q
```

## Environment
Buat `.env` dari `.env.example` lalu sesuaikan:
```
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/konterapp_full"
DIRECT_URL="postgresql://postgres:postgres@localhost:5432/konterapp_full"
AUTH_SECRET="konterapp-full-secret-key-change-in-production"
AUTH_URL="http://localhost:3002"
NEXT_PUBLIC_APP_URL="http://localhost:3002"

# PPOB Providers (isi jika ingin sync dari provider)
DIGIFLAZZ_USERNAME=""
DIGIFLAZZ_API_KEY=""
DIGIFLAZZ_BASE_URL="https://api.digiflazz.com/v1"
RAJABILLER_UID=""
RAJABILLER_PIN=""
RAJABILLER_BASE_URL="https://rajabiller.fastpay.co.id/transaksi/json_devel.php"
```

## Install & Run
```
npm install
npm run dev
```
App: `http://localhost:3002`

## Prisma
```
npx prisma generate
npx prisma migrate deploy
```

Reset DB (sesuai rule project):
```
npx prisma migrate reset --force
```

## Seed
Seed utama:
```
npm run seed
```
Seed dummy:
```
for f in prisma/seeders/dummy/*.ts; do npm run seed:dummy "$f"; done
```

## Build / Test
```
npm run build
npm run test
```

## DB Keepalive Scheduler (GitHub Actions)

Untuk project yang memakai Supabase free tier, database bisa auto-pause saat lama tidak ada aktivitas.
Repo ini menyediakan endpoint keepalive dan workflow scheduler:

- Endpoint: `GET /api/health/db`
- Workflow: `.github/workflows/db-keepalive.yml`

### 1. Set environment variable di app

Tambahkan env berikut (lihat juga `.env.example`):

```env
KEEPALIVE_CRON_KEY="your-random-secret"
```

`KEEPALIVE_CRON_KEY` dipakai untuk melindungi endpoint keepalive.

### 2. Set GitHub Secret

Di GitHub repo settings -> Secrets and variables -> Actions, buat secret:

- `KEEPALIVE_URL`

Contoh value:

```txt
https://your-domain.com/api/health/db?key=your-random-secret
```

### 3. Jalankan scheduler

Workflow `DB Keepalive` otomatis jalan tiap hari (cron) dan bisa dijalankan manual via `workflow_dispatch`.

Endpoint menjalankan query ringan `SELECT 1` untuk memastikan koneksi database tetap aktif.
