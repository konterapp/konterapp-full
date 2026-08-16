import { PrismaClient } from "@prisma/client";
import { v7 as uuidv7 } from "uuid";
import { FREE_TRIAL_PLAN_CODE, YEARLY_PLAN_CODE } from "../../lib/modules/billing/constants";

const PLANS_DATA = [
  {
    code: FREE_TRIAL_PLAN_CODE,
    name: "Free Trial",
    price: 0,
    durationDays: 30,
  },
  {
    code: YEARLY_PLAN_CODE,
    name: "Tahunan",
    price: 99000,
    durationDays: 365,
  },
];

export async function seedPlans(prisma: PrismaClient) {
  for (const data of PLANS_DATA) {
    await prisma.plan.upsert({
      where: { code: data.code },
      update: {},
      create: {
        uuid: uuidv7(),
        code: data.code,
        name: data.name,
        price: data.price,
        durationDays: data.durationDays,
        isActive: true,
      },
    });
  }

  console.log(`✓ ${PLANS_DATA.length} plans created`);
}

export async function getPlanByCode(prisma: PrismaClient, code: string) {
  const plan = await prisma.plan.findUnique({ where: { code } });
  if (!plan) {
    throw new Error(`Plan with code "${code}" not found. Run seedPlans first.`);
  }
  return plan;
}
