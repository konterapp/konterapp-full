import { PrismaClient, Role } from "@prisma/client";
import bcrypt from "bcryptjs";
import { v7 as uuidv7 } from "uuid";
import { getDefaultCompanyUuid } from "./company";

async function createUserWithRole(
  prisma: PrismaClient,
  data: { name: string; email: string; password: string; userType: number },
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

  await prisma.userProfile.upsert({
    where: { userId: user.id },
    update: {},
    create: {
      userId: user.id,
      userType: data.userType,
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
    { name: "Admin", email: "admin@admin.com", password: "password", userType: 2 },
    roles.adminRole,
    companyUuid
  );
  console.log("✓ Admin user created: admin@admin.com / password");

  await createUserWithRole(
    prisma,
    { name: "User", email: "user@user.com", password: "password", userType: 4 },
    roles.userRole,
    companyUuid
  );
  console.log("✓ Regular user created: user@user.com / password");
}
