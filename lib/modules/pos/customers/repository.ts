import { prisma } from '@/lib/prisma';

export const posCustomerRepository = {
  findMany(params: { where: any; skip: number; take: number }) {
    const { where, skip, take } = params;
    return prisma.posCustomer.findMany({
      where,
      skip,
      take,
      orderBy: { createdAt: 'desc' },
    });
  },

  count(where: any) {
    return prisma.posCustomer.count({ where });
  },

  findByUuid(uuid: string) {
    return prisma.posCustomer.findFirst({ where: { uuid } });
  },

  create(data: { name: string; phone: string | null; email: string | null; address: string | null }) {
    return prisma.posCustomer.create({ data });
  },

  updateByUuid(uuid: string, data: Record<string, unknown>) {
    return prisma.posCustomer.update({ where: { uuid }, data });
  },

  deleteByUuid(uuid: string) {
    return prisma.posCustomer.delete({ where: { uuid } });
  },

  countSales(uuid: string) {
    return prisma.posSale.count({ where: { customerUuid: uuid } });
  },
};
