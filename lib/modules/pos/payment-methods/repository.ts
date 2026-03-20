import { prisma } from '@/lib/prisma';

export const posPaymentMethodRepository = {
  findMany(params: { where: any; skip: number; take: number; orderBy: any }) {
    const { where, skip, take, orderBy } = params;
    return prisma.posPaymentMethod.findMany({ where, skip, take, orderBy });
  },

  count(where: any) {
    return prisma.posPaymentMethod.count({ where });
  },

  findByUuid(uuid: string) {
    return prisma.posPaymentMethod.findFirst({ where: { uuid } });
  },

  findByCode(code: string) {
    return prisma.posPaymentMethod.findUnique({ where: { code } });
  },

  create(data: {
    code: string;
    name: string;
    type: string;
    accountNumber: string | null;
    accountName: string | null;
    description: string | null;
    isActive: boolean;
  }) {
    return prisma.posPaymentMethod.create({ data });
  },

  updateByUuid(uuid: string, data: Record<string, unknown>) {
    return prisma.posPaymentMethod.update({ where: { uuid }, data });
  },

  deleteByUuid(uuid: string) {
    return prisma.posPaymentMethod.delete({ where: { uuid } });
  },

  countUsages(uuid: string) {
    return Promise.all([
      prisma.posSale.count({ where: { paymentMethodUuid: uuid } }),
      prisma.posPpobTransaction.count({ where: { paymentMethodUuid: uuid } }),
    ]);
  },
};
