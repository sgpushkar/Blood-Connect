/**
 * Privacy utilities — strip sensitive fields from donor/user data
 * before sending over the GraphQL API.
 */

import type { Donor } from "@prisma/client";
import { daysUntilEligible } from "../services/eligibility.js";

/**
 * Public-safe donor view. Strips address, exact coordinates, phone, email.
 * Adds computed fields: eligible, daysUntilEligible, distanceKm (if provided).
 */
export function toPublicDonor(
  donor: Donor,
  distanceKm?: number,
) {
  return {
    id: donor.id,
    name: donor.name,
    age: donor.age,
    gender: donor.gender,
    bloodGroup: donor.bloodGroup,
    city: donor.city,
    available: donor.available,
    verified: donor.verified,
    totalDonations: donor.totalDonations,
    badge: donor.badge,
    avatarSeed: donor.avatarSeed,
    eligible: daysUntilEligible(donor.lastDonation) === 0,
    daysUntilEligible: daysUntilEligible(donor.lastDonation),
    lastDonation: donor.lastDonation?.toISOString() ?? null,
    distanceKm: distanceKm ?? null,
    createdAt: donor.createdAt.toISOString(),
    // ── NEVER exposed ──
    // address, lat, lng, phone, email, weightKg
  };
}

/**
 * Full donor view — includes private fields.
 * Only visible to the donor themselves or an ADMIN.
 */
export function toPrivateDonor(donor: Donor) {
  return {
    ...toPublicDonor(donor),
    phone: donor.phone,
    email: donor.email,
    address: donor.address,
    weightKg: donor.weightKg,
  };
}
