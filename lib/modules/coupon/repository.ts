import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export const couponRepository = {
  async findMany(params: {
    where: Prisma.CouponWhereInput;
    orderBy: Prisma.CouponOrderByWithRelationInput;
    skip: number;
    take: number;
  }) {
    const { where, orderBy, skip, take } = params;
    return prisma.coupon.findMany({ where, orderBy, skip, take });
  },

  async count(where: Prisma.CouponWhereInput) {
    return prisma.coupon.count({ where });
  },

  async findByUuid(uuid: string) {
    return prisma.coupon.findUnique({ where: { uuid } });
  },

  async findByCode(code: string) {
    return prisma.coupon.findUnique({ where: { code } });
  },

  async create(data: Prisma.CouponCreateInput) {
    return prisma.coupon.create({ data });
  },

  async update(uuid: string, data: Prisma.CouponUpdateInput) {
    return prisma.coupon.update({ where: { uuid }, data });
  },

  async delete(uuid: string) {
    return prisma.coupon.delete({ where: { uuid } });
  },

  async incrementUsedCount(uuid: string) {
    return prisma.coupon.update({
      where: { uuid },
      data: { usedCount: { increment: 1 } },
    });
  },

  async decrementUsedCount(uuid: string) {
    return prisma.coupon.updateMany({
      where: { uuid, usedCount: { gt: 0 } },
      data: { usedCount: { decrement: 1 } },
    });
  },
};
