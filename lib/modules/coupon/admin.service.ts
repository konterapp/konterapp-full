import { Prisma } from "@prisma/client";
import { ApiError, ValidationApiError } from "@/lib/api-errors";
import { couponRepository } from "./repository";
import { formatCoupon } from "./coupon.mapper";
import { billingRepository } from "@/lib/modules/billing/repository";

function getSortConfig(sortBy: string, sortOrder: string): Prisma.CouponOrderByWithRelationInput {
  const allowedSorts = ["code", "name", "discount_percent", "used_count", "created_at"];
  const sortField = allowedSorts.includes(sortBy) ? sortBy : "created_at";
  const sortDir = sortOrder === "asc" ? "asc" : "desc";
  const sortFieldMap: Record<string, string> = {
    code: "code",
    name: "name",
    discount_percent: "discountPercent",
    used_count: "usedCount",
    created_at: "createdAt",
  };

  return { [sortFieldMap[sortField]]: sortDir as "asc" | "desc" };
}

function parseOptionalDate(value?: string | null): Date | null {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

export const couponAdminService = {
  async listCoupons(params: {
    page: number;
    perPage: number;
    search: string;
    status: string;
    sortBy: string;
    sortOrder: string;
  }) {
    const { page, perPage, search, status, sortBy, sortOrder } = params;
    const where: Prisma.CouponWhereInput = {};

    if (search) {
      where.OR = [
        { code: { contains: search } },
        { name: { contains: search } },
        { description: { contains: search } },
      ];
    }

    if (status === "active") {
      where.isActive = true;
    } else if (status === "inactive") {
      where.isActive = false;
    }

    const skip = (page - 1) * perPage;
    const [coupons, total] = await Promise.all([
      couponRepository.findMany({ where, orderBy: getSortConfig(sortBy, sortOrder), skip, take: perPage }),
      couponRepository.count(where),
    ]);

    return {
      coupons: coupons.map(formatCoupon),
      total,
      page,
      perPage,
    };
  },

  async getCouponDetail(uuid: string) {
    const coupon = await couponRepository.findByUuid(uuid);
    if (!coupon) {
      throw new ApiError("Kupon tidak ditemukan", 404);
    }
    return formatCoupon(coupon);
  },

  async createCoupon(payload: {
    code: string;
    name: string;
    description?: string | null;
    plan_code?: string | null;
    discount_percent: number;
    max_discount?: number | null;
    usage_limit?: number | null;
    is_active?: boolean;
    starts_at?: string | null;
    expires_at?: string | null;
  }) {
    const existing = await couponRepository.findByCode(payload.code);
    if (existing) {
      throw new ValidationApiError({ code: ["Kode kupon sudah digunakan"] });
    }

    if (payload.plan_code) {
      const plan = await billingRepository.findPlanByCode(payload.plan_code);
      const tier = await billingRepository.findTierByCode(payload.plan_code);
      if (!plan && !tier) {
        throw new ValidationApiError({ plan_code: ["Paket tidak ditemukan"] });
      }
    }

    const coupon = await couponRepository.create({
      code: payload.code,
      name: payload.name,
      description: payload.description || null,
      planCode: payload.plan_code || null,
      discountPercent: payload.discount_percent,
      maxDiscount: payload.max_discount ?? null,
      usageLimit: payload.usage_limit ?? null,
      isActive: payload.is_active ?? true,
      startsAt: parseOptionalDate(payload.starts_at),
      expiresAt: parseOptionalDate(payload.expires_at),
    });

    return formatCoupon(coupon);
  },

  async updateCoupon(uuid: string, payload: Partial<{
    code: string;
    name: string;
    description?: string | null;
    plan_code?: string | null;
    discount_percent: number;
    max_discount?: number | null;
    usage_limit?: number | null;
    is_active?: boolean;
    starts_at?: string | null;
    expires_at?: string | null;
  }>) {
    const existing = await couponRepository.findByUuid(uuid);
    if (!existing) {
      throw new ApiError("Kupon tidak ditemukan", 404);
    }

    if (payload.code && payload.code !== existing.code) {
      const codeExists = await couponRepository.findByCode(payload.code);
      if (codeExists) {
        throw new ValidationApiError({ code: ["Kode kupon sudah digunakan"] });
      }
    }

    if (payload.plan_code) {
      const plan = await billingRepository.findPlanByCode(payload.plan_code);
      const tier = await billingRepository.findTierByCode(payload.plan_code);
      if (!plan && !tier) {
        throw new ValidationApiError({ plan_code: ["Paket tidak ditemukan"] });
      }
    }

    const data: Prisma.CouponUpdateInput = {};
    if (payload.code !== undefined) data.code = payload.code;
    if (payload.name !== undefined) data.name = payload.name;
    if (payload.description !== undefined) data.description = payload.description || null;
    if (payload.plan_code !== undefined) data.planCode = payload.plan_code || null;
    if (payload.discount_percent !== undefined) data.discountPercent = payload.discount_percent;
    if (payload.max_discount !== undefined) data.maxDiscount = payload.max_discount ?? null;
    if (payload.usage_limit !== undefined) data.usageLimit = payload.usage_limit ?? null;
    if (payload.is_active !== undefined) data.isActive = payload.is_active;
    if (payload.starts_at !== undefined) data.startsAt = parseOptionalDate(payload.starts_at);
    if (payload.expires_at !== undefined) data.expiresAt = parseOptionalDate(payload.expires_at);

    const updated = await couponRepository.update(uuid, data);
    return formatCoupon(updated);
  },

  async deleteCoupon(uuid: string) {
    const existing = await couponRepository.findByUuid(uuid);
    if (!existing) {
      throw new ApiError("Kupon tidak ditemukan", 404);
    }
    await couponRepository.delete(uuid);
  },
};
