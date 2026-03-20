import { createHash } from 'crypto';
import { ApiError, ValidationApiError } from '@/lib/api-errors';
import { posPpobProductRepository } from './repository';
import { mapPpobProduct } from './ppob-product.mapper';

const DEFAULT_SYNC_CATEGORIES = ['PULSA', 'DATA', 'PLNPRA', 'PLNPASCA', 'TELKOM', 'PDAM', 'BPJS', 'EMONEY', 'GAME'];
const POSTPAID_CATEGORIES = ['PLNPASCA', 'TELKOM', 'PDAM', 'BPJS'];

function getEnvOrThrow(key: string): string {
  const value = process.env[key];
  if (!value) {
    throw new ApiError(`Konfigurasi ${key} belum diisi`, 400);
  }
  return value;
}

function getProductType(category: string): 'prepaid' | 'postpaid' {
  return POSTPAID_CATEGORIES.includes(category) ? 'postpaid' : 'prepaid';
}

function extractBrand(category: string, productName: string) {
  const brandMapping: Record<string, string[]> = {
    PULSA: ['TELKOMSEL', 'INDOSAT', 'XL', 'TRI', 'SMARTFREN', 'AXIS', 'NEIN'],
    DATA: ['TELKOMSEL', 'INDOSAT', 'XL', 'TRI', 'SMARTFREN', 'AXIS'],
  };
  const brands = brandMapping[category] || [];
  const upperName = productName.toUpperCase();
  for (const brand of brands) {
    if (upperName.includes(brand)) return brand;
  }
  switch (category) {
    case 'PULSA':
    case 'DATA':
      return 'UMUM';
    case 'PLNPRA':
    case 'PLNPASCA':
      return 'PLN';
    case 'TELKOM':
      return 'TELKOM';
    case 'PDAM':
      return 'PDAM';
    case 'BPJS':
      return 'BPJS';
    case 'EMONEY':
      return 'EMONEY';
    case 'GAME':
      return 'GAME';
    default:
      return 'UMUM';
  }
}

function parseRajaBillerProduct(category: string, data: Record<string, any>) {
  const code = data.KODE_PRODUK ?? data.kode_produk ?? null;
  const name = data.NAMA_PRODUK ?? data.nama_produk ?? null;
  const price = Number(data.HARGA ?? data.harga ?? 0);
  const admin = Number(data.ADMIN ?? data.admin ?? 0);
  if (!code || !name) return null;

  const type = getProductType(category);
  const brand = extractBrand(category, name);

  return {
    providerProductCode: code,
    productName: name,
    brand,
    category,
    type,
    basePrice: price,
    adminFee: admin,
    sellingPrice: price + admin,
    buyerProductStatus: true,
    sellerProductStatus: true,
    unlimitedStock: false,
    stock: 0,
    multi: false,
    isActive: true,
    providerMetadata: data,
  };
}

function mapDigiflazzProductData(category: string, item: Record<string, any>) {
  const code = item.buyer_sku_code ?? item.code ?? '';
  const name = item.product_name ?? item.name ?? '';
  if (!code || !name) return null;

  const price = Number(item.price ?? 0);
  const admin = Number(item.admin ?? item.admin_fee ?? 0);
  const type = getProductType(category);

  return {
    providerProductCode: code,
    productName: name,
    brand: item.brand ?? extractBrand(category, name),
    category,
    type,
    sellerName: item.seller_name ?? null,
    basePrice: price,
    adminFee: admin,
    sellingPrice: price + admin,
    digiflazzType: item.type ?? null,
    buyerProductStatus: Boolean(item.buyer_product_status ?? true),
    sellerProductStatus: Boolean(item.seller_product_status ?? true),
    unlimitedStock: Boolean(item.unlimited_stock ?? false),
    stock: Number(item.stock ?? 0),
    multi: Boolean(item.multi ?? false),
    startCutOff: item.start_cut_off ?? null,
    endCutOff: item.end_cut_off ?? null,
    desc: item.desc ?? null,
    isActive: Boolean(item.buyer_product_status ?? true) && Boolean(item.seller_product_status ?? true),
    providerMetadata: item,
  };
}

