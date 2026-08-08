import { useState, useEffect, useCallback } from "react";
import {
  LayoutGrid,
  ClipboardList,
  Users,
  Boxes,
  Megaphone,
} from "lucide-react";
import DashboardShell, { StatCard } from "../../components/DashboardShell";
import { BloodGroupChip, Avatar } from "../../components/Chips";
import StatusPill, { toneForRequestStatus, toneForUrgency } from "../../components/StatusPill";
import { formatDate, distanceKm } from "../../lib/utils";
import { gql, ME_HOSPITAL_QUERY, BLOOD_REQUESTS_QUERY, DONORS_QUERY, BROADCAST_EMERGENCY_MUTATION, COMPLETE_REQUEST_MUTATION } from "../../lib/graphql";

const TABS = [
  { key: "overview", label: "Overview", icon: LayoutGrid },
  { key: "requests", label: "Blood requests", icon: ClipboardList },
  { key: "donors", label: "Nearby donors", icon: Users },
  { key: "inventory", label: "Inventory", icon: Boxes },
  { key: "broadcast", label: "Emergency broadcast", icon: Megaphone },
];

const mapBg = (bg: string) => {
  const m: Record<string, string> = {
    A_POS: "A+", A_NEG: "A-", B_POS: "B+", B_NEG: "B-",
    AB_POS: "AB+", AB_NEG: "AB-", O_POS: "O+", O_NEG: "O-"
  };
  return m[bg] || bg;
};

