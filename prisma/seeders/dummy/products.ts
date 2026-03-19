/**
 * Dummy seeder untuk produk POS.
 * Jalankan: npm run seed:dummy prisma/seeders/dummy/products.ts
 */
import { PrismaClient } from "@prisma/client";
import { v7 as uuidv7 } from "uuid";

type ProductSeed = {
  category_name: string;
  name: string;
  sku: string;
  description?: string;
  barcode?: string;
  selling_price: number;
  unit: string;
  min_stock: number;
  is_active: boolean;
  initial_stock: number;
};

const PRODUCTS_DATA: ProductSeed[] = [
  // Pulsa & Paket Data
  {
    category_name: 'Pulsa & Paket Data',
    name: 'Pulsa Telkomsel 10.000',
    sku: 'PLSA-TSEL-10K',
    description: 'Pulsa Telkomsel nominal 10.000',
    selling_price: 11500,
    unit: 'pcs',
    min_stock: 50,
    is_active: true,
    initial_stock: 200,
  },
  {
    category_name: 'Pulsa & Paket Data',
    name: 'Pulsa Telkomsel 25.000',
    sku: 'PLSA-TSEL-25K',
    description: 'Pulsa Telkomsel nominal 25.000',
    selling_price: 26000,
    unit: 'pcs',
    min_stock: 50,
    is_active: true,
    initial_stock: 150,
  },
  {
    category_name: 'Pulsa & Paket Data',
    name: 'Paket Data XL 5GB',
    sku: 'DATA-XL-5GB',
    description: 'Paket data XL 5GB 30 hari',
    selling_price: 35000,
    unit: 'pcs',
    min_stock: 30,
    is_active: true,
    initial_stock: 100,
  },

  // Aksesoris HP
  {
    category_name: 'Aksesoris HP',
    name: 'Charger Type-C Fast Charging',
    sku: 'ACC-CHG-TYPEC',
    barcode: '8991234560011',
    description: 'Charger Type-C dengan teknologi fast charging',
    selling_price: 45000,
    unit: 'pcs',
    min_stock: 10,
    is_active: true,
    initial_stock: 50,
  },
  {
    category_name: 'Aksesoris HP',
    name: 'Tempered Glass Universal',
    sku: 'ACC-TG-UNI',
    barcode: '8991234560028',
    description: 'Pelindung layar tempered glass universal',
    selling_price: 25000,
    unit: 'pcs',
    min_stock: 20,
    is_active: true,
    initial_stock: 100,
  },
  {
    category_name: 'Aksesoris HP',
    name: 'Kabel Data Micro USB 1m',
    sku: 'ACC-KBL-MICRO',
    barcode: '8991234560035',
    description: 'Kabel data micro USB panjang 1 meter',
    selling_price: 15000,
    unit: 'pcs',
    min_stock: 15,
    is_active: true,
    initial_stock: 80,
  },
  {
    category_name: 'Aksesoris HP',
    name: 'Softcase Silikon iPhone',
    sku: 'ACC-CASE-IPH',
    barcode: '8991234560042',
    description: 'Softcase silikon bening untuk iPhone',
    selling_price: 20000,
    unit: 'pcs',
    min_stock: 10,
    is_active: true,
    initial_stock: 60,
  },

  // Minuman
  {
    category_name: 'Minuman',
    name: 'Aqua 600ml',
    sku: 'DRK-AQUA-600',
    barcode: '8886008101053',
    description: 'Air mineral Aqua kemasan 600ml',
    selling_price: 4000,
    unit: 'pcs',
    min_stock: 50,
    is_active: true,
    initial_stock: 200,
  },
  {
    category_name: 'Minuman',
    name: 'Teh Botol Sosro 450ml',
    sku: 'DRK-TBS-450',
    barcode: '8993388817009',
    description: 'Teh botol sosro kemasan 450ml',
    selling_price: 5000,
    unit: 'pcs',
    min_stock: 30,
    is_active: true,
    initial_stock: 150,
  },
  {
    category_name: 'Minuman',
    name: 'Coca-Cola 390ml',
    sku: 'DRK-COLA-390',
    barcode: '5449000000996',
    description: 'Coca-Cola kemasan botol 390ml',
    selling_price: 6000,
    unit: 'pcs',
    min_stock: 30,
    is_active: true,
    initial_stock: 120,
  },
  {
    category_name: 'Minuman',
    name: 'Kopi Good Day Cappuccino',
    sku: 'DRK-GD-CAP',
    barcode: '8991002105003',
    description: 'Kopi Good Day Cappuccino botol 250ml',
    selling_price: 5500,
    unit: 'pcs',
    min_stock: 20,
    is_active: true,
    initial_stock: 100,
  },

  // Makanan Ringan
  {
    category_name: 'Makanan Ringan',
    name: 'Chitato Sapi Panggang 68g',
    sku: 'SNACK-CHT-SP',
    barcode: '8886008101121',
    description: 'Chitato rasa sapi panggang 68g',
    selling_price: 10000,
    unit: 'pcs',
    min_stock: 20,
    is_active: true,
    initial_stock: 100,
  },
  {
    category_name: 'Makanan Ringan',
    name: 'Oreo Original 137g',
    sku: 'SNACK-OREO-ORI',
    barcode: '7622210100016',
    description: 'Biskuit Oreo original 137g',
    selling_price: 12000,
    unit: 'pcs',
    min_stock: 15,
    is_active: true,
    initial_stock: 80,
  },
  {
    category_name: 'Makanan Ringan',
    name: 'Indomie Goreng',
    sku: 'SNACK-INDMIE-GR',
    barcode: '8996001600016',
    description: 'Indomie Mi Goreng kemasan satuan',
    selling_price: 3500,
    unit: 'pcs',
    min_stock: 50,
    is_active: true,
    initial_stock: 300,
  },
  {
    category_name: 'Makanan Ringan',
    name: 'Silverqueen Cashew 65g',
    sku: 'SNACK-SQ-CSH',
    barcode: '8991002105065',
    description: 'Coklat Silverqueen Cashew 65g',
    selling_price: 15000,
    unit: 'pcs',
    min_stock: 10,
    is_active: true,
    initial_stock: 60,
  },

  // Rokok
  {
    category_name: 'Rokok',
    name: 'Gudang Garam Surya 16',
    sku: 'RKK-GG-SRY16',
    barcode: '8990001001165',
    description: 'Gudang Garam Surya 16 batang',
    selling_price: 28000,
    unit: 'bungkus',
    min_stock: 20,
    is_active: true,
    initial_stock: 100,
  },
  {
    category_name: 'Rokok',
    name: 'Sampoerna Mild 16',
    sku: 'RKK-SAM-MLD16',
    barcode: '8991092114163',
    description: 'Sampoerna A Mild 16 batang',
    selling_price: 30000,
    unit: 'bungkus',
    min_stock: 20,
    is_active: true,
    initial_stock: 100,
  },

  // Alat Tulis & Kantor
  {
    category_name: 'Alat Tulis & Kantor',
    name: 'Pulpen Pilot Hitam',
    sku: 'ATK-PLN-HT',
    barcode: '4902505511233',
    description: 'Pulpen Pilot warna hitam',
    selling_price: 4000,
    unit: 'pcs',
    min_stock: 30,
    is_active: true,
    initial_stock: 200,
  },
  {
    category_name: 'Alat Tulis & Kantor',
    name: 'Buku Tulis Sidu 58 Lembar',
    sku: 'ATK-BKT-58',
    barcode: '8992775005800',
    description: 'Buku tulis Sinar Dunia 58 lembar',
    selling_price: 5000,
    unit: 'pcs',
    min_stock: 20,
    is_active: true,
    initial_stock: 100,
  },
  {
    category_name: 'Alat Tulis & Kantor',
    name: 'Pensil 2B Faber Castell',
    sku: 'ATK-PSL-2B',
    barcode: '4005401117025',
    description: 'Pensil 2B Faber Castell',
    selling_price: 3500,
    unit: 'pcs',
    min_stock: 20,
    is_active: true,
    initial_stock: 150,
  },
  {
    category_name: 'Alat Tulis & Kantor',
    name: 'Penghapus Staedtler',
    sku: 'ATK-PHP-STD',
    barcode: '4007817526392',
    description: 'Penghapus Staedtler putih',
    selling_price: 3000,
    unit: 'pcs',
    min_stock: 15,
    is_active: true,
    initial_stock: 100,
  },

  // Kebutuhan Rumah Tangga
  {
    category_name: 'Kebutuhan Rumah Tangga',
    name: 'Rinso Anti Noda 800g',
    sku: 'RT-RINSO-800',
    barcode: '8999999527051',
    description: 'Deterjen Rinso Anti Noda 800g',
    selling_price: 18000,
    unit: 'pcs',
    min_stock: 15,
    is_active: true,
    initial_stock: 60,
  },
  {
    category_name: 'Kebutuhan Rumah Tangga',
    name: 'Tisu Paseo 250 Sheet',
    sku: 'RT-TISU-PSO',
    barcode: '8993088250016',
    description: 'Tisu Paseo Soft Pack 250 sheet',
    selling_price: 12000,
    unit: 'pcs',
    min_stock: 20,
    is_active: true,
    initial_stock: 80,
  },
  {
    category_name: 'Kebutuhan Rumah Tangga',
    name: 'Sunlight Lemon 800ml',
    sku: 'RT-SNLT-800',
    barcode: '8999999535018',
    description: 'Sabun cuci piring Sunlight Lemon 800ml',
    selling_price: 14000,
    unit: 'pcs',
    min_stock: 10,
    is_active: true,
    initial_stock: 50,
  },

  // Perawatan Diri
  {
    category_name: 'Perawatan Diri',
    name: 'Shampoo Pantene 160ml',
    sku: 'PD-PNTNE-160',
    barcode: '4902430915694',
    description: 'Shampoo Pantene Anti Dandruff 160ml',
    selling_price: 22000,
    unit: 'pcs',
    min_stock: 10,
    is_active: true,
    initial_stock: 40,
  },
  {
    category_name: 'Perawatan Diri',
    name: 'Pepsodent 120g',
    sku: 'PD-PEPS-120',
    barcode: '8999999749613',
    description: 'Pasta gigi Pepsodent Cavity Prevention 120g',
    selling_price: 10000,
    unit: 'pcs',
    min_stock: 15,
    is_active: true,
    initial_stock: 60,
  },
  {
    category_name: 'Perawatan Diri',
    name: 'Sabun Lifebuoy 100g',
    sku: 'PD-LFB-100',
    barcode: '8999999048952',
    description: 'Sabun batang Lifebuoy Total 10 100g',
    selling_price: 5000,
    unit: 'pcs',
    min_stock: 20,
    is_active: true,
    initial_stock: 80,
  },

  // Obat & Kesehatan
  {
    category_name: 'Obat & Kesehatan',
    name: 'Paracetamol 500mg Strip',
    sku: 'OBT-PARA-500',
    barcode: '8991038101013',
    description: 'Paracetamol 500mg isi 10 tablet',
    selling_price: 5000,
    unit: 'strip',
    min_stock: 20,
    is_active: true,
    initial_stock: 100,
  },
  {
    category_name: 'Obat & Kesehatan',
    name: 'Masker Medis 3-Ply (5pcs)',
    sku: 'OBT-MASK-3PLY',
    barcode: '8991234560301',
    description: 'Masker medis 3 ply isi 5 lembar',
    selling_price: 8000,
    unit: 'pack',
    min_stock: 15,
    is_active: true,
    initial_stock: 60,
  },
  {
    category_name: 'Obat & Kesehatan',
    name: 'Hansaplast Plester (10pcs)',
    sku: 'OBT-HANS-10',
    barcode: '4005800038907',
    description: 'Hansaplast plester luka isi 10 lembar',
    selling_price: 7000,
    unit: 'pack',
    min_stock: 10,
    is_active: true,
    initial_stock: 50,
  },

  // Elektronik & Gadget
  {
    category_name: 'Elektronik & Gadget',
    name: 'Earphone Bass In-Ear',
    sku: 'ELK-EARPH-BS',
    barcode: '8991234560400',
    description: 'Earphone bass in-ear dengan microphone',
    selling_price: 35000,
    unit: 'pcs',
    min_stock: 10,
    is_active: true,
    initial_stock: 40,
  },
  {
    category_name: 'Elektronik & Gadget',
    name: 'Powerbank 10000mAh',
    sku: 'ELK-PB-10K',
    barcode: '8991234560417',
    description: 'Powerbank 10000mAh fast charging',
    selling_price: 120000,
    unit: 'pcs',
    min_stock: 5,
    is_active: true,
    initial_stock: 20,
  },
  {
    category_name: 'Elektronik & Gadget',
    name: 'Flashdisk 16GB',
    sku: 'ELK-FD-16GB',
    barcode: '8991234560424',
    description: 'Flashdisk USB 3.0 kapasitas 16GB',
    selling_price: 45000,
    unit: 'pcs',
    min_stock: 8,
    is_active: true,
    initial_stock: 30,
  },
];

