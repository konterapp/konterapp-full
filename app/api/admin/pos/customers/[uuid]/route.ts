import { NextRequest } from 'next/server';
import { successResponse, errorResponse } from '@/lib/response';
import { prisma } from '@/lib/prisma';
import { withPermission } from '@/lib/api-middleware';

// GET /api/admin/pos/customers/[uuid] - Get customer detail
export const GET = withPermission(
  'admin.pos.sale.create',
  async (req: NextRequest, context) => {
  try {
    const { uuid } = await context.params;

    const customer = await prisma.posCustomer.findFirst({
      where: { uuid },
    });

    if (!customer) {
      return errorResponse('Customer not found', 404);
    }

    return successResponse('Customer retrieved successfully', customer);
  } catch (error: any) {
    console.error('Error fetching customer:', error);
    return errorResponse('Failed to fetch customer', 500);
  }
});

// PUT /api/admin/pos/customers/[uuid] - Update customer
export const PUT = withPermission(
  'admin.pos.sale.create',
  async (req: NextRequest, context) => {
  try {
    const { uuid } = await context.params;
    const body = await req.json();
    const { name, phone, email, address } = body;

    // Check if customer exists
    const existingCustomer = await prisma.posCustomer.findFirst({
      where: { uuid },
    });

    if (!existingCustomer) {
      return errorResponse('Customer not found', 404);
    }

    const customer = await prisma.posCustomer.update({
      where: { uuid },
      data: {
        name: name || existingCustomer.name,
        phone: phone ?? existingCustomer.phone,
        email: email ?? existingCustomer.email,
        address: address ?? existingCustomer.address,
      },
    });

    return successResponse('Customer updated successfully', customer);
  } catch (error: any) {
    console.error('Error updating customer:', error);
    return errorResponse('Failed to update customer', 500);
  }
});

// DELETE /api/admin/pos/customers/[uuid] - Delete customer
export const DELETE = withPermission(
  'admin.pos.sale.create',
  async (req: NextRequest, context) => {
  try {
    const { uuid } = await context.params;

    // Check if customer exists
    const customer = await prisma.posCustomer.findFirst({
      where: { uuid },
    });

    if (!customer) {
      return errorResponse('Customer not found', 404);
    }

    // Check if customer has transactions
    const salesCount = await prisma.posSale.count({
      where: { customerUuid: uuid },
    });

    if (salesCount > 0) {
      return errorResponse('Cannot delete customer with existing transactions', 400);
    }

    await prisma.posCustomer.delete({
      where: { uuid },
    });

    return successResponse('Customer deleted successfully', null);
  } catch (error: any) {
    console.error('Error deleting customer:', error);
    return errorResponse('Failed to delete customer', 500);
  }
});