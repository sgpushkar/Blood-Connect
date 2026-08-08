/**
 * Matching engine — the core of Blood Connect.
 *
 * When a blood request is created or donors are searched, this service:
 * 1. Checks blood compatibility (from bloodCompatibility.ts)
 * 2. Filters by availability
 * 3. Filters by eligibility (90-day rule)
 * 4. Filters by verification status
 * 5. Performs geospatial proximity search (bounding box + Haversine)
 * 6. Checks the donor doesn't have too many active commitments
 * 7. Ranks results by urgency-weighted inverse distance + reliability bonus
 */

import type { PrismaClient, BloodGroup, UrgencyLevel, Donor } from "@prisma/client";
import { getCompatibleDonorGroups } from "./bloodCompatibility.js";
import { distanceKm, boundingBox, type LatLng } from "./geo.js";
import { isEligibleByTime } from "./eligibility.js";

export interface MatchFilter {
  recipientBloodGroup: BloodGroup;
  location: LatLng;
  radiusKm?: number;           // default 10
  urgency?: UrgencyLevel;
  availableOnly?: boolean;     // default true
  eligibleOnly?: boolean;      // default true
  limit?: number;              // default 20, max 50
}

export interface MatchedDonor extends Donor {
  distanceKm: number;
  score: number;
}

const URGENCY_WEIGHT: Record<UrgencyLevel, number> = {
  CRITICAL: 3,
  URGENT: 2,
  STANDARD: 1,
};

const MAX_ACTIVE_COMMITMENTS = 2;

export async function findMatchingDonors(
  prisma: PrismaClient,
  filter: MatchFilter,
): Promise<MatchedDonor[]> {
  const radius = Math.min(filter.radiusKm ?? 10, 100);
  const limit = Math.min(filter.limit ?? 20, 50);
  const compatibleGroups = getCompatibleDonorGroups(filter.recipientBloodGroup);

  if (compatibleGroups.length === 0) return [];

  // Step 1: Bounding-box DB query (fast, index-friendly)
  const bbox = boundingBox(filter.location, radius);

  const donors = await prisma.donor.findMany({
    where: {
      bloodGroup: { in: compatibleGroups },
      available: filter.availableOnly !== false ? true : undefined,
      verified: true,
      lat: { gte: bbox.minLat, lte: bbox.maxLat },
      lng: { gte: bbox.minLng, lte: bbox.maxLng },
    },
    include: {
      acceptedRequests: {
        where: {
          request: { status: { in: ["OPEN", "MATCHED"] } },
        },
      },
    },
  });

  // Step 2: In-memory Haversine distance + eligibility + commitment checks
  const urgencyWeight = URGENCY_WEIGHT[filter.urgency ?? "STANDARD"];

  const scored: MatchedDonor[] = [];

  for (const donor of donors) {
    const dist = distanceKm(filter.location, { lat: donor.lat, lng: donor.lng });
    if (dist > radius) continue;

    // Skip ineligible donors if requested
    if (filter.eligibleOnly !== false && !isEligibleByTime(donor.lastDonation)) continue;

    // Skip donors with too many active commitments
    if (donor.acceptedRequests.length >= MAX_ACTIVE_COMMITMENTS) continue;

    // Score: higher is better
    const inverseDistance = 1 / Math.max(dist, 0.1); // avoid div-by-zero
    const reliabilityBonus = 1 + Math.min(donor.totalDonations / 50, 0.5); // up to 1.5x
    const score = urgencyWeight * inverseDistance * reliabilityBonus;

    // Strip the join-table data before returning
    const { acceptedRequests: _, ...donorData } = donor;
    scored.push({ ...donorData, distanceKm: Math.round(dist * 10) / 10, score });
  }

  // Step 3: Sort by score descending
  scored.sort((a, b) => b.score - a.score);

  return scored.slice(0, limit);
}
