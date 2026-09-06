import { prisma } from '@/lib/prisma';
import { getTenantCompanyUuid } from '@/lib/tenant-context';
import { Prisma } from '@prisma/client';

export const posUnitRepository = {
  findMany(params: {
    where: Prisma.AppPosProductUnitWhereInput;
    skip: number;
    take: number;
    orderBy: Prisma.AppPosProductUnitOrderByWithRelationInput;
  }) {
    const { where, skip, take, orderBy } = params;
    return prisma.appPosProductUnit.findMany({
      where,
      skip,
      take,
      orderBy,
    });
  },

  count(where: Prisma.AppPosProductUnitWhereInput) {
    return prisma.appPosProductUnit.count({ where });
  },

  findByUuid(uuid: string) {
    return prisma.appPosProductUnit.findFirst({ where: { uuid } });
  },

  findByName(name: string) {
    return prisma.appPosProductUnit.findFirst({
      where: {
        name: { equals: name, mode: 'insensitive' },
      },
    });
  },

  create(data: { name: string; description: string | null }) {
    // companyUuid diisi otomatis oleh extension tenant di lib/prisma.ts,
    // jadi tipe Prisma yang mewajibkannya di-cast eksplisit di sini.
    return prisma.appPosProductUnit.create({
      data: data as unknown as Prisma.AppPosProductUnitUncheckedCreateInput,
    });
  },

  updateByUuid(uuid: string, data: { name: string; description: string | null }) {
    return prisma.appPosProductUnit.update({ where: { uuid }, data });
  },

  deleteByUuid(uuid: string) {
    return prisma.appPosProductUnit.delete({ where: { uuid } });
  },

  countProductsUsingUnit(unitName: string) {
    return prisma.appPosProduct.count({
      where: { unit: unitName },
    });
  },

  countUnitConversionsUsingUnit(unitName: string) {
    const companyUuid = getTenantCompanyUuid();
    return prisma.appPosProductUnitConversion.count({
      where: companyUuid
        ? {
          unit: unitName,
          product: { companyUuid },
        }
        : { unit: unitName },
    });
  },
};
