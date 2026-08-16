import { NextRequest } from 'next/server';
import { successResponse } from '@/lib/response';
import { withPermission } from '@/lib/api-middleware';
import { withApiErrorHandling } from '@/lib/api-error-handler';
import { posReportService } from '@/lib/modules/pos/reports/admin.service';

export const GET = withPermission(
  'pos.report.index',
  withApiErrorHandling(async (req: NextRequest) => {
    const { searchParams } = new URL(req.url);
    const dateFromParam = searchParams.get('date_from');
    const dateToParam = searchParams.get('date_to');
    const branchUuid = searchParams.get('branch_uuid') || undefined;

    const data = await posReportService.getProfitLoss({ dateFromParam, dateToParam, branchUuid });
    return successResponse('Profit/Loss report retrieved successfully', data);
  })
);
