import { hash } from "bcryptjs";
import { v7 as uuidv7 } from "uuid";
import { ApiError, ValidationApiError } from "@/lib/api-errors";
import { appUserRepository } from "./app.repository";
import { mapAppUser } from "./app.user.mapper";
import { TENANT_DEFAULT_ROLE_ADMINISTRATOR } from "@/lib/modules/roles/templates";

export interface AppUserListParams {
  page: number;
  perPage: number;
  search?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

export const appUserService = {
  async listUsers(companyUuid: string, params: AppUserListParams) {
    const { page, perPage, search, sortBy = "created_at", sortOrder = "desc" } = params;
    const where: any = {};

    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
      ];
    }

    const sortFieldMap: Record<string, string> = {
      created_at: "createdAt",
      name: "name",
      email: "email",
    };
    const sortField = sortFieldMap[sortBy] ?? "createdAt";

    const [total, users] = await Promise.all([
      appUserRepository.countMembers(companyUuid, where),
      appUserRepository.listMembers(companyUuid, where, { [sortField]: sortOrder }, (page - 1) * perPage, perPage),
    ]);

    return {
      data: users.map((user) => mapAppUser(user, companyUuid)),
      pagination: {
        total,
        totalPages: Math.ceil(total / perPage),
        currentPage: page,
        perPage,
      },
    };
  },

  async getRoles(companyUuid: string) {
    return appUserRepository.listCompanyRoles(companyUuid);
  },

  async getUserDetail(companyUuid: string, uuid: string) {
    const user = await appUserRepository.findMember(companyUuid, uuid);
    if (!user) {
      throw new ApiError("User tidak ditemukan", 404);
    }
    return mapAppUser(user, companyUuid);
  },

  async createUser(
    companyUuid: string,
    payload: { name: string; email: string; password: string; role_uuids: string[] }
  ) {
    const normalizedEmail = payload.email.trim().toLowerCase();

    const existing = await appUserRepository.findByEmail(normalizedEmail);
    if (existing) {
      throw new ValidationApiError({ email: ["Email sudah terdaftar"] });
    }

    const roles = await this.resolveRoles(companyUuid, payload.role_uuids);

    const hashedPassword = await hash(payload.password, 10);

    const created = await appUserRepository.createMember({
      companyUuid,
      userData: {
        uuid: uuidv7(),
        name: payload.name.trim(),
        email: normalizedEmail,
        password: hashedPassword,
        isActive: true,
      },
      roleIds: roles.map((role) => role.id),
    });

    return this.getUserDetail(companyUuid, created.uuid);
  },

  async updateUser(
    companyUuid: string,
    uuid: string,
    payload: {
      name?: string;
      email?: string;
      password?: string;
      role_uuids?: string[];
      is_active?: boolean;
    },
    currentUserId: number
  ) {
    const user = await appUserRepository.findMember(companyUuid, uuid);
    if (!user) {
      throw new ApiError("User tidak ditemukan", 404);
    }

    const userData: Record<string, unknown> = {};

    if (payload.name !== undefined) {
      userData.name = payload.name.trim();
    }

    if (payload.email !== undefined && payload.email.trim().toLowerCase() !== user.email) {
      const normalizedEmail = payload.email.trim().toLowerCase();
      const existing = await appUserRepository.findByEmail(normalizedEmail, uuid);
      if (existing) {
        throw new ValidationApiError({ email: ["Email sudah terdaftar"] });
      }
      userData.email = normalizedEmail;
    }

    if (payload.password) {
      userData.password = await hash(payload.password, 10);
    }

    const hasCurrentAdminRole = user.modelHasRoles.some(
      (assignment: any) => assignment.role.name === TENANT_DEFAULT_ROLE_ADMINISTRATOR
    );

    let roleIds: number[] | null = null;
    let losesAdmin = false;
    if (payload.role_uuids !== undefined) {
      const roles = await this.resolveRoles(companyUuid, payload.role_uuids);
      roleIds = roles.map((role) => role.id);
      losesAdmin = hasCurrentAdminRole && !roles.some((role) => role.name === TENANT_DEFAULT_ROLE_ADMINISTRATOR);
    }

    const deactivating = payload.is_active === false && user.isActive;
    if (deactivating && user.id === currentUserId) {
      throw new ApiError("Tidak dapat menonaktifkan akun sendiri", 400);
    }

    if ((losesAdmin || deactivating) && hasCurrentAdminRole) {
      const otherAdmins = await appUserRepository.countAdmins(companyUuid, user.id);
      if (otherAdmins === 0) {
        throw new ApiError("Tidak dapat menghapus administrator terakhir di perusahaan ini", 400);
      }
    }

    if (Object.keys(userData).length > 0) {
      await appUserRepository.updateUserData(user.id, userData);
    }

    if (roleIds !== null) {
      await appUserRepository.replaceCompanyRoles(companyUuid, user.id, roleIds);
    }

    return this.getUserDetail(companyUuid, uuid);
  },

  async deleteUser(companyUuid: string, uuid: string, currentUserId: number) {
    const user = await appUserRepository.findMember(companyUuid, uuid);
    if (!user) {
      throw new ApiError("User tidak ditemukan", 404);
    }
    if (user.id === currentUserId) {
      throw new ApiError("Tidak dapat menghapus akun sendiri", 400);
    }

    const hasAdminRole = user.modelHasRoles.some(
      (assignment: any) => assignment.role.name === TENANT_DEFAULT_ROLE_ADMINISTRATOR
    );
    if (hasAdminRole) {
      const otherAdmins = await appUserRepository.countAdmins(companyUuid, user.id);
      if (otherAdmins === 0) {
        throw new ApiError("Tidak dapat menghapus administrator terakhir di perusahaan ini", 400);
      }
    }

    await appUserRepository.removeFromCompany(companyUuid, user.id);
  },

  async resolveRoles(companyUuid: string, roleUuids: string[]) {
    const uniqueUuids = [...new Set(roleUuids)];
    const roles = await appUserRepository.findRolesByUuids(companyUuid, uniqueUuids);
    if (roles.length !== uniqueUuids.length || roles.length === 0) {
      throw new ValidationApiError({ role_uuids: ["Role tidak valid untuk perusahaan ini"] });
    }
    return roles;
  },
};
