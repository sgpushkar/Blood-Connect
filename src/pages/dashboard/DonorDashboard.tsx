import { useState, useEffect, useCallback } from "react";
import {
  LayoutGrid,
  User,
  BellRing,
  History,
  Award,
  MapPin,
  ShieldCheck,
} from "lucide-react";
import DashboardShell, { StatCard } from "../../components/DashboardShell";
import { BloodGroupChip, BadgePill } from "../../components/Chips";
import StatusPill, { toneForUrgency } from "../../components/StatusPill";
import { useApp } from "../../context/AppContext";
import { daysUntilEligible, formatDate, distanceKm, BLOOD_COMPATIBILITY } from "../../lib/utils";
import {
  gql,
  MY_DONOR_PROFILE_QUERY,
  MY_DONATIONS_QUERY,
  BLOOD_REQUESTS_QUERY,
  TOGGLE_AVAILABILITY_MUTATION,
  ACCEPT_REQUEST_MUTATION,
  REJECT_REQUEST_MUTATION,
  UPDATE_DONOR_PROFILE_MUTATION
} from "../../lib/graphql";

const TABS = [
  { key: "overview", label: "Overview", icon: LayoutGrid },
  { key: "profile", label: "Profile", icon: User },
  { key: "requests", label: "Nearby requests", icon: BellRing },
  { key: "history", label: "Donation history", icon: History },
  { key: "rewards", label: "Rewards", icon: Award },
];

const mapBg = (bg: string) => {
  const m: Record<string, string> = {
    A_POS: "A+", A_NEG: "A-", B_POS: "B+", B_NEG: "B-",
    AB_POS: "AB+", AB_NEG: "AB-", O_POS: "O+", O_NEG: "O-"
  };
  return m[bg] || bg;
};

