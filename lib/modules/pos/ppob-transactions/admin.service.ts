import { Prisma } from '@prisma/client';
import { ApiError, ValidationApiError } from '@/lib/api-errors';
import { posPpobTransactionRepository } from './repository';
import { posSaldoRepository } from '@/lib/modules/pos/saldo/repository';
import { appUserRepository } from '@/lib/modules/users/app.repository';
import { mapPpobTransaction, mapPpobTransactionType } from './ppob-transaction.mapper';

function generateTransactionNumber() {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  return `PPOB-${year}${month}${day}-${random}`;
}

const PROFIT_PRODUCT_NAME = 'Laba PPOB';
const PROFIT_CATEGORY_NAME = 'Sistem';

/**
 * Produk sintetis (bukan produk jualan asli) buat mencatat laba Server
 * Pulsa/PPOB sebagai baris `app_pos_sales` -- supaya Riwayat/laporan omzet
 * cukup baca 1 sumber data, tanpa perlu UNION ke app_pos_ppob_transactions
 * (pola sama persis dengan Agen Bank). Disembunyikan dari listing produk
 * lewat `isSystem: true`. 1 produk per company, find-or-create.
 */
async function ensureProfitProduct(tx: Prisma.TransactionClient, companyUuid: string) {
  const sku = `SYS-LABA-PPOB-${companyUuid}`;
  const existing = await tx.appPosProduct.findUnique({ where: { sku } });
  if (existing) return existing;

  let category = await tx.appPosProductCategory.findFirst({ where: { companyUuid, name: PROFIT_CATEGORY_NAME } });
  if (!category) {
    category = await tx.appPosProductCategory.create({
      data: {
        companyUuid,
        name: PROFIT_CATEGORY_NAME,
        description: 'Kategori internal untuk produk yang dibuat otomatis oleh sistem -- jangan dihapus.',
      },
    });
  }

  return tx.appPosProduct.create({
    data: {
      companyUuid,
      categoryUuid: category.uuid,
      name: PROFIT_PRODUCT_NAME,
      sku,
      purchasePrice: 0,
      sellingPrice: 0,
      wholesalePrice: 0,
      minStock: 0,
      unit: 'pcs',
      isActive: true,
      isSystem: true,
    },
  });
}

