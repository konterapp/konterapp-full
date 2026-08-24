/**
 * CONTOH integration test pertama -- pola untuk test-test integration
 * berikutnya (silakan lanjutkan/tambah file baru di folder ini).
 *
 * Beda dari unit test biasa (*.test.ts, lihat vitest.setup.ts): file ini
 * TIDAK mock `@/lib/prisma` -- ini query ke Postgres BENERAN, ke DB
 * terpisah `konterapp_full_test` (lihat .env.test / .env.test.example),
 * BUKAN DB dev (konterapp_full). vitest.integration.setup.ts akan
 * throw error kalau DATABASE_URL tidak mengarah ke DB "*_test", jadi
 * aman dari salah nyasar TRUNCATE/DROP data dev.
 *
 * Cara jalanin:
 *   1. (sekali di awal, atau tiap kali schema.prisma berubah)
 *      npm run test:integration:db:push
 *   2. npm run test:integration
 *
 * Kenapa dibuat: unit test yang mock prisma TIDAK PERNAH mengeksekusi
 * extension tenant-scoping asli di lib/prisma.ts (auto-filter query by
 * company_uuid, auto-fill company_uuid saat create, auto-generate uuid).
 * Padahal itu bagian paling riskan di project ini -- CLAUDE.md sendiri
 * mendokumentasikan insiden nyata data bocor lintas tenant gara-gara
 * model baru lupa didaftarkan ke TENANT_MODELS (lib/tenant-context.ts).
 * Integration test ini query DB Postgres beneran supaya extension itu
 * benar-benar tereksekusi & bisa ketahuan kalau ada regresi.
 *
 * Pola untuk test baru: pakai `runWithTenantContext(companyUuid, cb)`
 * buat simulasi request yang datang dari tenant tertentu (persis yang
 * dilakukan withAuth/withPermission di lib/api-middleware.ts saat
 * production), lalu assert query prisma biasa (tanpa manual filter
 * company_uuid) otomatis ke-scope dengan benar. Selalu bikin >=2 company
 * di test buat verifikasi ISOLASI antar tenant (bukan cuma "field
 * ke-filled", tapi "company lain beneran tidak bisa lihat data ini").
 *
 * PENTING -- callback `runWithTenantContext` WAJIB fungsi `async` yang
 * pakai `await` di dalamnya (`async () => { return await prisma...; }`),
 * JANGAN arrow function biasa yang langsung return promise
 * (`() => prisma....create(...)`). Sudah dibuktikan lewat debugging: di
 * bawah vite-node/vitest, bentuk kedua bikin AsyncLocalStorage context
 * hilang di tengah jalan (companyUuid null di dalam extension lib/prisma.ts)
 * meskipun kelihatannya sama-sama valid TypeScript & sama-sama jalan
 * normal di runtime Next.js asli. Ini kemungkinan besar quirk transform
 * vite-node terhadap AsyncLocalStorage, bukan bug di lib/prisma.ts/
 * lib/tenant-context.ts -- tapi tetap WAJIB diikuti di semua integration
 * test baru supaya tidak muncul false negative yang membingungkan.
 */
