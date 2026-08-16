const ACTIVE_STATUSES = new Set(["trial", "active"]);

export function isSubscriptionActive(
  subscription: { status: string; expiresAt: Date } | null
): boolean {
  if (!subscription) return false;
  return ACTIVE_STATUSES.has(subscription.status) && subscription.expiresAt > new Date();
}
