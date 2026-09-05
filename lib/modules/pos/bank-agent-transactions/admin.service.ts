import { Prisma } from '@prisma/client';
import { ApiError, ValidationApiError } from '@/lib/api-errors';
import { posBankAgentTransactionRepository } from './repository';
import { posSaldoRepository } from '@/lib/modules/pos/saldo/repository';
import { appUserRepository } from '@/lib/modules/users/app.repository';
import { mapBankAgentTransaction, mapBankAgentTransactionType } from './bank-agent-transaction.mapper';

function generateTransactionNumber() {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  return `BA-${year}${month}${day}-${random}`;
}

const COMMISSION_PRODUCT_NAME = 'Komisi Agen Bank';
const COMMISSION_CATEGORY_NAME = 'Sistem';

/**
 * Produk sintetis (bukan produk jualan asli) buat mencatat komisi Agen Bank
 * sebagai baris `app_pos_sales` -- supaya Riwayat/laporan omzet cukup baca 1
 * sumber data, tanpa perlu UNION ke app_pos_bank_agent_transactions (pola
 * dicontek dari CatatKonter). Disembunyikan dari listing produk lewat
 * `isSystem: true`. 1 produk per company, dibuat otomatis saat pertama kali
 * dibutuhkan (find-or-create), sku deterministik per company biar idempoten.
 */
