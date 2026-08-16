import { NextRequest } from 'next/server';
import { successResponse } from '@/lib/response';
import { withPermission } from '@/lib/api-middleware';
import { withApiErrorHandling } from '@/lib/api-error-handler';
import { validateSchema } from '@/lib/validation';
import { updateTenantCompanySchema } from '@/lib/validations/company';
import { appCompanyService } from '@/lib/modules/companies/app.service';

export const GET = withPermission(
  'company.update',
  withApiErrorHandling(async (_req: NextRequest, context) => {
    const company = await appCompanyService.getCompanyDetail(context.companyUuid);
    return successResponse('Data perusahaan berhasil dimuat', company);
  })
);

export const PUT = withPermission(
  'company.update',
  withApiErrorHandling(async (req: NextRequest, context) => {
    const body = await req.json();
    const result = validateSchema(updateTenantCompanySchema, body);
    if (!('data' in result)) return result;

    const company = await appCompanyService.updateCompany(context.companyUuid, result.data);
    return successResponse('Perusahaan berhasil diperbarui', company);
  })
);
