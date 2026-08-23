import { NextRequest } from 'next/server';
import { successResponse } from '@/lib/response';
import { withPermission } from '@/lib/api-middleware';
import { withApiErrorHandling } from '@/lib/api-error-handler';
import { validateSchema } from '@/lib/validation';
import { createBranchSchema } from '@/lib/validations/branch';
import { posBranchService } from '@/lib/modules/pos/branches/admin.service';

export const GET = withPermission(
  'pos.branch.index',
  withApiErrorHandling(async (req: NextRequest) => {
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1');
    const perPage = parseInt(searchParams.get('per_page') || '10');
    const search = searchParams.get('search') || '';
    const isActive = searchParams.get('is_active');

    const result = await posBranchService.listBranches({
      page,
      perPage,
      search,
      isActive,
    });

    return successResponse('Branches retrieved successfully', result);
  })
);

export const POST = withPermission(
  'pos.branch.create',
  withApiErrorHandling(async (req: NextRequest, context: { companyUuid: string }) => {
    const rawBody = await req.json();
    const body = {
      ...rawBody,
      isActive: rawBody.isActive ?? rawBody.is_active,
      isMain: rawBody.isMain ?? rawBody.is_main,
      copySaldoFromBranchUuid: rawBody.copySaldoFromBranchUuid ?? rawBody.copy_saldo_from_branch_uuid,
    };

    const result = validateSchema(createBranchSchema, body);
    if (!('data' in result)) return result;

    const branch = await posBranchService.createBranch(context.companyUuid, result.data);
    return successResponse('Branch created successfully', branch);
  })
);
