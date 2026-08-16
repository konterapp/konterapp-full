import { successResponse } from "@/lib/response";
import { withAdministratorAuth } from "@/lib/administrator-api-middleware";
import { withApiErrorHandling } from "@/lib/api-error-handler";
import { validateSchema } from "@/lib/validation";
import { updateCompanySchema } from "@/lib/validations/company";
import { companyService } from "@/lib/modules/company/admin.service";

export const GET = withAdministratorAuth(
  withApiErrorHandling(async (_req, context) => {
    const params = await context.params;
    const uuid = params.uuid;

    const result = await companyService.getCompanyDetail(uuid);
    return successResponse("Perusahaan retrieved successfully", result);
  })
);

export const PATCH = withAdministratorAuth(
  withApiErrorHandling(async (req, context) => {
    const params = await context.params;
    const uuid = params.uuid;

    const body = await req.json();
    const validated = validateSchema(updateCompanySchema, body);
    if (!("data" in validated)) return validated;

    const result = await companyService.updateCompany(uuid, validated.data);
    return successResponse("Perusahaan berhasil diperbarui", result);
  })
);
