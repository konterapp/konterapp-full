import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';

export const posCustomerRepository = {
  findMany(params: { where: any; skip: number; take: number }) {
    const { where, skip, take } = params;
    return prisma.appPosCustomer.findMany({
      where,
      skip,
      take,
      orderBy: { createdAt: 'desc' },
    });
  },

  count(where: any) {
    return prisma.appPosCustomer.count({ where });
  },

  findByUuid(uuid: string) {
    return prisma.appPosCustomer.findFirst({ where: { uuid } });
  },

  create(data: { name: string; phone: string | null; email: string | null; address: string | null }) {
    // companyUuid diisi otomatis oleh extension tenant di lib/prisma.ts,
    // jadi tipe Prisma yang mewajibkannya di-cast eksplisit di sini.
    return prisma.appPosCustomer.create({
      data: data as unknown as Prisma.AppPosCustomerUncheckedCreateInput,
    });
  },

  updateByUuid(uuid: string, data: Record<string, unknown>) {
    return prisma.appPosCustomer.update({ where: { uuid }, data });
  },

  deleteByUuid(uuid: string) {
    return prisma.appPosCustomer.delete({ where: { uuid } });
  },

  countSales(uuid: string) {
    return prisma.appPosSale.count({ where: { customerUuid: uuid } });
  },
};
