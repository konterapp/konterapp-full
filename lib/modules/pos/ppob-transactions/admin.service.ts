import { ApiError } from '@/lib/api-errors';
import { posPpobTransactionRepository } from './repository';
import { mapPpobTransaction } from './ppob-transaction.mapper';

function buildOrderBy(sortBy: string, sortOrder: 'asc' | 'desc') {
  const map: Record<string, any> = {
    transaction_number: { transactionNumber: sortOrder },
    selling_price: { sellingPrice: sortOrder },
    profit: { profit: sortOrder },
    created_at: { createdAt: sortOrder },
  };

  return map[sortBy] || map.created_at;
}

function buildDateRange(dateFrom?: string, dateTo?: string) {
  if (!dateFrom && !dateTo) return undefined;

  const range: Record<string, Date> = {};

  if (dateFrom) {
    range.gte = new Date(`${dateFrom}T00:00:00.000Z`);
  }

  if (dateTo) {
    range.lte = new Date(`${dateTo}T23:59:59.999Z`);
  }

  return range;
}

function generateProviderReference() {
  return `REF-${Date.now()}-${Math.floor(Math.random() * 1000)
    .toString()
    .padStart(3, '0')}`;
}

export const posPpobTransactionService = {
  async listTransactions(params: {
    page: number;
    perPage: number;
    search: string;
    sortBy: string;
    sortOrder: 'asc' | 'desc';
    status?: string;
    type?: string;
    branchUuid?: string;
    dateFrom?: string;
    dateTo?: string;
  }) {
    const { page, perPage, search, sortBy, sortOrder, status, type, branchUuid, dateFrom, dateTo } = params;

    const skip = (page - 1) * perPage;
    const where: any = {};

    if (search) {
      where.OR = [
        { transactionNumber: { contains: search, mode: 'insensitive' } },
        { productName: { contains: search, mode: 'insensitive' } },
        { customerNumber: { contains: search, mode: 'insensitive' } },
        { customerName: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (status) {
      where.status = status;
    }

    if (type) {
      where.type = type;
    }

    if (branchUuid) {
      where.branchUuid = branchUuid;
    }

    const createdAt = buildDateRange(dateFrom, dateTo);
    if (createdAt) {
      where.createdAt = createdAt;
    }

    const orderBy = buildOrderBy(sortBy, sortOrder);

    const [transactions, total] = await Promise.all([
      posPpobTransactionRepository.findMany({ where, skip, take: perPage, orderBy }),
      posPpobTransactionRepository.count(where),
    ]);

    return {
      data: transactions.map(mapPpobTransaction),
      pagination: {
        page,
        perPage,
        total,
        totalPages: Math.ceil(total / perPage),
      },
    };
  },

  async checkStatus(uuid: string) {
    const transaction = await posPpobTransactionRepository.findByUuid(uuid);

    if (!transaction) {
      throw new ApiError('Transaksi PPOB tidak ditemukan', 404);
    }

    if (transaction.status !== 'pending') {
      return mapPpobTransaction(transaction);
    }

    const updated = await posPpobTransactionRepository.updateByUuid(uuid, {
      status: 'success',
      providerReference: transaction.providerReference || generateProviderReference(),
      providerResponse: {
        status: 'SUCCESS',
        message: 'Status berhasil diperbarui',
        checked_at: new Date().toISOString(),
      },
    });

    return mapPpobTransaction(updated);
  },
};
