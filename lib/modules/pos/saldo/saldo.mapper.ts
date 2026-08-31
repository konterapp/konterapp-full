export function mapSaldoBalanceGroup(row: any) {
  return {
    uuid: row.uuid,
    name: row.name ?? null,
    account_number: row.accountNumber ?? null,
    account_name: row.accountName ?? null,
    balance: Number(row.balance),
    branches: (row.branchLinks ?? []).map((link: any) => ({
      uuid: link.branch?.uuid,
      code: link.branch?.code,
      name: link.branch?.name,
    })),
    created_at: row.createdAt,
  };
}

export function mapPaymentMethodOption(account: { uuid: string; code: string; name: string; type: string }) {
  return {
    uuid: account.uuid,
    code: account.code,
    name: account.name,
    type: account.type,
  };
}

export function mapSaldoAccount(account: any) {
  const balanceRows = account.balances ?? [];
  const totalBalance = balanceRows.reduce((total: number, row: any) => total + Number(row.balance), 0);

  return {
    uuid: account.uuid,
    code: account.code,
    name: account.name,
    type: account.type,
    description: account.description,
    // Rollup: gabungan semua grup balance. Detail per grup ada di field balances.
    balance: Number(totalBalance.toFixed(2)),
    balances_count: balanceRows.length,
    balances: account.balances ? balanceRows.map(mapSaldoBalanceGroup) : undefined,
    is_payment_method: account.isPaymentMethod,
    is_active: account.isActive,
    show_in_shift: account.showInShift,
    sort_order: account.sortOrder,
    is_bank_agent: account.isBankAgent,
    is_ppob_server: account.isPpobServer,
    created_at: account.createdAt,
    updated_at: account.updatedAt,
  };
}

/**
 * `revealHidden = false` dipakai khusus alur buka/tutup shift utk viewer yg
 * TIDAK punya pos.saldo.view-real-balance (default: Kasir) -- akun yg
 * ditandai show_in_shift=false nominalnya di-null-kan (bukan barisnya yg
 * disembunyikan, cuma angkanya) supaya kasir blind-count, bukan salin
 * angka sistem. Administrator (isFullAccess) selalu revealHidden=true.
 */
export function mapBranchSaldoLink(row: any, revealHidden: boolean = true) {
  const isHidden = !revealHidden && row.saldoAccount?.showInShift === false;

  return {
    account: {
      uuid: row.saldoAccount?.uuid,
      code: row.saldoAccount?.code,
      name: row.saldoAccount?.name,
      type: row.saldoAccount?.type,
      is_payment_method: row.saldoAccount?.isPaymentMethod,
    },
    group: {
      uuid: row.saldoAccountBalance?.uuid,
      name: row.saldoAccountBalance?.name ?? null,
      balance: isHidden ? null : Number(row.saldoAccountBalance?.balance ?? 0),
      account_number: row.saldoAccountBalance?.accountNumber ?? null,
      account_name: row.saldoAccountBalance?.accountName ?? null,
    },
  };
}

export function mapSaldoMutation(mutation: any) {
  return {
    uuid: mutation.uuid,
    direction: mutation.direction,
    amount: Number(mutation.amount),
    balance_before: Number(mutation.balanceBefore),
    balance_after: Number(mutation.balanceAfter),
    reference_type: mutation.referenceType,
    reference_uuid: mutation.referenceUuid,
    notes: mutation.notes,
    // Grup balance TEMPAT mutasi ini beneran nempel (bukan opsional --
    // tiap mutasi pasti milik 1 grup). branch di bawah cuma info tambahan
    // "di cabang mana transaksi ini terjadi" (relevan untuk penjualan),
    // BUKAN pengganti grup.
    saldo_balance: mutation.saldoBalance ? { uuid: mutation.saldoBalance.uuid, name: mutation.saldoBalance.name ?? null } : null,
    branch: mutation.branch ? { uuid: mutation.branch.uuid, name: mutation.branch.name, code: mutation.branch.code } : null,
    creator: mutation.creator ? { id: mutation.creator.id, name: mutation.creator.name } : null,
    created_at: mutation.createdAt,
  };
}
