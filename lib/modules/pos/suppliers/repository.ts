import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';

export const posSupplierRepository = {
  countAll() {
    return prisma.appPosSupplier.count();
  },

  findMany(params: { where: any; skip: number; take: number; orderBy: any }) {
    const { where, skip, take, orderBy } = params;
    return prisma.appPosSupplier.findMany({ where, skip, take, orderBy });
  },

  count(where: any) {
    return prisma.appPosSupplier.count({ where });
  },

  findByUuid(uuid: string) {
    return prisma.appPosSupplier.findFirst({ where: { uuid } });
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
    // companyUuid diisi otomatis oleh extension tenant di lib/prisma.ts,
    // jadi tipe Prisma yang mewajibkannya di-cast eksplisit di sini.
    return prisma.appPosSupplier.create({
      data: data as unknown as Prisma.AppPosSupplierUncheckedCreateInput,
    });
  },

  updateByUuid(uuid: string, data: Record<string, unknown>) {
    return prisma.appPosSupplier.update({ where: { uuid }, data });
  },

  deleteByUuid(uuid: string) {
    return prisma.appPosSupplier.delete({ where: { uuid } });
  },
};
