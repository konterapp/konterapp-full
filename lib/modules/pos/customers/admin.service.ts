import { ApiError } from '@/lib/api-errors';
import { posCustomerRepository } from './repository';

export const posCustomerService = {
  async listCustomers(params: { page: number; perPage: number; search: string }) {
    const { page, perPage, search } = params;
    const skip = (page - 1) * perPage;

    const where: any = {};
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [customers, total] = await Promise.all([
      posCustomerRepository.findMany({ where, skip, take: perPage }),
      posCustomerRepository.count(where),
    ]);

    return {
      data: customers,
      pagination: {
        page,
        perPage,
        total,
        totalPages: Math.ceil(total / perPage),
      },
    };
  },

  async getCustomer(uuid: string) {
    const customer = await posCustomerRepository.findByUuid(uuid);
    if (!customer) {
      throw new ApiError('Customer not found', 404);
    }

    return customer;
  },

  async createCustomer(payload: { name: string; phone?: string | null; email?: string | null; address?: string | null }) {
    return posCustomerRepository.create({
      name: payload.name,
      phone: payload.phone || null,
      email: payload.email || null,
      address: payload.address || null,
    });
  },

  async updateCustomer(
    uuid: string,
    payload: { name?: string; phone?: string | null; email?: string | null; address?: string | null }
  ) {
    const existingCustomer = await posCustomerRepository.findByUuid(uuid);
    if (!existingCustomer) {
      throw new ApiError('Customer not found', 404);
    }

    return posCustomerRepository.updateByUuid(uuid, {
      name: payload.name || existingCustomer.name,
      phone: payload.phone ?? existingCustomer.phone,
      email: payload.email ?? existingCustomer.email,
      address: payload.address ?? existingCustomer.address,
    });
  },

  async deleteCustomer(uuid: string) {
    const customer = await posCustomerRepository.findByUuid(uuid);
    if (!customer) {
      throw new ApiError('Customer not found', 404);
    }

    const salesCount = await posCustomerRepository.countSales(uuid);
    if (salesCount > 0) {
      throw new ApiError('Cannot delete customer with existing transactions', 400);
    }

    await posCustomerRepository.deleteByUuid(uuid);
  },
};
