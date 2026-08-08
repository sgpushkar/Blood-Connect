/**
 * Blood group compatibility map.
 * Key = recipient blood group, Value = array of donor groups that can donate to this recipient.
 * Lifted directly from the existing frontend `src/lib/utils.ts`.
 */

import { BloodGroup } from "@prisma/client";

export const BLOOD_COMPATIBILITY: Record<BloodGroup, BloodGroup[]> = {
  O_NEG: [BloodGroup.O_NEG],
  O_POS: [BloodGroup.O_NEG, BloodGroup.O_POS],
  A_NEG: [BloodGroup.O_NEG, BloodGroup.A_NEG],
  A_POS: [BloodGroup.O_NEG, BloodGroup.O_POS, BloodGroup.A_NEG, BloodGroup.A_POS],
  B_NEG: [BloodGroup.O_NEG, BloodGroup.B_NEG],
  B_POS: [BloodGroup.O_NEG, BloodGroup.O_POS, BloodGroup.B_NEG, BloodGroup.B_POS],
  AB_NEG: [BloodGroup.O_NEG, BloodGroup.A_NEG, BloodGroup.B_NEG, BloodGroup.AB_NEG],
  AB_POS: [
    BloodGroup.O_NEG, BloodGroup.O_POS,
    BloodGroup.A_NEG, BloodGroup.A_POS,
    BloodGroup.B_NEG, BloodGroup.B_POS,
    BloodGroup.AB_NEG, BloodGroup.AB_POS,
  ],
};

/**
 * Given a recipient's blood group, return which donor blood groups are compatible.
 */
export function getCompatibleDonorGroups(recipientGroup: BloodGroup): BloodGroup[] {
  return BLOOD_COMPATIBILITY[recipientGroup] ?? [];
}

/**
 * Check if a donor's blood group is compatible with a recipient's blood group.
 */
export function isCompatible(donorGroup: BloodGroup, recipientGroup: BloodGroup): boolean {
  return BLOOD_COMPATIBILITY[recipientGroup]?.includes(donorGroup) ?? false;
}

// ─── Display helpers ─────────────────────────────────────

const DISPLAY_MAP: Record<BloodGroup, string> = {
  A_POS: "A+", A_NEG: "A-",
  B_POS: "B+", B_NEG: "B-",
  AB_POS: "AB+", AB_NEG: "AB-",
  O_POS: "O+", O_NEG: "O-",
};

const PARSE_MAP: Record<string, BloodGroup> = {
  "A+": BloodGroup.A_POS, "A-": BloodGroup.A_NEG,
  "B+": BloodGroup.B_POS, "B-": BloodGroup.B_NEG,
  "AB+": BloodGroup.AB_POS, "AB-": BloodGroup.AB_NEG,
  "O+": BloodGroup.O_POS, "O-": BloodGroup.O_NEG,
};

export function bloodGroupToDisplay(bg: BloodGroup): string {
  return DISPLAY_MAP[bg] ?? bg;
}

export function parseBloodGroup(str: string): BloodGroup | null {
  return PARSE_MAP[str] ?? (BloodGroup[str as keyof typeof BloodGroup] || null);
}
