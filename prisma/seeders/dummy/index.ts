import { PrismaClient } from "@prisma/client";
import { seedCore } from "../core";
import { seedBerita } from "./berita";
import { seedCompanies } from "./companies";
import { seedUserCompanies } from "./user-companies";
import { seedSubscriptions } from "./subscriptions";
import { seedBranches } from "./branches";
import { seedCategories } from "./categories";
import { seedUnits } from "./units";
import { seedCustomers } from "./customers";
import { seedPaymentMethods } from "./payment-methods";
import { seedProducts } from "./products";
import { seedPurchases } from "./purchases";
import { seedStockMovements } from "./stock-movements";
import { seedPpobTransactions } from "./ppob-transactions";
import { seedCashierShifts } from "./cashier-shifts";
import { seedSales } from "./sales";

async function seedDummy(prisma: PrismaClient) {
  await seedCore(prisma);
  await seedCompanies(prisma);
  await seedUserCompanies(prisma);
  await seedSubscriptions(prisma);

  await seedBranches(prisma);
  await seedCategories(prisma);
  await seedUnits(prisma);
  await seedCustomers(prisma);
  await seedPaymentMethods(prisma);
  await seedProducts(prisma);
  await seedPurchases(prisma);
  await seedStockMovements(prisma);
  await seedSales(prisma);
  await seedPpobTransactions(prisma);
  await seedCashierShifts(prisma);
  await seedBerita(prisma);
}

if (require.main === module) {
  const prisma = new PrismaClient();
  seedDummy(prisma)
    .then(() => {
      console.log("✓ Dummy seeding completed");
    })
    .catch((error) => {
      console.error(error);
      process.exit(1);
    })
    .finally(() => prisma.$disconnect());
}

export { seedDummy };
