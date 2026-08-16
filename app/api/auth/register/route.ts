import { NextRequest } from "next/server";
import { hash } from "bcryptjs";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { errorResponse, successResponse } from "@/lib/response";
import { validateSchema } from "@/lib/validation";
import { registerSchema } from "@/lib/validations/auth";
import { provisionTenantUser } from "@/lib/modules/auth/provisioning";

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
    const { user, company } = await provisionTenantUser({
      name: normalizedName,
      email: normalizedEmail,
      passwordHash: hashedPassword,
      companyName,
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
