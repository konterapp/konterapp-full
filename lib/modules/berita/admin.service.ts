import { v7 as uuidv7 } from "uuid";
import { generateSlug } from "@/lib/utils/slug";
import { ApiError, ValidationApiError } from "@/lib/api-errors";
import { removeFileIfExists, saveUploadedFile } from "@/lib/utils/file-upload";
import { beritaRepository } from "./repository";
import { formatBerita } from "./berita.mapper";

const allowedImageTypes = ["image/jpeg", "image/png", "image/jpg", "image/gif", "image/webp"];
const beritaUploadFolder = "berita";

function getSortConfig(sortBy: string, sortOrder: string) {
  const allowedSorts = ["id", "title", "published_at", "created_at"];
  const sortField = allowedSorts.includes(sortBy) ? sortBy : "id";
  const sortDir = sortOrder === "asc" ? "asc" : "desc";

  const sortFieldMap: Record<string, string> = {
    id: "id",
    title: "title",
    published_at: "publishedAt",
    created_at: "createdAt",
  };

  return {
    orderBy: { [sortFieldMap[sortField]]: sortDir as "asc" | "desc" },
  };
}

function parseTags(rawTags?: string) {
  if (!rawTags) return [];
  try {
    return JSON.parse(rawTags);
  } catch {
    return [];
  }
}

async function saveImage(imageFile: File) {
  return saveUploadedFile(imageFile, {
    folder: beritaUploadFolder,
    allowedTypes: allowedImageTypes,
    maxSizeBytes: 2 * 1024 * 1024,
    fieldName: "image",
  });
}

async function removeImageIfExists(filename?: string | null) {
  return removeFileIfExists(beritaUploadFolder, filename);
}

export const beritaService = {
  async listBerita(params: {
    page: number;
    perPage: number;
    search: string;
    sortBy: string;
    sortOrder: string;
    isPublished: string | null;
  }) {
    const { page, perPage, search, sortBy, sortOrder, isPublished } = params;

    const where: any = { deletedAt: null };

    if (search) {
      where.OR = [{ title: { contains: search } }, { content: { contains: search } }];
    }

    if (isPublished === "1" || isPublished === "true") {
      where.isPublished = true;
    } else if (isPublished === "0" || isPublished === "false") {
      where.isPublished = false;
    }

    const { orderBy } = getSortConfig(sortBy, sortOrder);
    const skip = (page - 1) * perPage;

    const [items, total] = await Promise.all([
      beritaRepository.findMany({ where, orderBy, skip, take: perPage }),
      beritaRepository.count(where),
    ]);

    return {
      items: items.map(formatBerita),
      total,
      page,
      perPage,
    };
  },

  async getBeritaDetail(uuid: string) {
    const berita = await beritaRepository.findByUuid(uuid);
    if (!berita) {
      throw new ApiError("Berita tidak ditemukan", 404);
    }

    return formatBerita(berita);
  },

  async createBerita(payload: any, imageFile: File | null, userId: number) {
    if (!imageFile || imageFile.size === 0) {
      throw new ValidationApiError({ image: ["Gambar wajib diupload"] });
    }

    const imageFilename = await saveImage(imageFile);

    let slug = generateSlug(payload.title);
    const existingSlug = await beritaRepository.findBySlug(slug);
    if (existingSlug) {
      slug = `${slug}-${Date.now()}`;
    }

    const tags = parseTags(payload.tags);

    const berita = await beritaRepository.create({
      uuid: uuidv7(),
      title: payload.title,
      slug,
      content: payload.content,
      image: imageFilename,
      tags,
      publishedAt: new Date(payload.published_at),
      isPublished: payload.is_published ?? false,
      newsType: payload.news_type ?? null,
      category: payload.category ?? null,
      createdBy: userId,
    });

    return formatBerita(berita);
  },

  async updateBerita(uuid: string, payload: any, imageFile: File | null) {
    const berita = await beritaRepository.findByUuid(uuid);
    if (!berita) {
      throw new ApiError("Berita tidak ditemukan", 404);
    }

    let imageFilename: string | undefined;
    if (imageFile && imageFile.size > 0) {
      imageFilename = await saveImage(imageFile);
      await removeImageIfExists(berita.image);
    }

    const updateData: Record<string, unknown> = {
      title: payload.title,
      content: payload.content,
      publishedAt: new Date(payload.published_at),
      isPublished: payload.is_published ?? false,
      newsType: payload.news_type ?? null,
      category: payload.category ?? null,
    };

    if (imageFilename !== undefined) {
      updateData.image = imageFilename;
    }

    if (payload.tags !== undefined) {
      const tags = parseTags(payload.tags);
      updateData.tags = tags.length > 0 ? tags : null;
    }

    const updated = await beritaRepository.updateById(berita.id, updateData);
    return formatBerita(updated);
  },

  async deleteBerita(uuid: string) {
    const berita = await beritaRepository.findByUuid(uuid);
    if (!berita) {
      throw new ApiError("Berita tidak ditemukan", 404);
    }

    await beritaRepository.softDeleteById(berita.id);
  },
};
