import { ApiError } from '@/lib/api-errors';
import { posSupplierRepository } from './repository';
import { mapSupplier, mapSupplierListItem } from './supplier.mapper';

async function generateSupplierCode(): Promise<string> {
  const count = await posSupplierRepository.countAll();
  const nextNumber = count + 1;
  return `SUP${String(nextNumber).padStart(4, '0')}`;
}

export const posSupplierService = {
  async listSuppliers(params: {
    page: number;
    perPage: number;
    search: string;
    sortBy: string;
    sortOrder: 'asc' | 'desc';
    isActive: string | null;
  }) {
    const { page, perPage, search, sortBy, sortOrder, isActive } = params;
    const skip = (page - 1) * perPage;

    const where: any = {};
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { code: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (isActive !== null && isActive !== undefined && isActive !== '') {
      where.isActive = isActive === 'true' || isActive === '1';
    }

    const sortMap: Record<string, any> = {
      created_at: { createdAt: sortOrder },
      code: { code: sortOrder },
      name: { name: sortOrder },
      phone: { phone: sortOrder },
      email: { email: sortOrder },
      is_active: { isActive: sortOrder },
    };
    const orderBy = sortMap[sortBy] || sortMap.created_at;

    const [suppliers, total] = await Promise.all([
      posSupplierRepository.findMany({ where, skip, take: perPage, orderBy }),
      posSupplierRepository.count(where),
    ]);

    return {
      data: suppliers.map(mapSupplierListItem),
      pagination: {
        page,
        perPage,
        total,
        totalPages: Math.ceil(total / perPage),
      },
    };
  },

  async getSupplier(uuid: string) {
    const supplier = await posSupplierRepository.findByUuid(uuid);
    if (!supplier) {
      throw new ApiError('Supplier not found', 404);
    }

    return mapSupplier(supplier);
  },

  async createSupplier(payload: {
    name: string;
    contact_person?: string | null;
    phone: string;
    email?: string | null;
    address?: string | null;
    is_active?: boolean;
  }) {
    const code = await generateSupplierCode();

    const supplier = await posSupplierRepository.create({
      code,
      name: payload.name,
      contactPerson: payload.contact_person || null,
      phone: payload.phone,
      email: payload.email || null,
      address: payload.address || null,
      isActive: payload.is_active ?? true,
    });

    return mapSupplier(supplier);
  },

  async updateSupplier(
    uuid: string,
    payload: {
      name?: string;
      contact_person?: string | null;
      phone?: string;
      email?: string | null;
      address?: string | null;
      is_active?: boolean;
    }
  ) {
    const supplier = await posSupplierRepository.findByUuid(uuid);
    if (!supplier) {
      throw new ApiError('Supplier not found', 404);
    }

    const updated = await posSupplierRepository.updateByUuid(uuid, {
      name: payload.name ?? supplier.name,
      contactPerson: payload.contact_person ?? supplier.contactPerson,
      phone: payload.phone ?? supplier.phone,
      email: payload.email ?? supplier.email,
      address: payload.address ?? supplier.address,
      isActive: payload.is_active ?? supplier.isActive,
    });

    return mapSupplier(updated);
  },

  async deleteSupplier(uuid: string) {
    const supplier = await posSupplierRepository.findByUuid(uuid);
    if (!supplier) {
      throw new ApiError('Supplier not found', 404);
    }

    await posSupplierRepository.deleteByUuid(uuid);
  },
};
