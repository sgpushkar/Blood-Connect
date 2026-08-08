import { createContext, useContext, useMemo, useState, type ReactNode } from "react";
import type { BloodRequest, Donor, UserRole, AppNotification } from "../types";
import {
  bloodRequests as initialRequests,
  donors as initialDonors,
  notifications as initialNotifications,
  demoUsers,
  CURRENT_USER,
  type DemoUser,
} from "../data/mock";
import { gql, LOGIN_MUTATION, setAuthToken } from "../lib/graphql";

interface AppContextValue {
  user: DemoUser | null;
  login: (email: string, password: string) => { ok: boolean; error?: string; role?: UserRole };
  loginAsync: (email: string, password: string) => Promise<{ ok: boolean; error?: string; role?: UserRole }>;
  logout: () => void;
  role: UserRole | null;
  isLive: boolean; // true if connected to GraphQL backend
  requests: BloodRequest[];
  donorsList: Donor[];
  notifications: AppNotification[];
  currentDonor: Donor;
  acceptRequest: (requestId: string, donorId: string) => void;
  rejectRequest: (requestId: string) => void;
  createRequest: (r: Omit<BloodRequest, "id" | "createdAt" | "status" | "acceptedDonorIds">) => void;
  cancelRequest: (requestId: string) => void;
  toggleAvailability: (donorId: string) => void;
  markNotificationRead: (id: string) => void;
}

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<DemoUser | null>(null);
  const [liveDonor, setLiveDonor] = useState<Donor | null>(null);
  const [isLive, setIsLive] = useState(false);
  const [requests, setRequests] = useState<BloodRequest[]>(initialRequests);
  const [donorsList, setDonorsList] = useState<Donor[]>(initialDonors);
  const [notifs, setNotifs] = useState<AppNotification[]>(initialNotifications);

  const value = useMemo<AppContextValue>(
    () => ({
      user,
      isLive,

      // Synchronous login (mock fallback) — used by existing Login.tsx
      login: (email, password) => {
        const match = demoUsers.find(
          (u) => u.email.toLowerCase() === email.trim().toLowerCase()
        );
        if (!match) return { ok: false, error: "No account found with that email." };
        if (match.password !== password) return { ok: false, error: "Incorrect password." };
        setUser(match);
        return { ok: true, role: match.role };
      },

      // Async login — tries GraphQL first, falls back to mock
      loginAsync: async (email, password) => {
        try {
          const data = await gql<{
            login: { 
              token: string; 
              user: { 
                id: string; 
                name: string; 
                role: string;
                donor?: any;
              } 
            };
          }>(LOGIN_MUTATION, { email, password });

          setAuthToken(data.login.token);
          setIsLive(true);

          if (data.login.user.donor) {
            const d = data.login.user.donor;
            const userRef = data.login.user;
            // Map GraphQL enum to frontend string format
            const bgMap: Record<string, string> = {
              A_POS: "A+", A_NEG: "A-", B_POS: "B+", B_NEG: "B-",
              AB_POS: "AB+", AB_NEG: "AB-", O_POS: "O+", O_NEG: "O-"
            };
            setLiveDonor({
              ...d,
              bloodGroup: bgMap[d.bloodGroup] ?? d.bloodGroup,
              email: userRef.email,
              phone: userRef.phone ?? "",
              weightKg: 65, // default since PublicDonor doesn't expose it
              address: d.city,
              lat: 19.076,
              lng: 72.8777,
            });
          }

          // Map the GraphQL role to the existing frontend role format
          const roleMap: Record<string, UserRole> = {
            DONOR: "donor",
            PATIENT: "patient",
            HOSPITAL: "hospital",
            BLOOD_BANK: "bloodbank",
            ADMIN: "admin",
          };

          const role = roleMap[data.login.user.role] ?? "donor";
          const demoMatch = demoUsers.find(
            (u) => u.email.toLowerCase() === email.trim().toLowerCase()
          );

          setUser({
            email: email.toLowerCase(),
            password, // only kept in memory for mock compat
            role,
            name: data.login.user.name,
            refId: demoMatch?.refId,
          });

          return { ok: true, role };
        } catch (err: any) {
          // GraphQL server unreachable or query failed — fall back to mock login
          const match = demoUsers.find(
            (u) => u.email.toLowerCase() === email.trim().toLowerCase()
          );
          if (!match) return { ok: false, error: err.message || "No account found with that email." };
          if (match.password !== password) return { ok: false, error: "Incorrect password." };
          setUser(match);
          return { ok: true, role: match.role };
        }
      },

      logout: () => {
        setUser(null);
        setLiveDonor(null);
        setAuthToken(null);
        setIsLive(false);
      },

      role: user?.role ?? null,
      requests,
      donorsList,
      notifications: notifs,
      currentDonor:
        liveDonor ??
        donorsList.find((d) => d.id === user?.refId) ??
        donorsList.find((d) => d.id === CURRENT_USER.donor.id) ??
        donorsList[0],
      acceptRequest: (requestId, donorId) => {
        setRequests((prev) =>
          prev.map((r) =>
            r.id === requestId
              ? {
                  ...r,
                  status: "Matched",
                  acceptedDonorIds: [...new Set([...r.acceptedDonorIds, donorId])],
                }
              : r
          )
        );
      },
      rejectRequest: (requestId) => {
        setRequests((prev) => prev.map((r) => (r.id === requestId ? { ...r } : r)));
      },
      createRequest: (r) => {
        setRequests((prev) => [
          {
            ...r,
            id: `req-${prev.length + 1}-${Date.now()}`,
            createdAt: new Date().toISOString(),
            status: "Open",
            acceptedDonorIds: [],
          },
          ...prev,
        ]);
      },
      cancelRequest: (requestId) => {
        setRequests((prev) =>
          prev.map((r) => (r.id === requestId ? { ...r, status: "Cancelled" } : r))
        );
      },
      toggleAvailability: (donorId) => {
        setDonorsList((prev) =>
          prev.map((d) => (d.id === donorId ? { ...d, available: !d.available } : d))
        );
      },
      markNotificationRead: (id) => {
        setNotifs((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
      },
    }),
    [user, isLive, requests, donorsList, notifs]
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used inside AppProvider");
  return ctx;
}

