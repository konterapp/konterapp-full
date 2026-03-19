import { NextRequest } from 'next/server';
import { successResponse, errorResponse } from '@/lib/response';
import { prisma } from '@/lib/prisma';
import { withPermission } from '@/lib/api-middleware';

// GET /api/admin/pos/products - List all products
export const GET = withPermission('admin.pos.product.index', async (req: NextRequest) => {
  try {
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1');
    const perPage = parseInt(searchParams.get('per_page') || '10');
    const search = searchParams.get('search') || '';
    const categoryUuid = searchParams.get('category_uuid');
    const branchUuid = searchParams.get('branch_uuid');
    const isActive = searchParams.get('is_active');
    const inStockOnly = searchParams.get('in_stock');

    const skip = (page - 1) * perPage;

    const where: any = {};

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { sku: { contains: search, mode: 'insensitive' } },
        { barcode: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (categoryUuid) {
      where.categoryUuid = categoryUuid;
    }

    if (isActive !== null && isActive !== undefined) {
      where.isActive = isActive === 'true';
    }

    if (inStockOnly === 'true' && branchUuid) {
      where.stockItems = {
        some: {
          branchUuid,
          stock: { gt: 0 },
        },
      };
    }

    const [products, total] = await Promise.all([
      prisma.posProduct.findMany({
        where,
        skip,
        take: perPage,
        orderBy: { createdAt: 'desc' },
        include: {
          category: {
            select: { uuid: true, name: true },
          },
          stockItems: branchUuid
            ? {
                where: { branchUuid },
                select: { branchUuid: true, stock: true },
              }
            : true,
          _count: {
            select: { stockItems: true },
          },
        },
      }),
      prisma.posProduct.count({ where }),
    ]);

    // Transform products to include stock per branch
    const transformedProducts = products.map(product => {
      const stockData = product.stockItems.reduce((acc, item) => {
        acc[item.branchUuid] = item.stock;
        return acc;
      }, {} as Record<string, number>);

      const totalStock = Object.values(stockData).reduce((a, b) => a + b, 0);

      return {
        ...product,
        stocks: product.stockItems.map(item => ({
          branch_uuid: item.branchUuid,
          stock: item.stock,
        })),
        total_stock: branchUuid ? stockData[branchUuid] || 0 : totalStock,
      };
    });

    return successResponse('Products retrieved successfully', {
      data: transformedProducts,
      pagination: {
        page,
        perPage,
        total,
        totalPages: Math.ceil(total / perPage),
      },
    });
  } catch (error: any) {
    console.error('Error fetching products:', error);
    return errorResponse('Failed to fetch products', 500);
  }
});

// POST /api/admin/pos/products - Create new product
export const POST = withPermission('admin.pos.product.create', async (req: NextRequest) => {
  try {
    const body = await req.json();
    const {
      categoryUuid,
      name,
      sku,
      description,
      barcode,
      sellingPrice,
      minSellingPrice,
      minStock,
      unit,
      isActive,
      image,
      initialStock,
      branchUuid,
    } = body;

    // Validation
    if (!categoryUuid || !name || !sku || !sellingPrice) {
      return errorResponse('Category, name, SKU, and selling price are required', 400);
    }

    // Check if SKU already exists
    const existingProduct = await prisma.posProduct.findUnique({
      where: { sku },
    });

    if (existingProduct) {
      return errorResponse('Product SKU already exists', 400);
    }

    // Check if barcode exists (if provided)
    if (barcode) {
      const existingBarcode = await prisma.posProduct.findFirst({
        where: { barcode },
      });

      if (existingBarcode) {
        return errorResponse('Product barcode already exists', 400);
      }
    }

    // Create product with initial stock if branch is provided
    const product = await prisma.posProduct.create({
      data: {
        categoryUuid,
        name,
        sku,
        description: description || null,
        barcode: barcode || null,
        sellingPrice: parseFloat(sellingPrice),
        minSellingPrice: minSellingPrice ? parseFloat(minSellingPrice) : null,
        minStock: minStock || 0,
        unit: unit || 'pcs',
        isActive: isActive ?? true,
        image: image || null,
        stockItems:
          initialStock && branchUuid
            ? {
                create: {
                  branchUuid,
                  stock: parseInt(initialStock),
                },
              }
            : undefined,
      },
      include: {
        category: {
          select: { uuid: true, name: true },
        },
        stockItems: true,
      },
    });

    return successResponse('Product created successfully', product);
  } catch (error: any) {
    console.error('Error creating product:', error);
    return errorResponse('Failed to create product', 500);
  }
}
