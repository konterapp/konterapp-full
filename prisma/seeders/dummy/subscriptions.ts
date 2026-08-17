/**
 * Dummy seeder untuk company_subscriptions & subscription_invoices.
 * Jalankan: npm run seed:dummy prisma/seeders/dummy/subscriptions.ts
 *
 * Catatan: seeder ini butuh companies dan plans sudah ada (lihat
 * seedCore & seedCompanies), jalankan lewat dummy/index.ts.
 */
import { PrismaClient } from "@prisma/client";
import { v7 as uuidv7 } from "uuid";
import { DEFAULT_COMPANY_CODE } from "../company";
import { FREE_PLAN_CODE, STARTER_MONTHLY_PLAN_CODE, STARTER_YEARLY_PLAN_CODE } from "../../../lib/modules/billing/constants";

function daysFromNow(days: number): Date {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date;
}

async function upsertSubscription(
  prisma: PrismaClient,
  companyUuid: string,
  planUuid: string,
  status: string,
  startedAt: Date,
  expiresAt: Date | null
) {
  await prisma.companySubscription.upsert({
    where: { companyUuid },
    update: { planUuid, status, startedAt, expiresAt },
    create: { uuid: uuidv7(), companyUuid, planUuid, status, startedAt, expiresAt },
  });
}

export async function seedSubscriptions(prisma: PrismaClient) {
  const [defaultCompany, berkahJaya, sinarAbadi] = await Promise.all([
    prisma.company.findUnique({ where: { code: DEFAULT_COMPANY_CODE } }),
    prisma.company.findUnique({ where: { code: "CMP-002" } }),
    prisma.company.findUnique({ where: { code: "CMP-003" } }),
  ]);
  const [freePlan, monthlyPlan, yearlyPlan] = await Promise.all([
    prisma.plan.findUnique({ where: { code: FREE_PLAN_CODE } }),
    prisma.plan.findUnique({ where: { code: STARTER_MONTHLY_PLAN_CODE } }),
    prisma.plan.findUnique({ where: { code: STARTER_YEARLY_PLAN_CODE } }),
  ]);

  if (!freePlan || !yearlyPlan) {
    console.log("⚠ Plan belum di-seed, lewati seedSubscriptions (jalankan seedCore dulu)");
    return;
  }

  let count = 0;

  // Perusahaan demo utama: sudah upgrade ke paket Tahunan (aktif)
  if (defaultCompany) {
    await upsertSubscription(
      prisma,
      defaultCompany.uuid,
      yearlyPlan.uuid,
      "active",
      daysFromNow(-30),
      daysFromNow(335)
    );

    await prisma.subscriptionInvoice.upsert({
      where: { providerInvoiceId: "dummy-sub-invoice-001" },
      update: {},
      create: {
        uuid: uuidv7(),
        companyUuid: defaultCompany.uuid,
        planUuid: yearlyPlan.uuid,
        provider: "midtrans",
        providerInvoiceId: "dummy-sub-invoice-001",
        amount: yearlyPlan.price,
        status: "paid",
        paidAt: daysFromNow(-30),
      },
    });
    count += 1;
  }

  // Konter Berkah Jaya: paket Free selamanya (aktif, tidak kedaluwarsa)
  if (berkahJaya) {
    await upsertSubscription(
      prisma,
      berkahJaya.uuid,
      freePlan.uuid,
      "active",
      daysFromNow(-5),
      null
    );
    count += 1;
  }

  // Konter Sinar Abadi: paket berbayar bulanan yang sudah kedaluwarsa
  // (untuk uji blokir akses /app saat langganan berbayar habis dan belum diperpanjang).
  if (sinarAbadi && monthlyPlan) {
    await upsertSubscription(
      prisma,
      sinarAbadi.uuid,
      monthlyPlan.uuid,
      "active",
      daysFromNow(-40),
      daysFromNow(-10)
    );

    await prisma.subscriptionInvoice.upsert({
      where: { providerInvoiceId: "dummy-sub-invoice-002" },
      update: {},
      create: {
        uuid: uuidv7(),
        companyUuid: sinarAbadi.uuid,
        planUuid: monthlyPlan.uuid,
        provider: "midtrans",
        providerInvoiceId: "dummy-sub-invoice-002",
        amount: monthlyPlan.price,
        status: "pending",
        paymentLink: "https://app.sandbox.midtrans.com/snap/v4/redirection/dummy-invoice-002",
      },
    });
    count += 1;
  }

  console.log(`✓ ${count} company subscriptions dummy created/updated`);
}
