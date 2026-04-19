import { PrismaClient } from "@prisma/client";
import { getTenantCompanyUuid, TENANT_MODELS } from "./tenant-context";

function modelToDelegateName(model: string): string {
  return model.charAt(0).toLowerCase() + model.slice(1);
}

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

function createPrismaClient() {
  const basePrisma = new PrismaClient();

  return basePrisma.$extends({
    query: {
      $allModels: {
        async $allOperations({ model, operation, args, query }) {
          const companyUuid = getTenantCompanyUuid();
          if (!model || !companyUuid || !TENANT_MODELS.has(model)) {
            return query(args);
          }

          if (operation === "findUnique" || operation === "findUniqueOrThrow") {
            const delegateName = modelToDelegateName(model);
            const delegateUnknown = (basePrisma as unknown as Record<string, unknown>)[delegateName];
            if (delegateUnknown && typeof delegateUnknown === "object") {
              const delegate = delegateUnknown as Record<string, (value: unknown) => Promise<unknown>>;
              const method = operation === "findUnique" ? "findFirst" : "findFirstOrThrow";
              const finder = delegate[method];

              if (typeof finder === "function") {
                return finder(withCompanyWhereArgs(args, companyUuid));
              }
            }
          }

          if (["findMany", "findFirst", "count", "aggregate", "groupBy", "updateMany", "deleteMany"].includes(operation)) {
            return query(withCompanyWhereArgs(args, companyUuid));
          }

          if (operation === "create") {
            const normalizedArgs = args && typeof args === "object" ? { ...(args as Record<string, unknown>) } : {};
            normalizedArgs.data = applyCompanyToData(normalizedArgs.data, companyUuid);
            return query(normalizedArgs);
          }

          if (operation === "createMany") {
            const normalizedArgs = args && typeof args === "object" ? { ...(args as Record<string, unknown>) } : {};
            normalizedArgs.data = applyCompanyToData(normalizedArgs.data, companyUuid);
            return query(normalizedArgs);
          }

          if (operation === "upsert") {
            const normalizedArgs = args && typeof args === "object" ? { ...(args as Record<string, unknown>) } : {};
            normalizedArgs.create = applyCompanyToData(normalizedArgs.create, companyUuid);
            normalizedArgs.update = applyCompanyToData(normalizedArgs.update, companyUuid);
            return query(normalizedArgs);
          }

          return query(args);
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
