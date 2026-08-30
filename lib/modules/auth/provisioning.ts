import { hash } from "bcryptjs";
import { v7 as uuidv7 } from "uuid";
import { Prisma, PrismaClient } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import {
  seedTenantDefaultRoles,
  TENANT_DEFAULT_ROLE_ADMINISTRATOR,
} from "@/lib/modules/roles/templates";
import { FREE_PLAN_CODE } from "@/lib/modules/billing/constants";
import { generateReferralCode } from "@/lib/modules/referral/constants";

const MODEL_TYPE_USER = "App\\Models\\User";

const TENANT_DEFAULT_SALDO_ACCOUNTS = [
  { code: "CASH", name: "Tunai", type: "cash" },
  { code: "BRI", name: "BRI", type: "bank" },
  { code: "BNI", name: "BNI", type: "bank" },
  { code: "DANA", name: "Dana", type: "e_wallet" },
];

const TENANT_DEFAULT_PRODUCT_CATEGORIES = [
  { name: "Pulsa & Voucher", description: "Voucher pulsa, paket data, dan token listrik" },
  { name: "Aksesoris HP", description: "Case, charger, headset, dan aksesoris ponsel lainnya" },
  { name: "Minuman & Snack", description: "Minuman ringan, kopi, dan makanan ringan" },
  { name: "Rokok", description: "Berbagai merek rokok dan produk tembakau" },
  { name: "Percetakan", description: "Cetak foto, fotokopi, dan jasa percetakan lainnya" },
];

const TENANT_DEFAULT_UNITS = [
  { name: "pcs", description: "Piece / Satuan" },
  { name: "pack", description: "Pack / Kemasan" },
  { name: "box", description: "Box / Kotak" },
  { name: "lusin", description: "Lusin / 12 item" },
];

// categoryName harus cocok dengan salah satu nama di TENANT_DEFAULT_PRODUCT_CATEGORIES.
const TENANT_DEFAULT_PRODUCTS = [
  {
    categoryName: "Pulsa & Voucher",
    name: "Pulsa Elektrik 10.000",
    unit: "pcs",
    purchasePrice: 10500,
    sellingPrice: 12000,
  },
  {
    categoryName: "Aksesoris HP",
    name: "Kabel Data USB",
    unit: "pcs",
    purchasePrice: 12000,
    sellingPrice: 20000,
  },
  {
    categoryName: "Minuman & Snack",
    name: "Air Mineral 600ml",
    unit: "pcs",
    purchasePrice: 3500,
    sellingPrice: 5000,
  },
  {
    categoryName: "Rokok",
    name: "Rokok Kemasan",
    unit: "pack",
    purchasePrice: 22000,
    sellingPrice: 25000,
  },
  {
    categoryName: "Percetakan",
    name: "Cetak Foto 4R",
    unit: "pcs",
    purchasePrice: 1500,
    sellingPrice: 3000,
  },
];

async function seedTenantDefaults(tx: Prisma.TransactionClient, companyUuid: string) {
  const mainBranch = await tx.appPosBranch.create({
    data: {
      uuid: uuidv7(),
      companyUuid,
      code: "MAIN",
      name: "Kantor Pusat",
      isMain: true,
      isActive: true,
    },
  });

  for (const [sortOrder, saldo] of TENANT_DEFAULT_SALDO_ACCOUNTS.entries()) {
    const account = await tx.appPosSaldoAccount.create({
      data: {
        uuid: uuidv7(),
        companyUuid,
        code: saldo.code,
        name: saldo.name,
        type: saldo.type,
        isPaymentMethod: true,
        isActive: true,
        sortOrder,
      },
    });

    // Tenant baru cuma punya 1 cabang -> semua akun default cukup 1 grup
    // balance yang di-link ke mainBranch itu.
    const balanceRow = await tx.appPosSaldoAccountBalance.create({
      data: {
        uuid: uuidv7(),
        companyUuid,
        saldoAccountUuid: account.uuid,
        balance: 0,
      },
    });

    await tx.appPosSaldoAccountBalanceBranch.create({
      data: {
        uuid: uuidv7(),
        companyUuid,
        saldoAccountUuid: account.uuid,
        saldoAccountBalanceUuid: balanceRow.uuid,
        branchUuid: mainBranch.uuid,
      },
    });
  }

  const categoryUuidByName = new Map<string, string>();
  for (const cat of TENANT_DEFAULT_PRODUCT_CATEGORIES) {
    const created = await tx.appPosProductCategory.create({
      data: {
        uuid: uuidv7(),
        companyUuid,
        name: cat.name,
        description: cat.description,
      },
    });
    categoryUuidByName.set(cat.name, created.uuid);
  }

  for (const unit of TENANT_DEFAULT_UNITS) {
    await tx.appPosProductUnit.create({
      data: {
        uuid: uuidv7(),
        companyUuid,
        name: unit.name,
        description: unit.description,
      },
    });
  }

  for (const product of TENANT_DEFAULT_PRODUCTS) {
    const categoryUuid = categoryUuidByName.get(product.categoryName);
    if (!categoryUuid) continue;

    const createdProduct = await tx.appPosProduct.create({
      data: {
        uuid: uuidv7(),
        companyUuid,
        categoryUuid,
        name: product.name,
        sku: `DEF-${crypto.randomUUID().replace(/-/g, "").slice(0, 8).toUpperCase()}`,
        purchasePrice: product.purchasePrice,
        sellingPrice: product.sellingPrice,
        unit: product.unit,
        isActive: true,
      },
    });

    await tx.appPosProductStock.create({
      data: {
        uuid: uuidv7(),
        companyUuid,
        productUuid: createdProduct.uuid,
        branchUuid: mainBranch.uuid,
        stock: 0,
      },
    });
  }
}

