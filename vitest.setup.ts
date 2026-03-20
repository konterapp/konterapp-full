import { vi } from 'vitest';

vi.mock('@/lib/prisma', () => {
  const mockPrisma = {
    $transaction: vi.fn(),
  };

  return { prisma: mockPrisma };
});
