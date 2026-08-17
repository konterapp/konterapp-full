import { prisma } from '@/lib/prisma';

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

  create(data: { name: string; phone: string | null; email: string | null; address: string | null; isDefault?: boolean }) {
    return prisma.appPosCustomer.create({ data });
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
