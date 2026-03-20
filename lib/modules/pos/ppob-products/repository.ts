import { prisma } from '@/lib/prisma';

export const posPpobProductRepository = {
  findMany(params: { where: any; skip: number; take: number; orderBy: any }) {
    const { where, skip, take, orderBy } = params;
    return prisma.posPpobProduct.findMany({ where, skip, take, orderBy });
  },

  count(where: any) {
    return prisma.posPpobProduct.count({ where });
  },

  findByUuid(uuid: string) {
    return prisma.posPpobProduct.findFirst({ where: { uuid } });
  },

  findByProviderCode(provider: string, providerProductCode: string) {
    return prisma.posPpobProduct.findFirst({
      where: { provider, providerProductCode },
    });
  },

  create(data: Record<string, unknown>) {
    return prisma.posPpobProduct.create({ data: data as any });
  },

  updateByUuid(uuid: string, data: Record<string, unknown>) {
    return prisma.posPpobProduct.update({ where: { uuid }, data: data as any });
  },

  deleteByUuid(uuid: string) {
    return prisma.posPpobProduct.delete({ where: { uuid } });
  },
};
