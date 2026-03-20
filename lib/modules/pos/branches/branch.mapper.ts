export function mapBranch(branch: any) {
  return {
    uuid: branch.uuid,
    code: branch.code,
    name: branch.name,
    address: branch.address,
    phone: branch.phone,
    email: branch.email,
    is_active: branch.isActive,
    is_main: branch.isMain,
    created_at: branch.createdAt,
    updated_at: branch.updatedAt,
  };
}

export function mapBranchListSimple(branch: any) {
  return {
    uuid: branch.uuid,
    code: branch.code,
    name: branch.name,
    is_main: branch.isMain,
    is_active: branch.isActive,
  };
}
