const ACTIVE_STATUSES = new Set(["trial", "active"]);

export function isSubscriptionActive(
  subscription: { status: string; expiresAt: Date | string | null } | null
): boolean {
  if (!subscription) return false;
  if (!ACTIVE_STATUSES.has(subscription.status)) return false;
  // Free selamanya / langganan tanpa kedaluwarsa (expiresAt null) selalu aktif.
  if (subscription.expiresAt == null) return true;
  return new Date(subscription.expiresAt) > new Date();
}
