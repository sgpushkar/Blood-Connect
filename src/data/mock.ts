import type {
  Donor,
  BloodRequest,
  Hospital,
  BloodBank,
  Donation,
  AppNotification,
  BloodGroup,
  MonthlyStat,
} from "../types";

const BLOOD_GROUPS: BloodGroup[] = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

const CITIES: { name: string; lat: number; lng: number }[] = [
  { name: "Meridian City", lat: 19.076, lng: 72.8777 },
  { name: "Brookhaven", lat: 19.116, lng: 72.905 },
  { name: "Fairview Heights", lat: 19.033, lng: 72.845 },
  { name: "Cedar Falls", lat: 19.198, lng: 72.97 },
  { name: "Ashford", lat: 18.99, lng: 72.83 },
];

const FIRST_NAMES = [
  "Aarav", "Meera", "Kabir", "Isha", "Rohan", "Ananya", "Vikram", "Sana",
  "Dev", "Priya", "Arjun", "Neha", "Farhan", "Divya", "Yusuf", "Kavya",
  "Rahul", "Simran", "Aditya", "Zara", "Karan", "Leela", "Imran", "Tara",
];
const LAST_NAMES = [
  "Mehta", "Kapoor", "Nair", "Iyer", "Sheikh", "Rao", "Bose", "Malhotra",
  "Sharma", "Verma", "Pillai", "Chowdhury", "Reddy", "Khan", "D'Souza", "Joshi",
];

function seededRandom(seed: number) {
  let s = seed;
  return () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
}

const rand = seededRandom(42);
function pick<T>(arr: T[]): T {
  return arr[Math.floor(rand() * arr.length)];
}
function jitter(n: number, amt: number) {
  return n + (rand() - 0.5) * amt;
}
function daysAgo(n: number) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString();
}
function daysFromNow(n: number) {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d.toISOString();
}

function badgeFor(donations: number): Donor["badge"] {
  if (donations >= 20) return "Platinum";
  if (donations >= 10) return "Gold";
  if (donations >= 4) return "Silver";
  if (donations >= 1) return "Bronze";
  return "New";
}

export const donors: Donor[] = Array.from({ length: 48 }).map((_, i) => {
  const city = pick(CITIES);
  const totalDonations = Math.floor(rand() * 24);
  const lastDonationDaysAgo = totalDonations > 0 ? Math.floor(rand() * 200) + 10 : null;
  const first = pick(FIRST_NAMES);
  const last = pick(LAST_NAMES);
  return {
    id: `donor-${i + 1}`,
    name: `${first} ${last}`,
    age: 18 + Math.floor(rand() * 42),
    gender: pick(["Male", "Female", "Other"]) as Donor["gender"],
    bloodGroup: pick(BLOOD_GROUPS),
    weightKg: 50 + Math.floor(rand() * 40),
    phone: `+91 9${Math.floor(100000000 + rand() * 899999999)}`,
    email: `${first.toLowerCase()}.${last.toLowerCase()}${i}@mailbox.com`,
    city: city.name,
    address: `${12 + Math.floor(rand() * 400)} ${pick(["Lake Rd", "MG Road", "Church St", "Park Lane", "Station Rd"])}, ${city.name}`,
    lat: jitter(city.lat, 0.08),
    lng: jitter(city.lng, 0.08),
    lastDonation: lastDonationDaysAgo ? daysAgo(lastDonationDaysAgo) : null,
    available: rand() > 0.28,
    totalDonations,
    badge: badgeFor(totalDonations),
    verified: rand() > 0.15,
    avatarSeed: `${first}${last}${i}`,
  };
});

const HOSPITAL_NAMES = [
  "St. Xavier General Hospital", "Meridian Medical Center", "Brookhaven City Hospital",
  "Fairview Trauma Institute", "Cedar Falls Regional Hospital", "Ashford Memorial Hospital",
];

export const hospitals: Hospital[] = HOSPITAL_NAMES.map((name, i) => {
  const city = pick(CITIES);
  return {
    id: `hosp-${i + 1}`,
    name,
    city: city.name,
    address: `${city.name} Health District, Block ${i + 1}`,
    verified: rand() > 0.2,
    activeRequests: Math.floor(rand() * 6),
    bedsForTransfusion: 10 + Math.floor(rand() * 40),
    lat: jitter(city.lat, 0.05),
    lng: jitter(city.lng, 0.05),
  };
});