export default function HospitalDashboard() {
  const [tab, setTab] = useState("overview");
  
  const [hospital, setHospital] = useState<any>(null);
  const [hospitalRequests, setHospitalRequests] = useState<any[]>([]);
  const [nearbyDonors, setNearbyDonors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [broadcastMsg, setBroadcastMsg] = useState("");
  const [broadcastBg, setBroadcastBg] = useState("O_NEG");

  const fetchData = useCallback(async () => {
    try {
      // 1. Fetch Hospital Profile
      const meData = await gql<{ me: any }>(ME_HOSPITAL_QUERY);
      const fetchedHospital = meData.me.hospital;
      setHospital(fetchedHospital);

      if (!fetchedHospital) return;

      // 2. Fetch requests for this hospital
      const requestsData = await gql<any>(BLOOD_REQUESTS_QUERY, {
        filter: { hospitalId: fetchedHospital.id },
        pagination: { first: 50 },
      });
      const reqs = requestsData.bloodRequests.edges.map((e: any) => ({
        ...e.node,
        bloodGroup: mapBg(e.node.bloodGroup)
      }));
      setHospitalRequests(reqs);

      // 3. Fetch nearby available donors
      const donorsData = await gql<any>(DONORS_QUERY, {
        filter: { city: fetchedHospital.city, availableOnly: true },
        pagination: { first: 20 },
      });
      const donors = donorsData.donors.edges.map((e: any) => ({
        ...e.node,
        bloodGroup: mapBg(e.node.bloodGroup),
        km: distanceKm(fetchedHospital, e.node)
      })).sort((a: any, b: any) => a.km - b.km);
      setNearbyDonors(donors);

    } catch (err) {
      console.error("Failed to fetch hospital data:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleBroadcast = async () => {
    if (!broadcastMsg) return alert("Please enter a message.");
    try {
      await gql(BROADCAST_EMERGENCY_MUTATION, {
        message: broadcastMsg,
        bloodGroup: broadcastBg
      });
      alert("Emergency broadcast sent to nearby donors!");
      setBroadcastMsg("");
    } catch (err) {
      console.error(err);
      alert("Failed to send broadcast.");
    }
  };

  const handleCompleteRequest = async (id: string) => {
    if (!confirm("Mark this request as fulfilled?")) return;
    try {
      await gql(COMPLETE_REQUEST_MUTATION, { id });
      await fetchData();
    } catch (err) {
      console.error(err);
      alert("Failed to mark request as fulfilled.");
    }
  };

  if (loading) {
    return <DashboardShell title="Loading..." roleLabel="Hospital" name="" tabs={TABS} activeTab={tab} onTabChange={setTab}><div className="p-8 text-center text-ink-soft">Loading data...</div></DashboardShell>;
  }

  if (!hospital) {
    return <DashboardShell title="Error" roleLabel="Hospital" name="" tabs={TABS} activeTab={tab} onTabChange={setTab}><div className="p-8 text-center text-red-500">Could not load hospital profile.</div></DashboardShell>;
  }

  return (
    <DashboardShell
      title={hospital.name}
      subtitle={`${hospital.city} · ${hospital.verified ? "Verified" : "Verification pending"}`}
      name={hospital.name}
      roleLabel="Hospital"
      tabs={TABS}
      activeTab={tab}
      onTabChange={setTab}
    >
      {tab === "overview" && (
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-4">
            <StatCard label="Active requests" value={hospitalRequests.filter(r => r.status !== "FULFILLED" && r.status !== "CANCELLED").length} icon={ClipboardList} />
            <StatCard label="Donors nearby" value={nearbyDonors.length} icon={Users} />
            <StatCard label="Transfusion beds" value={hospital.bedsForTransfusion} icon={Boxes} />
            <StatCard label="Fulfilled this month" value={hospitalRequests.filter(r => r.status === "FULFILLED").length} icon={LayoutGrid} />
          </div>
          <div>
            <p className="mb-3 text-sm font-semibold">Recent requests</p>
            <div className="space-y-3">
              {hospitalRequests.slice(0, 4).map((r) => (
                <div key={r.id} className="flex items-center justify-between rounded-2xl border border-line bg-white p-4">
                  <div className="flex items-center gap-3">
                    <BloodGroupChip group={r.bloodGroup} size="sm" />
                    <div>
                      <p className="text-sm font-semibold">{r.patientName}</p>
                      <p className="text-xs text-ink-soft">{r.unitsRequired} units · {formatDate(r.requiredDate)}</p>
                    </div>
                  </div>
                  <StatusPill tone={toneForRequestStatus(r.status)} dot>{r.status}</StatusPill>
                </div>
              ))}
              {hospitalRequests.length === 0 && (
                <p className="text-sm text-ink-soft text-center py-4">No recent requests.</p>
              )}
            </div>
          </div>
        </div>
      )}

      {tab === "requests" && (
        <div className="overflow-hidden rounded-2xl border border-line">
          <table className="w-full text-sm">
            <thead className="bg-card text-left text-xs uppercase tracking-wide text-ink-soft">
              <tr>
                <th className="px-4 py-3">Patient</th>
                <th className="px-4 py-3">Group</th>
                <th className="px-4 py-3">Units</th>
                <th className="px-4 py-3">Urgency</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Needed by</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {hospitalRequests.map((r) => (
                <tr key={r.id} className="border-t border-line">
                  <td className="px-4 py-3 font-medium">{r.patientName}</td>
                  <td className="px-4 py-3">{r.bloodGroup}</td>
                  <td className="px-4 py-3">{r.unitsRequired}</td>
                  <td className="px-4 py-3"><StatusPill tone={toneForUrgency(r.urgency)}>{r.urgency}</StatusPill></td>
                  <td className="px-4 py-3"><StatusPill tone={toneForRequestStatus(r.status)} dot>{r.status}</StatusPill></td>
                  <td className="px-4 py-3 text-ink-soft">{formatDate(r.requiredDate)}</td>
                  <td className="px-4 py-3 text-right">
                    {(r.status === "OPEN" || r.status === "MATCHED") && (
                      <button 
                        onClick={() => handleCompleteRequest(r.id)}
                        className="text-xs font-semibold text-primary hover:underline"
                      >
                        Mark fulfilled
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              {hospitalRequests.length === 0 && (
                <tr><td colSpan={7} className="px-4 py-8 text-center text-ink-soft">No requests found.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {tab === "donors" && (
        <div className="grid gap-3 sm:grid-cols-2">
          {nearbyDonors.map((d) => (
            <div key={d.id} className="flex items-center justify-between rounded-2xl border border-line bg-white p-4">
              <div className="flex items-center gap-3">
                <Avatar name={d.name} />
                <div>
                  <p className="text-sm font-semibold">{d.name}</p>
                  <p className="text-xs text-ink-soft">{d.km?.toFixed(1)} km · {d.city}</p>
                </div>
              </div>
              <div className="flex flex-col items-end gap-1.5">
                <BloodGroupChip group={d.bloodGroup} size="sm" />
                <StatusPill tone={d.available ? "green" : "neutral"} dot>
                  {d.available ? "Available" : "Unavailable"}
                </StatusPill>
              </div>
            </div>
          ))}
          {nearbyDonors.length === 0 && (
            <p className="col-span-2 text-center text-sm text-ink-soft py-4">No available donors nearby.</p>
          )}
        </div>
      )}

      {tab === "inventory" && (
        <div className="rounded-2xl border border-line bg-white p-6 text-center text-sm text-ink-soft">
          Inventory is managed by your linked blood bank. Switch to the Blood Bank dashboard to view
          and update live stock levels.
        </div>
      )}

      {tab === "broadcast" && (
        <div className="max-w-lg space-y-4 rounded-2xl border border-line bg-white p-6">
          <p className="text-sm font-semibold">Send an emergency broadcast</p>
          <p className="text-xs text-ink-soft">
            This notifies every verified, available donor within 10 km matching the selected blood
            group — use it only for genuine emergencies.
          </p>
          
          <div className="space-y-3">
            <select 
              value={broadcastBg}
              onChange={(e) => setBroadcastBg(e.target.value)}
              className="w-full rounded-xl border border-line px-3 py-2.5 text-sm"
            >
              <option value="A_POS">A+</option>
              <option value="A_NEG">A-</option>
              <option value="B_POS">B+</option>
              <option value="B_NEG">B-</option>
              <option value="AB_POS">AB+</option>
              <option value="AB_NEG">AB-</option>
              <option value="O_POS">O+</option>
              <option value="O_NEG">O-</option>
            </select>
            <textarea
              rows={3}
              value={broadcastMsg}
              onChange={(e) => setBroadcastMsg(e.target.value)}
              placeholder="e.g. Urgent need for O- blood, 3 units, trauma case"
              className="w-full rounded-xl border border-line px-3 py-2.5 text-sm"
            />
          </div>
          
          <button 
            onClick={handleBroadcast}
            className="w-full rounded-xl bg-primary py-3 text-sm font-semibold text-white shadow-md shadow-primary/25"
          >
            Broadcast to nearby donors
          </button>
        </div>
      )}
    </DashboardShell>
  );
}
