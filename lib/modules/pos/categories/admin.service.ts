import { ApiError, ValidationApiError } from '@/lib/api-errors';
import { posCategoryRepository } from './repository';
import { mapCategory } from './category.mapper';

export const posCategoryService = {
  async listCategories(params: {
    page: number;
    perPage: number;
    search: string;
    sortBy: string;
    sortOrder: 'asc' | 'desc';
  }) {
    const { page, perPage, search, sortBy, sortOrder } = params;
    const skip = (page - 1) * perPage;

    const where: any = {};
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    const sortFieldMap: Record<string, string> = {
      created_at: 'createdAt',
      name: 'name',
    };
    const sortField = sortFieldMap[sortBy] ? sortBy : 'created_at';

    const [categories, total] = await Promise.all([
      posCategoryRepository.findMany({
        where,
        skip,
        take: perPage,
        orderBy: { [sortFieldMap[sortField]]: sortOrder },
      }),
      posCategoryRepository.count(where),
    ]);

    return {
      data: categories.map(mapCategory),
      pagination: {
        page,
        perPage,
        total,
        totalPages: Math.ceil(total / perPage),
      },
    };
  },

  async getCategoryDetail(uuid: string) {
    const category = await posCategoryRepository.findByUuid(uuid);
    if (!category) {
      throw new ApiError('Category not found', 404);
    }

    return mapCategory(category);
  },

  async createCategory(payload: { name: string; description?: string | null }) {
    const existing = await posCategoryRepository.findByName(payload.name);
    if (existing) {
      throw new ValidationApiError({ name: ['Nama kategori sudah digunakan'] });
    }

    const category = await posCategoryRepository.create({
      name: payload.name,
      description: payload.description || null,
    });

    return mapCategory({ ...category, _count: { products: 0 } });
  },

  async updateCategory(uuid: string, payload: { name?: string; description?: string | null }) {
    const existing = await posCategoryRepository.findByUuid(uuid);
    if (!existing) {
      throw new ApiError('Category not found', 404);
    }

    const category = await posCategoryRepository.updateByUuid(uuid, {
      name: payload.name ?? existing.name,
      description: payload.description ?? existing.description,
    });

    return mapCategory({ ...category, _count: { products: existing._count?.products ?? 0 } });
  },

  async deleteCategory(uuid: string) {
    const existing = await posCategoryRepository.findByUuid(uuid);
    if (!existing) {
      throw new ApiError('Category not found', 404);
    }

    const productCount = await posCategoryRepository.countProducts(uuid);
    if (productCount > 0) {
      throw new ApiError('Cannot delete category with existing products', 400);
    }

    await posCategoryRepository.deleteByUuid(uuid);
  },
};
