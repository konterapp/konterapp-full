import { prisma } from "@/lib/prisma";
import { successResponse, errorResponse, validationError } from "@/lib/response";
import { withPermission } from "@/lib/api-middleware";
import { validateSchema } from "@/lib/validation";
import { updateBeritaSchema } from "@/lib/validations/berita";
import { v7 as uuidv7 } from "uuid";
import { writeFile, mkdir, unlink } from "fs/promises";
import { join } from "path";

export const preferredRegion = "sin1";
function formatBerita(berita: any) {
  let tags: string[] = [];
  if (berita.tags) {
    tags = typeof berita.tags === "string" ? JSON.parse(berita.tags) : berita.tags;
  }

  return {
    id: berita.id,
    uuid: berita.uuid,
    title: berita.title,
    slug: berita.slug,
    content: berita.content,
    image: berita.image,
    image_url: berita.image ? `/uploads/berita/${berita.image}` : null,
    tags,
    news_type: berita.newsType,
    category: berita.category,
    author: berita.creator?.name ?? null,
    published_at: berita.publishedAt,
    is_published: berita.isPublished,
    is_draft: berita.isDraft,
    views: berita.views,
    created_at: berita.createdAt,
    updated_at: berita.updatedAt,
  };
}

export const GET = withPermission("admin.berita.index", async (req, context) => {
  try {
    const params = await context.params;
    const uuid = params.uuid;

    const berita = await prisma.berita.findFirst({
      where: { uuid, deletedAt: null },
      include: { creator: { select: { name: true } } },
    });

    if (!berita) {
      return errorResponse("Berita tidak ditemukan", 404);
    }

    return successResponse("Detail Berita", formatBerita(berita));
  } catch (e: any) {
    return errorResponse(e.message ?? "Internal server error", 500);
  }
});

export const PATCH = withPermission("admin.berita.update", async (req, context) => {
  try {
    const params = await context.params;
    const uuid = params.uuid;

    const berita = await prisma.berita.findFirst({
      where: { uuid, deletedAt: null },
    });

    if (!berita) {
      return errorResponse("Berita tidak ditemukan", 404);
    }

    const contentType = req.headers.get("content-type") ?? "";
    let body: any;
    let imageFile: File | null = null;

    if (contentType.includes("multipart/form-data")) {
      const formData = await req.formData();
      body = Object.fromEntries(formData.entries());
      imageFile = formData.get("image") as File | null;
    } else {
      body = await req.json();
    }

    const result = validateSchema(updateBeritaSchema, body);
    if (!("data" in result)) return result;
    const validated = result.data;

    // Handle image upload
    let imageFilename: string | undefined;
    if (imageFile && imageFile.size > 0) {
      const allowedTypes = ["image/jpeg", "image/png", "image/jpg", "image/gif", "image/webp"];
      if (!allowedTypes.includes(imageFile.type)) {
        return validationError({ image: ["Gambar harus berupa jpeg, png, jpg, gif, atau webp"] });
      }
      if (imageFile.size > 2 * 1024 * 1024) {
        return validationError({ image: ["Gambar maksimal 2MB"] });
      }

      const bytes = await imageFile.arrayBuffer();
      const buffer = Buffer.from(bytes);
      imageFilename = `${uuidv7()}_${imageFile.name}`;
      const uploadDir = join(process.cwd(), "public", "uploads", "berita");
      await mkdir(uploadDir, { recursive: true });
      await writeFile(join(uploadDir, imageFilename), buffer);

      // Delete old image
      if (berita.image) {
        try {
          await unlink(join(process.cwd(), "public", "uploads", "berita", berita.image));
        } catch {
          // Ignore
        }
      }
    }

    // Parse tags
    let tags: string[] | undefined;
    if (validated.tags !== undefined) {
      try {
        tags = validated.tags ? JSON.parse(validated.tags) : [];
      } catch {
        tags = [];
      }
    }

    const updateData: any = {
      title: validated.title,
      content: validated.content,
      publishedAt: new Date(validated.published_at),
      isPublished: validated.is_published ?? false,
      newsType: validated.news_type ?? null,
      category: validated.category ?? null,
    };

    if (imageFilename !== undefined) {
      updateData.image = imageFilename;
    }
    if (tags !== undefined) {
      updateData.tags = tags.length > 0 ? tags : null;
    }

    const updated = await prisma.berita.update({
      where: { id: berita.id },
      data: updateData,
      include: { creator: { select: { name: true } } },
    });

    return successResponse("Berita berhasil diperbarui", formatBerita(updated));
  } catch (e: any) {
    return errorResponse(e.message ?? "Internal server error", 500);
  }
});

export const DELETE = withPermission("admin.berita.delete", async (req, context) => {
  try {
    const params = await context.params;
    const uuid = params.uuid;

    const berita = await prisma.berita.findFirst({
      where: { uuid, deletedAt: null },
    });

    if (!berita) {
      return errorResponse("Berita tidak ditemukan", 404);
    }

    await prisma.berita.update({
      where: { id: berita.id },
      data: { deletedAt: new Date() },
    });

    return successResponse("Berita berhasil dihapus");
  } catch (e: any) {
    return errorResponse(e.message ?? "Internal server error", 500);
  }
});