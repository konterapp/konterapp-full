import { AsyncLocalStorage } from "node:async_hooks";

type TenantStore = {
  companyUuid: string;
};

// Gunakan globalThis supaya singleton tetap sama meski module di-hot-reload
// oleh Turbopack. Tanpa ini, setiap edit file menyebabkan AsyncLocalStorage
// baru (kosong) sementara api-middleware.ts masih pakai yang lama → NULL.
const g = globalThis as unknown as { __tenantContextStorage?: AsyncLocalStorage<TenantStore> };
const tenantContextStorage = g.__tenantContextStorage ?? new AsyncLocalStorage<TenantStore>();
if (process.env.NODE_ENV !== "production") {
  g.__tenantContextStorage = tenantContextStorage;
}

export const TENANT_MODELS = new Set<string>([
  "AppPosProductCategory",
  "AppPosProductUnit",
  "AppPosBranch",
  "AppPosProduct",
  "AppPosSupplier",
  "AppPosPurchase",
  "AppPosStockMovement",
  "AppPosPaymentMethod",
  "AppPosCustomer",
  "AppPosSale",
  "AppPosCashierShift",
  "AppPosPpobProduct",
  "AppPosPpobTransaction",
]);

export function runWithTenantContext<T>(companyUuid: string, callback: () => Promise<T>): Promise<T> {
  return tenantContextStorage.run({ companyUuid }, callback);
}

export function getTenantCompanyUuid(): string | null {
  return tenantContextStorage.getStore()?.companyUuid ?? null;
}
