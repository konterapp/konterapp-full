import { NextRequest } from "next/server";
import { hash } from "bcryptjs";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { errorResponse, successResponse } from "@/lib/response";
import { validateSchema } from "@/lib/validation";
import { registerSchema } from "@/lib/validations/auth";

const DEFAULT_COMPANY_CODE = "CMP-001";
const DEFAULT_COMPANY_NAME = "KonterApp Demo Company";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const result = validateSchema(registerSchema, body);
    if (!("data" in result)) return result;

    const { name, email, password } = result.data;
    const normalizedEmail = email.trim().toLowerCase();
    const normalizedName = name.trim();

    const existingUser = await prisma.user.findFirst({
      where: { email: normalizedEmail, deletedAt: null },
      select: { id: true },
    });
    if (existingUser) {
      return errorResponse("Email sudah terdaftar", 409, {
        email: ["Email sudah terdaftar"],
      });
    }

    const userRole = await prisma.role.findFirst({
      where: { name: "user", guardName: "web" },
      select: { id: true },
    });
    if (!userRole) {
      return errorResponse(
        "Role default user tidak ditemukan. Jalankan seeder role terlebih dahulu.",
        500
      );
    }

    const company = await prisma.company.upsert({
      where: { code: DEFAULT_COMPANY_CODE },
      update: {},
      create: {
        code: DEFAULT_COMPANY_CODE,
        name: DEFAULT_COMPANY_NAME,
        isActive: true,
      },
      select: { uuid: true },
    });

    const hashedPassword = await hash(password, 10);
    const user = await prisma.user.create({
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

    await prisma.userProfile.upsert({
      where: { userId: user.id },
      update: {},
      create: {
        userId: user.id,
        userType: 4,
      },
    });

    await prisma.modelHasRole.upsert({
      where: {
        roleId_modelType_modelId: {
          roleId: userRole.id,
          modelType: "App\\Models\\User",
          modelId: user.id,
        },
      },
      update: {},
      create: {
        roleId: userRole.id,
        modelType: "App\\Models\\User",
        modelId: user.id,
      },
    });

    await prisma.companyUser.upsert({
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

    return successResponse(
      "Registrasi berhasil, silakan login",
      { user },
      201
    );
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return errorResponse("Email sudah terdaftar", 409, {
        email: ["Email sudah terdaftar"],
      });
    }

    console.error("Register error:", error);
    return errorResponse("Terjadi kesalahan saat registrasi", 500);
  }
}
