import { useState } from "react";
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
import { useApp } from "../../context/AppContext";
import { donors, CURRENT_USER } from "../../data/mock";
import { formatDate, distanceKm } from "../../lib/utils";

const TABS = [
  { key: "overview", label: "Overview", icon: LayoutGrid },
  { key: "requests", label: "Blood requests", icon: ClipboardList },
  { key: "donors", label: "Nearby donors", icon: Users },
  { key: "inventory", label: "Inventory", icon: Boxes },
  { key: "broadcast", label: "Emergency broadcast", icon: Megaphone },
];

export default function HospitalDashboard() {
  const [tab, setTab] = useState("overview");
  const { requests } = useApp();
  const hospital = CURRENT_USER.hospital;
  const hospitalRequests = requests.filter((r) => r.hospital === hospital.name);
  const nearbyDonors = donors
    .map((d) => ({ ...d, km: distanceKm(hospital, d) }))
    .sort((a, b) => a.km - b.km)
    .slice(0, 8);

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
            <StatCard label="Active requests" value={hospitalRequests.filter(r => r.status !== "Fulfilled" && r.status !== "Cancelled").length} icon={ClipboardList} />
            <StatCard label="Donors nearby" value={nearbyDonors.filter(d => d.available).length} icon={Users} />
            <StatCard label="Transfusion beds" value={hospital.bedsForTransfusion} icon={Boxes} />
            <StatCard label="Fulfilled this month" value={hospitalRequests.filter(r => r.status === "Fulfilled").length} icon={LayoutGrid} />
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
                </tr>
              ))}
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
                  <p className="text-xs text-ink-soft">{d.km.toFixed(1)} km · {d.city}</p>
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
          <textarea
            rows={3}
            placeholder="e.g. Urgent need for O- blood, 3 units, trauma case"
            className="w-full rounded-xl border border-line px-3 py-2.5 text-sm"
          />
          <button className="w-full rounded-xl bg-primary py-3 text-sm font-semibold text-white shadow-md shadow-primary/25">
            Broadcast to nearby donors
          </button>
        </div>
      )}
    </DashboardShell>
  );
}
