/**
 * Dummy seeder untuk pelanggan POS.
 * Jalankan: npm run seed:dummy prisma/seeders/dummy/customers.ts
 */
import { PrismaClient } from "@prisma/client";
import { v7 as uuidv7 } from "uuid";
import { getDefaultCompanyUuid } from "../company";

type CustomerSeed = {
  name: string;
  phone: string;
  email?: string;
  address?: string;
};

const CUSTOMERS_DATA: CustomerSeed[] = [
  {
    name: "Budi Santoso",
    phone: "081234560001",
    email: "budi.santoso@example.com",
    address: "Jl. Melati No. 12, Jakarta Selatan",
  },
  {
    name: "Siti Aisyah",
    phone: "081234560002",
    email: "siti.aisyah@example.com",
    address: "Jl. Anggrek No. 8, Bandung",
  },
  {
    name: "Andi Pratama",
    phone: "081234560003",
    email: "andi.pratama@example.com",
    address: "Jl. Kenanga No. 21, Surabaya",
  },
  {
    name: "Rina Kartika",
    phone: "081234560004",
    email: "rina.kartika@example.com",
    address: "Jl. Cendana No. 5, Semarang",
  },
  {
    name: "Dimas Saputra",
    phone: "081234560005",
    email: "dimas.saputra@example.com",
    address: "Jl. Flamboyan No. 19, Yogyakarta",
  },
  {
    name: "Nanda Putri",
    phone: "081234560006",
    email: "nanda.putri@example.com",
    address: "Jl. Mawar No. 17, Malang",
  },
  {
    name: "Yoga Prakoso",
    phone: "081234560007",
    email: "yoga.prakoso@example.com",
    address: "Jl. Bougenville No. 10, Depok",
  },
  {
    name: "Laila Rahma",
    phone: "081234560008",
    email: "laila.rahma@example.com",
    address: "Jl. Dahlia No. 4, Tangerang",
  },
  {
    name: "Fajar Nugroho",
    phone: "081234560009",
    email: "fajar.nugroho@example.com",
    address: "Jl. Kamboja No. 27, Bekasi",
  },
  {
    name: "Maya Wulandari",
    phone: "081234560010",
    email: "maya.wulandari@example.com",
    address: "Jl. Teratai No. 2, Bogor",
  },
];

export async function seedCustomers(prisma: PrismaClient) {
  const companyUuid = await getDefaultCompanyUuid(prisma);
  let createdOrUpdated = 0;

  for (const data of CUSTOMERS_DATA) {
    const existing = await prisma.appPosCustomer.findFirst({
      where: {
        companyUuid,
        phone: data.phone,
      },
    });

    if (existing) {
      await prisma.appPosCustomer.update({
        where: { uuid: existing.uuid },
        data: {
          name: data.name,
          email: data.email || null,
          address: data.address || null,
          isDefault: false,
        },
      });
      createdOrUpdated++;
      continue;
    }

    await prisma.appPosCustomer.create({
      data: {
        uuid: uuidv7(),
        companyUuid,
        name: data.name,
        phone: data.phone,
        email: data.email || null,
        address: data.address || null,
        isDefault: false,
      },
    });
    createdOrUpdated++;
  }

  console.log(`✓ ${createdOrUpdated} customers dummy created/updated`);
}

// Standalone runner
if (require.main === module) {
  const prisma = new PrismaClient();
  seedCustomers(prisma)
    .catch((e) => {
      console.error(e);
      process.exit(1);
    })
    .finally(() => prisma.$disconnect());
}
