/**
 * Donor eligibility logic.
 * Lifted from the existing frontend `src/lib/utils.ts` (`daysUntilEligible`)
 * and `src/data/mock.ts` (`badgeFor`).
 */

import type { Donor } from "@prisma/client";

const ELIGIBILITY_DAYS = 90;
const MIN_AGE = 18;
const MAX_AGE = 65;
const MIN_WEIGHT_KG = 50;

/**
 * Number of days remaining before a donor is eligible to donate again.
 * Returns 0 if eligible now (or never donated).
 */
export function daysUntilEligible(lastDonation: Date | null): number {
  if (!lastDonation) return 0;
  const elapsedMs = Date.now() - lastDonation.getTime();
  const elapsedDays = Math.floor(elapsedMs / (1000 * 60 * 60 * 24));
  const remaining = ELIGIBILITY_DAYS - elapsedDays;
  return Math.max(0, remaining);
}

/**
 * Whether a donor is currently eligible to donate (90-day rule).
 */
export function isEligibleByTime(lastDonation: Date | null): boolean {
  return daysUntilEligible(lastDonation) === 0;
}

/**
 * Full eligibility check including age, weight, and time since last donation.
 */
export function isFullyEligible(donor: Pick<Donor, "age" | "weightKg" | "lastDonation" | "verified">): boolean {
  if (!donor.verified) return false;
  if (donor.age < MIN_AGE || donor.age > MAX_AGE) return false;
  if (donor.weightKg < MIN_WEIGHT_KG) return false;
  return isEligibleByTime(donor.lastDonation);
}

/**
 * Compute the badge tier based on total donation count.
 * Matches the existing frontend logic in `mock.ts`.
 */
export function badgeFor(totalDonations: number): string {
  if (totalDonations >= 20) return "Platinum";
  if (totalDonations >= 10) return "Gold";
  if (totalDonations >= 4) return "Silver";
  if (totalDonations >= 1) return "Bronze";
  return "New";
}
