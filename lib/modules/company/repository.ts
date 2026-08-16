import { prisma } from "@/lib/prisma";

const companyInclude = {
  _count: { select: { memberships: true, branches: true } },
} as const;

export const companyRepository = {
  async findMany(params: { where: any; orderBy: any; skip: number; take: number }) {
    const { where, orderBy, skip, take } = params;
    return prisma.company.findMany({
      where,
      include: companyInclude,
      orderBy,
      skip,
      take,
    });
  },

  async count(where: any) {
    return prisma.company.count({ where });
  },

  async findByUuid(uuid: string) {
    return prisma.company.findUnique({
      where: { uuid },
      include: companyInclude,
    });
  },

  async findByCode(code: string, excludeUuid?: string) {
    return prisma.company.findFirst({
      where: {
        code,
        ...(excludeUuid ? { NOT: { uuid: excludeUuid } } : {}),
      },
    });
  },

  async create(data: { code: string; name: string; isActive: boolean }) {
    return prisma.company.create({
      data,
      include: companyInclude,
    });
  },

  async update(uuid: string, data: { code: string; name: string; isActive?: boolean }) {
    return prisma.company.update({
      where: { uuid },
      data,
      include: companyInclude,
    });
  },

  async toggleActiveByUuid(uuid: string, isActive: boolean) {
    return prisma.company.update({
      where: { uuid },
      data: { isActive },
      include: companyInclude,
    });
  },

  async listAllActiveForSelect() {
    return prisma.company.findMany({
      where: { isActive: true },
      select: { uuid: true, code: true, name: true },
      orderBy: { name: "asc" },
    });
  },
};
