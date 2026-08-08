/**
 * All GraphQL resolvers — queries, mutations, subscriptions.
 *
 * This is the single resolvers file that handles the complete Blood Connect API.
 * Organized by section with clear comments.
 */

import { PubSub } from "graphql-subscriptions";
import type { PrismaClient } from "@prisma/client";
import {
  hashPassword,
  comparePassword,
  signToken,
  requireAuth,
  requireRole,
  type AuthContext,
} from "../middleware/auth.js";
import { toPublicDonor, toPrivateDonor } from "../utils/privacy.js";
import { getNetworkStats } from "../services/stats.js";
import { findMatchingDonors } from "../services/matching.js";
import { daysUntilEligible, badgeFor } from "../services/eligibility.js";
import { distanceKm } from "../services/geo.js";

// ─── PubSub for subscriptions ────────────────────────
// In production at national scale you'd swap this for Redis PubSub.
// For initial deployment this in-memory PubSub is fine.
const pubsub = new PubSub();

const EVENTS = {
  BLOOD_REQUEST_CREATED: "BLOOD_REQUEST_CREATED",
  BLOOD_REQUEST_UPDATED: "BLOOD_REQUEST_UPDATED",
  DONOR_AVAILABILITY_CHANGED: "DONOR_AVAILABILITY_CHANGED",
  NOTIFICATION_CREATED: "NOTIFICATION_CREATED",
  DONATION_COMPLETED: "DONATION_COMPLETED",
} as const;

// ─── Context type ────────────────────────────────────
export interface GqlContext extends AuthContext {
  prisma: PrismaClient;
}

// ─── Pagination helpers ──────────────────────────────
function encodeCursor(id: string): string {
  return Buffer.from(id).toString("base64");
}
function decodeCursor(cursor: string): string {
  return Buffer.from(cursor, "base64").toString("utf-8");
}

// ─── Helper to load a full BloodRequest with relations ──
async function loadFullRequest(prisma: PrismaClient, id: string) {
  const req = await prisma.bloodRequest.findUnique({
    where: { id },
    include: {
      hospital: true,
      acceptedDonors: { include: { donor: true } },
    },
  });
  if (!req) throw new Error("Blood request not found.");
  return {
    ...req,
    matchedCount: req.acceptedDonors.length,
    acceptedDonors: req.acceptedDonors.map((rd) => toPublicDonor(rd.donor)),
  };
}

// ═══════════════════════════════════════════════════════
// RESOLVERS
// ═══════════════════════════════════════════════════════

