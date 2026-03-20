import { hash } from "bcryptjs";
import { mkdir, unlink, writeFile } from "fs/promises";
import { join } from "path";
import { v7 as uuidv7 } from "uuid";
import { getUserPermissions } from "@/lib/permissions";
import { formatUser } from "./user.mapper";
import { userRepository } from "./repository";

const avatarUploadDir = join(process.cwd(), "public", "uploads", "avatars");

type ValidationErr = { ok: false; statusCode: 422; errors: Record<string, string[]>; message?: string };
type NotFoundErr = { ok: false; statusCode: 404; message: string };
type ServiceErr = ValidationErr | NotFoundErr;
type ServiceOk<T> = { ok: true; data: T; message?: string };
type ServiceResult<T> = ServiceOk<T> | ServiceErr;

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
    sortDir,
    orderBy: { [sortFieldMap[sortField]]: sortDir as "asc" | "desc" },
  };
}

function getSourceFilter(source: string) {
  if (!source) return undefined;
  if (source === "local") return null;
  if (source === "mice") return "mice_auth";
  if (source === "event_daerah") return "event_daerah";
  return source;
}

async function saveAvatar(file: File) {
  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);
  const avatarFilename = `${uuidv7()}_${file.name}`;
  await mkdir(avatarUploadDir, { recursive: true });
  await writeFile(join(avatarUploadDir, avatarFilename), buffer);
  return avatarFilename;
}

async function removeAvatarIfExists(filename?: string | null) {
  if (!filename) return;
  try {
    await unlink(join(avatarUploadDir, filename));
  } catch {
    // ignore missing file
  }
}

function validateRoleSpecificFields(roleName: string, payload: any): ServiceErr | null {
  if (roleName === "pemda" && !payload.wilayah_kode) {
    return { ok: false, statusCode: 422, errors: { wilayah_kode: ["Wilayah wajib dipilih"] } };
  }
  if (roleName === "pemprov" && !payload.province_id) {
    return { ok: false, statusCode: 422, errors: { province_id: ["Provinsi wajib dipilih"] } };
  }
  if ((roleName === "curator" || roleName === "verifikator") && !payload.admin_scope) {
    return { ok: false, statusCode: 422, errors: { admin_scope: ["Admin scope wajib dipilih"] } };
  }
  return null;
}

