import { useState, useEffect, useCallback } from "react";
import {
  LayoutGrid,
  Users,
  Building2,
  ShieldCheck,
  FileBarChart,
  Terminal,
} from "lucide-react";
import DashboardShell, { StatCard } from "../../components/DashboardShell";
import { Avatar, BloodGroupChip } from "../../components/Chips";
import StatusPill from "../../components/StatusPill";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import { 
  gql, 
  NETWORK_STATS_QUERY, 
  DONORS_QUERY, 
  HOSPITALS_QUERY, 
  BLOOD_BANKS_QUERY,
  VERIFY_DONOR_MUTATION,
  VERIFY_HOSPITAL_MUTATION,
  BLOCK_USER_MUTATION
} from "../../lib/graphql";
import { monthlyStats, bloodGroupDistribution } from "../../data/mock";
import { useToast } from "../../context/ToastContext";

const TABS = [
  { key: "overview", label: "Overview", icon: LayoutGrid },
  { key: "users", label: "Users & donors", icon: Users },
  { key: "orgs", label: "Hospitals & banks", icon: Building2 },
  { key: "verify", label: "Verification", icon: ShieldCheck },
  { key: "analytics", label: "Analytics", icon: FileBarChart },
  { key: "insights", label: "AI Insights", icon: Terminal },
  { key: "logs", label: "System logs", icon: Terminal },
];

const mockPredictiveData = [
  { day: "Today", supply: 120, demand: 90 },
  { day: "+1 Day", supply: 110, demand: 95 },
  { day: "+2 Days", supply: 105, demand: 110 },
  { day: "+3 Days", supply: 90, demand: 130 },
  { day: "+4 Days", supply: 70, demand: 145 },
  { day: "+5 Days", supply: 60, demand: 155 },
  { day: "+6 Days", supply: 55, demand: 160 },
];

const PIE_COLORS = ["#D32F2F", "#EF5350", "#B71C1C", "#E8890C", "#1F9D55", "#5B5B5B", "#EAB308", "#0EA5E9"];

const LOGS = [
  { time: "09:41", event: "Donor verification approved — Kabir Sheikh" },
  { time: "09:12", event: "Emergency broadcast sent by St. Xavier General Hospital" },
  { time: "08:55", event: "New blood bank registered — Ashford Civic Trust" },
  { time: "08:20", event: "Request req-3 marked Fulfilled" },
  { time: "07:58", event: "User flagged for review — duplicate profile" },
];

const mapBg = (bg: string) => {
  const m: Record<string, string> = {
    A_POS: "A+", A_NEG: "A-", B_POS: "B+", B_NEG: "B-",
    AB_POS: "AB+", AB_NEG: "AB-", O_POS: "O+", O_NEG: "O-"
  };
  return m[bg] || bg;
};