async function ensureCommissionProduct(tx: Prisma.TransactionClient, companyUuid: string) {
  const sku = `SYS-KOMISI-AGEN-BANK-${companyUuid}`;
  const existing = await tx.appPosProduct.findUnique({ where: { sku } });
  if (existing) return existing;

  let category = await tx.appPosProductCategory.findFirst({ where: { companyUuid, name: COMMISSION_CATEGORY_NAME } });
  if (!category) {
    category = await tx.appPosProductCategory.create({
      data: {
        companyUuid,
        name: COMMISSION_CATEGORY_NAME,
        description: 'Kategori internal untuk produk yang dibuat otomatis oleh sistem -- jangan dihapus.',
        isSystem: true,
      },
    });
  }

  return tx.appPosProduct.create({
    data: {
      companyUuid,
      categoryUuid: category.uuid,
      name: COMMISSION_PRODUCT_NAME,
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

export const posBankAgentTransactionService = {
  // ==================== Jenis Transaksi (master data dinamis) ====================

  async listTransactionTypes(companyUuid: string) {
    const types = await posBankAgentTransactionRepository.findTypeMany({
      where: { companyUuid },
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }] as unknown as Prisma.AppPosBankAgentTransactionTypeOrderByWithRelationInput,
    });
    return types.map(mapBankAgentTransactionType);
  },

  async createTransactionType(companyUuid: string, payload: { name: string; cashDirection: string; isActive?: boolean; sortOrder?: number }) {
    const existing = await posBankAgentTransactionRepository.findTypeByName(companyUuid, payload.name);
    if (existing) {
      throw new ValidationApiError({ name: ['Nama jenis transaksi sudah digunakan'] });
    }

    const type = await posBankAgentTransactionRepository.createType({
      companyUuid,
      name: payload.name,
      cashDirection: payload.cashDirection,
      isActive: payload.isActive ?? true,
      sortOrder: payload.sortOrder ?? 0,
    });
    return mapBankAgentTransactionType(type);
  },

  async updateTransactionType(uuid: string, companyUuid: string, payload: { name?: string; cashDirection?: string; isActive?: boolean; sortOrder?: number }) {
    const existing = await posBankAgentTransactionRepository.findTypeByUuid(uuid);
    if (!existing || existing.companyUuid !== companyUuid) {
      throw new ApiError('Jenis transaksi tidak ditemukan', 404);
    }

    if (payload.name && payload.name !== existing.name) {
      const nameExists = await posBankAgentTransactionRepository.findTypeByName(companyUuid, payload.name);
      if (nameExists) {
        throw new ValidationApiError({ name: ['Nama jenis transaksi sudah digunakan'] });
      }
    }

    const type = await posBankAgentTransactionRepository.updateTypeByUuid(uuid, {
      name: payload.name ?? existing.name,
      cashDirection: payload.cashDirection ?? existing.cashDirection,
      isActive: payload.isActive ?? existing.isActive,
      sortOrder: payload.sortOrder ?? existing.sortOrder,
    });
    return mapBankAgentTransactionType(type);
  },

  async deleteTransactionType(uuid: string, companyUuid: string) {
    const existing = await posBankAgentTransactionRepository.findTypeByUuid(uuid);
    if (!existing || existing.companyUuid !== companyUuid) {
      throw new ApiError('Jenis transaksi tidak ditemukan', 404);
    }

    const usageCount = await posBankAgentTransactionRepository.countTransactionsByType(uuid);
    if (usageCount > 0) {
      throw new ApiError('Jenis transaksi ini masih dipakai oleh transaksi yang sudah ada', 400);
    }

    await posBankAgentTransactionRepository.deleteTypeByUuid(uuid);
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

    // Sama seperti domain Saldo -- user yang dibatasi cabangnya cuma boleh
    // lihat transaksi cabangnya sendiri.
    const assignedBranchUuids = await appUserRepository.getAssignedBranchUuids(companyUuid, userId);

    const where: Prisma.AppPosBankAgentTransactionWhereInput = { companyUuid };

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
      posBankAgentTransactionRepository.findMany({ where, skip, take: perPage, orderBy: { createdAt: 'desc' } }),
      posBankAgentTransactionRepository.count(where),
    ]);

    return {
      data: rows.map(mapBankAgentTransaction),
      pagination: {
        page,
        perPage,
        total,
        totalPages: Math.ceil(total / perPage),
      },
    };
  },

  async getTransaction(uuid: string, companyUuid: string, userId: number) {
    const transaction = await posBankAgentTransactionRepository.findByUuid(uuid);
    if (!transaction || transaction.companyUuid !== companyUuid) {
      throw new ApiError('Transaksi tidak ditemukan', 404);
    }

    const assignedBranchUuids = await appUserRepository.getAssignedBranchUuids(companyUuid, userId);
    if (assignedBranchUuids.length > 0 && !assignedBranchUuids.includes(transaction.branchUuid)) {
      throw new ApiError('Transaksi tidak ditemukan', 404);
    }

    return mapBankAgentTransaction(transaction);
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
      fee?: number;
      adminFee?: number;
      feeReceivedVia?: string | null;
      paymentMethodUuid: string;
      paidAmount?: number;
      notes?: string | null;
    }
  ) {
    const assignedBranchUuids = await appUserRepository.getAssignedBranchUuids(companyUuid, userId);
    if (assignedBranchUuids.length > 0 && !assignedBranchUuids.includes(payload.branchUuid)) {
      throw new ApiError('Anda tidak punya akses ke cabang ini', 403);
    }

    const type = await posBankAgentTransactionRepository.findTypeByUuid(payload.transactionTypeUuid);
    if (!type || type.companyUuid !== companyUuid) {
      throw new ValidationApiError({ transactionTypeUuid: ['Jenis transaksi tidak valid'] });
    }
    if (!type.isActive) {
      throw new ValidationApiError({ transactionTypeUuid: ['Jenis transaksi ini sudah nonaktif'] });
    }

    // Akun saldo APA PUN bisa dipakai buat Agen Bank selama ditandai
    // eksplisit (is_bank_agent) -- bukan berdasar `type` akunnya, supaya
    // mis. akun DANA/BRI yang juga metode bayar biasa tetap bisa dipakai.
    const account = await posSaldoRepository.findByUuid(payload.saldoAccountUuid, false);
    if (!account || account.companyUuid !== companyUuid) {
      throw new ValidationApiError({ saldoAccountUuid: ['Akun saldo tidak ditemukan'] });
    }
    if (!account.isBankAgent) {
      throw new ValidationApiError({ saldoAccountUuid: ['Akun ini belum ditandai boleh dipakai untuk Agen Bank'] });
    }

    // Grup balance akun ini utk cabang yg dipilih -- akun Agen Bank reuse
    // AppPosSaldoAccount, jadi tetap ikut aturan 1 cabang = 1 grup balance
    // per akun induk yang sudah ada di domain Saldo.
    const branchLink = await posBankAgentTransactionRepository.findBranchLink(payload.saldoAccountUuid, payload.branchUuid);
    if (!branchLink) {
      throw new ValidationApiError({ saldoAccountUuid: ['Akun ini belum dikonfigurasi untuk cabang ini'] });
    }

    // Kolom DB bertipe string bebas (VarChar), tapi nilainya dijamin 'in'/'out'
    // oleh createBankAgentTransactionTypeSchema saat jenis transaksi dibuat/diedit.
    const cashDirection = type.cashDirection as 'in' | 'out';

    if (cashDirection === 'out') {
      const balanceRow = await posSaldoRepository.findBalanceByUuid(branchLink.saldoAccountBalanceUuid);
      if (!balanceRow || Number(balanceRow.balance) < payload.baseAmount) {
        throw new ValidationApiError({ baseAmount: ['Saldo akun tidak cukup untuk transaksi ini'] });
      }
    }

    // Akun kas/metode bayar yg dipakai customer (Cash/BCA/QRIS, dst) --
    // terpisah dari akun bank/e-wallet Agen Bank di atas. Uang fisik yang
    // diterima/diserahkan kasir mempengaruhi akun INI, bukan akun Agen Bank.
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

    const fee = payload.fee || 0;
    const paidAmount = payload.paidAmount ?? payload.sellingAmount;
    const changeAmount = Math.max(paidAmount - payload.sellingAmount, 0);
    const transactionNumber = generateTransactionNumber();

    // Mutasi kas yg bakal dijalankan ke akun metode bayar (bisa lebih dari 1
    // baris utk kasus "Tunai Terpisah" di Tarik Tunai). Dihitung DI LUAR
    // transaction supaya validasi (mis. komisi > nominal) gagal cepat
    // sebelum ada write apa pun.
    const cashMutations: Array<{ direction: 'in' | 'out'; amount: number; notes: string }> = [];

    if (cashDirection === 'in') {
      // Jenis dgn arah kas KELUAR (mis. Tarik Tunai): customer transfer masuk
      // ke akun Agen Bank (sudah ditangani di atas), kasir GANTI menyerahkan
      // tunai ke customer -- kas toko berkurang, formulanya tergantung cara
      // komisi direalisasikan. Berlaku utk SEMUA jenis ber-cashDirection 'in',
      // bukan cuma yg bernama "Tarik Tunai" (nama bebas diedit admin).
      if (fee > 0) {
        const via = payload.feeReceivedVia;
        if (!via) {
          throw new ValidationApiError({ feeReceivedVia: ['Wajib dipilih kalau ada komisi'] });
        }
        if (via === 'cash') {
          cashMutations.push({ direction: 'out', amount: payload.baseAmount, notes: `${type.name} (${transactionNumber})` });
          cashMutations.push({ direction: 'in', amount: fee, notes: `Komisi ${type.name} (${transactionNumber})` });
        } else if (via === 'balance') {
          cashMutations.push({ direction: 'out', amount: payload.baseAmount, notes: `${type.name} (${transactionNumber})` });
        } else {
          // deducted (default kalau valid) -- komisi otomatis nempel di
          // laci karena tunai yang diserahkan lebih sedikit.
          const cashOut = payload.baseAmount - fee;
          if (cashOut < 0) {
            throw new ValidationApiError({ fee: ['Komisi tidak boleh lebih besar dari nominal'] });
          }
          cashMutations.push({ direction: 'out', amount: cashOut, notes: `${type.name} (${transactionNumber})` });
        }
      } else {
        cashMutations.push({ direction: 'out', amount: payload.baseAmount, notes: `${type.name} (${transactionNumber})` });
      }
    } else {
      // Jenis dgn arah kas MASUK (mis. Setor Tunai, Transfer Antar Bank,
      // Pembayaran BPJS, dst): customer bayar ke kasir, kas toko bertambah --
      // sama seperti netCashIn di penjualan produk biasa (bayar dikurangi
      // kembalian, bukan nominal bayar mentah).
      const netCashIn = paidAmount - changeAmount;
      if (netCashIn > 0) {
        cashMutations.push({ direction: 'in', amount: netCashIn, notes: `${type.name} (${transactionNumber})` });
      }
    }

    const transaction = await posBankAgentTransactionRepository.runInTransaction(async (tx) => {
      const created = await posBankAgentTransactionRepository.createInTx(tx, {
        companyUuid,
        branchUuid: payload.branchUuid,
        saldoAccountUuid: payload.saldoAccountUuid,
        saldoAccountBalanceUuid: branchLink.saldoAccountBalanceUuid,
        transactionNumber,
        transactionTypeUuid: payload.transactionTypeUuid,
        cashDirection,
        accountReference: payload.accountReference || null,
        baseAmount: payload.baseAmount,
        sellingAmount: payload.sellingAmount,
        fee,
        adminFee: payload.adminFee || 0,
        feeReceivedVia: payload.feeReceivedVia || null,
        paymentMethodUuid: payload.paymentMethodUuid,
        paidAmount,
        changeAmount,
        notes: payload.notes || null,
        createdBy: userId,
      });

      // (1) Nominal transaksi -- menggerakkan akun bank/e-wallet Agen Bank.
      await posSaldoRepository.applyMutationInTx(tx, {
        saldoAccountBalanceUuid: branchLink.saldoAccountBalanceUuid,
        companyUuid,
        branchUuid: payload.branchUuid,
        direction: cashDirection,
        amount: payload.baseAmount,
        referenceType: 'bank_agent_transaction',
        referenceUuid: created.uuid,
        notes: `${type.name} (${created.transactionNumber})`,
        createdBy: userId,
      });

      // (2) Uang fisik yg diterima/diserahkan kasir -- menggerakkan akun
      // metode bayar (Cash/BCA/QRIS, dst), terpisah dari akun Agen Bank.
      for (const mutation of cashMutations) {
        await posSaldoRepository.applyMutationInTx(tx, {
          saldoAccountBalanceUuid: paymentBranchLink.saldoAccountBalanceUuid,
          companyUuid,
          branchUuid: payload.branchUuid,
          direction: mutation.direction,
          amount: mutation.amount,
          referenceType: 'bank_agent_transaction',
          referenceUuid: created.uuid,
          notes: mutation.notes,
          createdBy: userId,
        });
      }

      // (3) SELALU dicatat sbg 1 baris penjualan produk sintetis ("Komisi
      // Agen Bank"), walau fee = 0 -- supaya transaksi ini tetap kelihatan
      // di menu Penjualan (1 sumber data), bukan cuma yang ada komisinya.
      // Nominalnya KOMISI KOTOR (fee), BUKAN dikurangi adminFee -- sengaja
      // gross, sama seperti pola CatatKonter (pendapatan dicatat bruto,
      // biaya admin bank dihitung terpisah on-the-fly dari kolom admin_fee
      // saat bikin laporan nanti, TIDAK dinetokan di sini). Kalau dinetokan
      // di sini, laporan Laba Rugi ke depan bisa dobel-potong (sekali di
      // sale ini, sekali lagi saat admin_fee diagregasi jadi Pengeluaran).
      // "Laba Bersih" per transaksi tetap tersedia terpisah di kolom list
      // Agen Bank (lihat bank-agent-transaction.mapper.ts). Juga BUKAN
      // baseAmount -- itu cuma numpang lewat, sudah tercermin di mutasi
      // akun Agen Bank/kas di atas, bukan pendapatan toko.
      {
        const commissionProduct = await ensureCommissionProduct(tx, companyUuid);
        const sale = await tx.appPosSale.create({
          data: {
            companyUuid,
            saleNumber: `KOM-${created.transactionNumber}`,
            branchUuid: payload.branchUuid,
            customerUuid: null,
            paymentMethodUuid: payload.paymentMethodUuid,
            bankAgentTransactionUuid: created.uuid,
            saleDate: new Date(),
            subtotal: fee,
            discountAmount: 0,
            totalAmount: fee,
            paidAmount: fee,
            changeAmount: 0,
            paymentStatus: 'paid',
            notes: fee > 0 ? `Komisi ${type.name} (${created.transactionNumber})` : `${type.name} (${created.transactionNumber})`,
            createdBy: userId,
          },
        });
        await tx.appPosSaleItem.create({
          data: {
            companyUuid,
            saleUuid: sale.uuid,
            productUuid: commissionProduct.uuid,
            quantity: 1,
            unitPrice: fee,
            discount: 0,
            subtotal: fee,
          },
        });
      }

      return created;
    });

    return mapBankAgentTransaction(transaction);
  },
};
