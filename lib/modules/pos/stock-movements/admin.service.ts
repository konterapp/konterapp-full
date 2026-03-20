import { posStockMovementRepository } from './repository';
import { mapStockMovementListItem } from './stock-movement.mapper';

const roundDateEnd = (date: Date) => {
  const copy = new Date(date);
  copy.setHours(23, 59, 59, 999);
  return copy;
};

export const posStockMovementService = {
  async listStockMovements(params: {
    page: number;
    perPage: number;
    search: string;
    sortBy: string;
    sortOrder: 'asc' | 'desc';
    branchUuid: string;
    productUuid: string;
    movementType: string;
    dateFrom: string | null;
    dateTo: string | null;
  }) {
    const { page, perPage, search, sortBy, sortOrder, branchUuid, productUuid, movementType, dateFrom, dateTo } = params;

    const skip = (page - 1) * perPage;
    const where: any = {};

    if (search) {
      where.OR = [
        { product: { name: { contains: search, mode: 'insensitive' } } },
        { product: { sku: { contains: search, mode: 'insensitive' } } },
      ];
    }
    if (branchUuid) where.branchUuid = branchUuid;
    if (productUuid) where.productUuid = productUuid;
    if (movementType) where.movementType = movementType;

    if (dateFrom || dateTo) {
      const createdAt: any = {};
      if (dateFrom) createdAt.gte = new Date(dateFrom);
      if (dateTo) createdAt.lte = roundDateEnd(new Date(dateTo));
      where.createdAt = createdAt;
    }

    const sortMap: Record<string, any> = {
      created_at: { createdAt: sortOrder },
      movement_type: { movementType: sortOrder },
      quantity_change: { quantity: sortOrder },
      quantity_before: { previousStock: sortOrder },
      quantity_after: { newStock: sortOrder },
      product_name: { product: { name: sortOrder } },
      branch_name: { branch: { name: sortOrder } },
    };
    const orderBy = sortMap[sortBy] || sortMap.created_at;

    const [movements, total] = await Promise.all([
      posStockMovementRepository.findMany({ where, skip, take: perPage, orderBy }),
      posStockMovementRepository.count(where),
    ]);

    return {
      data: movements.map(mapStockMovementListItem),
      pagination: {
        page,
        perPage,
        total,
        totalPages: Math.ceil(total / perPage),
      },
    };
  },
};
