import { formatSubscription } from "@/lib/modules/billing/billing.mapper";

export function formatCompany(company: any) {
  return {
    uuid: company.uuid,
    code: company.code,
    name: company.name,
    is_active: company.isActive,
    users_count: company._count?.memberships ?? 0,
    branches_count: company._count?.branches ?? 0,
    subscription: company.subscription !== undefined ? formatSubscription(company.subscription) : undefined,
    created_at: company.createdAt,
    updated_at: company.updatedAt,
  };
}
