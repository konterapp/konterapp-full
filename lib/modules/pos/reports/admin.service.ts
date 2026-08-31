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

async function resolveBranchInfo(branchUuid?: string) {
  if (!branchUuid) return null;
  const branch = await posReportRepository.findBranch(branchUuid);
  if (!branch) return null;
  return { uuid: branch.uuid, name: branch.name };
}

export const posReportService = {
  async getProfitLoss(params: { dateFromParam: string | null; dateToParam: string | null; branchUuid?: string }) {
    const { dateFromParam, dateToParam, branchUuid } = params;
    const { dateFrom, dateTo, rangeStart, rangeEnd } = resolveDateRange(dateFromParam, dateToParam);

    const saleWhere: Prisma.AppPosSaleWhereInput = {
      saleDate: {
        gte: rangeStart,
        lte: rangeEnd,
      },
    };
    const purchaseWhere: Prisma.AppPosPurchaseWhereInput = {
      purchaseDate: {
        lte: rangeEnd,
      },
      paymentStatus: { notIn: ['draft', 'void'] },
    };
    const bankAgentWhere: Prisma.AppPosBankAgentTransactionWhereInput = {
      createdAt: {
        gte: rangeStart,
        lte: rangeEnd,
      },
    };
    const ppobWhere: Prisma.AppPosPpobTransactionWhereInput = {
      createdAt: {
        gte: rangeStart,
        lte: rangeEnd,
      },
    };

    if (branchUuid) {
      saleWhere.branchUuid = branchUuid;
      purchaseWhere.branchUuid = branchUuid;
      bankAgentWhere.branchUuid = branchUuid;
      ppobWhere.branchUuid = branchUuid;
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

    // Produk sistem (mis. "Komisi Agen Bank", AppPosProduct.isSystem) TETAP
    // dihitung ke total pendapatan/laba di bawah -- itu pendapatan riil
    // toko. Yang dikecualikan cuma dari breakdown "Detail Per Produk" (lihat
    // filter setelah .map ini), karena HPP/rata-rata beli/margin per-produk
    // tidak relevan & menyesatkan buat baris komisi (bukan barang beneran).
    const computedRows = soldProducts.map((item) => {
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

      return {
        isSystem: product?.isSystem ?? false,
        detail: mapProfitLossProduct({
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
        }),
      };
    });

    const productDetails = computedRows.filter((row) => !row.isSystem).map((row) => row.detail);

    productDetails.sort((a, b) => b.profit - a.profit);

    const totalProfit = totalRevenue - totalCogs;
    const overallMargin = totalRevenue > 0 ? round2((totalProfit / totalRevenue) * 100) : 0;

    // Total Pengeluaran -- baru berisi biaya admin bank + biaya admin PPOB
    // (dihitung on-the-fly dari app_pos_bank_agent_transactions &
    // app_pos_ppob_transactions, pola CatatKonter), belum ada komponen lain
    // krn modul Pengeluaran umum (listrik, gaji, dst) belum dibangun. Kalau
    // nanti dibangun, tinggal ditambah ke totalExpenses ini.
    const adminFeeAgg = await posReportRepository.sumBankAgentAdminFee(bankAgentWhere);
    const totalAdminFee = Number(adminFeeAgg._sum.adminFee || 0);
    const ppobAdminFeeAgg = await posReportRepository.sumPpobAdminFee(ppobWhere);
    const totalPpobAdminFee = Number(ppobAdminFeeAgg._sum.adminFee || 0);
    const totalExpenses = totalAdminFee + totalPpobAdminFee;
    const netProfit = round2(totalProfit - totalExpenses);

    const branchInfo = await resolveBranchInfo(branchUuid);

    return mapProfitLossReport({
      dateFrom,
      dateTo,
      totalAdminFee: round2(totalAdminFee),
      totalPpobAdminFee: round2(totalPpobAdminFee),
      totalExpenses: round2(totalExpenses),
      netProfit,
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

  async getSalesSummary(params: { dateFromParam: string | null; dateToParam: string | null; branchUuid?: string }) {
    const { dateFromParam, dateToParam, branchUuid } = params;
    const { dateFrom, dateTo, rangeStart, rangeEnd } = resolveDateRange(dateFromParam, dateToParam);

    const saleWhere: Prisma.AppPosSaleWhereInput = {
      saleDate: {
        gte: rangeStart,
        lte: rangeEnd,
      },
    };

    if (branchUuid) {
      saleWhere.branchUuid = branchUuid;
    }

    const [aggregate, byPaymentStatus, dailyRows, recentRows, branchInfo] = await Promise.all([
      posReportRepository.aggregateSales(saleWhere),
      posReportRepository.groupSalesByPaymentStatus(saleWhere),
      posReportRepository.groupSalesByDate(saleWhere),
      posReportRepository.findRecentSales(saleWhere, 10),
      resolveBranchInfo(branchUuid),
    ]);

    const totalSales = Number(aggregate._sum.totalAmount || 0);
    const totalPaid = Number(aggregate._sum.paidAmount || 0);
    const totalDiscount = Number(aggregate._sum.discountAmount || 0);
    const totalTransactions = Number(aggregate._count._all || 0);
    const avgTicket = totalTransactions > 0 ? round2(totalSales / totalTransactions) : 0;

    return {
      period: {
        from: dateFrom,
        to: dateTo,
      },
      branch: branchInfo,
      summary: {
        total_sales: round2(totalSales),
        total_paid: round2(totalPaid),
        outstanding_amount: round2(Math.max(totalSales - totalPaid, 0)),
        total_discount: round2(totalDiscount),
        total_transactions: totalTransactions,
        average_ticket: round2(avgTicket),
      },
      by_payment_status: byPaymentStatus.map((row) => ({
        payment_status: row.paymentStatus,
        count: Number(row._count._all || 0),
        total_amount: round2(Number(row._sum.totalAmount || 0)),
        paid_amount: round2(Number(row._sum.paidAmount || 0)),
      })),
      daily: dailyRows.map((row) => ({
        date: formatDate(row.saleDate),
        transactions: Number(row._count._all || 0),
        total_amount: round2(Number(row._sum.totalAmount || 0)),
      })),
      recent_transactions: recentRows.map((row) => ({
        uuid: row.uuid,
        sale_number: row.saleNumber,
        sale_date: row.saleDate,
        total_amount: round2(Number(row.totalAmount || 0)),
        paid_amount: round2(Number(row.paidAmount || 0)),
        payment_status: row.paymentStatus,
        branch: row.branch
          ? {
              uuid: row.branch.uuid,
              name: row.branch.name,
              code: row.branch.code,
            }
          : null,
        customer: row.customer
          ? {
              uuid: row.customer.uuid,
              name: row.customer.name,
              phone: row.customer.phone,
            }
          : null,
      })),
    };
  },

  async getPurchaseSummary(params: { dateFromParam: string | null; dateToParam: string | null; branchUuid?: string }) {
    const { dateFromParam, dateToParam, branchUuid } = params;
    const { dateFrom, dateTo, rangeStart, rangeEnd } = resolveDateRange(dateFromParam, dateToParam);

    const purchaseWhere: Prisma.AppPosPurchaseWhereInput = {
      purchaseDate: {
        gte: rangeStart,
        lte: rangeEnd,
      },
      paymentStatus: { notIn: ['draft', 'void'] },
    };

    if (branchUuid) {
      purchaseWhere.branchUuid = branchUuid;
    }

    const [aggregate, byPaymentStatus, dailyRows, recentRows, branchInfo] = await Promise.all([
      posReportRepository.aggregatePurchases(purchaseWhere),
      posReportRepository.groupPurchasesByPaymentStatus(purchaseWhere),
      posReportRepository.groupPurchasesByDate(purchaseWhere),
      posReportRepository.findRecentPurchases(purchaseWhere, 10),
      resolveBranchInfo(branchUuid),
    ]);

    const totalPurchases = Number(aggregate._sum.totalAmount || 0);
    const totalPaid = Number(aggregate._sum.paidAmount || 0);
    const totalDiscount = Number(aggregate._sum.discountAmount || 0);
    const totalTransactions = Number(aggregate._count._all || 0);
    const avgTicket = totalTransactions > 0 ? round2(totalPurchases / totalTransactions) : 0;

    return {
      period: {
        from: dateFrom,
        to: dateTo,
      },
      branch: branchInfo,
      summary: {
        total_purchases: round2(totalPurchases),
        total_paid: round2(totalPaid),
        outstanding_amount: round2(Math.max(totalPurchases - totalPaid, 0)),
        total_discount: round2(totalDiscount),
        total_transactions: totalTransactions,
        average_ticket: round2(avgTicket),
      },
      by_payment_status: byPaymentStatus.map((row) => ({
        payment_status: row.paymentStatus,
        count: Number(row._count._all || 0),
        total_amount: round2(Number(row._sum.totalAmount || 0)),
        paid_amount: round2(Number(row._sum.paidAmount || 0)),
      })),
      daily: dailyRows.map((row) => ({
        date: formatDate(row.purchaseDate),
        transactions: Number(row._count._all || 0),
        total_amount: round2(Number(row._sum.totalAmount || 0)),
      })),
      recent_transactions: recentRows.map((row) => ({
        uuid: row.uuid,
        purchase_number: row.purchaseNumber,
        purchase_date: row.purchaseDate,
        total_amount: round2(Number(row.totalAmount || 0)),
        paid_amount: round2(Number(row.paidAmount || 0)),
        payment_status: row.paymentStatus,
        branch: row.branch
          ? {
              uuid: row.branch.uuid,
              name: row.branch.name,
              code: row.branch.code,
            }
          : null,
        supplier: row.supplier
          ? {
              uuid: row.supplier.uuid,
              name: row.supplier.name,
              code: row.supplier.code,
            }
          : null,
      })),
    };
  },
};
