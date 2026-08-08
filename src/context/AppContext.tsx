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

interface AppContextValue {
  user: DemoUser | null;
  login: (email: string, password: string) => { ok: boolean; error?: string };
  logout: () => void;
  role: UserRole | null;
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
  const [requests, setRequests] = useState<BloodRequest[]>(initialRequests);
  const [donorsList, setDonorsList] = useState<Donor[]>(initialDonors);
  const [notifs, setNotifs] = useState<AppNotification[]>(initialNotifications);

  const value = useMemo<AppContextValue>(
    () => ({
      user,
      login: (email, password) => {
        const match = demoUsers.find(
          (u) => u.email.toLowerCase() === email.trim().toLowerCase()
        );
        if (!match) return { ok: false, error: "No account found with that email." };
        if (match.password !== password) return { ok: false, error: "Incorrect password." };
        setUser(match);
        return { ok: true };
      },
      logout: () => setUser(null),
      role: user?.role ?? null,
      requests,
      donorsList,
      notifications: notifs,
      currentDonor:
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
    [user, requests, donorsList, notifs]
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used inside AppProvider");
  return ctx;
}
