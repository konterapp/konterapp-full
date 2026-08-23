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
    created_at: account.createdAt,
    updated_at: account.updatedAt,
  };
}

export function mapBranchSaldoLink(row: any) {
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
      balance: Number(row.saldoAccountBalance?.balance ?? 0),
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
