export interface Branch {
  uuid: string;
  code: string;
  name: string;
  address?: string;
  phone?: string;
  email?: string;
  is_active: boolean;
  is_main: boolean;
  max_concurrent_users: number;
  created_at: string;
  updated_at: string;
}

export async function getAllBranches(): Promise<{ status: string; data: Branch[] }> {
  const response = await fetch('/api/app/pos/branches');
  return response.json();
}

export async function getBranch(uuid: string): Promise<{ status: string; data: Branch }> {
  const response = await fetch(`/api/app/pos/branches/${uuid}`);
  return response.json();
}

export async function createBranch(data: {
  code: string;
  name: string;
  address?: string;
  phone?: string;
  email?: string;
  is_active?: boolean;
  is_main?: boolean;
  max_concurrent_users?: number;
}): Promise<{ status: string; data: Branch }> {
  const response = await fetch('/api/app/pos/branches', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return response.json();
}

export async function updateBranch(
  uuid: string,
  data: {
    code?: string;
    name?: string;
    address?: string;
    phone?: string;
    email?: string;
    is_active?: boolean;
    is_main?: boolean;
    max_concurrent_users?: number;
  }
): Promise<{ status: string; data: Branch }> {
  const response = await fetch(`/api/app/pos/branches/${uuid}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return response.json();
}

export async function deleteBranch(uuid: string): Promise<{ status: string }> {
  const response = await fetch(`/api/app/pos/branches/${uuid}`, {
    method: 'DELETE',
  });
  return response.json();
}

export interface BranchSaldoItem {
  account: {
    uuid: string;
    code: string;
    name: string;
    type: string;
    is_payment_method: boolean;
  };
  group: {
    uuid: string;
    name: string | null;
    // null = disembunyikan dari viewer ini (akun show_in_shift=false &
    // viewer tidak punya permission pos.saldo.view-real-balance, mis.
    // Kasir) -- BUKAN saldo Rp0. Administrator selalu lihat angka asli.
    balance: number | null;
    account_number: string | null;
    account_name: string | null;
  };
  // Cuma terisi di snapshot shift yang SUDAH disimpan (opening_saldo/
  // closing_saldo pada ShiftRecord) -- hasil input manual kasir dibanding
  // saldo sistem saat itu. Kosong (undefined) di live-fetch saldo cabang.
  actual_balance?: number | null;
  variance?: number | null;
}

export async function getBranchSaldo(uuid: string): Promise<{
  status: string;
  message?: string;
  data: { branch: Branch; data: BranchSaldoItem[]; total_balance: number };
}> {
  const response = await fetch(`/api/app/pos/branches/${uuid}/saldo`);
  return response.json();
}

/**
 * Sama seperti getBranchSaldo, tapi dipakai di alur buka/tutup shift kasir --
 * cukup permission pos.sale.create (yang dimiliki role Kasir), bukan
 * pos.branch.index (permission kelola menu Cabang yang sengaja tidak
 * diberikan ke role Kasir default).
 */
export async function getShiftBranchSaldo(uuid: string): Promise<{
  status: string;
  message?: string;
  data: { branch: Branch; data: BranchSaldoItem[]; total_balance: number };
}> {
  const response = await fetch(`/api/app/pos/shifts/branch-saldo/${uuid}`);
  return response.json();
}
