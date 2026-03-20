import { prisma } from "@/lib/prisma";

const beritaInclude = {
  creator: { select: { name: true } },
} as const;

export const beritaRepository = {
  async findMany(params: { where: any; orderBy: any; skip: number; take: number }) {
    const { where, orderBy, skip, take } = params;
    return prisma.berita.findMany({
      where,
      include: beritaInclude,
      orderBy,
      skip,
      take,
    });
  },

  async count(where: any) {
    return prisma.berita.count({ where });
  },

  async findByUuid(uuid: string) {
    return prisma.berita.findFirst({
      where: { uuid, deletedAt: null },
      include: beritaInclude,
    });
  },

  async findBySlug(slug: string) {
    return prisma.berita.findFirst({ where: { slug } });
  },

  async create(data: {
    uuid: string;
    title: string;
    slug: string;
    content: string;
    image: string;
    tags?: string[];
    publishedAt: Date;
    isPublished: boolean;
    newsType?: string | null;
    category?: string | null;
    createdBy: number;
  }) {
    return prisma.berita.create({
      data: {
        ...data,
        tags: data.tags && data.tags.length > 0 ? data.tags : undefined,
      },
      include: beritaInclude,
    });
  },

  async updateById(id: number, data: Record<string, unknown>) {
    return prisma.berita.update({
      where: { id },
      data,
      include: beritaInclude,
    });
  },

  async softDeleteById(id: number) {
    return prisma.berita.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  },
};
