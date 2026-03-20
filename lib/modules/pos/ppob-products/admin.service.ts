import { ApiError, ValidationApiError } from '@/lib/api-errors';
import { posPpobProductRepository } from './repository';
import { mapPpobProduct } from './ppob-product.mapper';

const DEFAULT_SYNC_CATEGORIES = ['PULSA', 'DATA', 'PLNPRA', 'PLNPASCA', 'TELKOM', 'PDAM', 'BPJS', 'EMONEY', 'GAME'];

function buildOrderBy(sortBy: string, sortOrder: 'asc' | 'desc') {
  const sortMap: Record<string, any> = {
    product_name: { productName: sortOrder },
    provider: { provider: sortOrder },
    category: { category: sortOrder },
    base_price: { basePrice: sortOrder },
    selling_price: { sellingPrice: sortOrder },
    created_at: { createdAt: sortOrder },
  };

  return sortMap[sortBy] || sortMap.product_name;
}

function buildProviderSamples(provider: string, category: string) {
  const suffix = provider === 'rajabiller' ? 'RB' : 'DF';
  return [
    {
      provider,
      providerProductCode: `${suffix}-${category}-001`,
      productName: `${category} Sample 1`,
      category,
      type: category === 'PLNPASCA' || category === 'BPJS' ? 'postpaid' : 'prepaid',
      basePrice: 10000,
      adminFee: 1000,
      sellingPrice: 11000,
      isActive: true,
    },
    {
      provider,
      providerProductCode: `${suffix}-${category}-002`,
      productName: `${category} Sample 2`,
      category,
      type: category === 'PLNPASCA' || category === 'BPJS' ? 'postpaid' : 'prepaid',
      basePrice: 20000,
      adminFee: 1200,
      sellingPrice: 21200,
      isActive: true,
    },
  ];
}

export const posPpobProductService = {
  async listProducts(params: {
    page: number;
    perPage: number;
    search: string;
    category?: string;
    provider?: string;
    isActive?: string;
    sortBy: string;
    sortOrder: 'asc' | 'desc';
  }) {
    const { page, perPage, search, category, provider, isActive, sortBy, sortOrder } = params;
    const skip = (page - 1) * perPage;

    const where: any = {};

    if (search) {
      where.OR = [
        { productName: { contains: search, mode: 'insensitive' } },
        { providerProductCode: { contains: search, mode: 'insensitive' } },
        { brand: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (category) where.category = category;
    if (provider) where.provider = provider;
    if (isActive !== undefined && isActive !== null && isActive !== '') {
      where.isActive = isActive === '1' || isActive === 'true';
    }

    const orderBy = buildOrderBy(sortBy, sortOrder);

    const [products, total] = await Promise.all([
      posPpobProductRepository.findMany({ where, skip, take: perPage, orderBy }),
      posPpobProductRepository.count(where),
    ]);

    return {
      data: products.map(mapPpobProduct),
      pagination: {
        page,
        perPage,
        total,
        totalPages: Math.ceil(total / perPage),
      },
    };
  },

  async createProduct(payload: {
    provider: string;
    provider_product_code: string;
    product_name: string;
    category: string;
    type: string;
    base_price: number;
    admin_fee?: number;
    selling_price: number;
    is_active?: boolean;
  }) {
    const existing = await posPpobProductRepository.findByProviderCode(payload.provider, payload.provider_product_code);
    if (existing) {
      throw new ValidationApiError({ provider_product_code: ['Kode produk provider sudah digunakan'] });
    }

    const created = await posPpobProductRepository.create({
      provider: payload.provider,
      providerProductCode: payload.provider_product_code,
      productName: payload.product_name,
      category: payload.category,
      type: payload.type,
      basePrice: payload.base_price,
      adminFee: payload.admin_fee ?? 0,
      sellingPrice: payload.selling_price,
      isActive: payload.is_active ?? true,
    });

    return mapPpobProduct(created);
  },

  async updateProduct(
    uuid: string,
    payload: {
      provider?: string;
      provider_product_code?: string;
      product_name?: string;
      category?: string;
      type?: string;
      base_price?: number;
      admin_fee?: number;
      selling_price?: number;
      is_active?: boolean;
    }
  ) {
    const existing = await posPpobProductRepository.findByUuid(uuid);
    if (!existing) {
      throw new ApiError('Produk PPOB tidak ditemukan', 404);
    }

    const provider = payload.provider ?? existing.provider;
    const providerCode = payload.provider_product_code ?? existing.providerProductCode;

    if (provider !== existing.provider || providerCode !== existing.providerProductCode) {
      const duplicate = await posPpobProductRepository.findByProviderCode(provider, providerCode);
      if (duplicate && duplicate.uuid !== uuid) {
        throw new ValidationApiError({ provider_product_code: ['Kode produk provider sudah digunakan'] });
      }
    }

    const updated = await posPpobProductRepository.updateByUuid(uuid, {
      provider,
      providerProductCode: providerCode,
      productName: payload.product_name ?? existing.productName,
      category: payload.category ?? existing.category,
      type: payload.type ?? existing.type,
      basePrice: payload.base_price ?? existing.basePrice,
      adminFee: payload.admin_fee ?? existing.adminFee,
      sellingPrice: payload.selling_price ?? existing.sellingPrice,
      isActive: payload.is_active ?? existing.isActive,
    });

    return mapPpobProduct(updated);
  },

  async deleteProduct(uuid: string) {
    const existing = await posPpobProductRepository.findByUuid(uuid);
    if (!existing) {
      throw new ApiError('Produk PPOB tidak ditemukan', 404);
    }

    await posPpobProductRepository.deleteByUuid(uuid);
  },

  async syncProducts(provider: string, category: string) {
    const samples = buildProviderSamples(provider, category);
    let affected = 0;

    for (const sample of samples) {
      const existing = await posPpobProductRepository.findByProviderCode(sample.provider, sample.providerProductCode);
      if (existing) {
        await posPpobProductRepository.updateByUuid(existing.uuid, sample);
      } else {
        await posPpobProductRepository.create(sample);
      }
      affected += 1;
    }

    return affected;
  },

  async syncAllDigiflazz() {
    const result: Record<string, number> = {};

    for (const category of DEFAULT_SYNC_CATEGORIES) {
      result[category] = await this.syncProducts('digiflazz', category);
    }

    return result;
  },
};
