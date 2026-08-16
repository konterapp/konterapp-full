import { prisma } from '@/lib/prisma';

export const posCategoryRepository = {
  findMany(params: { where: any; skip: number; take: number; orderBy: any }) {
    const { where, skip, take, orderBy } = params;
    return prisma.appPosProductCategory.findMany({
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
    return prisma.appPosProductCategory.count({ where });
  },

  findByUuid(uuid: string) {
    return prisma.appPosProductCategory.findFirst({
      where: { uuid },
      include: {
        _count: {
          select: { products: true },
        },
      },
    });
  },

  findByName(name: string) {
    return prisma.appPosProductCategory.findFirst({ where: { name } });
  },

  create(data: { name: string; description: string | null }) {
    return prisma.appPosProductCategory.create({ data });
  },

  updateByUuid(uuid: string, data: { name: string; description: string | null }) {
    return prisma.appPosProductCategory.update({ where: { uuid }, data });
  },

  countProducts(uuid: string) {
    return prisma.appPosProduct.count({ where: { categoryUuid: uuid } });
  },

  deleteByUuid(uuid: string) {
    return prisma.appPosProductCategory.delete({ where: { uuid } });
  },
};