import { randomUUID } from 'node:crypto';
import { describe, it, expect, afterAll } from 'vitest';
import type { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { runWithTenantContext } from '@/lib/tenant-context';

/**
 * appPosBranch.create di bawah ini sengaja TIDAK mengirim company_uuid --
 * itu justru yang mau dibuktikan (auto-fill oleh extension tenant-scoping).
 * Tipe AppPosBranchUncheckedCreateInput yang di-generate Prisma tetap
 * mewajibkan company_uuid (extension $allOperations tidak mengubah tipe
 * hasil generate), jadi perlu type assertion di sini -- bukan bug di kode
 * aplikasi, cuma keterbatasan typing Prisma Client extension.
 */
function branchCreateData(
  data: Omit<Prisma.AppPosBranchUncheckedCreateInput, 'companyUuid'>
): Prisma.AppPosBranchUncheckedCreateInput {
  return data as unknown as Prisma.AppPosBranchUncheckedCreateInput;
}

describe('lib/prisma.ts tenant-scoping extension (real DB)', () => {
  const createdCompanyUuids: string[] = [];

  async function createTestCompany(label: string) {
    // Company sendiri BUKAN tenant model (tidak punya company_uuid),
    // tapi TERDAFTAR di UUID_MODELS -- create tanpa `uuid` di sini
    // sekaligus jadi bukti auto-generate uuid jalan.
    const company = await prisma.company.create({
      data: {
        code: `TEST-${label}-${randomUUID().slice(0, 8)}`,
        name: `Test Company ${label}`,
        isActive: true,
      },
    });
    createdCompanyUuids.push(company.uuid);
    return company;
  }

  afterAll(async () => {
    // onDelete: Cascade dari Company -> AppPosBranch dkk, jadi cukup
    // hapus company-nya saja buat bersihkan semua data test ini.
    if (createdCompanyUuids.length > 0) {
      await prisma.company.deleteMany({ where: { uuid: { in: createdCompanyUuids } } });
    }
    await prisma.$disconnect();
  });

  it('auto-generates a uuid on create for UUID_MODELS (tidak perlu dikirim manual)', async () => {
    const company = await createTestCompany('uuidgen');

    expect(company.uuid).toBeTruthy();
    expect(company.uuid).toHaveLength(36);
  });

  it('auto-fills company_uuid saat create untuk TENANT_MODELS, mengikuti tenant context aktif', async () => {
    const company = await createTestCompany('autofill');

    const branch = await runWithTenantContext(company.uuid, async () => {
      return await prisma.appPosBranch.create({
        data: branchCreateData({
          code: 'MAIN',
          name: 'Cabang Test',
          isActive: true,
        }),
      });
    });

    expect(branch.companyUuid).toBe(company.uuid);
  });

  it('mengisolasi data antar tenant: company lain tidak bisa lihat cabang company ini lewat findMany biasa', async () => {
    const companyA = await createTestCompany('isoA');
    const companyB = await createTestCompany('isoB');

    await runWithTenantContext(companyA.uuid, async () => {
      return await prisma.appPosBranch.create({
        data: branchCreateData({ code: 'A1', name: 'Cabang Milik A', isActive: true }),
      });
    });

    const branchesVisibleToB = await runWithTenantContext(companyB.uuid, async () => {
      return await prisma.appPosBranch.findMany();
    });
    expect(branchesVisibleToB.find((b) => b.companyUuid === companyA.uuid)).toBeUndefined();

    const branchesVisibleToA = await runWithTenantContext(companyA.uuid, async () => {
      return await prisma.appPosBranch.findMany();
    });
    expect(branchesVisibleToA.some((b) => b.companyUuid === companyA.uuid)).toBe(true);
  });

  it('findUniqueOrThrow di dalam $transaction bisa baca row yang baru dibuat di transaction yang sama', async () => {
    // Regresi nyata: sebelum diperbaiki, rewrite findUnique/findUniqueOrThrow
    // di lib/prisma.ts memanggil delegate dari basePrisma (client di luar
    // transaction) alih-alih `tx` yang aktif -- row yang baru di-insert di
    // transaction yang belum commit jadi tidak kelihatan dari basePrisma
    // (connection terpisah), dan findUniqueOrThrow salah lempar "not found"
    // meskipun row-nya jelas ada. Ini persis pola yang dipakai
    // applyMutationInTx di lib/modules/pos/saldo/repository.ts (create baris
    // balance lalu langsung findUniqueOrThrow ke baris itu, di transaction
    // yang sama).
    const company = await createTestCompany('txread');

    const branch = await runWithTenantContext(company.uuid, async () => {
      return await prisma.$transaction(async (tx) => {
        const created = await tx.appPosBranch.create({
          data: branchCreateData({ code: 'TX1', name: 'Cabang Dalam Transaction', isActive: true }),
        });

        return await tx.appPosBranch.findUniqueOrThrow({
          where: { uuid: created.uuid },
        });
      });
    });

    expect(branch.companyUuid).toBe(company.uuid);
  });
});
