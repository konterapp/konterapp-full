import { prisma } from "@/lib/prisma";
import { successResponse, errorResponse, validationError, paginatedResponse } from "@/lib/response";
import { withPermission } from "@/lib/api-middleware";
import { validateSchema } from "@/lib/validation";
import { createBeritaSchema } from "@/lib/validations/berita";
import { generateSlug } from "@/lib/utils/slug";
import { v7 as uuidv7 } from "uuid";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";

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

export const GET = withPermission("admin.berita.index", async (req) => {
  try {
    const url = new URL(req.url);
    const page = Math.max(1, Number(url.searchParams.get("page") ?? 1));
    const perPage = Math.max(1, Math.min(100, Number(url.searchParams.get("per_page") ?? 10)));
    const search = url.searchParams.get("search") ?? "";
    const sortBy = url.searchParams.get("sort_by") ?? "id";
    const sortOrder = url.searchParams.get("sort_order") ?? "desc";
    const isPublished = url.searchParams.get("is_published");

    const allowedSorts = ["id", "title", "published_at", "created_at"];
    const sortField = allowedSorts.includes(sortBy) ? sortBy : "id";
    const sortDir = sortOrder === "asc" ? "asc" : "desc";
    const sortFieldMap: Record<string, string> = {
      id: "id",
      title: "title",
      published_at: "publishedAt",
      created_at: "createdAt",
    };

    const where: any = { deletedAt: null };

    if (search) {
      where.OR = [
        { title: { contains: search } },
        { content: { contains: search } },
      ];
    }

    if (isPublished === "1" || isPublished === "true") {
      where.isPublished = true;
    } else if (isPublished === "0" || isPublished === "false") {
      where.isPublished = false;
    }

    const [items, total] = await Promise.all([
      prisma.berita.findMany({
        where,
        include: { creator: { select: { name: true } } },
        orderBy: { [sortFieldMap[sortField]]: sortDir },
        skip: (page - 1) * perPage,
        take: perPage,
      }),
      prisma.berita.count({ where }),
    ]);

    return paginatedResponse("List Berita", items.map(formatBerita), {
      currentPage: page,
      perPage,
      total,
      path: url.pathname,
    });
  } catch (e: any) {
    return errorResponse(e.message ?? "Internal server error", 500);
  }
});

export const POST = withPermission("admin.berita.create", async (req, context) => {
  try {
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

    const result = validateSchema(createBeritaSchema, body);
    if (!("data" in result)) return result;
    const validated = result.data;

    // Image required on create
    if (!imageFile || imageFile.size === 0) {
      return validationError({ image: ["Gambar wajib diupload"] });
    }

    // Validate image type
    const allowedTypes = ["image/jpeg", "image/png", "image/jpg", "image/gif", "image/webp"];
    if (!allowedTypes.includes(imageFile.type)) {
      return validationError({ image: ["Gambar harus berupa jpeg, png, jpg, gif, atau webp"] });
    }
    if (imageFile.size > 2 * 1024 * 1024) {
      return validationError({ image: ["Gambar maksimal 2MB"] });
    }

    // Generate slug
    let slug = generateSlug(validated.title);
    const existingSlug = await prisma.berita.findFirst({ where: { slug } });
    if (existingSlug) {
      slug = `${slug}-${Date.now()}`;
    }

    // Upload image
    const bytes = await imageFile.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const imageFilename = `${uuidv7()}_${imageFile.name}`;
    const uploadDir = join(process.cwd(), "public", "uploads", "berita");
    await mkdir(uploadDir, { recursive: true });
    await writeFile(join(uploadDir, imageFilename), buffer);

    // Parse tags
    let tags: string[] = [];
    if (validated.tags) {
      try {
        tags = JSON.parse(validated.tags);
      } catch {
        tags = [];
      }
    }

    const berita = await prisma.berita.create({
      data: {
        uuid: uuidv7(),
        title: validated.title,
        slug,
        content: validated.content,
        image: imageFilename,
        tags: tags.length > 0 ? tags : undefined,
        publishedAt: new Date(validated.published_at),
        isPublished: validated.is_published ?? false,
        newsType: validated.news_type ?? null,
        category: validated.category ?? null,
        createdBy: context.userId,
      },
      include: { creator: { select: { name: true } } },
    });

    return successResponse("Berita berhasil dibuat", formatBerita(berita), 201);
  } catch (e: any) {
    return errorResponse(e.message ?? "Internal server error", 500);
  }
});
