import { PrismaClient, Role } from "@prisma/client";
import bcrypt from "bcryptjs";
import { v7 as uuidv7 } from "uuid";
import { getDefaultCompanyUuid } from "./company";

export const DEFAULT_ADMIN_EMAIL = "admin@konterapp.com";
export const DEFAULT_USER_EMAIL = "kasir@konterapp.com";

async function createUserWithRole(
  prisma: PrismaClient,
  data: { name: string; email: string; password: string },
  role: Role,
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

  await prisma.modelHasRole.upsert({
    where: {
      roleId_modelType_modelId: {
        roleId: role.id,
        modelType: "App\\Models\\User",
        modelId: user.id,
      },
    },
    update: {},
    create: {
      roleId: role.id,
      modelType: "App\\Models\\User",
      modelId: user.id,
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

export async function seedUsers(
  prisma: PrismaClient,
  roles: { adminRole: Role; userRole: Role }
) {
  const companyUuid = await getDefaultCompanyUuid(prisma);

  await createUserWithRole(
    prisma,
    { name: "Budi Santoso", email: DEFAULT_ADMIN_EMAIL, password: "password" },
    roles.adminRole,
    companyUuid
  );
  console.log(`✓ Admin user created: ${DEFAULT_ADMIN_EMAIL} / password`);

  await createUserWithRole(
    prisma,
    { name: "Siti Rahayu", email: DEFAULT_USER_EMAIL, password: "password" },
    roles.userRole,
    companyUuid
  );
  console.log(`✓ Regular user created: ${DEFAULT_USER_EMAIL} / password`);
}