export const resolvers = {
  // ─── Custom scalar ─────────────────────────────────
  DateTime: {
    __serialize: (value: unknown) => {
      if (value instanceof Date) return value.toISOString();
      return value;
    },
    __parseValue: (value: unknown) => {
      if (typeof value === "string") return new Date(value);
      return value;
    },
  },

  // ═════════════════════════════════════════════════════
  // QUERIES
  // ═════════════════════════════════════════════════════
  Query: {
    // ── Public ──────────────────────────────────────
    networkStats: async (_: unknown, __: unknown, ctx: GqlContext) => {
      return getNetworkStats(ctx.prisma);
    },

    // ── Auth required ───────────────────────────────
    me: async (_: unknown, __: unknown, ctx: GqlContext) => {
      requireAuth(ctx);
      const user = await ctx.prisma.user.findUnique({
        where: { id: ctx.userId! },
        include: { donor: true, hospital: true, bloodBank: { include: { stock: true } } },
      });
      if (!user) throw new Error("User not found.");
      return {
        ...user,
        donor: user.donor ? toPublicDonor(user.donor) : null,
      };
    },

    myDonorProfile: async (_: unknown, __: unknown, ctx: GqlContext) => {
      requireAuth(ctx);
      const user = await ctx.prisma.user.findUnique({
        where: { id: ctx.userId! },
        include: { donor: true },
      });
      if (!user?.donor) return null;
      return toPrivateDonor(user.donor);
    },

    // ── Donors (paginated) ──────────────────────────
    donors: async (
      _: unknown,
      args: { filter?: Record<string, unknown>; pagination?: { first?: number; after?: string } },
      ctx: GqlContext,
    ) => {
      const f = args.filter ?? {};
      const first = Math.min(args.pagination?.first ?? 20, 50);
      const after = args.pagination?.after ? decodeCursor(args.pagination.after) : undefined;

      const where: Record<string, unknown> = { verified: true };
      if (f.bloodGroup) where.bloodGroup = f.bloodGroup;
      if (f.availableOnly) where.available = true;
      if (f.city) where.city = f.city;
      if (f.maxAge) where.age = { lte: f.maxAge };

      const totalCount = await ctx.prisma.donor.count({ where: where as any });

      const donors = await ctx.prisma.donor.findMany({
        where: where as any,
        take: first + 1, // fetch one extra to check hasNextPage
        ...(after ? { cursor: { id: after }, skip: 1 } : {}),
        orderBy: { createdAt: "desc" },
      });

      const hasNextPage = donors.length > first;
      const edges = donors.slice(0, first).map((d) => ({
        node: toPublicDonor(d),
        cursor: encodeCursor(d.id),
      }));

      return {
        edges,
        pageInfo: {
          hasNextPage,
          hasPreviousPage: !!after,
          startCursor: edges[0]?.cursor ?? null,
          endCursor: edges[edges.length - 1]?.cursor ?? null,
        },
        totalCount,
      };
    },

    donor: async (_: unknown, args: { id: string }, ctx: GqlContext) => {
      requireAuth(ctx);
      const d = await ctx.prisma.donor.findUnique({ where: { id: args.id } });
      if (!d) return null;
      return toPublicDonor(d);
    },

    // ── Hospitals ───────────────────────────────────
    hospitals: async (
      _: unknown,
      args: { filter?: { city?: string; verifiedOnly?: boolean } },
      ctx: GqlContext,
    ) => {
      requireAuth(ctx);
      const where: Record<string, unknown> = {};
      if (args.filter?.city) where.city = args.filter.city;
      if (args.filter?.verifiedOnly) where.verified = true;
      return ctx.prisma.hospital.findMany({ where: where as any, orderBy: { name: "asc" } });
    },

    hospital: async (_: unknown, args: { id: string }, ctx: GqlContext) => {
      requireAuth(ctx);
      return ctx.prisma.hospital.findUnique({ where: { id: args.id } });
    },

    // ── Blood Banks ─────────────────────────────────
    bloodBanks: async (_: unknown, args: { city?: string }, ctx: GqlContext) => {
      requireAuth(ctx);
      const where = args.city ? { city: args.city } : {};
      return ctx.prisma.bloodBank.findMany({
        where,
        include: { stock: true },
        orderBy: { name: "asc" },
      });
    },

    bloodBank: async (_: unknown, args: { id: string }, ctx: GqlContext) => {
      requireAuth(ctx);
      return ctx.prisma.bloodBank.findUnique({
        where: { id: args.id },
        include: { stock: true },
      });
    },

    // ── Blood Requests (paginated) ──────────────────
    bloodRequests: async (
      _: unknown,
      args: { filter?: Record<string, unknown>; pagination?: { first?: number; after?: string } },
      ctx: GqlContext,
    ) => {
      requireAuth(ctx);
      const f = args.filter ?? {};
      const first = Math.min(args.pagination?.first ?? 20, 50);
      const after = args.pagination?.after ? decodeCursor(args.pagination.after) : undefined;

      const where: Record<string, unknown> = {};
      if (f.bloodGroup) where.bloodGroup = f.bloodGroup;
      if (f.status) where.status = f.status;
      if (f.urgency) where.urgency = f.urgency;
      if (f.hospitalId) where.hospitalId = f.hospitalId;

      const totalCount = await ctx.prisma.bloodRequest.count({ where: where as any });

      const requests = await ctx.prisma.bloodRequest.findMany({
        where: where as any,
        take: first + 1,
        ...(after ? { cursor: { id: after }, skip: 1 } : {}),
        include: {
          hospital: true,
          acceptedDonors: { include: { donor: true } },
        },
        orderBy: { createdAt: "desc" },
      });

      const hasNextPage = requests.length > first;
      const edges = requests.slice(0, first).map((r) => ({
        node: {
          ...r,
          matchedCount: r.acceptedDonors.length,
          acceptedDonors: r.acceptedDonors.map((rd) => toPublicDonor(rd.donor)),
        },
        cursor: encodeCursor(r.id),
      }));

      return {
        edges,
        pageInfo: {
          hasNextPage,
          hasPreviousPage: !!after,
          startCursor: edges[0]?.cursor ?? null,
          endCursor: edges[edges.length - 1]?.cursor ?? null,
        },
        totalCount,
      };
    },

    bloodRequest: async (_: unknown, args: { id: string }, ctx: GqlContext) => {
      requireAuth(ctx);
      return loadFullRequest(ctx.prisma, args.id);
    },

    myRequests: async (_: unknown, __: unknown, ctx: GqlContext) => {
      requireAuth(ctx);
      // For patients: find requests where the user created them (we match on user name)
      const user = await ctx.prisma.user.findUnique({ where: { id: ctx.userId! } });
      if (!user) throw new Error("User not found.");

      const requests = await ctx.prisma.bloodRequest.findMany({
        where: { patientName: user.name },
        include: {
          hospital: true,
          acceptedDonors: { include: { donor: true } },
        },
        orderBy: { createdAt: "desc" },
      });

      return requests.map((r) => ({
        ...r,
        matchedCount: r.acceptedDonors.length,
        acceptedDonors: r.acceptedDonors.map((rd) => toPublicDonor(rd.donor)),
      }));
    },

    myDonations: async (_: unknown, __: unknown, ctx: GqlContext) => {
      requireAuth(ctx);
      const user = await ctx.prisma.user.findUnique({
        where: { id: ctx.userId! },
        include: { donor: true },
      });
      if (!user?.donor) return [];
      return ctx.prisma.donation.findMany({
        where: { donorId: user.donor.id },
        include: { donor: true, hospital: true },
        orderBy: { date: "desc" },
      });
    },

    notifications: async (
      _: unknown,
      args: { unreadOnly?: boolean },
      ctx: GqlContext,
    ) => {
      requireAuth(ctx);
      const where: Record<string, unknown> = { userId: ctx.userId };
      if (args.unreadOnly) where.read = false;
      return ctx.prisma.notification.findMany({
        where: where as any,
        orderBy: { createdAt: "desc" },
        take: 50,
      });
    },

    // ── Matching ────────────────────────────────────
    matchDonors: async (
      _: unknown,
      args: {
        bloodGroup: string;
        latitude: number;
        longitude: number;
        radiusKm?: number;
        urgency?: string;
      },
      ctx: GqlContext,
    ) => {
      requireAuth(ctx);
      const matched = await findMatchingDonors(ctx.prisma, {
        recipientBloodGroup: args.bloodGroup as any,
        location: { lat: args.latitude, lng: args.longitude },
        radiusKm: args.radiusKm,
        urgency: args.urgency as any,
      });
      return matched.map((d) => toPublicDonor(d, d.distanceKm));
    },
  },

  // ═════════════════════════════════════════════════════
  // MUTATIONS
  // ═════════════════════════════════════════════════════
  Mutation: {
    // ── Auth ────────────────────────────────────────
    register: async (
      _: unknown,
      args: { input: Record<string, any> },
      ctx: GqlContext,
    ) => {
      const { email, password, name, phone, role, bloodGroup, age, gender, city, weightKg } =
        args.input;

      // Check for existing user
      const existing = await ctx.prisma.user.findUnique({ where: { email: email.toLowerCase() } });
      if (existing) throw new Error("An account with this email already exists.");

      if (password.length < 6) throw new Error("Password must be at least 6 characters.");

      const passwordHash = await hashPassword(password);

      const user = await ctx.prisma.user.create({
        data: {
          email: email.toLowerCase(),
          passwordHash,
          name,
          phone,
          role,
        },
      });

      // If the role is DONOR, also create a donor profile
      if (role === "DONOR" && bloodGroup && city) {
        await ctx.prisma.donor.create({
          data: {
            userId: user.id,
            name,
            age: age ?? 25,
            gender: gender ?? "OTHER",
            bloodGroup,
            weightKg: weightKg ?? 65,
            phone: phone ?? "",
            email: email.toLowerCase(),
            city,
            address: city, // Default to city; can be updated later
            lat: 19.076, // Default Mumbai coordinates; updated on profile edit
            lng: 72.8777,
            available: true,
            verified: false,
            avatarSeed: name.replace(/\s/g, ""),
          },
        });
      }

      const token = signToken({ userId: user.id, role: user.role });
      return { token, user };
    },

    login: async (
      _: unknown,
      args: { email: string; password: string },
      ctx: GqlContext,
    ) => {
      const user = await ctx.prisma.user.findUnique({
        where: { email: args.email.toLowerCase() },
        include: { donor: true, hospital: true, bloodBank: { include: { stock: true } } },
      });
      if (!user) throw new Error("No account found with that email.");
      if (user.blocked) throw new Error("This account has been blocked.");

      const valid = await comparePassword(args.password, user.passwordHash);
      if (!valid) throw new Error("Incorrect password.");

      const token = signToken({ userId: user.id, role: user.role });
      return {
        token,
        user: {
          ...user,
          donor: user.donor ? toPublicDonor(user.donor) : null,
        },
      };
    },

    // ── Blood Requests ──────────────────────────────
    createBloodRequest: async (
      _: unknown,
      args: { input: Record<string, any> },
      ctx: GqlContext,
    ) => {
      requireRole(ctx, ["PATIENT", "HOSPITAL", "ADMIN"]);

      const hospital = await ctx.prisma.hospital.findUnique({
        where: { id: args.input.hospitalId },
      });
      if (!hospital) throw new Error("Hospital not found.");

      const request = await ctx.prisma.bloodRequest.create({
        data: {
          patientName: args.input.patientName,
          bloodGroup: args.input.bloodGroup,
          unitsRequired: args.input.unitsRequired,
          urgency: args.input.urgency,
          hospitalId: hospital.id,
          hospitalAddress: hospital.address,
          requiredDate: new Date(args.input.requiredDate),
          doctorContact: args.input.doctorContact,
          lat: hospital.lat,
          lng: hospital.lng,
        },
        include: { hospital: true },
      });

      // Update hospital active request count
      await ctx.prisma.hospital.update({
        where: { id: hospital.id },
        data: { activeRequests: { increment: 1 } },
      });

      const full = { ...request, acceptedDonors: [], matchedCount: 0 };
      pubsub.publish(EVENTS.BLOOD_REQUEST_CREATED, { bloodRequestCreated: full });
      return full;
    },

    updateBloodRequest: async (
      _: unknown,
      args: { id: string; input: Record<string, any> },
      ctx: GqlContext,
    ) => {
      requireRole(ctx, ["PATIENT", "HOSPITAL", "ADMIN"]);
      await ctx.prisma.bloodRequest.update({
        where: { id: args.id },
        data: args.input,
      });
      const full = await loadFullRequest(ctx.prisma, args.id);
      pubsub.publish(EVENTS.BLOOD_REQUEST_UPDATED, { bloodRequestUpdated: full });
      return full;
    },

    cancelBloodRequest: async (
      _: unknown,
      args: { id: string },
      ctx: GqlContext,
    ) => {
      requireRole(ctx, ["PATIENT", "HOSPITAL", "ADMIN"]);
      await ctx.prisma.bloodRequest.update({
        where: { id: args.id },
        data: { status: "CANCELLED" },
      });
      const full = await loadFullRequest(ctx.prisma, args.id);
      pubsub.publish(EVENTS.BLOOD_REQUEST_UPDATED, { bloodRequestUpdated: full });
      return full;
    },

    completeBloodRequest: async (
      _: unknown,
      args: { id: string },
      ctx: GqlContext,
    ) => {
      requireRole(ctx, ["HOSPITAL", "ADMIN"]);
      await ctx.prisma.bloodRequest.update({
        where: { id: args.id },
        data: { status: "FULFILLED" },
      });
      // Decrement hospital active count
      const req = await ctx.prisma.bloodRequest.findUnique({ where: { id: args.id } });
      if (req) {
        await ctx.prisma.hospital.update({
          where: { id: req.hospitalId },
          data: { activeRequests: { decrement: 1 } },
        });
      }
      const full = await loadFullRequest(ctx.prisma, args.id);
      pubsub.publish(EVENTS.BLOOD_REQUEST_UPDATED, { bloodRequestUpdated: full });
      return full;
    },

    // ── Donor actions ───────────────────────────────
    acceptBloodRequest: async (
      _: unknown,
      args: { requestId: string },
      ctx: GqlContext,
    ) => {
      requireRole(ctx, ["DONOR"]);
      const user = await ctx.prisma.user.findUnique({
        where: { id: ctx.userId! },
        include: { donor: true },
      });
      if (!user?.donor) throw new Error("Donor profile not found.");

      // Create the join record
      await ctx.prisma.requestDonor.create({
        data: { requestId: args.requestId, donorId: user.donor.id },
      });

      // Update request status to MATCHED
      await ctx.prisma.bloodRequest.update({
        where: { id: args.requestId },
        data: { status: "MATCHED" },
      });

      const full = await loadFullRequest(ctx.prisma, args.requestId);
      pubsub.publish(EVENTS.BLOOD_REQUEST_UPDATED, { bloodRequestUpdated: full });
      return full;
    },

    rejectBloodRequest: async (
      _: unknown,
      args: { requestId: string },
      ctx: GqlContext,
    ) => {
      requireRole(ctx, ["DONOR"]);
      // Just return the request unchanged — rejection is a no-op on the record
      return loadFullRequest(ctx.prisma, args.requestId);
    },

    toggleAvailability: async (_: unknown, __: unknown, ctx: GqlContext) => {
      requireRole(ctx, ["DONOR"]);
      const user = await ctx.prisma.user.findUnique({
        where: { id: ctx.userId! },
        include: { donor: true },
      });
      if (!user?.donor) throw new Error("Donor profile not found.");

      const updated = await ctx.prisma.donor.update({
        where: { id: user.donor.id },
        data: { available: !user.donor.available },
      });

      const pub = toPublicDonor(updated);
      pubsub.publish(EVENTS.DONOR_AVAILABILITY_CHANGED, { donorAvailabilityChanged: pub });
      return pub;
    },

    updateDonorProfile: async (
      _: unknown,
      args: { input: Record<string, any> },
      ctx: GqlContext,
    ) => {
      requireRole(ctx, ["DONOR"]);
      const user = await ctx.prisma.user.findUnique({
        where: { id: ctx.userId! },
        include: { donor: true },
      });
      if (!user?.donor) throw new Error("Donor profile not found.");

      const updated = await ctx.prisma.donor.update({
        where: { id: user.donor.id },
        data: args.input,
      });
      return toPrivateDonor(updated);
    },

    // ── Donations ───────────────────────────────────
    recordDonation: async (
      _: unknown,
      args: { input: Record<string, any> },
      ctx: GqlContext,
    ) => {
      requireRole(ctx, ["HOSPITAL", "BLOOD_BANK", "ADMIN"]);

      const certId = `CERT-${new Date().getFullYear()}-${Date.now().toString(36).toUpperCase()}`;
      const donation = await ctx.prisma.donation.create({
        data: {
          donorId: args.input.donorId,
          hospitalId: args.input.hospitalId,
          date: new Date(args.input.date),
          units: args.input.units ?? 1,
          certificateId: certId,
        },
        include: { donor: true, hospital: true },
      });

      // Update donor stats
      const newTotal = donation.donor.totalDonations + donation.units;
      await ctx.prisma.donor.update({
        where: { id: args.input.donorId },
        data: {
          totalDonations: newTotal,
          lastDonation: new Date(args.input.date),
          badge: badgeFor(newTotal),
        },
      });

      pubsub.publish(EVENTS.DONATION_COMPLETED, { donationCompleted: donation });
      return donation;
    },

    // ── Notifications ───────────────────────────────
    markNotificationRead: async (
      _: unknown,
      args: { id: string },
      ctx: GqlContext,
    ) => {
      requireAuth(ctx);
      return ctx.prisma.notification.update({
        where: { id: args.id },
        data: { read: true },
      });
    },

    markAllNotificationsRead: async (_: unknown, __: unknown, ctx: GqlContext) => {
      requireAuth(ctx);
      await ctx.prisma.notification.updateMany({
        where: { userId: ctx.userId!, read: false },
        data: { read: true },
      });
      return true;
    },

    // ── Admin ───────────────────────────────────────
    verifyDonor: async (_: unknown, args: { donorId: string }, ctx: GqlContext) => {
      requireRole(ctx, ["ADMIN"]);
      const donor = await ctx.prisma.donor.update({
        where: { id: args.donorId },
        data: { verified: true },
      });
      return toPublicDonor(donor);
    },

    verifyHospital: async (_: unknown, args: { hospitalId: string }, ctx: GqlContext) => {
      requireRole(ctx, ["ADMIN"]);
      return ctx.prisma.hospital.update({
        where: { id: args.hospitalId },
        data: { verified: true },
      });
    },

    blockUser: async (_: unknown, args: { userId: string }, ctx: GqlContext) => {
      requireRole(ctx, ["ADMIN"]);
      return ctx.prisma.user.update({
        where: { id: args.userId },
        data: { blocked: true },
      });
    },
  },

  // ═════════════════════════════════════════════════════
  // SUBSCRIPTIONS
  // ═════════════════════════════════════════════════════
  Subscription: {
    bloodRequestCreated: {
      subscribe: () => pubsub.asyncIterableIterator([EVENTS.BLOOD_REQUEST_CREATED]),
    },
    bloodRequestUpdated: {
      subscribe: () => pubsub.asyncIterableIterator([EVENTS.BLOOD_REQUEST_UPDATED]),
    },
    donorAvailabilityChanged: {
      subscribe: () => pubsub.asyncIterableIterator([EVENTS.DONOR_AVAILABILITY_CHANGED]),
    },
    notificationCreated: {
      subscribe: () => pubsub.asyncIterableIterator([EVENTS.NOTIFICATION_CREATED]),
    },
    donationCompleted: {
      subscribe: () => pubsub.asyncIterableIterator([EVENTS.DONATION_COMPLETED]),
    },
  },

  // ═════════════════════════════════════════════════════
  // FIELD RESOLVERS (nested type resolution)
  // ═════════════════════════════════════════════════════
  Donation: {
    donor: (parent: any) => {
      if (parent.donor) return toPublicDonor(parent.donor);
      return null;
    },
  },

  BloodBank: {
    stock: (parent: any) => {
      return parent.stock ?? [];
    },
  },
};
