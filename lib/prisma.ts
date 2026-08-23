import { PrismaClient } from "@prisma/client";
import { v7 as uuidv7 } from "uuid";
import { getTenantCompanyUuid, TENANT_MODELS } from "./tenant-context";

const UUID_MODELS = new Set<string>([
  "User",
  "Administrator",
  "Company",
  "CompanyUser",
  "Plan",
  "CompanySubscription",
  "SubscriptionInvoice",
  "AppPosProductCategory",
  "AppPosProductUnit",
  "AppPosBranch",
  "AppPosProduct",
  "AppPosProductBarcode",
  "AppPosProductUnitConversion",
  "AppPosProductBranchPrice",
  "AppPosProductImage",
  "AppPosProductStock",
  "AppPosSupplier",
  "AppPosPurchase",
  "AppPosPurchaseItem",
  "AppPosStockMovement",
  "AppPosCustomer",
  "AppPosSale",
  "AppPosSaleItem",
  "AppPosCashierShift",
  "AppPosPpobProduct",
  "AppPosPpobTransaction",
  "AppPosSaldoAccount",
  "AppPosSaldoAccountBalance",
  "AppPosSaldoAccountBalanceBranch",
  "AppPosSaldoMutation",
]);

function mergeCompanyWhere(where: unknown, companyUuid: string): unknown {
  if (!where || typeof where !== "object") {
    return { companyUuid };
  }

  if (Object.prototype.hasOwnProperty.call(where, "companyUuid")) {
    return where;
  }

  return {
    AND: [where, { companyUuid }],
  };
}

function withCompanyWhereArgs(args: unknown, companyUuid: string): Record<string, unknown> {
  const normalized = args && typeof args === "object" ? { ...(args as Record<string, unknown>) } : {};
  normalized.where = mergeCompanyWhere(normalized.where, companyUuid);
  return normalized;
}

function applyCompanyToData(data: unknown, companyUuid: string): unknown {
  if (!data || typeof data !== "object") {
    return data;
  }

  if (Array.isArray(data)) {
    return data.map((item) => applyCompanyToData(item, companyUuid));
  }

  if (Object.prototype.hasOwnProperty.call(data, "companyUuid")) {
    return data;
  }

  return {
    ...(data as Record<string, unknown>),
    companyUuid,
  };
}

function applyUuidToData(data: unknown): unknown {
  if (!data || typeof data !== "object" || Array.isArray(data)) {
    return data;
  }

  if (Object.prototype.hasOwnProperty.call(data, "uuid")) {
    return data;
  }

  return {
    ...(data as Record<string, unknown>),
    uuid: uuidv7(),
  };
}

function applyUuidByOperation(operation: string, args: unknown): unknown {
  const normalizedArgs = args && typeof args === "object" ? { ...(args as Record<string, unknown>) } : {};

  if (operation === "create") {
    normalizedArgs.data = applyUuidToData(normalizedArgs.data);
    return normalizedArgs;
  }

  if (operation === "createMany") {
    if (Array.isArray(normalizedArgs.data)) {
      normalizedArgs.data = normalizedArgs.data.map((item) => applyUuidToData(item));
    } else {
      normalizedArgs.data = applyUuidToData(normalizedArgs.data);
    }
    return normalizedArgs;
  }

  if (operation === "upsert") {
    normalizedArgs.create = applyUuidToData(normalizedArgs.create);
    return normalizedArgs;
  }

  return normalizedArgs;
}

function createPrismaClient() {
  const basePrisma = new PrismaClient();

  return basePrisma.$extends({
    query: {
      $allModels: {
        async $allOperations({ model, operation, args, query }) {
          let nextArgs: Record<string, unknown> = args && typeof args === "object" ? (args as Record<string, unknown>) : {};
          if (model && UUID_MODELS.has(model) && ["create", "createMany", "upsert"].includes(operation)) {
            nextArgs = applyUuidByOperation(operation, args) as Record<string, unknown>;
          }

          const companyUuid = getTenantCompanyUuid();
          if (!model || !companyUuid || !TENANT_MODELS.has(model)) {
            return query(nextArgs);
          }

          if (operation === "findUnique" || operation === "findUniqueOrThrow") {
            // findUnique(OrThrow) cuma terima where dengan field unique/index
            // (tidak bisa di-AND-kan dengan companyUuid seperti findFirst),
            // jadi tenant check dilakukan SETELAH row-nya didapat, bukan lewat
            // rewrite where. PENTING: query(nextArgs) di sini WAJIB dipakai
            // (bukan panggil delegate dari client lain/basePrisma) supaya tetap
            // jalan di transaction client (tx) yang sedang aktif -- kalau
            // dulu pernah diganti manggil basePrisma langsung, row yang baru
            // dibuat di transaction yang sama jadi tidak kelihatan (belum
            // committed di connection lain) dan salah dianggap "not found".
            const result = await query(nextArgs);
            const belongsToOtherTenant =
              result &&
              typeof result === "object" &&
              "companyUuid" in (result as Record<string, unknown>) &&
              (result as Record<string, unknown>).companyUuid !== companyUuid;

            if (belongsToOtherTenant) {
              if (operation === "findUniqueOrThrow") {
                throw new Error(`No ${model} found matching the query.`);
              }
              return null;
            }

            return result;
          }

          if (["findMany", "findFirst", "count", "aggregate", "groupBy", "updateMany", "deleteMany"].includes(operation)) {
            return query(withCompanyWhereArgs(nextArgs, companyUuid));
          }

          if (operation === "create") {
            const normalizedArgs = nextArgs && typeof nextArgs === "object" ? { ...(nextArgs as Record<string, unknown>) } : {};
            normalizedArgs.data = applyCompanyToData(normalizedArgs.data, companyUuid);
            return query(normalizedArgs);
          }

          if (operation === "createMany") {
            const normalizedArgs = nextArgs && typeof nextArgs === "object" ? { ...(nextArgs as Record<string, unknown>) } : {};
            normalizedArgs.data = applyCompanyToData(normalizedArgs.data, companyUuid);
            return query(normalizedArgs);
          }

          if (operation === "upsert") {
            const normalizedArgs = nextArgs && typeof nextArgs === "object" ? { ...(nextArgs as Record<string, unknown>) } : {};
            normalizedArgs.create = applyCompanyToData(normalizedArgs.create, companyUuid);
            normalizedArgs.update = applyCompanyToData(normalizedArgs.update, companyUuid);
            return query(normalizedArgs);
          }

          return query(nextArgs);
        },
      },
    },
  });
}

type ExtendedPrismaClient = ReturnType<typeof createPrismaClient>;

const globalForPrisma = globalThis as unknown as {
  prisma: ExtendedPrismaClient | undefined;
};

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
