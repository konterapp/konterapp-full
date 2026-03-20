import { ApiError, ValidationApiError } from "@/lib/api-errors";
import { roleRepository } from "./repository";
import { formatRole } from "./role.mapper";

function getSortConfig(sortBy: string, sortOrder: string) {
  const allowedSorts = ["id", "name", "created_at"];
  const sortField = allowedSorts.includes(sortBy) ? sortBy : "id";
  const sortDir = sortOrder === "asc" ? "asc" : "desc";
  const sortFieldMap: Record<string, string> = {
    id: "id",
    name: "name",
    created_at: "createdAt",
  };

  return {
    orderBy: { [sortFieldMap[sortField]]: sortDir as "asc" | "desc" },
  };
}

export const roleService = {
  async listRoles(params: {
    page: number;
    perPage: number;
    search: string;
    sortBy: string;
    sortOrder: string;
  }) {
    const { page, perPage, search, sortBy, sortOrder } = params;
    const where: any = {};

    if (search) {
      where.name = { contains: search };
    }

    const { orderBy } = getSortConfig(sortBy, sortOrder);
    const skip = (page - 1) * perPage;

    const [roles, total] = await Promise.all([
      roleRepository.findMany({ where, orderBy, skip, take: perPage }),
      roleRepository.count(where),
    ]);

    return {
      roles: roles.map(formatRole),
      total,
      page,
      perPage,
    };
  },

  async getRoleDetail(id: number) {
    const role = await roleRepository.findById(id);
    if (!role) {
      throw new ApiError("Role tidak ditemukan", 404);
    }

    return formatRole(role);
  },

  async createRole(payload: { name: string; permissions?: string[] }) {
    const existing = await roleRepository.findByName(payload.name);
    if (existing) {
      throw new ValidationApiError({ name: ["Nama role sudah ada"] });
    }

    const role = await roleRepository.createRole(payload);
    return formatRole(role);
  },

  async updateRole(payload: { id: number; name: string; permissions?: string[] }) {
    const existingRole = await roleRepository.findById(payload.id);
    if (!existingRole) {
      throw new ApiError("Role tidak ditemukan", 404);
    }

    const existingName = await roleRepository.findByName(payload.name, payload.id);
    if (existingName) {
      throw new ValidationApiError({ name: ["Nama role sudah ada"] });
    }

    const updatedRole = await roleRepository.updateRole(payload);
    return formatRole(updatedRole);
  },

  async deleteRole(id: number) {
    const existingRole = await roleRepository.findById(id);
    if (!existingRole) {
      throw new ApiError("Role tidak ditemukan", 404);
    }

    await roleRepository.deleteRole(id);
  },

  async listPermissions() {
    const permissions = await roleRepository.listAllPermissions();
    return permissions.map((p) => ({ name: p.name }));
  },
};
