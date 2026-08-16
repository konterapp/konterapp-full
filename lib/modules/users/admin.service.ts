import { hash } from "bcryptjs";
import { v7 as uuidv7 } from "uuid";
import { ApiError, ValidationApiError } from "@/lib/api-errors";
import { getUserPermissions } from "@/lib/permissions";
import { formatUser } from "./user.mapper";
import { userRepository } from "./repository";

function getSortConfig(sortBy: string, sortOrder: string) {
  const allowedSorts = ["id", "name", "email", "created_at"];
  const sortField = allowedSorts.includes(sortBy) ? sortBy : "id";
  const sortDir = sortOrder === "asc" ? "asc" : "desc";
  const sortFieldMap: Record<string, string> = {
    id: "id",
    name: "name",
    email: "email",
    created_at: "createdAt",
  };
  return {
    orderBy: { [sortFieldMap[sortField]]: sortDir as "asc" | "desc" },
  };
}

export const userService = {
  async listUsers(params: {
    page: number;
    perPage: number;
    search: string;
    sortBy: string;
    sortOrder: string;
    role: string;
  }) {
    const { page, perPage, search, sortBy, sortOrder, role } = params;
    const where: any = { deletedAt: null };

    if (search) {
      where.OR = [{ name: { contains: search } }, { email: { contains: search } }];
    }

    if (role) {
      where.modelHasRoles = {
        some: {
          role: { name: role },
        },
      };
    }

    const { orderBy } = getSortConfig(sortBy, sortOrder);
    const skip = (page - 1) * perPage;

    const [users, total] = await Promise.all([
      userRepository.findMany(where, orderBy, skip, perPage),
      userRepository.count(where),
    ]);

    return {
      users: users.map((user) => formatUser(user)),
      total,
      page,
      perPage,
    };
  },

  async getRoles() {
    return userRepository.listRoles();
  },

  async getUserDetail(uuid: string) {
    const user = await userRepository.findByUuid(uuid);
    if (!user) {
      throw new ApiError("User tidak ditemukan", 404);
    }

    const permissions = await getUserPermissions(user.id);
    return formatUser(user, permissions);
  },

  async createUser(payload: any) {
    const companyUuid: string = payload.company_uuid;
    const existingEmail = await userRepository.findByEmail(payload.email);
    if (existingEmail) {
      throw new ValidationApiError({ email: ["Email sudah terdaftar"] });
    }

    const role = await userRepository.findRoleById(payload.roles);
    if (!role) {
      throw new ValidationApiError({ roles: ["Role tidak valid"] });
    }

    const hashedPassword = await hash(payload.password, 10);

    const user = await userRepository.createWithRole({
      userData: {
        uuid: uuidv7(),
        name: payload.name,
        email: payload.email,
        password: hashedPassword,
        isActive: true,
      },
      roleId: role.id,
      companyUuid,
    });

    return formatUser(user);
  },

  async updateUser(uuid: string, payload: any) {
    const user = await userRepository.findByUuidBasic(uuid);
    if (!user) {
      throw new ApiError("User tidak ditemukan", 404);
    }

    const existingEmail = await userRepository.findByEmail(payload.email, uuid);
    if (existingEmail) {
      throw new ValidationApiError({ email: ["Email sudah terdaftar"] });
    }

    const role = await userRepository.findRoleById(payload.roles);
    if (!role) {
      throw new ValidationApiError({ roles: ["Role tidak valid"] });
    }

    const userData: Record<string, unknown> = {
      name: payload.name,
      email: payload.email,
    };

    if (payload.password) {
      userData.password = await hash(payload.password, 10);
    }

    const updated = await userRepository.updateWithRole({
      userId: user.id,
      roleId: role.id,
      userData,
    });

    return formatUser(updated);
  },

  async deleteUser(uuid: string) {
    const user = await userRepository.findByUuidBasic(uuid);
    if (!user) {
      throw new ApiError("User tidak ditemukan", 404);
    }

    await userRepository.softDeleteById(user.id);
  },

  async toggleUserActive(uuid: string) {
    const user = await userRepository.findByUuidBasic(uuid);
    if (!user) {
      throw new ApiError("User tidak ditemukan", 404);
    }

    const updated = await userRepository.toggleActiveById(user.id, !user.isActive);
    return formatUser(updated);
  },
};
