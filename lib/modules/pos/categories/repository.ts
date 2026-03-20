import { prisma } from '@/lib/prisma';

export const posCategoryRepository = {
  findMany(params: { where: any; skip: number; take: number; orderBy: any }) {
    const { where, skip, take, orderBy } = params;
    return prisma.posProductCategory.findMany({
      where,
      skip,
      take,
      orderBy,
      include: {
        _count: {
          select: { products: true },
        },
      },
    });
  },

  count(where: any) {
    return prisma.posProductCategory.count({ where });
  },

  findByUuid(uuid: string) {
    return prisma.posProductCategory.findFirst({
      where: { uuid },
      include: {
        _count: {
          select: { products: true },
        },
      },
    });
  },

  findByName(name: string) {
    return prisma.posProductCategory.findFirst({ where: { name } });
  },

  create(data: { name: string; description: string | null }) {
    return prisma.posProductCategory.create({ data });
  },

  updateByUuid(uuid: string, data: { name: string; description: string | null }) {
    return prisma.posProductCategory.update({ where: { uuid }, data });
  },

  countProducts(uuid: string) {
    return prisma.posProduct.count({ where: { categoryUuid: uuid } });
  },

  deleteByUuid(uuid: string) {
    return prisma.posProductCategory.delete({ where: { uuid } });
  },
};
