import { NextRequest } from "next/server";
import { hash } from "bcryptjs";
import { Prisma, PrismaClient } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { errorResponse, successResponse } from "@/lib/response";
import { validateSchema } from "@/lib/validation";
import { registerSchema } from "@/lib/validations/auth";
import {
  seedTenantDefaultRoles,
  TENANT_DEFAULT_ROLE_ADMINISTRATOR,
} from "@/lib/modules/roles/templates";
import { FREE_TRIAL_PLAN_CODE } from "@/lib/modules/billing/constants";

const MODEL_TYPE_USER = "App\\Models\\User";

/**
 * Generate kode company otomatis berformat CMP-XXX berdasarkan kode
 * CMP-XXX tertinggi yang sudah ada.
 */
async function generateCompanyCode(tx: Prisma.TransactionClient): Promise<string> {
  const companies = await tx.company.findMany({
    select: { code: true },
    orderBy: { createdAt: "desc" },
    take: 1000,
  });

  let maxSequence = 0;
  for (const company of companies) {
    const match = company.code.match(/^CMP-(\d+)$/);
    if (match) {
      maxSequence = Math.max(maxSequence, Number(match[1]));
    }
  }

  return `CMP-${String(maxSequence + 1).padStart(3, "0")}`;
}

async function createCompanyWithUniqueCode(tx: Prisma.TransactionClient, name: string) {
  for (let attempt = 0; attempt < 10; attempt++) {
    const code = await generateCompanyCode(tx);
    try {
      return await tx.company.create({
        data: { code, name, isActive: true },
        select: { uuid: true, code: true, name: true },
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2002"
      ) {
        continue;
      }
      throw error;
    }
  }
  throw new Error("Gagal membuat kode perusahaan unik, silakan coba lagi");
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const result = validateSchema(registerSchema, body);
    if (!("data" in result)) return result;

    const { name, email, password, company_name } = result.data;
    const normalizedEmail = email.trim().toLowerCase();
    const normalizedName = name.trim();
    const companyName = company_name?.trim() || `Konter ${normalizedName}`;

    const existingUser = await prisma.user.findFirst({
      where: { email: normalizedEmail, deletedAt: null },
      select: { id: true },
    });
    if (existingUser) {
      return errorResponse("Email sudah terdaftar", 409, {
        email: ["Email sudah terdaftar"],
      });
    }

    const hashedPassword = await hash(password, 10);

    // Registrasi = membuat tenant (company) baru milik user tersebut,
    // lengkap dengan role default, subscription free trial, dan user
    // sebagai administrator tenant.
    const { user, company } = await (prisma as unknown as PrismaClient).$transaction(async (tx) => {
      const company = await createCompanyWithUniqueCode(tx, companyName);

      await seedTenantDefaultRoles(tx, company.uuid);

      const adminRole = await tx.role.findFirst({
        where: { companyUuid: company.uuid, name: TENANT_DEFAULT_ROLE_ADMINISTRATOR },
        select: { id: true },
      });
      if (!adminRole) {
        throw new Error("Role administrator tenant tidak ditemukan");
      }

      const user = await tx.user.create({
        data: {
          name: normalizedName,
          email: normalizedEmail,
          password: hashedPassword,
          isActive: true,
          emailVerifiedAt: new Date(),
        },
        select: {
          id: true,
          uuid: true,
          name: true,
          email: true,
        },
      });

      await tx.modelHasRole.create({
        data: {
          roleId: adminRole.id,
          modelType: MODEL_TYPE_USER,
          modelId: user.id,
          companyUuid: company.uuid,
        },
      });

      await tx.companyUser.upsert({
        where: {
          company_user_unique: {
            companyUuid: company.uuid,
            userId: user.id,
          },
        },
        update: {
          isDefault: true,
          isActive: true,
        },
        create: {
          companyUuid: company.uuid,
          userId: user.id,
          isDefault: true,
          isActive: true,
        },
      });

      const trialPlan = await tx.plan.findUnique({
        where: { code: FREE_TRIAL_PLAN_CODE },
      });
      if (trialPlan) {
        const startedAt = new Date();
        const expiresAt = new Date(startedAt);
        expiresAt.setDate(expiresAt.getDate() + trialPlan.durationDays);

        await tx.companySubscription.create({
          data: {
            companyUuid: company.uuid,
            planUuid: trialPlan.uuid,
            status: "trial",
            startedAt,
            expiresAt,
          },
        });
      }

      return { user, company };
    });

    return successResponse(
      `Registrasi berhasil, silakan login. Perusahaan ${company.name} siap digunakan.`,
      { user },
      201
    );
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      const target = (error.meta as { target?: string[] | string } | undefined)?.target;
      const targetLabel = Array.isArray(target) ? target.join(",") : String(target ?? "");
      if (targetLabel.includes("email")) {
        return errorResponse("Email sudah terdaftar", 409, {
          email: ["Email sudah terdaftar"],
        });
      }
      return errorResponse("Terjadi konflik data, silakan coba lagi", 409);
    }

    console.error("Register error:", error);
    return errorResponse("Terjadi kesalahan saat registrasi", 500);
  }
}
