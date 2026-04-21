import { posReportRepository } from './repository';
import { mapProfitLossProduct, mapProfitLossReport } from './report.mapper';
import { Prisma } from '@prisma/client';

const pad2 = (value: number) => String(value).padStart(2, '0');
const formatDate = (date: Date) => `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`;
const round2 = (value: number) => Math.round(value * 100) / 100;
const DATE_FORMAT_REGEX = /^\d{4}-\d{2}-\d{2}$/;

function parseDateBoundary(value: string, endOfDay: boolean) {
  return new Date(`${value}T${endOfDay ? '23:59:59.999' : '00:00:00.000'}Z`);
}

function isValidDateValue(value: string | null): value is string {
  if (!value || !DATE_FORMAT_REGEX.test(value)) return false;
  return Number.isFinite(parseDateBoundary(value, false).getTime());
}

function resolveDateRange(dateFromParam: string | null, dateToParam: string | null) {
  const now = new Date();
  const defaultFrom = formatDate(new Date(now.getFullYear(), now.getMonth(), 1));
  const defaultTo = formatDate(new Date(now.getFullYear(), now.getMonth(), now.getDate()));

  let dateFrom = isValidDateValue(dateFromParam) ? dateFromParam : defaultFrom;
  let dateTo = isValidDateValue(dateToParam) ? dateToParam : defaultTo;

  if (dateFrom > dateTo) {
    const temp = dateFrom;
    dateFrom = dateTo;
    dateTo = temp;
  }

  return {
    dateFrom,
    dateTo,
    rangeStart: parseDateBoundary(dateFrom, false),
    rangeEnd: parseDateBoundary(dateTo, true),
  };
}

export const posReportService = {
  async getProfitLoss(params: { dateFromParam: string | null; dateToParam: string | null; branchUuid?: string }) {
    const { dateFromParam, dateToParam, branchUuid } = params;
    const { dateFrom, dateTo, rangeStart, rangeEnd } = resolveDateRange(dateFromParam, dateToParam);

    const saleWhere: Prisma.PosSaleWhereInput = {
      saleDate: {
        gte: rangeStart,
        lte: rangeEnd,
      },
    };
    const purchaseWhere: Prisma.PosPurchaseWhereInput = {
      purchaseDate: {
        lte: rangeEnd,
      },
      paymentStatus: { notIn: ['draft', 'void'] },
    };

    if (branchUuid) {
      saleWhere.branchUuid = branchUuid;
      purchaseWhere.branchUuid = branchUuid;
    }

    const totalTransactions = await posReportRepository.countSales(saleWhere);
    const soldProducts = await posReportRepository.groupSoldProducts(saleWhere);
    const avgPurchaseRows = await posReportRepository.groupPurchaseCostRows({
      purchaseWhere,
      productUuids: soldProducts.map((row) => row.productUuid),
    });

    const avgPurchaseMap = new Map<string, number>();
    avgPurchaseRows.forEach((row) => {
      const qty = Number(row._sum.quantityBase || 0);
      const subtotal = Number(row._sum.subtotal || 0);
      const avgPrice = qty > 0 ? subtotal / qty : 0;
      avgPurchaseMap.set(row.productUuid, avgPrice);
    });

    const productUuids = soldProducts.map((row) => row.productUuid);
    const products = await posReportRepository.findProductsByUuids(productUuids);
    const productMap = new Map(products.map((product) => [product.uuid, product]));

    let totalRevenue = 0;
    let totalCogs = 0;
    let totalItemsSold = 0;

    const productDetails = soldProducts.map((item) => {
      const qtySold = Number(item._sum.quantity || 0);
      const revenue = Number(item._sum.subtotal || 0);
      const avgSellingPrice = qtySold > 0 ? revenue / qtySold : 0;
      const product = productMap.get(item.productUuid);
      const avgPurchasePrice =
        avgPurchaseMap.get(item.productUuid) ?? Number(product?.purchasePrice || 0);
      const cogs = avgPurchasePrice * qtySold;
      const profit = revenue - cogs;
      const marginPct = revenue > 0 ? round2((profit / revenue) * 100) : 0;

      totalRevenue += revenue;
      totalCogs += cogs;
      totalItemsSold += qtySold;

      return mapProfitLossProduct({
        productUuid: item.productUuid,
        productName: product ? product.name : 'Produk Dihapus',
        sku: product ? product.sku : '-',
        qtySold,
        avgPurchasePrice: round2(avgPurchasePrice),
        avgSellingPrice: round2(avgSellingPrice),
        revenue: round2(revenue),
        cogs: round2(cogs),
        profit: round2(profit),
        marginPct,
      });
    });

    productDetails.sort((a, b) => b.profit - a.profit);

    const totalProfit = totalRevenue - totalCogs;
    const overallMargin = totalRevenue > 0 ? round2((totalProfit / totalRevenue) * 100) : 0;

    let branchInfo = null;
    if (branchUuid) {
      const branch = await posReportRepository.findBranch(branchUuid);
      if (branch) {
        branchInfo = { uuid: branch.uuid, name: branch.name };
      }
    }

    return mapProfitLossReport({
      dateFrom,
      dateTo,
      branchInfo,
      totalRevenue: round2(totalRevenue),
      totalCogs: round2(totalCogs),
      totalProfit: round2(totalProfit),
      overallMargin,
      totalTransactions,
      totalItemsSold,
      products: productDetails,
    });
  },
};