export default function DonorDashboard() {
  const [tab, setTab] = useState("overview");
  const { currentDonor: mockDonor } = useApp();
  
  const [donor, setDonor] = useState<any>(null);
  const [nearby, setNearby] = useState<any[]>([]);
  const [myDonations, setMyDonations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      // Fetch donor profile
      const profileData = await gql<{ myDonorProfile: any }>(MY_DONOR_PROFILE_QUERY);
      let fetchedDonor = profileData.myDonorProfile;
      if (fetchedDonor) {
        fetchedDonor = { ...fetchedDonor, bloodGroup: mapBg(fetchedDonor.bloodGroup) };
        setDonor(fetchedDonor);
      } else {
        fetchedDonor = mockDonor; // Fallback if no real profile returned
      }

      // Fetch requests
      const requestsData = await gql<any>(BLOOD_REQUESTS_QUERY, {
        filter: { status: "OPEN" },
        pagination: { first: 50 },
      });
      const compatible = BLOOD_COMPATIBILITY[fetchedDonor.bloodGroup] ?? [];
      const openRequests = requestsData.bloodRequests.edges
        .map((e: any) => e.node)
        .map((r: any) => ({ ...r, bloodGroup: mapBg(r.bloodGroup) }))
        .filter((r: any) => compatible.includes(r.bloodGroup))
        .map((r: any) => ({
          ...r,
          hospital: r.hospital?.name || "Unknown Hospital",
          km: distanceKm(fetchedDonor, r)
        }))
        .sort((a: any, b: any) => a.km - b.km);
      setNearby(openRequests);

      // Fetch donations
      const donationsData = await gql<{ myDonations: any[] }>(MY_DONATIONS_QUERY);
      setMyDonations(donationsData.myDonations.map((d: any) => ({
        ...d,
        hospital: d.hospital?.name || "Unknown Hospital"
      })));

    } catch (err) {
      console.error("Failed to fetch donor data from GraphQL:", err);
    } finally {
      setLoading(false);
    }
  }, [mockDonor]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleToggleAvailability = async () => {
    if (!donor) return;
    try {
      const res = await gql<{ toggleAvailability: { available: boolean } }>(TOGGLE_AVAILABILITY_MUTATION);
      setDonor((prev: any) => ({ ...prev, available: res.toggleAvailability.available }));
    } catch (err) {
      console.error("Failed to toggle availability:", err);
    }
  };

  const handleAcceptRequest = async (requestId: string) => {
    try {
      await gql(ACCEPT_REQUEST_MUTATION, { requestId });
      setNearby(prev => prev.filter(r => r.id !== requestId));
    } catch (err) {
      console.error("Failed to accept request:", err);
    }
  };

  const handleDeclineRequest = async (requestId: string) => {
    try {
      await gql(REJECT_REQUEST_MUTATION, { requestId });
      setNearby(prev => prev.filter(r => r.id !== requestId));
    } catch (err) {
      console.error("Failed to decline request:", err);
    }
  };

  const handleEditProfile = async () => {
    if (!donor) return;
    const newCity = window.prompt("Update your city:", donor.city);
    if (!newCity || newCity === donor.city) return;

    try {
      await gql(UPDATE_DONOR_PROFILE_MUTATION, { input: { city: newCity } });
      await fetchData(); // refresh profile
    } catch (err) {
      console.error("Failed to update profile:", err);
      alert("Failed to update profile.");
    }
  };

  const current = donor || mockDonor;
  
  if (loading) {
    return <DashboardShell title="Loading..." roleLabel="Donor" name="" tabs={TABS} activeTab={tab} onTabChange={setTab}><div className="p-8 text-center text-ink-soft">Loading data...</div></DashboardShell>;
  }

  const eligDays = daysUntilEligible(current);

  return (
    <DashboardShell
      title={`Welcome back, ${current.name.split(" ")[0]}`}
      subtitle={`${current.bloodGroup} donor · ${current.city}`}
      name={current.name}
      roleLabel="Donor"
      tabs={TABS}
      activeTab={tab}
      onTabChange={setTab}
    >
      {tab === "overview" && (
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-3">
            <StatCard label="Total donations" value={current.totalDonations || 0} icon={History} />
            <StatCard
              label="Eligibility"
              value={eligDays > 0 ? `${eligDays}d left` : "Eligible now"}
              hint={eligDays > 0 ? "Until you can donate again" : "You're clear to donate"}
              icon={ShieldCheck}
            />
            <StatCard label="Nearby open requests" value={nearby.length} icon={BellRing} />
          </div>

          <div className="rounded-2xl border border-line bg-white p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold">Availability status</p>
                <p className="text-xs text-ink-soft">
                  Turn this off if you can't donate right now — you won't appear in nearby matches.
                </p>
              </div>
              <button
                onClick={handleToggleAvailability}
                className={`relative h-7 w-12 shrink-0 rounded-full transition-colors ${
                  current.available ? "bg-status-green" : "bg-line"
                }`}
              >
                <span
                  className={`absolute top-0.5 h-6 w-6 rounded-full bg-white shadow transition-transform ${
                    current.available ? "translate-x-5" : "translate-x-0.5"
                  }`}
                />
              </button>
            </div>
          </div>

          <div>
            <p className="mb-3 text-sm font-semibold">Closest matching requests</p>
            <div className="space-y-3">
              {nearby.slice(0, 3).map((r) => (
                <div
                  key={r.id}
                  className="flex flex-col gap-3 rounded-2xl border border-line bg-white p-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="flex items-center gap-3">
                    <BloodGroupChip group={r.bloodGroup} size="sm" />
                    <div>
                      <p className="text-sm font-semibold">{r.hospital}</p>
                      <p className="flex items-center gap-1 text-xs text-ink-soft">
                        <MapPin size={11} /> {r.km?.toFixed(1)} km away
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <StatusPill tone={toneForUrgency(r.urgency)}>{r.urgency}</StatusPill>
                    <button
                      onClick={() => handleAcceptRequest(r.id)}
                      className="rounded-full bg-primary px-4 py-1.5 text-xs font-semibold text-white"
                    >
                      Accept
                    </button>
                  </div>
                </div>
              ))}
              {nearby.length === 0 && (
                <p className="rounded-2xl border border-dashed border-line p-6 text-center text-sm text-ink-soft">
                  No compatible open requests near you right now.
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {tab === "profile" && (
        <div className="max-w-xl space-y-4 rounded-2xl border border-line bg-white p-6">
          {[
            ["Full name", current.name],
            ["Blood group", current.bloodGroup],
            ["Age", `${current.age} yrs`],
            ["Gender", current.gender],
            ["Weight", `${current.weightKg} kg`],
            ["Phone", current.phone],
            ["Email", current.email],
            ["Address", current.address],
            ["Last donation", formatDate(current.lastDonation)],
          ].map(([label, value]) => (
            <div key={label} className="flex items-center justify-between border-b border-line pb-3 text-sm last:border-0 last:pb-0">
              <span className="text-ink-soft">{label}</span>
              <span className="font-medium">{value}</span>
            </div>
          ))}
          <button 
            onClick={handleEditProfile}
            className="mt-2 w-full rounded-xl border border-line py-2.5 text-sm font-semibold hover:bg-card"
          >
            Edit profile (City)
          </button>
        </div>
      )}

      {tab === "requests" && (
        <div className="space-y-3">
          {nearby.map((r) => (
            <div key={r.id} className="rounded-2xl border border-line bg-white p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <BloodGroupChip group={r.bloodGroup} size="sm" />
                  <div>
                    <p className="text-sm font-semibold">{r.hospital}</p>
                    <p className="text-xs text-ink-soft">{r.hospitalAddress}</p>
                  </div>
                </div>
                <StatusPill tone={toneForUrgency(r.urgency)}>{r.urgency}</StatusPill>
              </div>
              <div className="mt-3 flex items-center justify-between text-xs text-ink-soft">
                <span>{r.km?.toFixed(1)} km away · {r.unitsRequired} units needed</span>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleAcceptRequest(r.id)}
                    className="rounded-full bg-primary px-4 py-1.5 font-semibold text-white"
                  >
                    Accept
                  </button>
                  <button 
                    onClick={() => handleDeclineRequest(r.id)}
                    className="rounded-full border border-line px-4 py-1.5 font-semibold"
                  >
                    Decline
                  </button>
                </div>
              </div>
            </div>
          ))}
          {nearby.length === 0 && (
            <p className="rounded-2xl border border-dashed border-line p-8 text-center text-sm text-ink-soft">
              No open requests match your blood group nearby right now.
            </p>
          )}
        </div>
      )}

      {tab === "history" && (
        <div className="overflow-hidden rounded-2xl border border-line">
          <table className="w-full text-sm">
            <thead className="bg-card text-left text-xs uppercase tracking-wide text-ink-soft">
              <tr>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Hospital</th>
                <th className="px-4 py-3">Units</th>
                <th className="px-4 py-3">Certificate</th>
              </tr>
            </thead>
            <tbody>
              {myDonations.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-ink-soft">
                    No donations logged yet.
                  </td>
                </tr>
              )}
              {myDonations.map((d) => (
                <tr key={d.id} className="border-t border-line">
                  <td className="px-4 py-3">{formatDate(d.date)}</td>
                  <td className="px-4 py-3">{d.hospital}</td>
                  <td className="px-4 py-3">{d.units}</td>
                  <td className="px-4 py-3">
                    <span className="font-mono text-xs text-primary">{d.certificateId}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === "rewards" && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {["Bronze", "Silver", "Gold", "Platinum"].map((b) => (
              <div
                key={b}
                className={`rounded-2xl border p-5 text-center ${
                  current.badge === b ? "border-primary bg-status-red-soft" : "border-line"
                }`}
              >
                <BadgePill badge={b} />
                <p className="mt-3 text-xs text-ink-soft">
                  {b === "Bronze" ? "1+" : b === "Silver" ? "4+" : b === "Gold" ? "10+" : "20+"}{" "}
                  donations
                </p>
              </div>
            ))}
          </div>
          <div className="rounded-2xl border border-line bg-white p-6 text-center">
            <p className="font-display text-3xl font-semibold text-primary">
              {(current.totalDonations || 0) * 3}
            </p>
            <p className="mt-1 text-sm text-ink-soft">Estimated lives touched through your donations</p>
          </div>
        </div>
      )}
    </DashboardShell>
  );
}
