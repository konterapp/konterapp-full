import { roleRepository } from "./repository";
import { formatRole } from "./role.mapper";

type ValidationErr = { ok: false; statusCode: 422; errors: Record<string, string[]>; message?: string };
type NotFoundErr = { ok: false; statusCode: 404; message: string };
type ServiceErr = ValidationErr | NotFoundErr;
type ServiceOk<T> = { ok: true; data: T; message?: string };
type ServiceResult<T> = ServiceOk<T> | ServiceErr;

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
    sortDir,
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

  async getRoleDetail(id: number): Promise<ServiceResult<any>> {
    const role = await roleRepository.findById(id);
    if (!role) {
      return { ok: false, statusCode: 404, message: "Role tidak ditemukan" };
    }

    return { ok: true, data: formatRole(role) };
  },

  async createRole(payload: { name: string; permissions?: string[] }): Promise<ServiceResult<any>> {
    const existing = await roleRepository.findByName(payload.name);
    if (existing) {
      return { ok: false, statusCode: 422, errors: { name: ["Nama role sudah ada"] } };
    }

    const role = await roleRepository.createRole(payload);
    return { ok: true, data: formatRole(role), message: "Role created successfully" };
  },

  async updateRole(payload: { id: number; name: string; permissions?: string[] }): Promise<ServiceResult<any>> {
    const existingRole = await roleRepository.findById(payload.id);
    if (!existingRole) {
      return { ok: false, statusCode: 404, message: "Role tidak ditemukan" };
    }

    const existingName = await roleRepository.findByName(payload.name, payload.id);
    if (existingName) {
      return { ok: false, statusCode: 422, errors: { name: ["Nama role sudah ada"] } };
    }

    const updatedRole = await roleRepository.updateRole(payload);
    return { ok: true, data: formatRole(updatedRole), message: "Role updated successfully" };
  },

  async deleteRole(id: number): Promise<ServiceResult<null>> {
    const existingRole = await roleRepository.findById(id);
    if (!existingRole) {
      return { ok: false, statusCode: 404, message: "Role tidak ditemukan" };
    }

    await roleRepository.deleteRole(id);
    return { ok: true, data: null, message: "Role deleted successfully" };
  },

  async listPermissions() {
    const permissions = await roleRepository.listAllPermissions();
    return permissions.map((p) => ({ name: p.name }));
  },
};
