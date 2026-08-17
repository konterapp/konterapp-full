export const TIER_FREE_CODE = "free";
export const TIER_STARTER_CODE = "starter";
export const TIER_GROWTH_CODE = "growth";
export const TIER_PRO_CODE = "pro";

export const FREE_PLAN_CODE = "free";
export const STARTER_MONTHLY_PLAN_CODE = "starter-monthly";
export const STARTER_YEARLY_PLAN_CODE = "starter-yearly";
export const GROWTH_MONTHLY_PLAN_CODE = "growth-monthly";
export const GROWTH_YEARLY_PLAN_CODE = "growth-yearly";
export const PRO_MONTHLY_PLAN_CODE = "pro-monthly";
export const PRO_YEARLY_PLAN_CODE = "pro-yearly";

export const BILLING_PERIOD_MONTHLY = "monthly";
export const BILLING_PERIOD_YEARLY = "yearly";

export const INVOICE_PAYMENT_EXPIRY_HOURS = 24;

// Batas default tiap tiap paket (semua tier punya batas).
export const FREE_PLAN_LIMITS = { maxBranches: 1, maxUsers: 3, maxProducts: 100, maxTransactionsPerMonth: 1000 };
export const STARTER_PLAN_LIMITS = { maxBranches: 1, maxUsers: 3, maxProducts: 500, maxTransactionsPerMonth: 5000 };
export const GROWTH_PLAN_LIMITS = { maxBranches: 3, maxUsers: 9, maxProducts: 2000, maxTransactionsPerMonth: 20000 };
export const PRO_PLAN_LIMITS = { maxBranches: 10, maxUsers: 30, maxProducts: 10000, maxTransactionsPerMonth: 100000 };