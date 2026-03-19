import { NextRequest } from 'next/server';
import { successResponse, errorResponse } from '@/lib/response';
import { prisma } from '@/lib/prisma';
import { withPermission } from '@/lib/api-middleware';

// GET /api/admin/pos/transactions - List all transactions
export const GET = withPermission('admin.pos.sale.index', async (req: NextRequest) => {
  try {
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1');
    const perPage = parseInt(searchParams.get('per_page') || '10');
    const search = searchParams.get('search') || '';
    const branchUuid = searchParams.get('branch_uuid');
    const startDate = searchParams.get('start_date');
    const endDate = searchParams.get('end_date');
    const paymentStatus = searchParams.get('payment_status');

    const skip = (page - 1) * perPage;

    const where: any = { deletedAt: null };

    if (search) {
      where.OR = [
        { saleNumber: { contains: search, mode: 'insensitive' } },
        { customer: { name: { contains: search, mode: 'insensitive' } } },
      ];
    }

    if (branchUuid) {
      where.branchUuid = branchUuid;
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

    const [sales, total] = await Promise.all([
      prisma.posSale.findMany({
        where,
        skip,
        take: perPage,
        orderBy: { createdAt: 'desc' },
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
          items: {
            include: {
              product: {
                select: { uuid: true, name: true, sku: true, image: true },
              },
            },
          },
        },
      }),
      prisma.posSale.count({ where }),
    ]);

    return successResponse('Transactions retrieved successfully', {
      data: sales,
      pagination: {
        page,
        perPage,
        total,
        totalPages: Math.ceil(total / perPage),
      },
    });
  } catch (error: any) {
    console.error('Error fetching transactions:', error);
    return errorResponse('Failed to fetch transactions', 500);
  }
});

// POST /api/admin/pos/transactions - Create new sale (Kasir)
export const POST = withPermission('admin.pos.sale.create', async (req: NextRequest, context) => {
  try {
    const body = await req.json();
    const {
      branchUuid,
      customerUuid,
      paymentMethodUuid,
      saleDate,
      items,
      discountAmount,
      paidAmount,
      notes,
    } = body;

    // Validation
    if (!branchUuid || !paymentMethodUuid || !items || items.length === 0) {
      return errorResponse('Branch, payment method, and items are required', 400);
    }

    // Get current user
    const currentUser = { id: context.userId };

    if (!currentUser) {
      return errorResponse('User not found', 404);
    }

    // Generate sale number
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const random = Math.floor(Math.random() * 1000)
      .toString()
      .padStart(3, '0');
    const saleNumber = `INV-${year}${month}${day}-${random}`;

    // Calculate totals
    let subtotal = 0;
    let totalDiscount = discountAmount || 0;

    for (const item of items) {
      const itemSubtotal = item.quantity * parseFloat(item.unit_price);
      const itemDiscount = item.discount || 0;
      subtotal += itemSubtotal;
      totalDiscount += itemDiscount;
    }

    const totalAmount = subtotal - totalDiscount;

    // Start transaction
    const sale = await prisma.$transaction(async tx => {
      // Check stock for each item
      for (const item of items) {
        const stock = await tx.posProductStock.findFirst({
          where: {
            productUuid: item.productUuid,
            branchUuid,
          },
        });

        if (!stock || stock.stock < item.quantity) {
          throw new Error(
            `Stok ${item.productUuid} tidak cukup (tersedia: ${stock?.stock || 0})`
          );
        }
      }

      // Create sale
      const createdSale = await tx.posSale.create({
        data: {
          saleNumber,
          branchUuid,
          customerUuid: customerUuid || null,
          paymentMethodUuid,
          saleDate: saleDate || new Date().toISOString().split('T')[0],
          subtotal,
          discountAmount: totalDiscount,
          totalAmount,
          paidAmount: paidAmount || totalAmount,
          changeAmount: (paidAmount || totalAmount) - totalAmount,
          paymentStatus: 'paid',
          notes: notes || null,
          createdBy: currentUser.id,
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

      // Create sale items and update stock
      for (const item of items) {
        // Create sale item
        await tx.posSaleItem.create({
          data: {
            saleUuid: createdSale.uuid,
            productUuid: item.productUuid,
            quantity: item.quantity,
            unitPrice: parseFloat(item.unit_price),
            discount: item.discount || 0,
            subtotal: item.quantity * parseFloat(item.unit_price) - (item.discount || 0),
          },
        });

        // Update stock
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

        // Create stock movement
        const product = await tx.posProduct.findUnique({
          where: { uuid: item.productUuid },
          select: { name: true },
        });

        await tx.posStockMovement.create({
          data: {
            branchUuid,
            productUuid: item.productUuid,
            movementType: 'out',
            quantity: item.quantity,
            previousStock: 0, // Will be updated in trigger or recalculate
            newStock: 0,
            referenceType: 'sale',
            referenceUuid: createdSale.uuid,
            notes: `Sale: ${saleNumber}`,
            createdBy: currentUser.id,
          },
        });
      }

      return createdSale;
    });

    return successResponse('Sale created successfully', sale);
  } catch (error: any) {
    console.error('Error creating sale:', error);
    return errorResponse(error.message || 'Failed to create sale', 500);
  }
}
