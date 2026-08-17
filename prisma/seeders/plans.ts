import { PrismaClient } from "@prisma/client";
import { v7 as uuidv7 } from "uuid";
import {
  FREE_PLAN_CODE,
  STARTER_MONTHLY_PLAN_CODE,
  STARTER_YEARLY_PLAN_CODE,
  GROWTH_MONTHLY_PLAN_CODE,
  GROWTH_YEARLY_PLAN_CODE,
  PRO_MONTHLY_PLAN_CODE,
  PRO_YEARLY_PLAN_CODE,
  TIER_FREE_CODE,
  TIER_STARTER_CODE,
  TIER_GROWTH_CODE,
  TIER_PRO_CODE,
  BILLING_PERIOD_MONTHLY,
  BILLING_PERIOD_YEARLY,
} from "../../lib/modules/billing/constants";

const TIERS_DATA = [
  {
    code: TIER_FREE_CODE,
    name: "Free",
    description: "Paket gratis selamanya untuk konter & toko kecil.",
    maxBranches: 1,
    maxUsers: 3,
    maxProducts: 100,
    maxTransactionsPerMonth: 1000,
    features: ["Transaksi PPOB tanpa batas", "Kasir digital (POS) lengkap", "Laporan penjualan & stok", "1 cabang", "3 pengguna", "100 produk", "1000 transaksi/bulan"],
    displayOrder: 1,
  },
  {
    code: TIER_STARTER_CODE,
    name: "Starter",
    description: "Untuk konter & toko kecil yang mulai berkembang.",
    maxBranches: 1,
    maxUsers: 3,
    maxProducts: 500,
    maxTransactionsPerMonth: 5000,
    features: ["Semua fitur Free", "1 cabang", "3 pengguna", "500 produk", "5000 transaksi/bulan", "Struk dengan nama toko sendiri"],
    displayOrder: 2,
  },
  {
    code: TIER_GROWTH_CODE,
    name: "Growth",
    description: "Untuk usaha yang berkembang dengan beberapa cabang.",
    maxBranches: 3,
    maxUsers: 9,
    maxProducts: 2000,
    maxTransactionsPerMonth: 20000,
    features: ["Semua fitur Starter", "3 cabang", "9 pengguna", "2000 produk", "20000 transaksi/bulan", "Multi kasir", "Laporan laba-rugi detail"],
    displayOrder: 3,
  },
  {
    code: TIER_PRO_CODE,
    name: "Pro",
    description: "Untuk bisnis multi cabang dengan kebutuhan penuh.",
    maxBranches: 10,
    maxUsers: 30,
    maxProducts: 10000,
    maxTransactionsPerMonth: 100000,
    features: ["Semua fitur Growth", "10 cabang", "30 pengguna", "10000 produk", "100000 transaksi/bulan", "Prioritas dukungan 24 jam", "Manajemen multi toko"],
    displayOrder: 4,
  },
];

const PLANS_DATA = [
  { code: FREE_PLAN_CODE, name: "Free", tierCode: TIER_FREE_CODE, billingPeriod: null, price: 0, durationDays: null, displayOrder: 1 },
  { code: STARTER_MONTHLY_PLAN_CODE, name: "Starter Bulanan", tierCode: TIER_STARTER_CODE, billingPeriod: BILLING_PERIOD_MONTHLY, price: 10000, durationDays: 30, displayOrder: 2 },
  { code: STARTER_YEARLY_PLAN_CODE, name: "Starter Tahunan", tierCode: TIER_STARTER_CODE, billingPeriod: BILLING_PERIOD_YEARLY, price: 99000, durationDays: 365, displayOrder: 3 },
  { code: GROWTH_MONTHLY_PLAN_CODE, name: "Growth Bulanan", tierCode: TIER_GROWTH_CODE, billingPeriod: BILLING_PERIOD_MONTHLY, price: 35000, durationDays: 30, displayOrder: 4 },
  { code: GROWTH_YEARLY_PLAN_CODE, name: "Growth Tahunan", tierCode: TIER_GROWTH_CODE, billingPeriod: BILLING_PERIOD_YEARLY, price: 350000, durationDays: 365, displayOrder: 5 },
  { code: PRO_MONTHLY_PLAN_CODE, name: "Pro Bulanan", tierCode: TIER_PRO_CODE, billingPeriod: BILLING_PERIOD_MONTHLY, price: 99000, durationDays: 30, displayOrder: 6 },
  { code: PRO_YEARLY_PLAN_CODE, name: "Pro Tahunan", tierCode: TIER_PRO_CODE, billingPeriod: BILLING_PERIOD_YEARLY, price: 990000, durationDays: 365, displayOrder: 7 },
];

export async function seedPlans(prisma: PrismaClient) {
  for (const data of TIERS_DATA) {
    await prisma.planTier.upsert({
      where: { code: data.code },
      update: {
        name: data.name,
        description: data.description,
        maxBranches: data.maxBranches,
        maxUsers: data.maxUsers,
        maxProducts: data.maxProducts,
        maxTransactionsPerMonth: data.maxTransactionsPerMonth,
        features: data.features,
        displayOrder: data.displayOrder,
        isActive: true,
      },
      create: {
        uuid: uuidv7(),
        code: data.code,
        name: data.name,
        description: data.description,
        maxBranches: data.maxBranches,
        maxUsers: data.maxUsers,
        maxProducts: data.maxProducts,
        maxTransactionsPerMonth: data.maxTransactionsPerMonth,
        features: data.features,
        displayOrder: data.displayOrder,
        isActive: true,
      },
    });
  }

  for (const data of PLANS_DATA) {
    const tier = await prisma.planTier.findUnique({ where: { code: data.tierCode } });
    if (!tier) {
      throw new Error(`PlanTier with code "${data.tierCode}" not found. Run seedPlans first.`);
    }

    await prisma.plan.upsert({
      where: { code: data.code },
      update: {
        name: data.name,
        tierUuid: tier.uuid,
        billingPeriod: data.billingPeriod,
        price: data.price,
        durationDays: data.durationDays,
        displayOrder: data.displayOrder,
        isActive: true,
      },
      create: {
        uuid: uuidv7(),
        code: data.code,
        name: data.name,
        tierUuid: tier.uuid,
        billingPeriod: data.billingPeriod,
        price: data.price,
        durationDays: data.durationDays,
        displayOrder: data.displayOrder,
        isActive: true,
      },
    });
  }

  console.log(`✓ ${TIERS_DATA.length} plan tiers created`);
  console.log(`✓ ${PLANS_DATA.length} plans created`);
}

export async function getPlanByCode(prisma: PrismaClient, code: string) {
  const plan = await prisma.plan.findUnique({ where: { code } });
  if (!plan) {
    throw new Error(`Plan with code "${code}" not found. Run seedPlans first.`);
  }
  return plan;
}
