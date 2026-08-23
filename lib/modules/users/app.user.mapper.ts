export function mapAppUser(user: any, companyUuid: string) {
  const roles = (user.modelHasRoles ?? [])
    .filter((r: any) => r.companyUuid === companyUuid)
    .map((r: any) => ({ uuid: r.role.uuid, name: r.role.name }));

  const membership = (user.companyMemberships ?? []).find(
    (m: any) => m.companyUuid === companyUuid
  );

  const branches = (membership?.branches ?? []).map((b: any) => ({
    uuid: b.branch.uuid,
    name: b.branch.name,
  }));

  return {
    id: user.id,
    uuid: user.uuid,
    name: user.name,
    email: user.email,
    is_active: user.isActive,
    email_verified_at: user.emailVerifiedAt ?? null,
    invitation_accepted_at: membership?.invitationAcceptedAt ?? null,
    roles,
    branches,
    created_at: user.createdAt,
    updated_at: user.updatedAt,
  };
}
