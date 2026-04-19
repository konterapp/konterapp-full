import { AsyncLocalStorage } from "node:async_hooks";

type TenantStore = {
  companyUuid: string;
};

const tenantContextStorage = new AsyncLocalStorage<TenantStore>();

export const TENANT_MODELS = new Set<string>([
  "PosProductCategory",
  "PosProductUnit",
  "PosBranch",
  "PosProduct",
  "PosSupplier",
  "PosPurchase",
  "PosStockMovement",
  "PosPaymentMethod",
  "PosCustomer",
  "PosSale",
  "PosPpobProduct",
  "PosPpobTransaction",
]);

export function runWithTenantContext<T>(companyUuid: string, callback: () => Promise<T>): Promise<T> {
  return tenantContextStorage.run({ companyUuid }, callback);
}

export function getTenantCompanyUuid(): string | null {
  return tenantContextStorage.getStore()?.companyUuid ?? null;
}
