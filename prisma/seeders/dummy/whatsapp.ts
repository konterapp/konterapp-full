/**
 * Dummy seeder untuk fitur WhatsApp (koneksi Baileys + notifikasi).
 * Jalankan: npm run seed:dummy prisma/seeders/dummy/whatsapp.ts
 *
 * Sesi sengaja dibuat dengan status disconnected (QR hanya muncul saat user
 * menekan Connect di halaman), dan pengaturan notifikasi dibuat non-aktif
 * supaya tidak ada pengiriman tak terduga di data dummy.
 */
import { PrismaClient } from "@prisma/client";
import { v7 as uuidv7 } from "uuid";

export async function seedWhatsapp(prisma: PrismaClient) {
  const companies = await prisma.company.findMany({
    where: { code: { in: ["CMP-002", "CMP-003", "CMP-004"] } },
    select: { uuid: true },
  });

  for (const company of companies) {
    await prisma.appWhatsappSession.upsert({
      where: { companyUuid: company.uuid },
      update: {},
      create: {
        uuid: uuidv7(),
        companyUuid: company.uuid,
        status: "disconnected",
      },
    });

    await prisma.appWhatsappNotificationSetting.upsert({
      where: { companyUuid_type: { companyUuid: company.uuid, type: "stock_low" } },
      update: {},
      create: {
        uuid: uuidv7(),
        companyUuid: company.uuid,
        type: "stock_low",
        isEnabled: false,
        targetPhone: null,
        threshold: 5,
      },
    });

    await prisma.appWhatsappNotificationSetting.upsert({
      where: { companyUuid_type: { companyUuid: company.uuid, type: "saldo_low" } },
      update: {},
      create: {
        uuid: uuidv7(),
        companyUuid: company.uuid,
        type: "saldo_low",
        isEnabled: false,
        targetPhone: null,
        threshold: 50000,
      },
    });
  }

  console.log(`✓ WhatsApp dummy data created for ${companies.length} companies`);
}