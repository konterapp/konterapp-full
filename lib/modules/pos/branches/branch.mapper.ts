import type { AppPosBranch } from '@prisma/client';

export function mapBranch(branch: AppPosBranch) {
  return {
    uuid: branch.uuid,
    code: branch.code,
    name: branch.name,
    address: branch.address,
    phone: branch.phone,
    email: branch.email,
    is_active: branch.isActive,
    is_main: branch.isMain,
    max_concurrent_users: branch.maxConcurrentUsers,
    created_at: branch.createdAt,
    updated_at: branch.updatedAt,
  };
}

export function mapBranchListSimple(
  branch: Pick<AppPosBranch, 'uuid' | 'code' | 'name' | 'isMain' | 'isActive' | 'maxConcurrentUsers'>
) {
  return {
    uuid: branch.uuid,
    code: branch.code,
    name: branch.name,
    is_main: branch.isMain,
    is_active: branch.isActive,
    max_concurrent_users: branch.maxConcurrentUsers,
  };
}
