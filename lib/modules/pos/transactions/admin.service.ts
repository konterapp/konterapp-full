import { ApiError, ValidationApiError } from '@/lib/api-errors';
import { posTransactionRepository } from './repository';
import { mapTransaction } from './transaction.mapper';
import { Prisma } from '@prisma/client';
import { posShiftRepository } from '../shifts/repository';

function generateSaleNumber() {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const random = Math.floor(Math.random() * 1000)
    .toString()
    .padStart(3, '0');

  return `INV-${year}${month}${day}-${random}`;
}

export const posTransactionService = {
  async listTransactions(params: {
    page: number;
    perPage: number;
    search: string;
    branchUuid: string | null;
    paymentMethodUuid: string | null;
    startDate: string | null;
    endDate: string | null;
    paymentStatus: string | null;
    sortBy?: string | null;
    sortOrder?: 'asc' | 'desc' | null;
  }) {
    const { page, perPage, search, branchUuid, paymentMethodUuid, startDate, endDate, paymentStatus, sortBy, sortOrder } = params;
    const skip = (page - 1) * perPage;

    const where: Prisma.PosSaleWhereInput = {};

    if (search) {
      where.OR = [
        { saleNumber: { contains: search, mode: 'insensitive' } },
        { customer: { name: { contains: search, mode: 'insensitive' } } },
      ];
    }

    if (branchUuid) {
      where.branchUuid = branchUuid;
    }

    if (paymentMethodUuid) {
      where.paymentMethodUuid = paymentMethodUuid;
    }

    if (startDate && endDate) {
      where.saleDate = {
        gte: new Date(startDate),
        lte: new Date(endDate),
      };
    } else if (startDate) {
      where.saleDate = { gte: new Date(startDate) };
    } else if (endDate) {
      where.saleDate = { lte: new Date(endDate) };
    }

    if (paymentStatus) {
      where.paymentStatus = paymentStatus;
    }

    const safeSortOrder: 'asc' | 'desc' = sortOrder === 'asc' ? 'asc' : 'desc';
    const sortMap: Record<string, Prisma.PosSaleOrderByWithRelationInput> = {
      sale_number: { saleNumber: safeSortOrder },
      sale_date: { saleDate: safeSortOrder },
      total_amount: { totalAmount: safeSortOrder },
      payment_status: { paymentStatus: safeSortOrder },
      created_at: { createdAt: safeSortOrder },
    };

    const orderBy = sortMap[sortBy || 'created_at'] || sortMap.created_at;

    const [sales, total] = await Promise.all([
      posTransactionRepository.findMany({ where, skip, take: perPage, orderBy }),
      posTransactionRepository.count(where),
    ]);

    return {
      data: sales.map(mapTransaction),
      pagination: {
        page,
        perPage,
        total,
        totalPages: Math.ceil(total / perPage),
      },
    };
  },

  async createSale(
    payload: {
      branchUuid?: string;
      customerUuid?: string | null;
      paymentMethodUuid?: string;
      saleDate?: string;
      items?: Array<{
        productUuid: string;
        quantity: number;
        unit_price: string | number;
        discount?: number;
      }>;
      discountAmount?: number;
      paidAmount?: number | string;
      notes?: string | null;
    },
    userId: number
  ) {
    const { branchUuid, customerUuid, paymentMethodUuid, saleDate, items, discountAmount, paidAmount, notes } = payload;

    if (!branchUuid || !paymentMethodUuid || !items || items.length === 0) {
      throw new ValidationApiError({ items: ['Branch, payment method, and items are required'] });
    }

    const activeShift = await posShiftRepository.findOpenByUser(userId);
    if (!activeShift) {
      throw new ApiError('Shift kasir belum dibuka. Buka shift terlebih dahulu sebelum transaksi.', 400);
    }

    if (activeShift.branchUuid !== branchUuid) {
      throw new ApiError(
        `Shift aktif berada di cabang ${activeShift.branch?.name || activeShift.branchUuid}. Gunakan cabang shift aktif atau tutup shift terlebih dahulu.`,
        400
      );
    }

    const saleNumber = generateSaleNumber();

    let subtotal = 0;
    let totalDiscount = discountAmount || 0;

    for (const item of items) {
      const itemSubtotal = item.quantity * Number(item.unit_price);
      const itemDiscount = item.discount || 0;
      subtotal += itemSubtotal;
      totalDiscount += itemDiscount;
    }

    const totalAmount = subtotal - totalDiscount;
    const parsedPaidAmount =
      paidAmount === undefined || paidAmount === null || paidAmount === ''
        ? totalAmount
        : Number(paidAmount);

    if (Number.isNaN(parsedPaidAmount) || parsedPaidAmount < 0) {
      throw new ValidationApiError({ paidAmount: ['Nominal bayar tidak valid'] });
    }

    const finalPaidAmount = parsedPaidAmount;
    const changeAmount = Math.max(finalPaidAmount - totalAmount, 0);
    const paymentStatus =
      finalPaidAmount <= 0
        ? 'pending'
        : finalPaidAmount < totalAmount
          ? 'partial'
          : 'paid';

    const sale = await posTransactionRepository.runInTransaction(async (tx: Prisma.TransactionClient) => {
      for (const item of items) {
        const stock = await tx.posProductStock.findFirst({
          where: {
            productUuid: item.productUuid,
            branchUuid,
          },
        });

        if (!stock || stock.stock < item.quantity) {
          throw new ApiError(`Stok ${item.productUuid} tidak cukup (tersedia: ${stock?.stock || 0})`, 400);
        }
      }

      const createdSale = await tx.posSale.create({
        data: {
          saleNumber,
          branchUuid,
          customerUuid: customerUuid || null,
          paymentMethodUuid,
          saleDate: saleDate ? new Date(saleDate) : new Date(),
          subtotal,
          discountAmount: totalDiscount,
          totalAmount,
          paidAmount: finalPaidAmount,
          changeAmount,
          paymentStatus,
          notes: notes || null,
          createdBy: userId,
        },
        include: {
          branch: {
            select: { uuid: true, name: true, code: true },
          },
          customer: {
            select: { uuid: true, name: true, phone: true },
          },
          paymentMethod: {
            select: { uuid: true, name: true, code: true },
          },
          creator: {
            select: { id: true, name: true, email: true },
          },
        },
      });

      for (const item of items) {
        await tx.posSaleItem.create({
          data: {
            saleUuid: createdSale.uuid,
            productUuid: item.productUuid,
            quantity: item.quantity,
            unitPrice: Number(item.unit_price),
            discount: item.discount || 0,
            subtotal: item.quantity * Number(item.unit_price) - (item.discount || 0),
          },
        });

        const stock = await tx.posProductStock.findFirst({
          where: {
            productUuid: item.productUuid,
            branchUuid,
          },
        });

        await tx.posProductStock.updateMany({
          where: {
            productUuid: item.productUuid,
            branchUuid,
          },
          data: {
            stock: {
              decrement: item.quantity,
            },
          },
        });

        await tx.posStockMovement.create({
          data: {
            branchUuid,
            productUuid: item.productUuid,
            movementType: 'out',
            quantity: item.quantity,
            previousStock: stock?.stock ?? 0,
            newStock: (stock?.stock ?? 0) - item.quantity,
            referenceType: 'sale',
            referenceUuid: createdSale.uuid,
            notes: `Sale: ${saleNumber}`,
            createdBy: userId,
          },
        });
      }

      return createdSale;
    });

    if (!sale) {
      throw new ApiError('Failed to create sale', 500);
    }

    return mapTransaction(sale);
  },

  async getTransactionDetail(uuid: string) {
    const sale = await posTransactionRepository.findByUuid(uuid);
    if (!sale) {
      throw new ApiError('Transaksi tidak ditemukan', 404);
    }

    return mapTransaction(sale);
  },
};
