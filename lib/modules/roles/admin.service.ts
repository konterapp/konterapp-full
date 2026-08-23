import { ApiError } from "@/lib/api-errors";
import { appRoleRepository } from "./repository";
import { mapRole } from "./role.mapper";
import { TENANT_DEFAULT_ROLE_ADMINISTRATOR } from "./templates";
import type { Permission } from "./permissions";

export interface RoleListParams {
  page: number;
  perPage: number;
  search?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

export const appRoleService = {
  async listRoles(companyUuid: string, params: RoleListParams) {
    const { page, perPage, search, sortBy = "created_at", sortOrder = "asc" } = params;
    const where: any = { companyUuid };

    if (search) {
      where.name = { contains: search, mode: "insensitive" };
    }

    const sortFieldMap: Record<string, string> = {
      created_at: "createdAt",
      updated_at: "updatedAt",
      name: "name",
    };
    const sortField = sortFieldMap[sortBy] ?? "createdAt";

    const [total, roles] = await Promise.all([
      appRoleRepository.count(where),
      appRoleRepository.findMany({
        where,
        skip: (page - 1) * perPage,
        take: perPage,
        orderBy: { [sortField]: sortOrder },
      }),
    ]);

    return {
      data: roles.map(mapRole),
      pagination: {
        total,
        totalPages: Math.ceil(total / perPage),
        currentPage: page,
        perPage,
      },
    };
  },

  async getRoleDetail(companyUuid: string, uuid: string) {
    const role = await appRoleRepository.findByUuid(companyUuid, uuid);
    if (!role) {
      throw new ApiError("Role tidak ditemukan", 404);
    }
    return mapRole(role);
  },

  async createRole(
    companyUuid: string,
    payload: { name: string; permissions?: Permission[]; is_full_access?: boolean }
  ) {
    const name = payload.name.trim();
    const permissions = payload.permissions ?? [];
    const isFullAccess = payload.is_full_access ?? false;

    const existing = await appRoleRepository.findByName(companyUuid, name);
    if (existing) {
      throw new ApiError("Nama role sudah digunakan", 400);
    }

    const role = await appRoleRepository.runInTransaction(async (tx) => {
      const createdRole = await appRoleRepository.create(tx, { companyUuid, name, isFullAccess });

      if (!isFullAccess && permissions.length > 0) {
        await appRoleRepository.replacePermissions(tx, createdRole.id, permissions);
      }

      return createdRole;
    });

    return this.getRoleDetail(companyUuid, role.uuid);
  },

  async updateRole(
    companyUuid: string,
    uuid: string,
    payload: {
      name?: string;
      permissions?: Permission[];
      is_full_access?: boolean;
    }
  ) {
    const role = await appRoleRepository.findByUuid(companyUuid, uuid);
    if (!role) {
      throw new ApiError("Role tidak ditemukan", 404);
    }
    if (role.name === TENANT_DEFAULT_ROLE_ADMINISTRATOR) {
      throw new ApiError("Role administrator tidak dapat diubah", 400);
    }

    const name = payload.name?.trim() ?? role.name;
    if (name !== role.name) {
      const existing = await appRoleRepository.findByName(companyUuid, name);
      if (existing && existing.id !== role.id) {
        throw new ApiError("Nama role sudah digunakan", 400);
      }
    }

    const isFullAccess = payload.is_full_access ?? role.isFullAccess;

    await appRoleRepository.runInTransaction(async (tx) => {
      await appRoleRepository.updateByUuid(tx, companyUuid, uuid, {
        name,
        isFullAccess,
      });

      if (isFullAccess) {
        await appRoleRepository.clearPermissions(tx, role.id);
      } else if (payload.permissions !== undefined) {
        await appRoleRepository.replacePermissions(tx, role.id, payload.permissions);
      }
    });

    return this.getRoleDetail(companyUuid, uuid);
  },

  async deleteRole(companyUuid: string, uuid: string) {
    const role = await appRoleRepository.findByUuid(companyUuid, uuid);
    if (!role) {
      throw new ApiError("Role tidak ditemukan", 404);
    }
    if (role.name === TENANT_DEFAULT_ROLE_ADMINISTRATOR) {
      throw new ApiError("Role administrator tidak dapat dihapus", 400);
    }

    const assignments = await appRoleRepository.countAssignments(role.id);
    if (assignments > 0) {
      throw new ApiError("Role sedang digunakan oleh user dan tidak dapat dihapus", 400);
    }

    await appRoleRepository.deleteByUuid(companyUuid, uuid);
  },
};