export const userService = {
  async listUsers(params: {
    page: number;
    perPage: number;
    search: string;
    sortBy: string;
    sortOrder: string;
    role: string;
    source: string;
  }) {
    const { page, perPage, search, sortBy, sortOrder, role, source } = params;
    const where: any = { deletedAt: null };

    if (search) {
      where.OR = [
        { name: { contains: search } },
        { email: { contains: search } },
      ];
    }

    if (role) {
      where.modelHasRoles = {
        some: {
          role: { name: role },
        },
      };
    }

    const sourceFilter = getSourceFilter(source);
    if (sourceFilter !== undefined) {
      where.sourceDb = sourceFilter;
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

  async getUserDetail(uuid: string): Promise<ServiceResult<any>> {
    const user = await userRepository.findByUuid(uuid);
    if (!user) {
      return { ok: false, statusCode: 404, message: "User tidak ditemukan" };
    }

    const permissions = await getUserPermissions(user.id);
    return { ok: true, data: formatUser(user, permissions) };
  },

  async createUser(payload: any, profilePhotoFile: File | null): Promise<ServiceResult<any>> {
    const existingEmail = await userRepository.findByEmail(payload.email);
    if (existingEmail) {
      return { ok: false, statusCode: 422, errors: { email: ["Email sudah terdaftar"] } };
    }

    const role = await userRepository.findRoleById(payload.roles);
    if (!role) {
      return { ok: false, statusCode: 422, errors: { roles: ["Role tidak valid"] } };
    }

    const roleValidationError = validateRoleSpecificFields(role.name, payload);
    if (roleValidationError) return roleValidationError;

    let avatarFilename: string | null = null;
    if (profilePhotoFile && profilePhotoFile.size > 0) {
      avatarFilename = await saveAvatar(profilePhotoFile);
    }

    const adminScope =
      role.name === "curator" || role.name === "verifikator"
        ? payload.admin_scope ?? null
        : null;

    const dcClean = (payload.dc ?? "").replace("+", "");
    const hashedPassword = await hash(payload.password, 10);

    const user = await userRepository.createWithProfileAndRole({
      userData: {
        uuid: uuidv7(),
        name: payload.name,
        email: payload.email,
        password: hashedPassword,
        isActive: true,
      },
      profileData: {
        phone: dcClean + (payload.phone_without_dc ?? ""),
        phoneWithoutDc: payload.phone_without_dc ?? null,
        dc: payload.dc ?? null,
        iso: payload.iso ?? null,
        title: payload.title ?? null,
        company: payload.company ?? null,
        workUnit: payload.work_unit ?? null,
        adminScope,
        provinceId: payload.province_id ?? null,
        cityId: payload.city_id ?? null,
        wilayahKode: payload.wilayah_kode ?? null,
        avatar: avatarFilename,
      },
      roleId: role.id,
    });

    return { ok: true, data: formatUser(user), message: "User created successfully" };
  },

  async updateUser(uuid: string, payload: any, profilePhotoFile: File | null): Promise<ServiceResult<any>> {
    const user = await userRepository.findByUuidBasic(uuid);
    if (!user) {
      return { ok: false, statusCode: 404, message: "User tidak ditemukan" };
    }

    const existingEmail = await userRepository.findByEmail(payload.email, uuid);
    if (existingEmail) {
      return { ok: false, statusCode: 422, errors: { email: ["Email sudah terdaftar"] } };
    }

    const role = await userRepository.findRoleById(payload.roles);
    if (!role) {
      return { ok: false, statusCode: 422, errors: { roles: ["Role tidak valid"] } };
    }

    const roleValidationError = validateRoleSpecificFields(role.name, payload);
    if (roleValidationError) return roleValidationError;

    let avatarFilename: string | undefined;
    if (profilePhotoFile && profilePhotoFile.size > 0) {
      avatarFilename = await saveAvatar(profilePhotoFile);
      await removeAvatarIfExists(user.profile?.avatar);
    }

    const adminScope =
      role.name === "curator" || role.name === "verifikator"
        ? payload.admin_scope ?? null
        : null;

    const dcClean = (payload.dc ?? "").replace("+", "");
    const userData: Record<string, unknown> = {
      name: payload.name,
      email: payload.email,
    };

    if (payload.password) {
      userData.password = await hash(payload.password, 10);
    }

    const profileData: Record<string, unknown> = {
      phone: dcClean + (payload.phone_without_dc ?? ""),
      phoneWithoutDc: payload.phone_without_dc ?? null,
      dc: payload.dc ?? null,
      iso: payload.iso ?? null,
      title: payload.title ?? null,
      company: payload.company ?? null,
      workUnit: payload.work_unit ?? null,
      adminScope,
      provinceId: payload.province_id ?? null,
      cityId: payload.city_id ?? null,
      wilayahKode: payload.wilayah_kode ?? null,
    };

    if (avatarFilename !== undefined) {
      profileData.avatar = avatarFilename;
    }

    const updated = await userRepository.updateWithProfileAndRole({
      userId: user.id,
      roleId: role.id,
      userData,
      profileData,
    });

    return { ok: true, data: formatUser(updated), message: "User updated successfully" };
  },

  async deleteUser(uuid: string): Promise<ServiceResult<null>> {
    const user = await userRepository.findByUuidBasic(uuid);
    if (!user) {
      return { ok: false, statusCode: 404, message: "User tidak ditemukan" };
    }

    await userRepository.softDeleteById(user.id);
    return { ok: true, data: null, message: "User deleted successfully" };
  },

  async toggleUserActive(uuid: string): Promise<ServiceResult<any>> {
    const user = await userRepository.findByUuidBasic(uuid);
    if (!user) {
      return { ok: false, statusCode: 404, message: "User tidak ditemukan" };
    }

    const updated = await userRepository.toggleActiveById(user.id, !user.isActive);
    const message = updated.isActive
      ? "User activated successfully"
      : "User deactivated successfully";

    return { ok: true, data: formatUser(updated), message };
  },
};
