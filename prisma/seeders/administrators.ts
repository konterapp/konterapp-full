import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { v7 as uuidv7 } from "uuid";

export const DEFAULT_ADMINISTRATOR_EMAIL = "didik.abdul2017@gmail.com";

export async function seedAdministrators(prisma: PrismaClient) {
  const hashedPassword = await bcrypt.hash("password", 10);

  await prisma.administrator.upsert({
    where: { email: DEFAULT_ADMINISTRATOR_EMAIL },
    update: {},
    create: {
      uuid: uuidv7(),
      name: "Super Administrator",
      email: DEFAULT_ADMINISTRATOR_EMAIL,
      password: hashedPassword,
      isActive: true,
    },
  });

  console.log(`✓ Administrator created: ${DEFAULT_ADMINISTRATOR_EMAIL} / password`);
}
