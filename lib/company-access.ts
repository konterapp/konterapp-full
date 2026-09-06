import { prisma } from "./prisma";

export type UserCompanySummary = {
  uuid: string;
  code: string;
  name: string;
  allow_negative_stock: boolean;
  is_default: boolean;
};

export async function getUserCompanyMemberships(userId: number): Promise<UserCompanySummary[]> {
  const memberships = await prisma.companyUser.findMany({
    where: {
      userId,
      isActive: true,
      invitationAcceptedAt: { not: null },
      company: { isActive: true },
    },
    include: {
      company: {
        select: {
          uuid: true,
          code: true,
          name: true,
          allowNegativeStock: true,
        },
      },
    },
    orderBy: [{ isDefault: "desc" }, { createdAt: "asc" }],
  });

  return memberships.map((membership) => ({
    uuid: membership.company.uuid,
    code: membership.company.code,
    name: membership.company.name,
    allow_negative_stock: membership.company.allowNegativeStock,
    is_default: membership.isDefault,
  }));
}

export async function resolveUserActiveCompany(
  userId: number,
  preferredCompanyUuid?: string | null
): Promise<{
  activeCompanyUuid: string;
  companies: UserCompanySummary[];
}> {
  const companies = await getUserCompanyMemberships(userId);
  if (companies.length === 0) {
    throw new Error("User belum terhubung ke perusahaan mana pun");
  }

  const preferred = preferredCompanyUuid
    ? companies.find((company) => company.uuid === preferredCompanyUuid)
    : null;
  const fallback = companies.find((company) => company.is_default) ?? companies[0];
  const activeCompany = preferred ?? fallback;

  return {
    activeCompanyUuid: activeCompany.uuid,
    companies,
  };
}
