import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { v7 as uuidv7 } from "uuid";

export async function seedAdministrators(prisma: PrismaClient) {
  const hashedPassword = await bcrypt.hash("password", 10);

  await prisma.administrator.upsert({
    where: { email: "administrator@konterapp.com" },
    update: {},
    create: {
      uuid: uuidv7(),
      name: "Super Administrator",
      email: "administrator@konterapp.com",
      password: hashedPassword,
      isActive: true,
    },
  });

  console.log("✓ Administrator created: administrator@konterapp.com / password");
}
