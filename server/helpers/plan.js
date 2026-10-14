// Server-side plan definitions and authorization helpers.
// The client mirrors `hasActivePaidPlan` in yourtube/src/lib/planUtils.ts —
// keep the two in sync.

export const PLANS = {
  Bronze: { amount: 100, currency: "INR", durationDays: 30 },
  Silver: { amount: 200, currency: "INR", durationDays: 30 },
  Gold: { amount: 300, currency: "INR", durationDays: 30 },
};

export const PAID_PLANS = ["Bronze", "Silver", "Gold"];

export const DAILY_DOWNLOAD_LIMITS = {
  Free: 1,
  Bronze: 3,
  Silver: 7,
  Gold: 15,
};

/**
 * True when the user is on a paid plan whose subscription has not expired.
 * Mirrors the client-side helper so premium access decisions agree on both sides.
 */
export function hasActivePaidPlan(user) {
  return !!(
    user &&
    user.plan &&
    user.plan !== "Free" &&
    user.planDetails &&
    user.planDetails.expiresAt &&
    new Date(user.planDetails.expiresAt) > new Date()
  );
}

/**
 * The plan a user is actually entitled to RIGHT NOW. An expired subscription
 * leaves a stale `plan` string on the document (e.g. "Silver"), so anything
 * that grants entitlements must go through this — never read `user.plan` raw.
 */
export function getEffectivePlan(user) {
  return hasActivePaidPlan(user) ? user.plan : "Free";
}

/** Daily download allowance for the plan the user is currently entitled to. */
export function getDailyDownloadLimit(user) {
  return DAILY_DOWNLOAD_LIMITS[getEffectivePlan(user)] || DAILY_DOWNLOAD_LIMITS.Free;
}
