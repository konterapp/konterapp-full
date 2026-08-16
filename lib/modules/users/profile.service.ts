import { hash } from "bcryptjs";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { ApiError } from "@/lib/api-errors";
import { ValidationApiError } from "@/lib/api-errors";

export const profileService = {
  async getProfile(userId: number) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        uuid: true,
        name: true,
        email: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      throw new ApiError("User tidak ditemukan", 404);
    }

    const memberships = await prisma.companyUser.findMany({
      where: { userId },
      select: {
        company: { select: { uuid: true, code: true, name: true } },
      },
    });

    const roleAssignments = await prisma.modelHasRole.findMany({
      where: { modelId: userId },
      select: {
        companyUuid: true,
        role: { select: { name: true } },
      },
    });

    return {
      uuid: user.uuid,
      name: user.name,
      email: user.email,
      companies: memberships.map((m) => m.company),
      roles: roleAssignments.map((r) => ({ companyUuid: r.companyUuid, name: r.role.name })),
      created_at: user.createdAt,
      updated_at: user.updatedAt,
    };
  },

  async updateProfile(
    userId: number,
    payload: { name?: string; current_password?: string; new_password?: string }
  ) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new ApiError("User tidak ditemukan", 404);
    }

    const userData: Record<string, unknown> = {};

    if (payload.name !== undefined) {
      userData.name = payload.name.trim();
    }

    if (payload.new_password) {
      if (!payload.current_password) {
        throw new ValidationApiError({
          current_password: ["Password saat ini wajib diisi untuk mengganti password"],
        });
      }
      const isValid = await bcrypt.compare(payload.current_password, user.password);
      if (!isValid) {
        throw new ValidationApiError({ current_password: ["Password saat ini tidak cocok"] });
      }
      userData.password = await hash(payload.new_password, 10);
    }

    if (Object.keys(userData).length === 0) {
      return this.getProfile(userId);
    }

    await prisma.user.update({ where: { id: userId }, data: userData });

    return this.getProfile(userId);
  },
};
