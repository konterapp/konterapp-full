import { NextRequest } from 'next/server';
import { successResponse, errorResponse } from '@/lib/response';
import { prisma } from '@/lib/prisma';
import { withPermission } from '@/lib/api-middleware';
import { validateSchema } from '@/lib/validation';
import { createSupplierSchema } from '@/lib/validations/supplier';

async function generateSupplierCode(): Promise<string> {
  const count = await prisma.posSupplier.count();
  const nextNumber = count + 1;
  return `SUP${String(nextNumber).padStart(4, '0')}`;
}

// GET /api/admin/pos/suppliers - List all suppliers
export const GET = withPermission('admin.pos.supplier.index', async (req: NextRequest) => {
  try {
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1');
    const perPage = parseInt(searchParams.get('per_page') || '10');
    const search = searchParams.get('search') || '';
    const sortBy = searchParams.get('sort_by') || 'created_at';
    const sortOrder = searchParams.get('sort_order') === 'asc' ? 'asc' : 'desc';
    const isActive = searchParams.get('is_active');

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
      prisma.posSupplier.findMany({
        where,
        skip,
        take: perPage,
        orderBy,
      }),
      prisma.posSupplier.count({ where }),
    ]);

    const mapped = suppliers.map((supplier) => ({
      uuid: supplier.uuid,
      code: supplier.code,
      name: supplier.name,
      contact_person: supplier.contactPerson,
      phone: supplier.phone,
      email: supplier.email,
      address: supplier.address,
      is_active: supplier.isActive,
    }));

    return successResponse('Suppliers retrieved successfully', {
      data: mapped,
      pagination: {
        page,
        perPage,
        total,
        totalPages: Math.ceil(total / perPage),
      },
    });
  } catch (error: any) {
    console.error('Error fetching suppliers:', error);
    return errorResponse('Failed to fetch suppliers', 500);
  }
});

// POST /api/admin/pos/suppliers - Create new supplier
export const POST = withPermission('admin.pos.supplier.create', async (req: NextRequest) => {
  try {
    const rawBody = await req.json();
    const body = {
      ...rawBody,
      contact_person: rawBody.contact_person ?? rawBody.contactPerson,
      is_active: rawBody.is_active ?? rawBody.isActive,
    };
    const result = validateSchema(createSupplierSchema, body);
    if (!('data' in result)) return result;
    const validated = result.data;

    const code = await generateSupplierCode();

    const supplier = await prisma.posSupplier.create({
      data: {
        code,
        name: validated.name,
        contactPerson: validated.contact_person || null,
        phone: validated.phone,
        email: validated.email || null,
        address: validated.address || null,
        isActive: validated.is_active ?? true,
      },
    });

    const mapped = {
      uuid: supplier.uuid,
      code: supplier.code,
      name: supplier.name,
      contact_person: supplier.contactPerson,
      phone: supplier.phone,
      email: supplier.email,
      address: supplier.address,
      is_active: supplier.isActive,
      created_at: supplier.createdAt,
      updated_at: supplier.updatedAt,
    };

    return successResponse('Supplier created successfully', mapped);
  } catch (error: any) {
    console.error('Error creating supplier:', error);
    return errorResponse('Failed to create supplier', 500);
  }
});