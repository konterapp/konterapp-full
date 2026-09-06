import { successResponse, errorResponse } from "@/lib/response";
import { withAdministratorAuth } from "@/lib/administrator-api-middleware";
import { withApiErrorHandling } from "@/lib/api-error-handler";
import { getAdministratorSession } from "@/lib/administrator-session";
import { validateSchema } from "@/lib/validation";
import { markInvoicePaidSchema } from "@/lib/validations/billing";
import { billingAdminService } from "@/lib/modules/billing/admin.service";

export const POST = withAdministratorAuth(
  withApiErrorHandling(async (req, context) => {
    const session = await getAdministratorSession();
    if (!session) {
      return errorResponse("Unauthenticated", 401);
    }

    const params = await context.params;
    const uuid = params.uuid;

    let body: unknown = {};
    try {
      body = await req.json();
    } catch {
      // Body boleh kosong -- catatan bukan field wajib.
    }
    const result = validateSchema(markInvoicePaidSchema, body);
    if (!("data" in result)) return result;

    const updated = await billingAdminService.markInvoicePaid(uuid, session.id, result.data.note);
    return successResponse("Invoice berhasil dilunaskan", updated);
  })
);