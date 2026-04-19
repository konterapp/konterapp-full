import { hash } from "bcryptjs";
import { v7 as uuidv7 } from "uuid";
import { ApiError, ValidationApiError } from "@/lib/api-errors";
import { getUserPermissions } from "@/lib/permissions";
import { removeFileIfExists, saveUploadedFile } from "@/lib/utils/file-upload";
import { formatUser } from "./user.mapper";
import { userRepository } from "./repository";

const avatarUploadFolder = "avatars";
const allowedAvatarTypes = ["image/jpeg", "image/png", "image/jpg", "image/gif", "image/webp"];

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

function getSourceFilter(source: string) {
  if (!source) return undefined;
  if (source === "local") return null;
  if (source === "mice") return "mice_auth";
  if (source === "event_daerah") return "event_daerah";
  return source;
}

async function saveAvatar(file: File) {
  return saveUploadedFile(file, {
    folder: avatarUploadFolder,
    allowedTypes: allowedAvatarTypes,
    maxSizeBytes: 2 * 1024 * 1024,
    fieldName: "image",
  });
}

async function removeAvatarIfExists(filename?: string | null) {
  return removeFileIfExists(avatarUploadFolder, filename);
}

function validateRoleSpecificFields(roleName: string, payload: any) {
  if (roleName === "pemda" && !payload.wilayah_kode) {
    throw new ValidationApiError({ wilayah_kode: ["Wilayah wajib dipilih"] });
  }
  if (roleName === "pemprov" && !payload.province_id) {
    throw new ValidationApiError({ province_id: ["Provinsi wajib dipilih"] });
  }
  if ((roleName === "curator" || roleName === "verifikator") && !payload.admin_scope) {
    throw new ValidationApiError({ admin_scope: ["Admin scope wajib dipilih"] });
  }
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
      where.OR = [{ name: { contains: search } }, { email: { contains: search } }];
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

  async getUserDetail(uuid: string) {
    const user = await userRepository.findByUuid(uuid);
    if (!user) {
      throw new ApiError("User tidak ditemukan", 404);
    }

    const permissions = await getUserPermissions(user.id);
    return formatUser(user, permissions);
  },

  async createUser(payload: any, profilePhotoFile: File | null, companyUuid: string) {
    const existingEmail = await userRepository.findByEmail(payload.email);
    if (existingEmail) {
      throw new ValidationApiError({ email: ["Email sudah terdaftar"] });
    }

    const role = await userRepository.findRoleById(payload.roles);
    if (!role) {
      throw new ValidationApiError({ roles: ["Role tidak valid"] });
    }

    validateRoleSpecificFields(role.name, payload);

    let avatarFilename: string | null = null;
    if (profilePhotoFile && profilePhotoFile.size > 0) {
      avatarFilename = await saveAvatar(profilePhotoFile);
    }

    const adminScope =
      role.name === "curator" || role.name === "verifikator" ? payload.admin_scope ?? null : null;

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
      companyUuid,
    });

    return formatUser(user);
  },

  async updateUser(uuid: string, payload: any, profilePhotoFile: File | null) {
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

    validateRoleSpecificFields(role.name, payload);

    let avatarFilename: string | undefined;
    if (profilePhotoFile && profilePhotoFile.size > 0) {
      avatarFilename = await saveAvatar(profilePhotoFile);
      await removeAvatarIfExists(user.profile?.avatar);
    }

    const adminScope =
      role.name === "curator" || role.name === "verifikator" ? payload.admin_scope ?? null : null;

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
