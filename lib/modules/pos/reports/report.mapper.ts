export function mapProfitLossProduct(params: {
  productUuid: string;
  productName: string;
  sku: string;
  qtySold: number;
  avgPurchasePrice: number;
  avgSellingPrice: number;
  revenue: number;
  cogs: number;
  profit: number;
  marginPct: number;
}) {
  const { productUuid, productName, sku, qtySold, avgPurchasePrice, avgSellingPrice, revenue, cogs, profit, marginPct } =
    params;

  return {
    product_uuid: productUuid,
    product_name: productName,
    sku,
    qty_sold: qtySold,
    avg_purchase_price: avgPurchasePrice,
    avg_selling_price: avgSellingPrice,
    total_revenue: revenue,
    total_cogs: cogs,
    profit,
    margin_percentage: marginPct,
  };
}

export function mapProfitLossReport(params: {
  dateFrom: string;
  dateTo: string;
  branchInfo: { uuid: string; name: string } | null;
  totalRevenue: number;
  totalCogs: number;
  totalProfit: number;
  overallMargin: number;
  totalTransactions: number;
  totalItemsSold: number;
  totalAdminFee: number;
  totalExpenses: number;
  netProfit: number;
  products: Array<any>;
}) {
  const {
    dateFrom,
    dateTo,
    branchInfo,
    totalRevenue,
    totalCogs,
    totalProfit,
    overallMargin,
    totalTransactions,
    totalItemsSold,
    totalAdminFee,
    totalExpenses,
    netProfit,
    products,
  } = params;

  return {
    period: {
      from: dateFrom,
      to: dateTo,
    },
    branch: branchInfo,
    summary: {
      total_revenue: totalRevenue,
      total_cogs: totalCogs,
      total_profit: totalProfit,
      margin_percentage: overallMargin,
      total_transactions: totalTransactions,
      total_items_sold: totalItemsSold,
      // Total Pengeluaran -- skrg cuma biaya admin bank (blm ada modul
      // Pengeluaran umum), lihat komentar di admin.service.ts.
      total_admin_fee: totalAdminFee,
      total_expenses: totalExpenses,
      net_profit: netProfit,
    },
    products,
  };
}
