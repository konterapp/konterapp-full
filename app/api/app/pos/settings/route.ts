import { z } from 'zod';
import { successResponse } from '@/lib/response';
import { withPermission } from '@/lib/api-middleware';
import { withApiErrorHandling } from '@/lib/api-error-handler';
import { validateSchema } from '@/lib/validation';
import { appCompanyService } from '@/lib/modules/companies/app.service';

const updatePosSettingsSchema = z.object({
  allow_negative_stock: z.boolean(),
});

export const GET = withPermission(
  'company.update',
  withApiErrorHandling(async (_req, context) => {
    const settings = await appCompanyService.getPosSettings(context.companyUuid);
    return successResponse('Pengaturan POS berhasil dimuat', settings);
  })
);

export const PUT = withPermission(
  'company.update',
  withApiErrorHandling(async (req, context) => {
    const body = await req.json().catch(() => ({}));
    const result = validateSchema(updatePosSettingsSchema, body);
    if (!('data' in result)) return result;

    const settings = await appCompanyService.updatePosSettings(context.companyUuid, result.data);
    return successResponse('Pengaturan POS berhasil diperbarui', settings);
  })
);