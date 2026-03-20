import { prisma } from '@/lib/prisma';

export const posSupplierRepository = {
  countAll() {
    return prisma.posSupplier.count();
  },

  findMany(params: { where: any; skip: number; take: number; orderBy: any }) {
    const { where, skip, take, orderBy } = params;
    return prisma.posSupplier.findMany({ where, skip, take, orderBy });
  },

  count(where: any) {
    return prisma.posSupplier.count({ where });
  },

  findByUuid(uuid: string) {
    return prisma.posSupplier.findFirst({ where: { uuid } });
  },

  create(data: {
    code: string;
    name: string;
    contactPerson: string | null;
    phone: string;
    email: string | null;
    address: string | null;
    isActive: boolean;
  }) {
    return prisma.posSupplier.create({ data });
  },

  updateByUuid(uuid: string, data: Record<string, unknown>) {
    return prisma.posSupplier.update({ where: { uuid }, data });
  },

  deleteByUuid(uuid: string) {
    return prisma.posSupplier.delete({ where: { uuid } });
  },
};
