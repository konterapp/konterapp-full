import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { v7 as uuidv7 } from "uuid";
import { getDefaultCompanyUuid } from "./company";
import {
  TENANT_DEFAULT_ROLE_ADMINISTRATOR,
  TENANT_DEFAULT_ROLE_KASIR,
} from "../../lib/modules/roles/templates";

export const DEFAULT_ADMIN_EMAIL = "admin@konterapp.com";
export const DEFAULT_USER_EMAIL = "kasir@konterapp.com";

async function assignRole(
  prisma: PrismaClient,
  userId: number,
  companyUuid: string,
  roleName: string
) {
  const role = await prisma.role.findFirst({
    where: { companyUuid, name: roleName },
    select: { id: true },
  });
  if (!role) {
    throw new Error(`Role "${roleName}" tidak ditemukan untuk company ${companyUuid}`);
  }

  await prisma.modelHasRole.upsert({
    where: {
      roleId_modelType_modelId_companyUuid: {
        roleId: role.id,
        modelType: "App\\Models\\User",
        modelId: userId,
        companyUuid,
      },
    },
    update: {},
    create: {
      roleId: role.id,
      modelType: "App\\Models\\User",
      modelId: userId,
      companyUuid,
    },
  });
}

async function createUserWithMembership(
  prisma: PrismaClient,
  data: { name: string; email: string; password: string },
  companyUuid: string
) {
  const hashedPassword = await bcrypt.hash(data.password, 10);

  const user = await prisma.user.upsert({
    where: { email: data.email },
    update: {},
    create: {
      uuid: uuidv7(),
      name: data.name,
      email: data.email,
      password: hashedPassword,
      isActive: true,
      emailVerifiedAt: new Date(),
    },
  });

  await prisma.companyUser.upsert({
    where: {
      company_user_unique: {
        companyUuid,
        userId: user.id,
      },
    },
    update: {
      isActive: true,
      isDefault: true,
    },
    create: {
      uuid: uuidv7(),
      companyUuid,
      userId: user.id,
      isDefault: true,
      isActive: true,
    },
  });

  return user;
}

export async function seedUsers(prisma: PrismaClient) {
  const companyUuid = await getDefaultCompanyUuid(prisma);

  const admin = await createUserWithMembership(
    prisma,
    { name: "Budi Santoso", email: DEFAULT_ADMIN_EMAIL, password: "password" },
    companyUuid
  );
  await assignRole(prisma, admin.id, companyUuid, TENANT_DEFAULT_ROLE_ADMINISTRATOR);
  console.log(`✓ Admin user created: ${DEFAULT_ADMIN_EMAIL} / password (role: administrator)`);

  const kasir = await createUserWithMembership(
    prisma,
    { name: "Siti Rahayu", email: DEFAULT_USER_EMAIL, password: "password" },
    companyUuid
  );
  await assignRole(prisma, kasir.id, companyUuid, TENANT_DEFAULT_ROLE_KASIR);
  console.log(`✓ Kasir user created: ${DEFAULT_USER_EMAIL} / password (role: kasir)`);
}
