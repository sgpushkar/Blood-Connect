/**
 * Network statistics — live aggregates from the database.
 * Replaces the hardcoded stats on the existing landing page.
 */

import type { PrismaClient } from "@prisma/client";

export interface NetworkStats {
  totalDonors: number;
  availableDonors: number;
  registeredHospitals: number;
  registeredBloodBanks: number;
  totalDonations: number;
  activeBloodRequests: number;
  fulfilledRequests: number;
  livesSupported: number;
}

export async function getNetworkStats(prisma: PrismaClient): Promise<NetworkStats> {
  const [
    totalDonors,
    availableDonors,
    registeredHospitals,
    registeredBloodBanks,
    totalDonations,
    activeBloodRequests,
    fulfilledRequests,
  ] = await Promise.all([
    prisma.donor.count(),
    prisma.donor.count({ where: { available: true } }),
    prisma.hospital.count(),
    prisma.bloodBank.count(),
    prisma.donation.count(),
    prisma.bloodRequest.count({ where: { status: { in: ["OPEN", "MATCHED"] } } }),
    prisma.bloodRequest.count({ where: { status: "FULFILLED" } }),
  ]);

  return {
    totalDonors,
    availableDonors,
    registeredHospitals,
    registeredBloodBanks,
    totalDonations,
    activeBloodRequests,
    fulfilledRequests,
    livesSupported: totalDonations * 3, // each donation can support ~3 lives
  };
}
