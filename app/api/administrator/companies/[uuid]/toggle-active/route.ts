import { successResponse } from "@/lib/response";
import { withAdministratorAuth } from "@/lib/administrator-api-middleware";
import { withApiErrorHandling } from "@/lib/api-error-handler";
import { companyService } from "@/lib/modules/company/admin.service";

export const PATCH = withAdministratorAuth(
  withApiErrorHandling(async (_req, context) => {
    const params = await context.params;
    const uuid = params.uuid;

    const result = await companyService.toggleCompanyActive(uuid);
    const message = result.is_active ? "Perusahaan berhasil diaktifkan" : "Perusahaan berhasil dinonaktifkan";

    return successResponse(message, result);
  })
);
