import { z } from "zod";
import { successResponse } from "@/lib/response";
import { withAuth } from "@/lib/api-middleware";
import { withApiErrorHandling } from "@/lib/api-error-handler";
import { validateSchema } from "@/lib/validation";
import { billingTenantService } from "@/lib/modules/billing/tenant.service";
import { STARTER_YEARLY_PLAN_CODE } from "@/lib/modules/billing/constants";

const checkoutSchema = z.object({
  plan_code: z
    .string()
    .trim()
    .min(1, "Paket wajib diisi")
    .max(50, "Paket maksimal 50 karakter")
    .default(STARTER_YEARLY_PLAN_CODE),
  coupon_code: z
    .string()
    .trim()
    .toUpperCase()
    .optional()
    .nullable(),
  use_referral_balance: z.boolean().optional().default(false),
});

export const POST = withAuth(
  withApiErrorHandling(async (req, context) => {
    const body = await req.json().catch(() => ({}));
    const result = validateSchema(checkoutSchema, body);
    if (!("data" in result)) return result;

    const origin = req.headers.get("origin");
    const redirectUrl = origin ? `${origin}/app/billing` : undefined;
    const invoice = await billingTenantService.createCheckoutInvoice(
      context.companyUuid,
      context.userId,
      result.data.plan_code,
      result.data.coupon_code || null,
      redirectUrl,
      result.data.use_referral_balance
    );
    return successResponse("Invoice checkout berhasil dibuat", invoice, 201);
  })
);