function digiflazzCategoryMap() {
  return {
    PULSA: 'Pulsa',
    DATA: 'Data',
    PLNPRA: 'PLN',
    EMONEY: 'E-Money',
    GAME: 'Games',
    VOUCHER: 'Voucher',
    PLNPASCA: 'Pascabayar',
    TELKOM: 'Pascabayar',
    PDAM: 'Pascabayar',
    BPJS: 'Pascabayar',
  } as const;
}

async function digiflazzCall(endpoint: string, payload: Record<string, any>) {
  const baseUrl = process.env.DIGIFLAZZ_BASE_URL || 'https://api.digiflazz.com/v1';
  const response = await fetch(`${baseUrl}${endpoint}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const result = await response.json().catch(() => ({}));
  return result?.data ?? result;
}

async function digiflazzFetchPricelist(category: string) {
  const username = getEnvOrThrow('DIGIFLAZZ_USERNAME');
  const apiKey = getEnvOrThrow('DIGIFLAZZ_API_KEY');
  const cmd = POSTPAID_CATEGORIES.includes(category) ? 'pasca' : 'prepaid';
  const sign = createHash('md5').update(username + apiKey + 'pricelist').digest('hex');
  const result = await digiflazzCall('/price-list', {
    cmd,
    username,
    sign,
  });

  if (!Array.isArray(result)) {
    const message = result?.message || 'Gagal mengambil pricelist Digiflazz';
    throw new ApiError(message, 400);
  }

  const map = digiflazzCategoryMap();
  const digiflazzCategory = map[category as keyof typeof map];
  if (!digiflazzCategory) return [];

  return result.filter((item: any) => {
    const itemCategory = item?.category ?? '';
    if (digiflazzCategory !== 'Pascabayar') {
      return itemCategory === digiflazzCategory;
    }
    const brand = String(item?.brand ?? '').toUpperCase();
    switch (category) {
      case 'PLNPASCA':
        return brand.includes('PLN');
      case 'TELKOM':
        return brand.includes('TELKOM');
      case 'PDAM':
        return brand.includes('PDAM');
      case 'BPJS':
        return brand.includes('BPJS');
      default:
        return itemCategory === digiflazzCategory;
    }
  });
}

async function digiflazzFetchAllPricelist() {
  const username = getEnvOrThrow('DIGIFLAZZ_USERNAME');
  const apiKey = getEnvOrThrow('DIGIFLAZZ_API_KEY');
  const map = digiflazzCategoryMap();
  const grouped: Record<string, any[]> = {};
  Object.keys(map).forEach((cat) => { grouped[cat] = []; });

  const sign = createHash('md5').update(username + apiKey + 'pricelist').digest('hex');

  const [prepaidResult, postpaidResult] = await Promise.all([
    digiflazzCall('/price-list', { cmd: 'prepaid', username, sign }),
    digiflazzCall('/price-list', { cmd: 'pasca', username, sign }),
  ]);

  if (Array.isArray(prepaidResult)) {
    const prepaidCategories = ['PULSA', 'DATA', 'PLNPRA', 'EMONEY', 'GAME', 'VOUCHER'];
    for (const item of prepaidResult) {
      const itemCategory = item?.category ?? '';
      for (const internalCat of prepaidCategories) {
        const dgCat = map[internalCat as keyof typeof map];
        if (dgCat && itemCategory === dgCat) {
          grouped[internalCat].push(item);
          break;
        }
      }
    }
  }

  if (Array.isArray(postpaidResult)) {
    const postpaidCategories = ['PLNPASCA', 'TELKOM', 'PDAM', 'BPJS'];
    for (const item of postpaidResult) {
      const brand = String(item?.brand ?? '').toUpperCase();
      for (const internalCat of postpaidCategories) {
        const matched = internalCat === 'PLNPASCA'
          ? brand.includes('PLN')
          : internalCat === 'TELKOM'
          ? brand.includes('TELKOM')
          : internalCat === 'PDAM'
          ? brand.includes('PDAM')
          : internalCat === 'BPJS'
          ? brand.includes('BPJS')
          : false;
        if (matched) {
          grouped[internalCat].push(item);
          break;
        }
      }
    }
  }

  return grouped;
}

async function rajabillerCall(method: string, params: Record<string, any> = {}) {
  const uid = getEnvOrThrow('RAJABILLER_UID');
  const pin = getEnvOrThrow('RAJABILLER_PIN');
  const baseUrl = process.env.RAJABILLER_BASE_URL || 'https://rajabiller.fastpay.co.id/transaksi/json_devel.php';
  const payload = { method, uid, pin, ...params };
  const response = await fetch(baseUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  return response.json().catch(() => ({}));
}

async function rajabillerFetchPricelist(category: string) {
  const result = await rajabillerCall('rajabiller.cekharga_gp', { produk: category, group: category });
  if (result?.STATUS && result.STATUS !== '00') {
    throw new ApiError(result.KET || 'Gagal mengambil pricelist RajaBiller', 400);
  }
  if (Array.isArray(result?.DATA)) return result.DATA;
  if (Array.isArray(result)) return result;
  return [];
}

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

  async getProductsByCategory(params: { category: string; brand?: string }) {
    const { category, brand } = params;
    const where: any = { category, isActive: true };
    if (brand) where.brand = brand;

    const products = await posPpobProductRepository.findManyByFilter({
      where,
      orderBy: { basePrice: 'asc' },
    });

    return products.map(mapPpobProduct);
  },

  async getBrandsByCategory(category: string) {
    const brands = await posPpobProductRepository.findDistinctBrandsByCategory(category);
    return brands.map((item) => item.brand).filter(Boolean) as string[];
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

  async bulkDeleteProducts(uuids: string[]) {
    if (!uuids.length) {
      throw new ValidationApiError({ uuids: ['Pilih minimal 1 produk untuk dihapus'] });
    }

    const result = await posPpobProductRepository.deleteManyByUuids(uuids);
    return { deleted: result.count };
  },

  async syncProducts(provider: string, category: string) {
    let affected = 0;

    const items = provider === 'digiflazz'
      ? await digiflazzFetchPricelist(category)
      : await rajabillerFetchPricelist(category);

    for (const item of items) {
      const mapped = provider === 'digiflazz'
        ? mapDigiflazzProductData(category, item)
        : parseRajaBillerProduct(category, item);
      if (!mapped) continue;

      const existing = await posPpobProductRepository.findByProviderCode(provider, mapped.providerProductCode);
      if (existing) {
        await posPpobProductRepository.updateByUuid(existing.uuid, {
          ...mapped,
          provider,
        });
      } else {
        await posPpobProductRepository.create({
          ...mapped,
          provider,
        });
      }
      affected += 1;
    }

    return affected;
  },

  async syncAllDigiflazz() {
    const result: Record<string, number> = {};
    const grouped = await digiflazzFetchAllPricelist();

    for (const category of DEFAULT_SYNC_CATEGORIES) {
      const items = grouped[category] || [];
      let synced = 0;
      for (const item of items) {
        const mapped = mapDigiflazzProductData(category, item);
        if (!mapped) continue;
        const existing = await posPpobProductRepository.findByProviderCode('digiflazz', mapped.providerProductCode);
        if (existing) {
          await posPpobProductRepository.updateByUuid(existing.uuid, {
            ...mapped,
            provider: 'digiflazz',
          });
        } else {
          await posPpobProductRepository.create({
            ...mapped,
            provider: 'digiflazz',
          });
        }
        synced += 1;
      }
      result[category] = synced;
    }

    return result;
  },
};
