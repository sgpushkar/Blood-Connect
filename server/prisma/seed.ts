/**
 * Database seed script.
 *
 * Reproduces the exact same data that the frontend mock.ts generates,
 * so the app looks identical after connecting to the real database.
 *
 * Run: npx tsx prisma/seed.ts
 */

import { PrismaClient, BloodGroup, Gender, UrgencyLevel, RequestStatus } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

// ─── Same generators as the frontend mock.ts ─────────

const BLOOD_GROUPS: BloodGroup[] = [
  "A_POS", "A_NEG", "B_POS", "B_NEG", "AB_POS", "AB_NEG", "O_POS", "O_NEG",
];

const CITIES = [
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

const HOSPITAL_NAMES = [
  "St. Xavier General Hospital", "Meridian Medical Center", "Brookhaven City Hospital",
  "Fairview Trauma Institute", "Cedar Falls Regional Hospital", "Ashford Memorial Hospital",
];

// Seeded random — same PRNG as mock.ts for deterministic output
function seededRandom(seed: number) {
  let s = seed;
  return () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
}

const rand = seededRandom(42);
function pick<T>(arr: T[]): T { return arr[Math.floor(rand() * arr.length)]; }
function jitter(n: number, amt: number) { return n + (rand() - 0.5) * amt; }
function daysAgo(n: number) { const d = new Date(); d.setDate(d.getDate() - n); return d; }
function daysFromNow(n: number) { const d = new Date(); d.setDate(d.getDate() + n); return d; }
function badgeFor(donations: number): string {
  if (donations >= 20) return "Platinum";
  if (donations >= 10) return "Gold";
  if (donations >= 4) return "Silver";
  if (donations >= 1) return "Bronze";
  return "New";
}

async function main() {
  console.log("🌱 Seeding Blood Connect database...\n");

  // Clear existing data
  await prisma.requestDonor.deleteMany();
  await prisma.donation.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.bloodRequest.deleteMany();
  await prisma.bloodStock.deleteMany();
  await prisma.donor.deleteMany();
  await prisma.bloodBank.deleteMany();
  await prisma.hospital.deleteMany();
  await prisma.user.deleteMany();

  // ── 1. Create Users (matching demoUsers in mock.ts) ──────

  const passwordHash = await bcrypt.hash("donor123", 12);
  const patientHash = await bcrypt.hash("patient123", 12);
  const hospitalHash = await bcrypt.hash("hospital123", 12);
  const bankHash = await bcrypt.hash("bank123", 12);
  const adminHash = await bcrypt.hash("admin123", 12);

  const donorUser = await prisma.user.create({
    data: { email: "donor@demo.com", passwordHash, name: "Isha Iyer", role: "DONOR", phone: "+91 9000000001" },
  });
  const patientUser = await prisma.user.create({
    data: { email: "patient@demo.com", passwordHash: patientHash, name: "Neha Verma", role: "PATIENT", phone: "+91 9000000002" },
  });
  const hospitalUser = await prisma.user.create({
    data: { email: "hospital@demo.com", passwordHash: hospitalHash, name: "St. Xavier General Hospital", role: "HOSPITAL" },
  });
  const bankUser = await prisma.user.create({
    data: { email: "bank@demo.com", passwordHash: bankHash, name: "Meridian City Central Blood Bank", role: "BLOOD_BANK" },
  });
  const adminUser = await prisma.user.create({
    data: { email: "admin@demo.com", passwordHash: adminHash, name: "Platform Admin", role: "ADMIN" },
  });

  console.log("  ✓ 5 users created");

  // ── 2. Create Hospitals ──────────────────────────────────

  const hospitals = [];
  for (let i = 0; i < HOSPITAL_NAMES.length; i++) {
    const city = pick(CITIES);
    const h = await prisma.hospital.create({
      data: {
        name: HOSPITAL_NAMES[i],
        city: city.name,
        address: `${city.name} Health District, Block ${i + 1}`,
        verified: rand() > 0.2,
        activeRequests: Math.floor(rand() * 6),
        bedsForTransfusion: 10 + Math.floor(rand() * 40),
        lat: jitter(city.lat, 0.05),
        lng: jitter(city.lng, 0.05),
        ...(i === 0 ? { userId: hospitalUser.id } : {}), // Link first hospital to hospital user
      },
    });
    hospitals.push(h);
  }
  console.log(`  ✓ ${hospitals.length} hospitals created`);

  // ── 3. Create Blood Banks ────────────────────────────────

  const bloodBanks = [];
  for (let i = 0; i < CITIES.length; i++) {
    const city = CITIES[i];
    const bb = await prisma.bloodBank.create({
      data: {
        name: `${city.name} Central Blood Bank`,
        city: city.name,
        address: `${city.name} Civic Center, Sector ${i + 2}`,
        lat: jitter(city.lat, 0.03),
        lng: jitter(city.lng, 0.03),
        ...(i === 0 ? { userId: bankUser.id } : {}), // Link first bank to bank user
        stock: {
          create: BLOOD_GROUPS.map((bg) => ({
            bloodGroup: bg,
            units: Math.floor(rand() * 60),
          })),
        },
      },
    });
    bloodBanks.push(bb);
  }
  console.log(`  ✓ ${bloodBanks.length} blood banks created (with stock)`);

  // ── 4. Create Donors ─────────────────────────────────────

  const donors = [];
  for (let i = 0; i < 48; i++) {
    const city = pick(CITIES);
    const totalDonations = Math.floor(rand() * 24);
    const lastDonationDaysAgo = totalDonations > 0 ? Math.floor(rand() * 200) + 10 : null;
    const first = pick(FIRST_NAMES);
    const last = pick(LAST_NAMES);
    const d = await prisma.donor.create({
      data: {
        name: `${first} ${last}`,
        age: 18 + Math.floor(rand() * 42),
        gender: pick(["MALE", "FEMALE", "OTHER"] as Gender[]),
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
        // Link the 4th donor (index 3) to the donor user — matches mock.ts CURRENT_USER
        ...(i === 3 ? { userId: donorUser.id } : {}),
      },
    });
    donors.push(d);
  }
  console.log(`  ✓ ${donors.length} donors created`);

  // ── 5. Create Blood Requests ─────────────────────────────

  const URGENCIES: UrgencyLevel[] = ["CRITICAL", "URGENT", "STANDARD"];
  const STATUSES: RequestStatus[] = ["OPEN", "MATCHED", "FULFILLED", "CANCELLED"];

  const requests = [];
  for (let i = 0; i < 16; i++) {
    const hospital = pick(hospitals);
    const status: RequestStatus = i < 4 ? "OPEN" : pick(STATUSES);
    const first = pick(FIRST_NAMES);
    const last = pick(LAST_NAMES);

    const req = await prisma.bloodRequest.create({
      data: {
        patientName: `${first} ${last}`,
        bloodGroup: pick(BLOOD_GROUPS),
        unitsRequired: 1 + Math.floor(rand() * 4),
        urgency: i < 3 ? "CRITICAL" : pick(URGENCIES),
        hospitalId: hospital.id,
        hospitalAddress: hospital.address,
        requiredDate: daysFromNow(Math.floor(rand() * 5)),
        doctorContact: `Dr. ${pick(LAST_NAMES)} · +91 8${Math.floor(100000000 + rand() * 899999999)}`,
        status,
        lat: jitter(hospital.lat, 0.02),
        lng: jitter(hospital.lng, 0.02),
        createdAt: daysAgo(Math.floor(rand() * 12)),
      },
    });

    // Add matched donors for MATCHED/FULFILLED requests
    if (status === "FULFILLED" || status === "MATCHED") {
      const d1 = pick(donors);
      const d2 = pick(donors);
      const uniqueDonors = [d1];
      if (d2.id !== d1.id) uniqueDonors.push(d2);
      for (const d of uniqueDonors) {
        await prisma.requestDonor.create({
          data: { requestId: req.id, donorId: d.id },
        }).catch(() => {}); // ignore duplicate key errors
      }
    }
    requests.push(req);
  }
  console.log(`  ✓ ${requests.length} blood requests created`);

  // ── 6. Create Donations ──────────────────────────────────

  const donorsWithDonations = donors.filter((d) => d.totalDonations > 0).slice(0, 30);
  let donationCount = 0;
  for (let i = 0; i < donorsWithDonations.length; i++) {
    const d = donorsWithDonations[i];
    await prisma.donation.create({
      data: {
        donorId: d.id,
        hospitalId: pick(hospitals).id,
        date: d.lastDonation ?? daysAgo(30),
        units: 1,
        certificateId: `CERT-2024-${1000 + i}`,
      },
    });
    donationCount++;
  }
  console.log(`  ✓ ${donationCount} donations created`);

  // ── 7. Create Notifications ──────────────────────────────

  const notifs = [
    { title: "Critical request nearby", body: "A patient at St. Xavier General Hospital needs O- blood urgently, 2.1 km from you.", type: "EMERGENCY" as const, read: false },
    { title: "You're eligible again", body: "It's been 90 days since your last donation — you can donate again.", type: "REMINDER" as const, read: false },
    { title: "Donation confirmed", body: "Thank you for donating at Meridian Medical Center. Your certificate is ready.", type: "SUCCESS" as const, read: true },
    { title: "Blood camp this weekend", body: "Cedar Falls Regional Hospital is hosting a donation camp on Saturday, 9 AM–4 PM.", type: "INFO" as const, read: true },
  ];

  for (const n of notifs) {
    await prisma.notification.create({
      data: { userId: donorUser.id, ...n, createdAt: daysAgo(notifs.indexOf(n) * 2) },
    });
  }
  console.log(`  ✓ ${notifs.length} notifications created`);

  console.log("\n✅ Seed complete!\n");
  console.log("Demo credentials:");
  console.log("  donor@demo.com    / donor123");
  console.log("  patient@demo.com  / patient123");
  console.log("  hospital@demo.com / hospital123");
  console.log("  bank@demo.com     / bank123");
  console.log("  admin@demo.com    / admin123");
}

main()
  .catch((e) => {
    console.error("Seed failed:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
