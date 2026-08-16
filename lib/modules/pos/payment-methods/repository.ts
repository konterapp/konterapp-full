import { prisma } from '@/lib/prisma';

export const posPaymentMethodRepository = {
  findMany(params: { where: any; skip: number; take: number; orderBy: any }) {
    const { where, skip, take, orderBy } = params;
    return prisma.appPosPaymentMethod.findMany({ where, skip, take, orderBy });
  },

  count(where: any) {
    return prisma.appPosPaymentMethod.count({ where });
  },

  findByUuid(uuid: string) {
    return prisma.appPosPaymentMethod.findFirst({ where: { uuid } });
  },

  findByCode(code: string) {
    return prisma.appPosPaymentMethod.findUnique({ where: { code } });
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
    return prisma.appPosPaymentMethod.create({ data });
  },

  updateByUuid(uuid: string, data: Record<string, unknown>) {
    return prisma.appPosPaymentMethod.update({ where: { uuid }, data });
  },

  deleteByUuid(uuid: string) {
    return prisma.appPosPaymentMethod.delete({ where: { uuid } });
  },

  countUsages(uuid: string) {
    return Promise.all([
      prisma.appPosSale.count({ where: { paymentMethodUuid: uuid } }),
      prisma.appPosPpobTransaction.count({ where: { paymentMethodUuid: uuid } }),
    ]);
  },
};
