import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { ApiError } from "@/lib/api-errors";
import { formatAdministrator } from "./administrator.mapper";

export async function loginAdministrator(email: string, password: string) {
  const administrator = await prisma.administrator.findFirst({
    where: { email, deletedAt: null },
  });

  if (!administrator) {
    throw new ApiError("Email atau password salah", 401);
  }

  if (!administrator.isActive) {
    throw new ApiError("Akun Anda tidak aktif", 403);
  }

  const isValid = await bcrypt.compare(password, administrator.password);
  if (!isValid) {
    throw new ApiError("Email atau password salah", 401);
  }

  return formatAdministrator(administrator);
}

export async function getAdministratorById(id: number) {
  const administrator = await prisma.administrator.findFirst({
    where: { id, deletedAt: null, isActive: true },
  });
  return administrator ? formatAdministrator(administrator) : null;
}
