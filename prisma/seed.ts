import { PrismaClient } from "@prisma/client";
import { seedCore } from "./seeders/core";

const prisma = new PrismaClient();

async function main() {
  await seedCore(prisma);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
