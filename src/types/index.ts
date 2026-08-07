export type BloodGroup = "A+" | "A-" | "B+" | "B-" | "AB+" | "AB-" | "O+" | "O-";

export type UrgencyLevel = "Critical" | "Urgent" | "Standard";

export type RequestStatus = "Open" | "Matched" | "Fulfilled" | "Cancelled";

export type UserRole = "donor" | "patient" | "hospital" | "bloodbank" | "admin";

export interface Donor {
  id: string;
  name: string;
  age: number;
  gender: "Male" | "Female" | "Other";
  bloodGroup: BloodGroup;
  weightKg: number;
  phone: string;
  email: string;
  city: string;
  address: string;
  lat: number;
  lng: number;
  lastDonation: string | null; // ISO date
  available: boolean;
  totalDonations: number;
  badge: "Bronze" | "Silver" | "Gold" | "Platinum" | "New";
  verified: boolean;
  avatarSeed: string;
}

export interface BloodRequest {
  id: string;
  patientName: string;
  bloodGroup: BloodGroup;
  unitsRequired: number;
  urgency: UrgencyLevel;
  hospital: string;
  hospitalAddress: string;
  requiredDate: string; // ISO date
  doctorContact: string;
  status: RequestStatus;
  createdAt: string;
  acceptedDonorIds: string[];
  lat: number;
  lng: number;
}

export interface Hospital {
  id: string;
  name: string;
  city: string;
  address: string;
  verified: boolean;
  activeRequests: number;
  bedsForTransfusion: number;
  lat: number;
  lng: number;
}

export interface BloodBank {
  id: string;
  name: string;
  city: string;
  address: string;
  stock: Record<BloodGroup, number>; // units
  lat: number;
  lng: number;
}

export interface Donation {
  id: string;
  donorId: string;
  date: string;
  hospital: string;
  units: number;
  certificateId: string;
}

export interface AppNotification {
  id: string;
  title: string;
  body: string;
  type: "emergency" | "info" | "success" | "reminder";
  createdAt: string;
  read: boolean;
}

export interface MonthlyStat {
  month: string;
  donations: number;
  requests: number;
}
