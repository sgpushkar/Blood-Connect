/**
 * Authentication and authorization middleware.
 * Uses JWT for stateless auth. Passwords are hashed with bcryptjs.
 */

import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import type { UserRole } from "@prisma/client";

const JWT_SECRET = process.env.JWT_SECRET ?? "dev-secret-change-me";
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN ?? "7d";

export interface JwtPayload {
  userId: string;
  role: UserRole;
}

export interface AuthContext {
  userId: string | null;
  role: UserRole | null;
}

/**
 * Hash a plaintext password.
 */
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

/**
 * Compare a plaintext password against a stored hash.
 */
export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

/**
 * Sign a JWT token for an authenticated user.
 */
export function signToken(payload: JwtPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

/**
 * Verify and decode a JWT token.
 * Returns null if the token is invalid or expired.
 */
export function verifyToken(token: string): JwtPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as JwtPayload;
  } catch {
    return null;
  }
}

/**
 * Extract auth context from an HTTP Authorization header.
 * Expected format: "Bearer <token>"
 */
export function extractAuthFromHeader(authHeader: string | undefined): AuthContext {
  if (!authHeader?.startsWith("Bearer ")) {
    return { userId: null, role: null };
  }
  const token = authHeader.slice(7);
  const payload = verifyToken(token);
  if (!payload) {
    return { userId: null, role: null };
  }
  return { userId: payload.userId, role: payload.role };
}

/**
 * Guard: require the user to be authenticated.
 * Throws a descriptive error if not.
 */
export function requireAuth(ctx: AuthContext): asserts ctx is { userId: string; role: UserRole } {
  if (!ctx.userId || !ctx.role) {
    throw new Error("Authentication required. Please provide a valid Bearer token.");
  }
}

/**
 * Guard: require the user to have one of the specified roles.
 */
export function requireRole(ctx: AuthContext, allowed: UserRole[]): void {
  requireAuth(ctx);
  if (!allowed.includes(ctx.role!)) {
    throw new Error(
      `Access denied. This operation requires one of the following roles: ${allowed.join(", ")}.`
    );
  }
}
