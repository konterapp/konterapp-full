import { Prisma } from "@prisma/client";
import { ApiError } from "@/lib/api-errors";
import { billingRepository } from "./repository";
import { formatAdminInvoice } from "./billing.mapper";

function getSortConfig(
  sortBy: string,
  sortOrder: string
): Prisma.SubscriptionInvoiceOrderByWithRelationInput {
  const allowedSorts = ["amount", "status", "created_at", "provider_invoice_id"];
  const sortField = allowedSorts.includes(sortBy) ? sortBy : "created_at";
  const sortDir = sortOrder === "asc" ? "asc" : "desc";
  const sortFieldMap: Record<string, string> = {
    amount: "amount",
    status: "status",
    created_at: "createdAt",
    provider_invoice_id: "providerInvoiceId",
  };

  return { [sortFieldMap[sortField]]: sortDir as "asc" | "desc" };
}

export const billingAdminService = {
  async listInvoices(params: {
    page: number;
    perPage: number;
    search: string;
    status: string;
    sortBy: string;
    sortOrder: string;
  }) {
    const { page, perPage, search, status, sortBy, sortOrder } = params;
    const where: Prisma.SubscriptionInvoiceWhereInput = {};

    if (search) {
      where.OR = [
        { company: { name: { contains: search } } },
        { company: { code: { contains: search } } },
        { providerInvoiceId: { contains: search } },
        { providerTransactionId: { contains: search } },
      ];
    }

    if (status) {
      where.status = status;
    }

    const orderBy = getSortConfig(sortBy, sortOrder);
    const skip = (page - 1) * perPage;

    const [invoices, total] = await Promise.all([
      billingRepository.listInvoices({ where, orderBy, skip, take: perPage }),
      billingRepository.countInvoices(where),
    ]);

    return {
      invoices: invoices.map(formatAdminInvoice),
      total,
      page,
      perPage,
    };
  },

  async getInvoiceDetail(uuid: string) {
    const invoice = await billingRepository.findInvoiceByUuid(uuid);
    if (!invoice) {
      throw new ApiError("Transaksi billing tidak ditemukan", 404);
    }

    return formatAdminInvoice(invoice);
  },
};
