import { NextRequest } from 'next/server';
import { successResponse, errorResponse } from '@/lib/response';
import { prisma } from '@/lib/prisma';
import { withPermission } from '@/lib/api-middleware';
import { validateSchema } from '@/lib/validation';
import { updateSupplierSchema } from '@/lib/validations/supplier';

// GET /api/admin/pos/suppliers/[uuid] - Get supplier detail
export const GET = withPermission(
  'admin.pos.supplier.index',
  async (_req: NextRequest, context) => {
    try {
      const { uuid } = await context.params;

      const supplier = await prisma.posSupplier.findFirst({
        where: { uuid },
      });

      if (!supplier) {
        return errorResponse('Supplier not found', 404);
      }

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

      return successResponse('Supplier retrieved successfully', mapped);
    } catch (error: any) {
      console.error('Error fetching supplier:', error);
      return errorResponse('Failed to fetch supplier', 500);
    }
  }
);

// PATCH /api/admin/pos/suppliers/[uuid] - Update supplier
export const PATCH = withPermission(
  'admin.pos.supplier.update',
  async (req: NextRequest, context) => {
    try {
      const { uuid } = await context.params;
      const rawBody = await req.json();
      const body = {
        ...rawBody,
        contact_person: rawBody.contact_person ?? rawBody.contactPerson,
        is_active: rawBody.is_active ?? rawBody.isActive,
      };
      const result = validateSchema(updateSupplierSchema, body);
      if (!('data' in result)) return result;
      const validated = result.data;

      const supplier = await prisma.posSupplier.findFirst({
        where: { uuid },
      });

      if (!supplier) {
        return errorResponse('Supplier not found', 404);
      }

      const updated = await prisma.posSupplier.update({
        where: { uuid },
        data: {
          name: validated.name ?? supplier.name,
          contactPerson: validated.contact_person ?? supplier.contactPerson,
          phone: validated.phone ?? supplier.phone,
          email: validated.email ?? supplier.email,
          address: validated.address ?? supplier.address,
          isActive: validated.is_active ?? supplier.isActive,
        },
      });

      const mapped = {
        uuid: updated.uuid,
        code: updated.code,
        name: updated.name,
        contact_person: updated.contactPerson,
        phone: updated.phone,
        email: updated.email,
        address: updated.address,
        is_active: updated.isActive,
        created_at: updated.createdAt,
        updated_at: updated.updatedAt,
      };

      return successResponse('Supplier updated successfully', mapped);
    } catch (error: any) {
      console.error('Error updating supplier:', error);
      return errorResponse('Failed to update supplier', 500);
    }
  }
);

// PUT /api/admin/pos/suppliers/[uuid] - Update supplier (alias)
export const PUT = PATCH;

// DELETE /api/admin/pos/suppliers/[uuid] - Delete supplier
export const DELETE = withPermission(
  'admin.pos.supplier.delete',
  async (_req: NextRequest, context) => {
    try {
      const { uuid } = await context.params;

      const supplier = await prisma.posSupplier.findFirst({
        where: { uuid },
      });

      if (!supplier) {
        return errorResponse('Supplier not found', 404);
      }

      await prisma.posSupplier.delete({ where: { uuid } });

      return successResponse('Supplier deleted successfully', null);
    } catch (error: any) {
      console.error('Error deleting supplier:', error);
      return errorResponse('Failed to delete supplier', 500);
    }
  }
);
