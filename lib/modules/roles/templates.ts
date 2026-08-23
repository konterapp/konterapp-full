import { PrismaClient, Prisma } from "@prisma/client";
import { v7 as uuidv7 } from "uuid";
import type { Permission } from "./permissions";

/**
 * Template default role per tenant. Saat sebuah company dibuat, template ini
 * disalin menjadi role milik company tsb (roles.company_uuid). Tenant bebas
 * mengubah permission / menambah role kustom tanpa mempengaruhi tenant lain.
 */
export interface RoleTemplate {
  name: string;
  isFullAccess?: boolean;
  permissions: Permission[];
}

export const TENANT_DEFAULT_ROLE_ADMINISTRATOR = "administrator";
export const TENANT_DEFAULT_ROLE_KASIR = "kasir";

export const TENANT_DEFAULT_ROLE_TEMPLATES: RoleTemplate[] = [
  {
    name: TENANT_DEFAULT_ROLE_ADMINISTRATOR,
    // Full access: otomatis mendapat semua permission katalog (saat ini
    // maupun yang ditambahkan nanti), tidak perlu mapping eksplisit.
    isFullAccess: true,
    permissions: [],
  },
  {
    name: TENANT_DEFAULT_ROLE_KASIR,
    // Sengaja TIDAK dikasih pos.branch.index -- itu permission buat kelola
    // menu Cabang (bukan sekadar lihat nama cabang buat dropdown filter,
    // yang sudah dilayani endpoint /api/app/pos/branches/options tanpa
    // syarat permission spesifik). Tanpa permission ini, role Kasir kena
    // fitur pembatasan cabang: admin wajib pilih cabang penempatan saat
    // bikin user dengan role ini.
    permissions: [
      "pos.sale.index",
      "pos.sale.create",
      "pos.product.index",
      "pos.category.index",
    ],
  },
];

/**
 * Buat role default untuk sebuah company (idempotent). Dipanggil saat company
 * dibuat (companyService.createCompany) dan oleh seeder.
 */
export async function seedTenantDefaultRoles(
  prisma: PrismaClient | Prisma.TransactionClient,
  companyUuid: string
) {
  for (const template of TENANT_DEFAULT_ROLE_TEMPLATES) {
    const role = await prisma.role.upsert({
      where: {
        roles_company_uuid_name_unique: {
          companyUuid,
          name: template.name,
        },
      },
      update: {
        isFullAccess: template.isFullAccess ?? false,
      },
      create: {
        uuid: uuidv7(),
        name: template.name,
        companyUuid,
        isFullAccess: template.isFullAccess ?? false,
      },
    });

    if (template.permissions.length > 0) {
      await prisma.roleHasPermission.deleteMany({ where: { roleId: role.id } });
      await prisma.roleHasPermission.createMany({
        data: template.permissions.map((permissionName) => ({
          roleId: role.id,
          permissionName,
        })),
      });
    }
  }
}
