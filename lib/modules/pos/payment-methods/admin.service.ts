import { ApiError, ValidationApiError } from '@/lib/api-errors';
import { posPaymentMethodRepository } from './repository';

export const posPaymentMethodService = {
  async listPaymentMethods(params: {
    page: number;
    perPage: number;
    search: string;
    isActive: string | null;
    sortBy: string;
    sortOrder: string;
  }) {
    const { page, perPage, search, isActive, sortBy, sortOrder } = params;
    const skip = (page - 1) * perPage;

    const where: any = {};
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { code: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (isActive !== null && isActive !== undefined) {
      where.isActive = isActive === 'true';
    }

    const allowedSorts = ['created_at', 'code', 'name', 'type', 'is_active'];
    const sortFieldMap: Record<string, string> = {
      created_at: 'createdAt',
      code: 'code',
      name: 'name',
      type: 'type',
      is_active: 'isActive',
    };
    const sortField = allowedSorts.includes(sortBy) ? sortBy : 'created_at';
    const sortDir = sortOrder === 'asc' ? 'asc' : 'desc';

    const [paymentMethods, total] = await Promise.all([
      posPaymentMethodRepository.findMany({
        where,
        skip,
        take: perPage,
        orderBy: { [sortFieldMap[sortField]]: sortDir },
      }),
      posPaymentMethodRepository.count(where),
    ]);

    return {
      data: paymentMethods,
      pagination: {
        page,
        perPage,
        total,
        totalPages: Math.ceil(total / perPage),
      },
    };
  },

  async getPaymentMethod(uuid: string) {
    const paymentMethod = await posPaymentMethodRepository.findByUuid(uuid);
    if (!paymentMethod) {
      throw new ApiError('Payment method not found', 404);
    }

    return paymentMethod;
  },

  async createPaymentMethod(payload: {
    code: string;
    name: string;
    type: string;
    accountNumber?: string | null;
    accountName?: string | null;
    description?: string | null;
    isActive?: boolean;
  }) {
    const existingMethod = await posPaymentMethodRepository.findByCode(payload.code);
    if (existingMethod) {
      throw new ValidationApiError({ code: ['Kode metode sudah digunakan'] });
    }

    return posPaymentMethodRepository.create({
      code: payload.code,
      name: payload.name,
      type: payload.type || 'cash',
      accountNumber: payload.accountNumber || null,
      accountName: payload.accountName || null,
      description: payload.description || null,
      isActive: payload.isActive ?? true,
    });
  },

  async updatePaymentMethod(
    uuid: string,
    payload: {
      code?: string;
      name?: string;
      type?: string;
      accountNumber?: string | null;
      accountName?: string | null;
      description?: string | null;
      isActive?: boolean;
    }
  ) {
    const existingMethod = await posPaymentMethodRepository.findByUuid(uuid);
    if (!existingMethod) {
      throw new ApiError('Payment method not found', 404);
    }

    if (payload.code && payload.code !== existingMethod.code) {
      const codeExists = await posPaymentMethodRepository.findByCode(payload.code);
      if (codeExists) {
        throw new ValidationApiError({ code: ['Kode metode sudah digunakan'] });
      }
    }

    return posPaymentMethodRepository.updateByUuid(uuid, {
      code: payload.code || existingMethod.code,
      name: payload.name || existingMethod.name,
      type: payload.type || existingMethod.type,
      accountNumber: payload.accountNumber ?? existingMethod.accountNumber,
      accountName: payload.accountName ?? existingMethod.accountName,
      description: payload.description ?? existingMethod.description,
      isActive: payload.isActive ?? existingMethod.isActive,
    });
  },

  async deletePaymentMethod(uuid: string) {
    const paymentMethod = await posPaymentMethodRepository.findByUuid(uuid);
    if (!paymentMethod) {
      throw new ApiError('Payment method not found', 404);
    }

    const [salesCount, ppobCount] = await posPaymentMethodRepository.countUsages(uuid);
    if (salesCount > 0 || ppobCount > 0) {
      throw new ApiError('Cannot delete payment method with existing transactions', 400);
    }

    await posPaymentMethodRepository.deleteByUuid(uuid);
  },
};
