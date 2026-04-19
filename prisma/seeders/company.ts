import { PrismaClient } from "@prisma/client";
import { v7 as uuidv7 } from "uuid";

export const DEFAULT_COMPANY_CODE = "CMP-001";
export const DEFAULT_COMPANY_NAME = "KonterApp Demo Company";

export async function ensureDefaultCompany(prisma: PrismaClient) {
  const existing = await prisma.company.findFirst({
    where: { code: DEFAULT_COMPANY_CODE },
  });

  if (existing) {
    return existing;
  }

  return prisma.company.create({
    data: {
      uuid: uuidv7(),
      code: DEFAULT_COMPANY_CODE,
      name: DEFAULT_COMPANY_NAME,
      isActive: true,
    },
  });
}

export async function getDefaultCompanyUuid(prisma: PrismaClient): Promise<string> {
  const company = await ensureDefaultCompany(prisma);
  return company.uuid;
}
