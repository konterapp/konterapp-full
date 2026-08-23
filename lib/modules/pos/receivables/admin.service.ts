import { Prisma } from '@prisma/client';
import { mapReceivableSale } from './receivable.mapper';
import { posReceivableRepository } from './repository';
import { posBranchService } from '@/lib/modules/pos/branches/admin.service';

type ReceivableStatus = 'pending' | 'partial';

function buildDateRange(startDate?: string | null, endDate?: string | null): Prisma.DateTimeFilter | undefined {
  if (!startDate && !endDate) return undefined;

  const range: Prisma.DateTimeFilter = {};
  if (startDate) {
    range.gte = new Date(startDate);
  }
  if (endDate) {
    range.lte = new Date(endDate);
  }

  return range;
}

function normalizeStatuses(paymentStatus?: string | null): ReceivableStatus[] {
  if (paymentStatus === 'pending' || paymentStatus === 'partial') {
    return [paymentStatus];
  }
  return ['pending', 'partial'];
}

export const posReceivableService = {
  async listReceivables(params: {
    page: number;
    perPage: number;
    search: string;
    branchUuid: string | null;
    customerUuid: string | null;
    paymentStatus: string | null;
    startDate: string | null;
    endDate: string | null;
    sortBy: string | null;
    sortOrder: 'asc' | 'desc' | null;
    companyUuid: string;
    userId: number;
  }) {
    const {
      page,
      perPage,
      search,
      branchUuid,
      customerUuid,
      paymentStatus,
      startDate,
      endDate,
      sortBy,
      sortOrder,
      companyUuid,
      userId,
    } = params;

    const skip = (page - 1) * perPage;
    const statuses = normalizeStatuses(paymentStatus);

    const where: Prisma.AppPosSaleWhereInput = {
      paymentStatus: { in: statuses },
    };

    if (search) {
      where.OR = [
        { saleNumber: { contains: search, mode: 'insensitive' } },
        { customer: { name: { contains: search, mode: 'insensitive' } } },
        { customer: { phone: { contains: search, mode: 'insensitive' } } },
      ];
    }

    if (branchUuid) {
      where.branchUuid = branchUuid;
    }

    if (customerUuid) {
      where.customerUuid = customerUuid;
    }

    const saleDateFilter = buildDateRange(startDate, endDate);
    if (saleDateFilter) {
      where.saleDate = saleDateFilter;
    }

    const safeSortOrder: 'asc' | 'desc' = sortOrder === 'asc' ? 'asc' : 'desc';
    const sortMap: Record<string, Prisma.AppPosSaleOrderByWithRelationInput> = {
      sale_number: { saleNumber: safeSortOrder },
      sale_date: { saleDate: safeSortOrder },
      total_amount: { totalAmount: safeSortOrder },
      paid_amount: { paidAmount: safeSortOrder },
      payment_status: { paymentStatus: safeSortOrder },
      created_at: { createdAt: safeSortOrder },
    };

    const orderBy = sortMap[sortBy || 'sale_date'] || sortMap.sale_date;

    const [sales, total, aggregate, customerCount, branches, customers] = await Promise.all([
      posReceivableRepository.findMany({ where, skip, take: perPage, orderBy }),
      posReceivableRepository.count(where),
      posReceivableRepository.aggregateAmounts(where),
      posReceivableRepository.countDistinctCustomers(where),
      posBranchService.listBranchOptions(companyUuid, userId),
      posReceivableRepository.listCustomers(),
    ]);

    const totalAmount = Number(aggregate._sum.totalAmount || 0);
    const paidAmount = Number(aggregate._sum.paidAmount || 0);
    const outstandingAmount = Math.max(totalAmount - paidAmount, 0);

    return {
      data: sales.map(mapReceivableSale),
      summary: {
        invoice_count: total,
        customer_count: customerCount,
        total_amount: totalAmount,
        paid_amount: paidAmount,
        outstanding_amount: outstandingAmount,
      },
      filters: {
        branches,
        customers,
      },
      pagination: {
        page,
        perPage,
        total,
        totalPages: Math.ceil(total / perPage),
      },
    };
  },
};
