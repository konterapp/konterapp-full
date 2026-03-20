import { prisma } from "@/lib/prisma";
import { successResponse, errorResponse, paginatedResponse } from "@/lib/response";
import { buildUploadFileUrl } from "@/lib/utils/file-upload";
import { NextRequest } from "next/server";

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
    image_url: buildUploadFileUrl("berita", berita.image),
    tags,
    news_type: berita.newsType,
    category: berita.category,
    author: berita.creator?.name ?? null,
    published_at: berita.publishedAt,
    views: berita.views,
  };
}

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const page = Math.max(1, Number(url.searchParams.get("page") ?? 1));
    const perPage = Math.max(1, Math.min(100, Number(url.searchParams.get("per_page") ?? 6)));

    const where: any = {
      deletedAt: null,
      isPublished: true,
    };

    const [items, total] = await Promise.all([
      prisma.berita.findMany({
        where,
        include: { creator: { select: { name: true } } },
        orderBy: { publishedAt: "desc" },
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
}
