import { ApiError } from "@/lib/api-errors";
import { prisma } from "@/lib/prisma";

function formatCompany(company: {
  uuid: string;
  code: string;
  name: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}) {
  return {
    uuid: company.uuid,
    code: company.code,
    name: company.name,
    is_active: company.isActive,
    created_at: company.createdAt,
    updated_at: company.updatedAt,
  };
}

/**
 * Service profil perusahaan untuk sisi tenant (/app). Company uuid selalu
 * dari company context session (context.companyUuid), bukan input user.
 */
export const appCompanyService = {
  async getCompanyDetail(companyUuid: string) {
    const company = await prisma.company.findUnique({
      where: { uuid: companyUuid },
    });
    if (!company) {
      throw new ApiError("Perusahaan tidak ditemukan", 404);
    }
    return formatCompany(company);
  },

  async updateCompany(companyUuid: string, data: { name: string }) {
    const company = await prisma.company.update({
      where: { uuid: companyUuid },
      data: { name: data.name },
    });
    return formatCompany(company);
  },
};