export async function seedProducts(prisma: PrismaClient) {
  const branches = await prisma.posBranch.findMany({
    orderBy: { createdAt: 'asc' },
  });
  if (branches.length === 0) {
    console.log('⚠ No branches found, skipping product seed');
    return;
  }

  let mainBranch = branches.find((branch) => branch.isMain);
  if (!mainBranch) {
    mainBranch = branches[0];
  }

  const categories = await prisma.posProductCategory.findMany();
  const categoryMap = new Map(categories.map((cat) => [cat.name, cat.uuid]));

  let createdCount = 0;

  for (const data of PRODUCTS_DATA) {
    const categoryUuid = categoryMap.get(data.category_name);
    if (!categoryUuid) {
      console.log(`⚠ Category not found: ${data.category_name}`);
      continue;
    }

    const existing = await prisma.posProduct.findUnique({
      where: { sku: data.sku },
    });

    const product = existing
      ? await prisma.posProduct.update({
          where: { sku: data.sku },
          data: {
            categoryUuid,
            name: data.name,
            description: data.description || null,
            barcode: data.barcode || null,
            sellingPrice: data.selling_price,
            minStock: data.min_stock,
            unit: data.unit,
            isActive: data.is_active,
          },
        })
      : await prisma.posProduct.create({
          data: {
            uuid: uuidv7(),
            categoryUuid,
            name: data.name,
            sku: data.sku,
            description: data.description || null,
            barcode: data.barcode || null,
            sellingPrice: data.selling_price,
            minStock: data.min_stock,
            unit: data.unit,
            isActive: data.is_active,
          },
        });

    if (!existing) createdCount += 1;

    for (const branch of branches) {
      const stockValue = branch.uuid === mainBranch.uuid ? data.initial_stock : 0;

      const existingStock = await prisma.posProductStock.findFirst({
        where: {
          productUuid: product.uuid,
          branchUuid: branch.uuid,
        },
      });

      if (existingStock) {
        await prisma.posProductStock.update({
          where: { uuid: existingStock.uuid },
          data: { stock: stockValue },
        });
      } else {
        await prisma.posProductStock.create({
          data: {
            uuid: uuidv7(),
            productUuid: product.uuid,
            branchUuid: branch.uuid,
            stock: stockValue,
          },
        });
      }
    }
  }

  console.log(`✓ ${createdCount} products dummy created`);
}

// Standalone runner
if (require.main === module) {
  const prisma = new PrismaClient();
  seedProducts(prisma)
    .catch((e) => {
      console.error(e);
      process.exit(1);
    })
    .finally(() => prisma.$disconnect());
}
