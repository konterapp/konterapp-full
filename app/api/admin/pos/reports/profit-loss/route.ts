import { NextRequest } from 'next/server';
import { successResponse, errorResponse } from '@/lib/response';
import { prisma } from '@/lib/prisma';
import { withPermission } from '@/lib/api-middleware';

const pad2 = (value: number) => String(value).padStart(2, '0');
const formatDate = (date: Date) => {
  return date.getFullYear() + '-' + pad2(date.getMonth() + 1) + '-' + pad2(date.getDate());
};
const round2 = (value: number) => Math.round(value * 100) / 100;

// GET /api/admin/pos/reports/profit-loss
export const GET = withPermission('admin.pos.report.index', async (req: NextRequest) => {
  try {
    const { searchParams } = new URL(req.url);
    const dateFromParam = searchParams.get('date_from');
    const dateToParam = searchParams.get('date_to');
    const branchUuid = searchParams.get('branch_uuid') || undefined;

    const now = new Date();
    const defaultFrom = new Date(now.getFullYear(), now.getMonth(), 1);
    const defaultTo = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const dateFrom = dateFromParam || formatDate(defaultFrom);
    const dateTo = dateToParam || formatDate(defaultTo);

    const saleWhere: any = {
      saleDate: {
        gte: new Date(dateFrom),
        lte: new Date(dateTo),
      },
    };

    if (branchUuid) {
      saleWhere.branchUuid = branchUuid;
    }

    const totalTransactions = await prisma.posSale.count({ where: saleWhere });

    const soldProducts = await prisma.posSaleItem.groupBy({
      by: ['productUuid'],
      where: {
        sale: saleWhere,
      },
      _sum: {
        quantity: true,
        subtotal: true,
      },
    });

    const avgPurchaseRows = await prisma.posPurchaseItem.groupBy({
      by: ['productUuid'],
      _sum: {
        quantity: true,
        subtotal: true,
      },
    });

    const avgPurchaseMap = new Map<string, number>();
    avgPurchaseRows.forEach((row) => {
      const qty = Number(row._sum.quantity || 0);
      const subtotal = Number(row._sum.subtotal || 0);
      const avgPrice = qty > 0 ? subtotal / qty : 0;
      avgPurchaseMap.set(row.productUuid, avgPrice);
    });

    const productUuids = soldProducts.map((row) => row.productUuid);
    const products = productUuids.length > 0
      ? await prisma.posProduct.findMany({
          where: { uuid: { in: productUuids } },
          select: { uuid: true, name: true, sku: true },
        })
      : [];

    const productMap = new Map(products.map((product) => [product.uuid, product]));

    let totalRevenue = 0;
    let totalCogs = 0;
    let totalItemsSold = 0;

    const productDetails = soldProducts.map((item) => {
      const qtySold = Number(item._sum.quantity || 0);
      const revenue = Number(item._sum.subtotal || 0);
      const avgSellingPrice = qtySold > 0 ? revenue / qtySold : 0;
      const avgPurchasePrice = avgPurchaseMap.get(item.productUuid) || 0;
      const cogs = avgPurchasePrice * qtySold;
      const profit = revenue - cogs;
      const marginPct = revenue > 0 ? round2((profit / revenue) * 100) : 0;

      totalRevenue += revenue;
      totalCogs += cogs;
      totalItemsSold += qtySold;

      const product = productMap.get(item.productUuid);

      return {
        product_uuid: item.productUuid,
        product_name: product ? product.name : 'Produk Dihapus',
        sku: product ? product.sku : '-',
        qty_sold: qtySold,
        avg_purchase_price: round2(avgPurchasePrice),
        avg_selling_price: round2(avgSellingPrice),
        total_revenue: round2(revenue),
        total_cogs: round2(cogs),
        profit: round2(profit),
        margin_percentage: marginPct,
      };
    });

    productDetails.sort((a, b) => b.profit - a.profit);

    const totalProfit = totalRevenue - totalCogs;
    const overallMargin = totalRevenue > 0 ? round2((totalProfit / totalRevenue) * 100) : 0;

    let branchInfo = null;
    if (branchUuid) {
      const branch = await prisma.posBranch.findFirst({
        where: { uuid: branchUuid },
        select: { uuid: true, name: true },
      });
      if (branch) {
        branchInfo = { uuid: branch.uuid, name: branch.name };
      }
    }

    const data = {
      period: {
        from: dateFrom,
        to: dateTo,
      },
      branch: branchInfo,
      summary: {
        total_revenue: round2(totalRevenue),
        total_cogs: round2(totalCogs),
        total_profit: round2(totalProfit),
        margin_percentage: overallMargin,
        total_transactions: totalTransactions,
        total_items_sold: totalItemsSold,
      },
      products: productDetails,
    };

    return successResponse('Profit/Loss report retrieved successfully', data);
  } catch (error: any) {
    console.error('Error fetching profit/loss report:', error);
    return errorResponse('Failed to fetch profit/loss report', 500);
  }
});
