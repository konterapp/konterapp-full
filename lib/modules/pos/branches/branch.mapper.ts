export function mapBranch(branch: any) {
  return {
    uuid: branch.uuid,
    code: branch.code,
    name: branch.name,
    address: branch.address,
    phone: branch.phone,
    email: branch.email,
    isActive: branch.isActive,
    isMain: branch.isMain,
    createdAt: branch.createdAt,
    updatedAt: branch.updatedAt,
  };
}

export function mapBranchListSimple(branch: any) {
  return {
    uuid: branch.uuid,
    code: branch.code,
    name: branch.name,
    isMain: branch.isMain,
    isActive: branch.isActive,
  };
}