export const bloodBanks: BloodBank[] = CITIES.map((city, i) => {
  const stock = {} as Record<BloodGroup, number>;
  BLOOD_GROUPS.forEach((bg) => {
    stock[bg] = Math.floor(rand() * 60);
  });
  return {
    id: `bank-${i + 1}`,
    name: `${city.name} Central Blood Bank`,
    city: city.name,
    address: `${city.name} Civic Center, Sector ${i + 2}`,
    stock,
    lat: jitter(city.lat, 0.03),
    lng: jitter(city.lng, 0.03),
  };
});

const URGENCIES: BloodRequest["urgency"][] = ["Critical", "Urgent", "Standard"];
const STATUSES: BloodRequest["status"][] = ["Open", "Matched", "Fulfilled", "Cancelled"];

export const bloodRequests: BloodRequest[] = Array.from({ length: 16 }).map((_, i) => {
  const hospital = pick(hospitals);
  const status = i < 4 ? "Open" : pick(STATUSES);
  const matchedDonors =
    status === "Fulfilled" || status === "Matched"
      ? [pick(donors).id, pick(donors).id]
      : [];
  return {
    id: `req-${i + 1}`,
    patientName: `${pick(FIRST_NAMES)} ${pick(LAST_NAMES)}`,
    bloodGroup: pick(BLOOD_GROUPS),
    unitsRequired: 1 + Math.floor(rand() * 4),
    urgency: i < 3 ? "Critical" : pick(URGENCIES),
    hospital: hospital.name,
    hospitalAddress: hospital.address,
    requiredDate: daysFromNow(Math.floor(rand() * 5)),
    doctorContact: `Dr. ${pick(LAST_NAMES)} · +91 8${Math.floor(100000000 + rand() * 899999999)}`,
    status,
    createdAt: daysAgo(Math.floor(rand() * 12)),
    acceptedDonorIds: [...new Set(matchedDonors)],
    lat: jitter(hospital.lat, 0.02),
    lng: jitter(hospital.lng, 0.02),
  };
});

export const donations: Donation[] = donors
  .filter((d) => d.totalDonations > 0)
  .slice(0, 30)
  .map((d, i) => ({
    id: `don-${i + 1}`,
    donorId: d.id,
    date: d.lastDonation ?? daysAgo(30),
    hospital: pick(hospitals).name,
    units: 1,
    certificateId: `CERT-${2024}-${1000 + i}`,
  }));

export const notifications: AppNotification[] = [
  {
    id: "n1",
    title: "Critical request nearby",
    body: "A patient at St. Xavier General Hospital needs O- blood urgently, 2.1 km from you.",
    type: "emergency",
    createdAt: daysAgo(0),
    read: false,
  },
  {
    id: "n2",
    title: "You're eligible again",
    body: "It's been 90 days since your last donation — you can donate again.",
    type: "reminder",
    createdAt: daysAgo(1),
    read: false,
  },
  {
    id: "n3",
    title: "Donation confirmed",
    body: "Thank you for donating at Meridian Medical Center. Your certificate is ready.",
    type: "success",
    createdAt: daysAgo(4),
    read: true,
  },
  {
    id: "n4",
    title: "Blood camp this weekend",
    body: "Cedar Falls Regional Hospital is hosting a donation camp on Saturday, 9 AM–4 PM.",
    type: "info",
    createdAt: daysAgo(6),
    read: true,
  },
];

export const monthlyStats: MonthlyStat[] = [
  { month: "Mar", donations: 62, requests: 74 },
  { month: "Apr", donations: 78, requests: 85 },
  { month: "May", donations: 71, requests: 80 },
  { month: "Jun", donations: 94, requests: 101 },
  { month: "Jul", donations: 88, requests: 92 },
  { month: "Aug", donations: 103, requests: 110 },
];

export const bloodGroupDistribution: { group: BloodGroup; count: number }[] = BLOOD_GROUPS.map(
  (g) => ({
    group: g,
    count: donors.filter((d) => d.bloodGroup === g).length,
  })
);

export const CURRENT_USER = {
  donor: donors[3],
  hospital: hospitals[0],
  bloodbank: bloodBanks[0],
};

export { BLOOD_GROUPS, CITIES };
