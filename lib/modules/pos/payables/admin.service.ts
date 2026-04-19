import { Prisma } from '@prisma/client';
import { mapPayablePurchase } from './payable.mapper';
import { posPayableRepository } from './repository';

type PayableStatus = 'pending' | 'partial';

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

function normalizeStatuses(paymentStatus?: string | null): PayableStatus[] {
  if (paymentStatus === 'pending' || paymentStatus === 'partial') {
    return [paymentStatus];
  }
  return ['pending', 'partial'];
}

export const posPayableService = {
  async listPayables(params: {
    page: number;
    perPage: number;
    search: string;
    branchUuid: string | null;
    supplierUuid: string | null;
    paymentStatus: string | null;
    startDate: string | null;
    endDate: string | null;
    sortBy: string | null;
    sortOrder: 'asc' | 'desc' | null;
  }) {
    const {
      page,
      perPage,
      search,
      branchUuid,
      supplierUuid,
      paymentStatus,
      startDate,
      endDate,
      sortBy,
      sortOrder,
    } = params;

    const skip = (page - 1) * perPage;
    const statuses = normalizeStatuses(paymentStatus);

    const where: Prisma.PosPurchaseWhereInput = {
      paymentStatus: { in: statuses },
    };

    if (search) {
      where.OR = [
        { purchaseNumber: { contains: search, mode: 'insensitive' } },
        { supplier: { name: { contains: search, mode: 'insensitive' } } },
        { supplier: { code: { contains: search, mode: 'insensitive' } } },
      ];
    }

    if (branchUuid) {
      where.branchUuid = branchUuid;
    }

    if (supplierUuid) {
      where.supplierUuid = supplierUuid;
    }

    const purchaseDateFilter = buildDateRange(startDate, endDate);
    if (purchaseDateFilter) {
      where.purchaseDate = purchaseDateFilter;
    }

    const safeSortOrder: 'asc' | 'desc' = sortOrder === 'asc' ? 'asc' : 'desc';
    const sortMap: Record<string, Prisma.PosPurchaseOrderByWithRelationInput> = {
      purchase_number: { purchaseNumber: safeSortOrder },
      purchase_date: { purchaseDate: safeSortOrder },
      total_amount: { totalAmount: safeSortOrder },
      paid_amount: { paidAmount: safeSortOrder },
      payment_status: { paymentStatus: safeSortOrder },
      created_at: { createdAt: safeSortOrder },
    };

    const orderBy = sortMap[sortBy || 'purchase_date'] || sortMap.purchase_date;

    const [purchases, total, aggregate, supplierCount, branches, suppliers] = await Promise.all([
      posPayableRepository.findMany({ where, skip, take: perPage, orderBy }),
      posPayableRepository.count(where),
      posPayableRepository.aggregateAmounts(where),
      posPayableRepository.countDistinctSuppliers(where),
      posPayableRepository.listBranches(),
      posPayableRepository.listSuppliers(),
    ]);

    const totalAmount = Number(aggregate._sum.totalAmount || 0);
    const paidAmount = Number(aggregate._sum.paidAmount || 0);
    const outstandingAmount = Math.max(totalAmount - paidAmount, 0);

    return {
      data: purchases.map(mapPayablePurchase),
      summary: {
        invoice_count: total,
        supplier_count: supplierCount,
        total_amount: totalAmount,
        paid_amount: paidAmount,
        outstanding_amount: outstandingAmount,
      },
      filters: {
        branches,
        suppliers,
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
