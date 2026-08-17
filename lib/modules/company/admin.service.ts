import { ApiError, ValidationApiError } from "@/lib/api-errors";
import { companyRepository } from "./repository";
import { formatCompany } from "./company.mapper";
import { billingRepository } from "@/lib/modules/billing/repository";
import { FREE_PLAN_CODE } from "@/lib/modules/billing/constants";
import { prisma } from "@/lib/prisma";
import { seedTenantDefaultRoles } from "@/lib/modules/roles/templates";

function getSortConfig(sortBy: string, sortOrder: string) {
  const allowedSorts = ["code", "name", "created_at"];
  const sortField = allowedSorts.includes(sortBy) ? sortBy : "created_at";
  const sortDir = sortOrder === "asc" ? "asc" : "desc";
  const sortFieldMap: Record<string, string> = {
    code: "code",
    name: "name",
    created_at: "createdAt",
  };

  return {
    orderBy: { [sortFieldMap[sortField]]: sortDir as "asc" | "desc" },
  };
}

export const companyService = {
  async listCompanies(params: {
    page: number;
    perPage: number;
    search: string;
    sortBy: string;
    sortOrder: string;
  }) {
    const { page, perPage, search, sortBy, sortOrder } = params;
    const where: any = {};

    if (search) {
      where.OR = [{ name: { contains: search } }, { code: { contains: search } }];
    }

    const { orderBy } = getSortConfig(sortBy, sortOrder);
    const skip = (page - 1) * perPage;

    const [companies, total] = await Promise.all([
      companyRepository.findMany({ where, orderBy, skip, take: perPage }),
      companyRepository.count(where),
    ]);

    return {
      companies: companies.map(formatCompany),
      total,
      page,
      perPage,
    };
  },

  async getCompanyDetail(uuid: string) {
    const company = await companyRepository.findByUuid(uuid);
    if (!company) {
      throw new ApiError("Perusahaan tidak ditemukan", 404);
    }

    return formatCompany(company);
  },

  async createCompany(payload: { code: string; name: string; is_active?: boolean }) {
    const existing = await companyRepository.findByCode(payload.code);
    if (existing) {
      throw new ValidationApiError({ code: ["Kode perusahaan sudah digunakan"] });
    }

    const company = await companyRepository.create({
      code: payload.code,
      name: payload.name,
      isActive: payload.is_active ?? true,
    });

    // Seed role default tenant (administrator + kasir) untuk company baru
    await seedTenantDefaultRoles(prisma as unknown as Parameters<typeof seedTenantDefaultRoles>[0], company.uuid);

    const trialPlan = await billingRepository.findPlanByCode(FREE_PLAN_CODE);
    if (!trialPlan) {
      return formatCompany(company);
    }

    const startedAt = new Date();

    await billingRepository.createSubscription({
      companyUuid: company.uuid,
      planUuid: trialPlan.uuid,
      status: "active",
      startedAt,
      // Free selamanya: berlaku tanpa kedaluwarsa (expiresAt null).
      expiresAt: null,
    });

    const companyWithSubscription = await companyRepository.findByUuid(company.uuid);
    return formatCompany(companyWithSubscription);
  },

  async updateCompany(uuid: string, payload: { code: string; name: string; is_active?: boolean }) {
    const existingCompany = await companyRepository.findByUuid(uuid);
    if (!existingCompany) {
      throw new ApiError("Perusahaan tidak ditemukan", 404);
    }

    const existingCode = await companyRepository.findByCode(payload.code, uuid);
    if (existingCode) {
      throw new ValidationApiError({ code: ["Kode perusahaan sudah digunakan"] });
    }

    const updated = await companyRepository.update(uuid, {
      code: payload.code,
      name: payload.name,
      isActive: payload.is_active,
    });

    return formatCompany(updated);
  },

  async toggleCompanyActive(uuid: string) {
    const existingCompany = await companyRepository.findByUuid(uuid);
    if (!existingCompany) {
      throw new ApiError("Perusahaan tidak ditemukan", 404);
    }

    const updated = await companyRepository.toggleActiveByUuid(uuid, !existingCompany.isActive);
    return formatCompany(updated);
  },

  async listCompanyOptions() {
    const companies = await companyRepository.listAllActiveForSelect();
    return companies.map((company) => ({
      uuid: company.uuid,
      code: company.code,
      name: company.name,
    }));
  },
};