export const posPpobTransactionService = {
  // ==================== Jenis Transaksi (master data dinamis) ====================

  async listTransactionTypes(companyUuid: string) {
    const types = await posPpobTransactionRepository.findTypeMany({
      where: { companyUuid },
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }] as unknown as Prisma.AppPosPpobTransactionTypeOrderByWithRelationInput,
    });
    return types.map(mapPpobTransactionType);
  },

  async createTransactionType(companyUuid: string, payload: { name: string; cashDirection: string; isActive?: boolean; sortOrder?: number }) {
    const existing = await posPpobTransactionRepository.findTypeByName(companyUuid, payload.name);
    if (existing) {
      throw new ValidationApiError({ name: ['Nama jenis transaksi sudah digunakan'] });
    }

    const type = await posPpobTransactionRepository.createType({
      companyUuid,
      name: payload.name,
      cashDirection: payload.cashDirection,
      isActive: payload.isActive ?? true,
      sortOrder: payload.sortOrder ?? 0,
    });
    return mapPpobTransactionType(type);
  },

  async updateTransactionType(uuid: string, companyUuid: string, payload: { name?: string; cashDirection?: string; isActive?: boolean; sortOrder?: number }) {
    const existing = await posPpobTransactionRepository.findTypeByUuid(uuid);
    if (!existing || existing.companyUuid !== companyUuid) {
      throw new ApiError('Jenis transaksi tidak ditemukan', 404);
    }

    if (payload.name && payload.name !== existing.name) {
      const nameExists = await posPpobTransactionRepository.findTypeByName(companyUuid, payload.name);
      if (nameExists) {
        throw new ValidationApiError({ name: ['Nama jenis transaksi sudah digunakan'] });
      }
    }

    const type = await posPpobTransactionRepository.updateTypeByUuid(uuid, {
      name: payload.name ?? existing.name,
      cashDirection: payload.cashDirection ?? existing.cashDirection,
      isActive: payload.isActive ?? existing.isActive,
      sortOrder: payload.sortOrder ?? existing.sortOrder,
    });
    return mapPpobTransactionType(type);
  },

  async deleteTransactionType(uuid: string, companyUuid: string) {
    const existing = await posPpobTransactionRepository.findTypeByUuid(uuid);
    if (!existing || existing.companyUuid !== companyUuid) {
      throw new ApiError('Jenis transaksi tidak ditemukan', 404);
    }

    const usageCount = await posPpobTransactionRepository.countTransactionsByType(uuid);
    if (usageCount > 0) {
      throw new ApiError('Jenis transaksi ini masih dipakai oleh transaksi yang sudah ada', 400);
    }

    await posPpobTransactionRepository.deleteTypeByUuid(uuid);
  },

  // ==================== Transaksi ====================

  async listTransactions(params: {
    page: number;
    perPage: number;
    search: string;
    branchUuid: string;
    companyUuid: string;
    userId: number;
  }) {
    const { page, perPage, search, branchUuid, companyUuid, userId } = params;
    const skip = (page - 1) * perPage;

    // Sama seperti Agen Bank/Saldo -- user yang dibatasi cabangnya cuma
    // boleh lihat transaksi cabangnya sendiri.
    const assignedBranchUuids = await appUserRepository.getAssignedBranchUuids(companyUuid, userId);

    const where: Prisma.AppPosPpobTransactionWhereInput = { companyUuid };

    if (assignedBranchUuids.length > 0) {
      if (branchUuid && !assignedBranchUuids.includes(branchUuid)) {
        where.branchUuid = '__no_access__';
      } else {
        where.branchUuid = branchUuid || { in: assignedBranchUuids };
      }
    } else if (branchUuid) {
      where.branchUuid = branchUuid;
    }

    if (search) {
      where.OR = [
        { transactionNumber: { contains: search, mode: 'insensitive' } },
        { accountReference: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [rows, total] = await Promise.all([
      posPpobTransactionRepository.findMany({ where, skip, take: perPage, orderBy: { createdAt: 'desc' } }),
      posPpobTransactionRepository.count(where),
    ]);

    return {
      data: rows.map(mapPpobTransaction),
      pagination: {
        page,
        perPage,
        total,
        totalPages: Math.ceil(total / perPage),
      },
    };
  },

  async getTransaction(uuid: string, companyUuid: string, userId: number) {
    const transaction = await posPpobTransactionRepository.findByUuid(uuid);
    if (!transaction || transaction.companyUuid !== companyUuid) {
      throw new ApiError('Transaksi tidak ditemukan', 404);
    }

    const assignedBranchUuids = await appUserRepository.getAssignedBranchUuids(companyUuid, userId);
    if (assignedBranchUuids.length > 0 && !assignedBranchUuids.includes(transaction.branchUuid)) {
      throw new ApiError('Transaksi tidak ditemukan', 404);
    }

    return mapPpobTransaction(transaction);
  },

  async createTransaction(
    companyUuid: string,
    userId: number,
    payload: {
      branchUuid: string;
      saldoAccountUuid: string;
      transactionTypeUuid: string;
      accountReference?: string | null;
      baseAmount: number;
      sellingAmount: number;
      adminFee?: number;
      paymentMethodUuid: string;
      paidAmount?: number;
      notes?: string | null;
    }
  ) {
    const assignedBranchUuids = await appUserRepository.getAssignedBranchUuids(companyUuid, userId);
    if (assignedBranchUuids.length > 0 && !assignedBranchUuids.includes(payload.branchUuid)) {
      throw new ApiError('Anda tidak punya akses ke cabang ini', 403);
    }

    const type = await posPpobTransactionRepository.findTypeByUuid(payload.transactionTypeUuid);
    if (!type || type.companyUuid !== companyUuid) {
      throw new ValidationApiError({ transactionTypeUuid: ['Jenis transaksi tidak valid'] });
    }
    if (!type.isActive) {
      throw new ValidationApiError({ transactionTypeUuid: ['Jenis transaksi ini sudah nonaktif'] });
    }

    // Akun saldo APA PUN bisa dipakai sbg Server PPOB selama ditandai
    // eksplisit (is_ppob_server) -- bukan berdasar `type` akunnya, sama
    // polanya dgn Agen Bank.
    const account = await posSaldoRepository.findByUuid(payload.saldoAccountUuid, false);
    if (!account || account.companyUuid !== companyUuid) {
      throw new ValidationApiError({ saldoAccountUuid: ['Akun saldo tidak ditemukan'] });
    }
    if (!account.isPpobServer) {
      throw new ValidationApiError({ saldoAccountUuid: ['Akun ini belum ditandai boleh dipakai untuk Server Pulsa/PPOB'] });
    }

    const branchLink = await posPpobTransactionRepository.findBranchLink(payload.saldoAccountUuid, payload.branchUuid);
    if (!branchLink) {
      throw new ValidationApiError({ saldoAccountUuid: ['Akun ini belum dikonfigurasi untuk cabang ini'] });
    }

    // Kolom DB bertipe string bebas (VarChar), tapi nilainya dijamin 'in'/'out'
    // oleh createPpobTransactionTypeSchema saat jenis transaksi dibuat/diedit.
    const cashDirection = type.cashDirection as 'in' | 'out';

    if (cashDirection === 'out') {
      const balanceRow = await posSaldoRepository.findBalanceByUuid(branchLink.saldoAccountBalanceUuid);
      if (!balanceRow || Number(balanceRow.balance) < payload.baseAmount) {
        throw new ValidationApiError({ baseAmount: ['Saldo deposit server tidak cukup untuk transaksi ini'] });
      }
    }

    const paymentAccount = await posSaldoRepository.findByUuid(payload.paymentMethodUuid, false);
    if (!paymentAccount || paymentAccount.companyUuid !== companyUuid) {
      throw new ValidationApiError({ paymentMethodUuid: ['Metode pembayaran tidak ditemukan'] });
    }
    if (!paymentAccount.isPaymentMethod || !paymentAccount.isActive) {
      throw new ValidationApiError({ paymentMethodUuid: ['Akun saldo ini tidak bisa dipakai sebagai metode pembayaran'] });
    }
    const paymentBranchLink = await posSaldoRepository.findBranchLink(payload.paymentMethodUuid, payload.branchUuid);
    if (!paymentBranchLink) {
      throw new ValidationApiError({ paymentMethodUuid: ['Metode pembayaran ini belum dikonfigurasi untuk cabang ini'] });
    }

    const paidAmount = payload.paidAmount ?? payload.sellingAmount;
    const changeAmount = Math.max(paidAmount - payload.sellingAmount, 0);
    const transactionNumber = generateTransactionNumber();

    const cashMutations: Array<{ direction: 'in' | 'out'; amount: number; notes: string }> = [];

    if (cashDirection === 'in') {
      // Kasus jarang (mis. refund/void) -- kasir menyerahkan tunai ke
      // customer, bukan menerima.
      if (payload.sellingAmount > 0) {
        cashMutations.push({ direction: 'out', amount: payload.sellingAmount, notes: `${type.name} (${transactionNumber})` });
      }
    } else {
      // Kasus umum (jual pulsa/token/dst): customer bayar ke kasir.
      const netCashIn = paidAmount - changeAmount;
      if (netCashIn > 0) {
        cashMutations.push({ direction: 'in', amount: netCashIn, notes: `${type.name} (${transactionNumber})` });
      }
    }

    const transaction = await posPpobTransactionRepository.runInTransaction(async (tx) => {
      const created = await posPpobTransactionRepository.createInTx(tx, {
        companyUuid,
        branchUuid: payload.branchUuid,
        saldoAccountUuid: payload.saldoAccountUuid,
        saldoAccountBalanceUuid: branchLink.saldoAccountBalanceUuid,
        transactionTypeUuid: payload.transactionTypeUuid,
        transactionNumber,
        cashDirection,
        accountReference: payload.accountReference || null,
        baseAmount: payload.baseAmount,
        sellingAmount: payload.sellingAmount,
        adminFee: payload.adminFee || 0,
        paymentMethodUuid: payload.paymentMethodUuid,
        paidAmount,
        changeAmount,
        notes: payload.notes || null,
        createdBy: userId,
      });

      // (1) Nominal modal -- menggerakkan akun deposit Server PPOB.
      await posSaldoRepository.applyMutationInTx(tx, {
        saldoAccountBalanceUuid: branchLink.saldoAccountBalanceUuid,
        companyUuid,
        branchUuid: payload.branchUuid,
        direction: cashDirection,
        amount: payload.baseAmount,
        referenceType: 'ppob_transaction',
        referenceUuid: created.uuid,
        notes: `${type.name} (${created.transactionNumber})`,
        createdBy: userId,
      });

      // (2) Uang fisik yg diterima/diserahkan kasir -- menggerakkan akun
      // metode bayar (Cash/BCA/QRIS, dst), terpisah dari akun deposit server.
      for (const mutation of cashMutations) {
        await posSaldoRepository.applyMutationInTx(tx, {
          saldoAccountBalanceUuid: paymentBranchLink.saldoAccountBalanceUuid,
          companyUuid,
          branchUuid: payload.branchUuid,
          direction: mutation.direction,
          amount: mutation.amount,
          referenceType: 'ppob_transaction',
          referenceUuid: created.uuid,
          notes: mutation.notes,
          createdBy: userId,
        });
      }

      // (3) SELALU dicatat sbg 1 baris penjualan produk sintetis ("Laba
      // PPOB"), walau laba = 0 -- supaya transaksi ini tetap kelihatan di
      // menu Penjualan (1 sumber data). Nominalnya LABA KOTOR (jual - modal),
      // BUKAN dikurangi adminFee -- sengaja gross, sama persis pola Agen
      // Bank (biaya admin server diagregasi terpisah on-the-fly saat bikin
      // laporan Laba Rugi nanti, TIDAK dinetokan di sini, biar tidak dobel
      // potong). "Laba Bersih" per transaksi tetap tersedia terpisah di
      // kolom list/detail (lihat ppob-transaction.mapper.ts).
      {
        const grossProfit = payload.sellingAmount - payload.baseAmount;
        const profitProduct = await ensureProfitProduct(tx, companyUuid);
        const sale = await tx.appPosSale.create({
          data: {
            companyUuid,
            saleNumber: `LBP-${created.transactionNumber}`,
            branchUuid: payload.branchUuid,
            customerUuid: null,
            paymentMethodUuid: payload.paymentMethodUuid,
            ppobTransactionUuid: created.uuid,
            saleDate: new Date(),
            subtotal: grossProfit,
            discountAmount: 0,
            totalAmount: grossProfit,
            paidAmount: grossProfit,
            changeAmount: 0,
            paymentStatus: 'paid',
            notes: grossProfit !== 0 ? `Laba ${type.name} (${created.transactionNumber})` : `${type.name} (${created.transactionNumber})`,
            createdBy: userId,
          },
        });
        await tx.appPosSaleItem.create({
          data: {
            companyUuid,
            saleUuid: sale.uuid,
            productUuid: profitProduct.uuid,
            quantity: 1,
            unitPrice: grossProfit,
            discount: 0,
            subtotal: grossProfit,
          },
        });
      }

      return created;
    });

    return mapPpobTransaction(transaction);
  },
};
