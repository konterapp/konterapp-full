import { prisma } from '@/lib/prisma';

export const posPpobProductRepository = {
  findMany(params: { where: any; skip: number; take: number; orderBy: any }) {
    const { where, skip, take, orderBy } = params;
    return prisma.appPosPpobProduct.findMany({ where, skip, take, orderBy });
  },

  count(where: any) {
    return prisma.appPosPpobProduct.count({ where });
  },

  findByUuid(uuid: string) {
    return prisma.appPosPpobProduct.findFirst({ where: { uuid } });
  },

  findByProviderCode(provider: string, providerProductCode: string) {
    return prisma.appPosPpobProduct.findFirst({
      where: { provider, providerProductCode },
    });
  },

  findManyByFilter(params: { where: any; orderBy?: any }) {
    const { where, orderBy } = params;
    return prisma.appPosPpobProduct.findMany({ where, orderBy });
  },

  findDistinctBrandsByCategory(category: string) {
    return prisma.appPosPpobProduct.findMany({
      where: { category, isActive: true, brand: { not: null } },
      distinct: ['brand'],
      select: { brand: true },
      orderBy: { brand: 'asc' },
    });
  },

  create(data: Record<string, unknown>) {
    return prisma.appPosPpobProduct.create({ data: data as any });
  },

  updateByUuid(uuid: string, data: Record<string, unknown>) {
    return prisma.appPosPpobProduct.update({ where: { uuid }, data: data as any });
  },

  deleteByUuid(uuid: string) {
    return prisma.appPosPpobProduct.delete({ where: { uuid } });
  },

  deleteManyByUuids(uuids: string[]) {
    return prisma.appPosPpobProduct.deleteMany({ where: { uuid: { in: uuids } } });
  },
};
