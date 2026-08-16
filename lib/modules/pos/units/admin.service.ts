import { ApiError, ValidationApiError } from '@/lib/api-errors';
import { posUnitRepository } from './repository';
import { mapUnit } from './unit.mapper';
import { Prisma } from '@prisma/client';

export const posUnitService = {
  async listUnits(params: {
    page: number;
    perPage: number;
    search: string;
    sortBy: string;
    sortOrder: 'asc' | 'desc';
  }) {
    const { page, perPage, search, sortBy, sortOrder } = params;
    const skip = (page - 1) * perPage;

    const where: Prisma.AppPosProductUnitWhereInput = {};
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

    const [units, total] = await Promise.all([
      posUnitRepository.findMany({
        where,
        skip,
        take: perPage,
        orderBy: { [sortFieldMap[sortField]]: sortOrder },
      }),
      posUnitRepository.count(where),
    ]);

    return {
      data: units.map(mapUnit),
      pagination: {
        page,
        perPage,
        total,
        totalPages: Math.ceil(total / perPage),
      },
    };
  },

  async getUnitDetail(uuid: string) {
    const unit = await posUnitRepository.findByUuid(uuid);
    if (!unit) {
      throw new ApiError('Unit not found', 404);
    }

    return mapUnit(unit);
  },

  async createUnit(payload: { name: string; description?: string | null }) {
    const cleanName = payload.name.trim();
    const existing = await posUnitRepository.findByName(cleanName);
    if (existing) {
      throw new ValidationApiError({ name: ['Nama satuan sudah digunakan'] });
    }

    const unit = await posUnitRepository.create({
      name: cleanName,
      description: payload.description || null,
    });

    return mapUnit(unit);
  },

  async updateUnit(uuid: string, payload: { name?: string; description?: string | null }) {
    const existing = await posUnitRepository.findByUuid(uuid);
    if (!existing) {
      throw new ApiError('Unit not found', 404);
    }

    const nextName = payload.name !== undefined ? payload.name.trim() : existing.name;
    if (nextName !== existing.name) {
      const duplicate = await posUnitRepository.findByName(nextName);
      if (duplicate && duplicate.uuid !== existing.uuid) {
        throw new ValidationApiError({ name: ['Nama satuan sudah digunakan'] });
      }

      const [usedAsProductUnit, usedAsConversionUnit] = await Promise.all([
        posUnitRepository.countProductsUsingUnit(existing.name),
        posUnitRepository.countUnitConversionsUsingUnit(existing.name),
      ]);

      if (usedAsProductUnit > 0 || usedAsConversionUnit > 0) {
        throw new ApiError('Cannot rename unit that is already used by products', 400);
      }
    }

    const unit = await posUnitRepository.updateByUuid(uuid, {
      name: nextName,
      description: payload.description ?? existing.description,
    });

    return mapUnit(unit);
  },

  async deleteUnit(uuid: string) {
    const existing = await posUnitRepository.findByUuid(uuid);
    if (!existing) {
      throw new ApiError('Unit not found', 404);
    }

    const [usedAsProductUnit, usedAsConversionUnit] = await Promise.all([
      posUnitRepository.countProductsUsingUnit(existing.name),
      posUnitRepository.countUnitConversionsUsingUnit(existing.name),
    ]);
    if (usedAsProductUnit > 0 || usedAsConversionUnit > 0) {
      throw new ApiError('Cannot delete unit that is already used by products', 400);
    }

    await posUnitRepository.deleteByUuid(uuid);
  },
};
