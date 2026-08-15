export function hasActivePaidPlan(user: any): boolean {
  return !!(
    user &&
    user.plan &&
    user.plan !== "Free" &&
    user.planDetails?.expiresAt &&
    new Date(user.planDetails.expiresAt) > new Date()
  );
}
