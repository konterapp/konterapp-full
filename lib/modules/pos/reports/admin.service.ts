import { posReportRepository } from './repository';

const pad2 = (value: number) => String(value).padStart(2, '0');
const formatDate = (date: Date) => `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`;
const round2 = (value: number) => Math.round(value * 100) / 100;

export const posReportService = {
  async getProfitLoss(params: { dateFromParam: string | null; dateToParam: string | null; branchUuid?: string }) {
    const { dateFromParam, dateToParam, branchUuid } = params;

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

    const totalTransactions = await posReportRepository.countSales(saleWhere);
    const soldProducts = await posReportRepository.groupSoldProducts(saleWhere);
    const avgPurchaseRows = await posReportRepository.groupPurchaseAverageRows();

    const avgPurchaseMap = new Map<string, number>();
    avgPurchaseRows.forEach((row) => {
      const qty = Number(row._sum.quantity || 0);
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
      const branch = await posReportRepository.findBranch(branchUuid);
      if (branch) {
        branchInfo = { uuid: branch.uuid, name: branch.name };
      }
    }

    return {
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
  },
};
