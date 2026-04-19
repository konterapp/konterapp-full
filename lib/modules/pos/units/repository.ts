import { prisma } from '@/lib/prisma';
import { getTenantCompanyUuid } from '@/lib/tenant-context';
import { Prisma } from '@prisma/client';

export const posUnitRepository = {
  findMany(params: {
    where: Prisma.PosProductUnitWhereInput;
    skip: number;
    take: number;
    orderBy: Prisma.PosProductUnitOrderByWithRelationInput;
  }) {
    const { where, skip, take, orderBy } = params;
    return prisma.posProductUnit.findMany({
      where,
      skip,
      take,
      orderBy,
    });
  },

  count(where: Prisma.PosProductUnitWhereInput) {
    return prisma.posProductUnit.count({ where });
  },

  findByUuid(uuid: string) {
    return prisma.posProductUnit.findFirst({ where: { uuid } });
  },

  findByName(name: string) {
    return prisma.posProductUnit.findFirst({
      where: {
        name: { equals: name, mode: 'insensitive' },
      },
    });
  },

  create(data: { name: string; description: string | null }) {
    return prisma.posProductUnit.create({ data });
  },

  updateByUuid(uuid: string, data: { name: string; description: string | null }) {
    return prisma.posProductUnit.update({ where: { uuid }, data });
  },

  deleteByUuid(uuid: string) {
    return prisma.posProductUnit.delete({ where: { uuid } });
  },

  countProductsUsingUnit(unitName: string) {
    return prisma.posProduct.count({
      where: { unit: unitName },
    });
  },

  countUnitConversionsUsingUnit(unitName: string) {
    const companyUuid = getTenantCompanyUuid();
    return prisma.posProductUnitConversion.count({
      where: companyUuid
        ? {
          unit: unitName,
          product: { companyUuid },
        }
        : { unit: unitName },
    });
  },
};