// Alphabet tanpa karakter ambigu (0/O, 1/I/L) supaya kode mudah dibaca
// dan disebarkan via telepon/chat.
const CODE_ALPHABET = "23456789ABCDEFGHJKMNPQRSTUVWXYZ";
const CODE_LENGTH = 6;

/**
 * Generate kode company acak berformat KTR-XXXXXX (30^6 ~= 729 juta
 * kombinasi). Tidak sekuensial: tidak bocor jumlah tenant dan tidak
 * perlu query max -- cukup cek unique constraint + retry saat tabrakan.
 */
function generateCompanyCode(): string {
  const bytes = crypto.getRandomValues(new Uint32Array(CODE_LENGTH));
  let code = "";
  for (let i = 0; i < CODE_LENGTH; i++) {
    code += CODE_ALPHABET[bytes[i] % CODE_ALPHABET.length];
  }
  return `KTR-${code}`;
}

async function createCompanyWithUniqueCode(tx: Prisma.TransactionClient, name: string) {
  for (let attempt = 0; attempt < 10; attempt++) {
    const code = generateCompanyCode();
    try {
      return await tx.company.create({
        data: { code, name, isActive: true },
        select: { uuid: true, code: true, name: true },
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2002"
      ) {
        continue;
      }
      throw error;
    }
  }
  throw new Error("Gagal membuat kode perusahaan unik, silakan coba lagi");
}

/**
 * Provisioning tenant untuk user yang SUDAH ada: bikin perusahaan, role
 * default tenant, membership user sebagai administrator tenant, dan
 * subscription free trial. Dipakai oleh onboarding setelah login Google
 * pertama kali (nama perusahaan diinput user sendiri).
 */
export async function provisionCompanyForUser(params: {
  userId: number;
  companyName: string;
}): Promise<{ uuid: string; code: string; name: string }> {
  const { userId, companyName } = params;

  return (prisma as unknown as PrismaClient).$transaction(async (tx) => {
    const company = await createCompanyWithUniqueCode(tx, companyName);

    await seedTenantDefaultRoles(tx, company.uuid);
    await seedTenantDefaults(tx, company.uuid);

    const adminRole = await tx.role.findFirst({
      where: { companyUuid: company.uuid, name: TENANT_DEFAULT_ROLE_ADMINISTRATOR },
      select: { id: true },
    });
    if (!adminRole) {
      throw new Error("Role administrator tenant tidak ditemukan");
    }

    await tx.modelHasRole.create({
      data: {
        roleId: adminRole.id,
        modelType: MODEL_TYPE_USER,
        modelId: userId,
        companyUuid: company.uuid,
      },
    });

    await tx.companyUser.create({
      data: {
        companyUuid: company.uuid,
        userId,
        isDefault: true,
        isActive: true,
        // Company dibuat sendiri oleh user ini, bukan diundang -> langsung diterima.
        invitationAcceptedAt: new Date(),
      },
    });

    const trialPlan = await tx.plan.findUnique({
      where: { code: FREE_PLAN_CODE },
    });
    if (trialPlan) {
      const startedAt = new Date();
      await tx.companySubscription.create({
        data: {
          companyUuid: company.uuid,
          planUuid: trialPlan.uuid,
          status: "active",
          startedAt,
          // Free selamanya: berlaku tanpa kedaluwarsa (expiresAt null).
          expiresAt: null,
        },
      });
    }

    return company;
  });
}

/**
 * Provisioning user + tenant baru dalam satu transaksi: bikin user lalu
 * perusahaan lengkap dengan role default, subscription free trial, dan
 * user sebagai administrator tenant. Dipakai oleh registrasi password.
 */
export async function provisionTenantUser(params: {
  name: string;
  email: string;
  passwordHash: string;
  companyName?: string;
  referredByUserId?: number;
}): Promise<{
  user: { id: number; uuid: string; name: string; email: string };
  company: { uuid: string; code: string; name: string };
}> {
  const { name, email, passwordHash, companyName, referredByUserId } = params;

  return (prisma as unknown as PrismaClient).$transaction(async (tx) => {
    const company = await createCompanyWithUniqueCode(tx, companyName || `Konter ${name}`);

    await seedTenantDefaultRoles(tx, company.uuid);
    await seedTenantDefaults(tx, company.uuid);

    const adminRole = await tx.role.findFirst({
      where: { companyUuid: company.uuid, name: TENANT_DEFAULT_ROLE_ADMINISTRATOR },
      select: { id: true },
    });
    if (!adminRole) {
      throw new Error("Role administrator tenant tidak ditemukan");
    }

    // Generate kode referral unik untuk user baru (retry jika tabrakan).
    let referralCode: string | undefined;
    for (let i = 0; i < 10; i++) {
      const candidate = generateReferralCode();
      const exists = await tx.user.findUnique({
        where: { referralCode: candidate },
        select: { id: true },
      });
      if (!exists) {
        referralCode = candidate;
        break;
      }
    }
    if (!referralCode) {
      throw new Error("Gagal membuat kode referral unik");
    }

    const user = await tx.user.create({
      data: {
        uuid: uuidv7(),
        name,
        email,
        password: passwordHash,
        isActive: true,
        referralCode,
        referredByUserId: referredByUserId ?? undefined,
        // Registrasi password: wajib verifikasi email sebelum bisa login.
        emailVerifiedAt: null,
      },
      select: {
        id: true,
        uuid: true,
        name: true,
        email: true,
      },
    });

    await tx.modelHasRole.create({
      data: {
        roleId: adminRole.id,
        modelType: MODEL_TYPE_USER,
        modelId: user.id,
        companyUuid: company.uuid,
      },
    });

    await tx.companyUser.create({
      data: {
        companyUuid: company.uuid,
        userId: user.id,
        isDefault: true,
        isActive: true,
        // Company dibuat sendiri oleh user ini, bukan diundang -> langsung diterima.
        invitationAcceptedAt: new Date(),
      },
    });

    const trialPlan = await tx.plan.findUnique({
      where: { code: FREE_PLAN_CODE },
    });
    if (trialPlan) {
      const startedAt = new Date();
      await tx.companySubscription.create({
        data: {
          companyUuid: company.uuid,
          planUuid: trialPlan.uuid,
          status: "active",
          startedAt,
          // Free selamanya: berlaku tanpa kedaluwarsa (expiresAt null).
          expiresAt: null,
        },
      });
    }

    return { user, company };
  });
}

/**
 * Cari user berdasarkan email; kalau belum ada (login Google pertama kali),
 * buat user TANPA perusahaan -- nama perusahaan diinput user sendiri
 * lewat halaman onboarding setelah login.
 */
export async function findOrCreateGoogleUser(params: {
  email: string;
  name?: string | null;
}): Promise<{
  id: number;
  uuid: string;
  name: string;
  email: string;
  isActive: boolean;
  isNewUser: boolean;
}> {
  const email = params.email.trim().toLowerCase();
  const name = (params.name?.trim() || email.split("@")[0]).slice(0, 255);

  const existingUser = await prisma.user.findFirst({
    where: { email, deletedAt: null },
  });

  if (existingUser) {
    // Email Google sudah terverifikasi; tandai kalau belum.
    if (!existingUser.emailVerifiedAt) {
      await prisma.user.update({
        where: { id: existingUser.id },
        data: { emailVerifiedAt: new Date() },
      });
    }
    return {
      id: existingUser.id,
      uuid: existingUser.uuid,
      name: existingUser.name,
      email: existingUser.email,
      isActive: existingUser.isActive,
      isNewUser: false,
    };
  }

  // Password acak yang tidak diketahui siapa pun -> akun ini hanya bisa
  // diakses lewat login Google sampai user set password (bila ada fiturnya).
  const randomPasswordHash = await hash(crypto.randomUUID(), 10);

  const user = await prisma.user.create({
    data: {
      uuid: uuidv7(),
      name,
      email,
      password: randomPasswordHash,
      isActive: true,
      emailVerifiedAt: new Date(),
    },
    select: {
      id: true,
      uuid: true,
      name: true,
      email: true,
    },
  });

  return { ...user, isActive: true, isNewUser: true };
}
