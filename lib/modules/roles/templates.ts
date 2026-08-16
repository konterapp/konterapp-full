import { PrismaClient, Prisma } from "@prisma/client";
import { v7 as uuidv7 } from "uuid";

/**
 * Template default role per tenant. Saat sebuah company dibuat, template ini
 * disalin menjadi role milik company tsb (roles.company_uuid). Tenant bebas
 * mengubah permission / menambah role kustom tanpa mempengaruhi tenant lain.
 */
export interface RoleTemplate {
  name: string;
  isFullAccess?: boolean;
  permissions: string[];
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
    permissions: [
      "pos.sale.index",
      "pos.sale.create",
      "pos.product.index",
      "pos.category.index",
      "pos.branch.index",
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
  const permissions = await prisma.permission.findMany({
    select: { id: true, name: true },
  });
  const permissionIdByName = new Map(permissions.map((p) => [p.name, p.id]));

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
      const rolePermissionIds = template.permissions
        .map((name) => permissionIdByName.get(name))
        .filter((id): id is number => id != null);

      await prisma.roleHasPermission.deleteMany({ where: { roleId: role.id } });
      if (rolePermissionIds.length > 0) {
        await prisma.roleHasPermission.createMany({
          data: rolePermissionIds.map((permissionId) => ({
            roleId: role.id,
            permissionId,
          })),
        });
      }
    }
  }
}