export default function AdminDashboard() {
  const [tab, setTab] = useState("overview");
  const { showToast } = useToast();
  
  const [stats, setStats] = useState<any>(null);
  const [donors, setDonors] = useState<any[]>([]);
  const [hospitals, setHospitals] = useState<any[]>([]);
  const [bloodBanks, setBloodBanks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      const [sData, dData, hData, bData] = await Promise.all([
        gql<any>(NETWORK_STATS_QUERY),
        gql<{ donors: any }>(DONORS_QUERY, { 
          filter: { verifiedOnly: false }, 
          pagination: { first: 50 } 
        }),
        gql<any>(HOSPITALS_QUERY),
        gql<any>(BLOOD_BANKS_QUERY)
      ]);
      setStats(sData.networkStats);
      
      const mappedDonors = dData.donors.edges.map((e: any) => ({
        ...e.node,
        bloodGroup: mapBg(e.node.bloodGroup)
      }));
      setDonors(mappedDonors);
      
      setHospitals(hData.hospitals);
      setBloodBanks(bData.bloodBanks);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const verifyDonor = async (id: string) => {
    try {
      await gql(VERIFY_DONOR_MUTATION, { donorId: id });
      await fetchData();
      showToast("Donor verified successfully.", "success");
    } catch (err) {
      console.error(err);
      showToast("Failed to verify donor.", "error");
    }
  };

  const verifyHospital = async (id: string) => {
    try {
      await gql(VERIFY_HOSPITAL_MUTATION, { hospitalId: id });
      await fetchData();
      showToast("Hospital verified successfully.", "success");
    } catch (err) {
      console.error(err);
      showToast("Failed to verify hospital.", "error");
    }
  };



  const blockUser = async (id: string) => {
    if (!confirm("Are you sure you want to block this user?")) return;
    try {
      await gql(BLOCK_USER_MUTATION, { userId: id });
      await fetchData();
      showToast("User blocked successfully.", "success");
    } catch (err: any) {
      console.error(err);
      showToast("Failed to block user: " + err.message, "error");
    }
  };

  if (loading) {
    return <DashboardShell title="Loading..." roleLabel="Admin" name="" tabs={TABS} activeTab={tab} onTabChange={setTab}><div className="p-8 text-center text-ink-soft">Loading data...</div></DashboardShell>;
  }

  const unverifiedDonors = donors.filter(d => !d.verified);
  const unverifiedHospitals = hospitals.filter(h => !h.verified);

  return (
    <DashboardShell
      title="Platform administration"
      subtitle="Network-wide oversight and analytics"
      name="Admin"
      roleLabel="Admin"
      tabs={TABS}
      activeTab={tab}
      onTabChange={setTab}
    >
      {tab === "overview" && (
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-4">
            <StatCard label="Total donors" value={stats?.totalDonors || 0} icon={Users} />
            <StatCard label="Hospitals" value={stats?.registeredHospitals || 0} icon={Building2} />
            <StatCard label="Blood banks" value={stats?.registeredBloodBanks || 0} icon={Building2} />
            <StatCard label="Pending verifications" value={unverifiedDonors.length + unverifiedHospitals.length} icon={ShieldCheck} />
          </div>
          <div className="grid gap-4 lg:grid-cols-2">
            <div className="rounded-2xl border border-line bg-white p-5">
              <p className="mb-4 text-sm font-semibold">Monthly donations vs requests (Mock)</p>
              <div style={{ width: "100%", height: 240 }}>
                <ResponsiveContainer>
                  <LineChart data={monthlyStats}>
                    <XAxis dataKey="month" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 12 }} axisLine={false} tickLine={false} width={30} />
                    <Tooltip />
                    <Line type="monotone" dataKey="donations" stroke="#D32F2F" strokeWidth={2.5} dot={false} />
                    <Line type="monotone" dataKey="requests" stroke="#5B5B5B" strokeWidth={2} dot={false} strokeDasharray="4 3" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
            <div className="rounded-2xl border border-line bg-white p-5">
              <p className="mb-4 text-sm font-semibold">Donor blood group distribution (Mock)</p>
              <div style={{ width: "100%", height: 240 }}>
                <ResponsiveContainer>
                  <PieChart>
                    <Pie data={bloodGroupDistribution} dataKey="count" nameKey="group" innerRadius={50} outerRadius={85}>
                      {bloodGroupDistribution.map((_, i) => (
                        <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      )}

      {tab === "users" && (
        <div className="overflow-hidden rounded-2xl border border-line">
          <table className="w-full text-sm">
            <thead className="bg-card text-left text-xs uppercase tracking-wide text-ink-soft">
              <tr>
                <th className="px-4 py-3">Donor</th>
                <th className="px-4 py-3">Group</th>
                <th className="px-4 py-3">City</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Action</th>
              </tr>
            </thead>
            <tbody>
              {donors.slice(0, 14).map((d) => (
                <tr key={d.id} className="border-t border-line">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      <Avatar name={d.name} size="sm" />
                      <div>
                        <div>{d.name}</div>
                        <div className="text-[10px] text-ink-soft select-all font-mono" title="Donor ID (click to copy)">
                          {d.id}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3"><BloodGroupChip group={d.bloodGroup} size="sm" /></td>
                  <td className="px-4 py-3 text-ink-soft">{d.city}</td>
                  <td className="px-4 py-3">
                    <StatusPill tone={d.verified ? "green" : "orange"}>
                      {d.verified ? "Verified" : "Pending"}
                    </StatusPill>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-3">
                      {!d.verified && (
                        <button 
                          onClick={() => verifyDonor(d.id)}
                          className="text-xs font-semibold text-primary hover:underline"
                        >
                          Verify
                        </button>
                      )}
                      <button 
                        onClick={() => blockUser(d.id)}
                        className="text-xs font-semibold text-status-red hover:underline"
                      >
                        Block
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === "orgs" && (
        <div className="grid gap-4 lg:grid-cols-2">
          <div>
            <p className="mb-3 text-sm font-semibold">Hospitals</p>
            <div className="space-y-2">
              {hospitals.map((h) => (
                <div key={h.id} className="flex items-center justify-between rounded-xl border border-line bg-white p-3.5">
                  <div>
                    <p className="text-sm font-medium">{h.name}</p>
                    <p className="text-xs text-ink-soft">{h.city}</p>
                  </div>
                  <StatusPill tone={h.verified ? "green" : "orange"}>{h.verified ? "Verified" : "Pending"}</StatusPill>
                </div>
              ))}
            </div>
          </div>
          <div>
            <p className="mb-3 text-sm font-semibold">Blood banks</p>
            <div className="space-y-2">
              {bloodBanks.map((b) => (
                <div key={b.id} className="flex items-center justify-between rounded-xl border border-line bg-white p-3.5">
                  <div>
                    <p className="text-sm font-medium">{b.name}</p>
                    <p className="text-xs text-ink-soft">{b.city}</p>
                  </div>
                  <StatusPill tone="green">Active</StatusPill>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {tab === "verify" && (
        <div className="space-y-6">
          <div>
            <p className="mb-3 text-sm font-semibold">Pending Donors</p>
            <div className="space-y-2">
              {unverifiedDonors.map((d) => (
                <div key={d.id} className="flex items-center justify-between rounded-xl border border-line bg-white p-4">
                  <div className="flex items-center gap-3">
                    <Avatar name={d.name} size="sm" />
                    <div>
                      <p className="text-sm font-medium">{d.name}</p>
                      <p className="text-xs text-ink-soft">{d.bloodGroup} · {d.city}</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => verifyDonor(d.id)} className="rounded-full bg-status-green-soft px-3 py-1.5 text-xs font-semibold text-status-green">Approve</button>
                  </div>
                </div>
              ))}
              {unverifiedDonors.length === 0 && (
                <p className="rounded-2xl border border-dashed border-line p-8 text-center text-sm text-ink-soft">
                  No pending donors.
                </p>
              )}
            </div>
          </div>

          <div>
            <p className="mb-3 text-sm font-semibold">Pending Hospitals</p>
            <div className="space-y-2">
              {unverifiedHospitals.map((h) => (
                <div key={h.id} className="flex items-center justify-between rounded-xl border border-line bg-white p-4">
                  <div className="flex items-center gap-3">
                    <div>
                      <p className="text-sm font-medium">{h.name}</p>
                      <p className="text-xs text-ink-soft">{h.city}</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => verifyHospital(h.id)} className="rounded-full bg-status-green-soft px-3 py-1.5 text-xs font-semibold text-status-green">Approve</button>
                  </div>
                </div>
              ))}
              {unverifiedHospitals.length === 0 && (
                <p className="rounded-2xl border border-dashed border-line p-8 text-center text-sm text-ink-soft">
                  No pending hospitals.
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {tab === "analytics" && (
        <div className="grid gap-4 sm:grid-cols-3">
          <StatCard label="Success rate" value="87%" hint="Requests matched within 24h" icon={FileBarChart} />
          <StatCard label="Avg. match time" value="6 min" icon={FileBarChart} />
          <StatCard label="Active this month" value={donors.filter(d => d.available).length} icon={Users} />
        </div>
      )}

      {tab === "insights" && (
        <div className="space-y-6">
          <div className="rounded-3xl border border-[#E1E4E8] bg-gradient-to-b from-white to-[#F8FAFC] p-8 shadow-sm">
            <div className="mb-6 flex items-start justify-between">
              <div>
                <h3 className="flex items-center gap-2 font-display text-2xl font-bold text-ink">
                  <span className="text-primary">✨</span> AI Predictive Analytics
                </h3>
                <p className="mt-1 text-sm text-ink-soft">Forecasting blood supply vs. demand across the network based on historical trends.</p>
              </div>
              <div className="rounded-full bg-status-red-soft px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-status-red">
                Critical Alert
              </div>
            </div>

            <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
              <div className="h-[300px] w-full">
                <ResponsiveContainer>
                  <LineChart data={mockPredictiveData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <XAxis dataKey="day" tick={{ fontSize: 12, fill: "#888" }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 12, fill: "#888" }} axisLine={false} tickLine={false} />
                    <Tooltip
                      contentStyle={{ borderRadius: "12px", border: "none", boxShadow: "0 4px 20px rgba(0,0,0,0.1)" }}
                    />
                    <Legend iconType="circle" wrapperStyle={{ fontSize: 12, paddingTop: "20px" }} />
                    <Line type="monotone" name="Predicted Supply (Units)" dataKey="supply" stroke="#10B981" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                    <Line type="monotone" name="Predicted Demand (Units)" dataKey="demand" stroke="#EF4444" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              <div className="flex flex-col gap-4">
                <div className="rounded-2xl border border-line bg-white p-5 shadow-sm">
                  <p className="text-xs font-bold uppercase tracking-wider text-ink-soft">Insight 1</p>
                  <p className="mt-2 text-sm font-medium leading-relaxed text-ink">
                    <span className="text-status-red font-bold">78% probability</span> of a critical <span className="font-bold">O- shortage</span> in the next 3 days due to upcoming scheduled surgeries and low current inventory.
                  </p>
                </div>
                <div className="rounded-2xl border border-line bg-white p-5 shadow-sm">
                  <p className="text-xs font-bold uppercase tracking-wider text-ink-soft">Action Recommendation</p>
                  <p className="mt-2 text-sm font-medium leading-relaxed text-ink">
                    Recommend initiating a targeted emergency broadcast to O- and O+ donors within a 15km radius of major hospitals immediately.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {tab === "logs" && (
        <div className="rounded-2xl border border-line bg-white p-5 font-mono text-xs">
          {LOGS.map((l, i) => (
            <div key={i} className="flex gap-3 border-b border-line py-2.5 last:border-0">
              <span className="text-ink-soft">{l.time}</span>
              <span>{l.event}</span>
            </div>
          ))}
        </div>
      )}
    </DashboardShell>
  );
}
