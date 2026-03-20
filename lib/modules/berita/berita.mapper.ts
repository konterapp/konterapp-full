import { buildUploadFileUrl } from "@/lib/utils/file-upload";

export function formatBerita(berita: any) {
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
    image_url: buildUploadFileUrl("berita", berita.image),
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
