import { useState, useEffect, useCallback } from "react";
import { LayoutGrid, Droplets, PackagePlus, FileBarChart } from "lucide-react";
import DashboardShell, { StatCard } from "../../components/DashboardShell";
import { BloodGroupChip } from "../../components/Chips";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip } from "recharts";
import { gql, ME_BLOOD_BANK_QUERY } from "../../lib/graphql";

const TABS = [
  { key: "overview", label: "Overview", icon: LayoutGrid },
  { key: "stock", label: "Blood stock", icon: Droplets },
  { key: "intake", label: "Accept donations", icon: PackagePlus },
  { key: "reports", label: "Reports", icon: FileBarChart },
];

function stockTone(units: number) {
  if (units < 10) return "text-status-red bg-status-red-soft";
  if (units < 25) return "text-status-orange bg-status-orange-soft";
  return "text-status-green bg-status-green-soft";
}

const mapBg = (bg: string) => {
  const m: Record<string, string> = {
    A_POS: "A+", A_NEG: "A-", B_POS: "B+", B_NEG: "B-",
    AB_POS: "AB+", AB_NEG: "AB-", O_POS: "O+", O_NEG: "O-"
  };
  return m[bg] || bg;
};

export default function BloodBankDashboard() {
  const [tab, setTab] = useState("overview");
  const [bank, setBank] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      const data = await gql<{ me: any }>(ME_BLOOD_BANK_QUERY);
      if (data.me.bloodBank) {
        setBank(data.me.bloodBank);
      }
    } catch (err) {
      console.error("Failed to load blood bank data", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (loading) {
    return <DashboardShell title="Loading..." roleLabel="Blood Bank" name="" tabs={TABS} activeTab={tab} onTabChange={setTab}><div className="p-8 text-center text-ink-soft">Loading data...</div></DashboardShell>;
  }

  if (!bank) {
    return <DashboardShell title="Error" roleLabel="Blood Bank" name="" tabs={TABS} activeTab={tab} onTabChange={setTab}><div className="p-8 text-center text-status-red">Could not load blood bank profile.</div></DashboardShell>;
  }

  // Format stock for UI
  const stockMap: Record<string, number> = {};
  bank.stock?.forEach((s: any) => {
    stockMap[mapBg(s.bloodGroup)] = s.units;
  });
  
  // Ensure all common groups exist in the map
  const groups = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];
  groups.forEach(g => {
    if (stockMap[g] === undefined) stockMap[g] = 0;
  });

  const stockEntries = Object.entries(stockMap).sort((a, b) => groups.indexOf(a[0]) - groups.indexOf(b[0]));
  const totalUnits = stockEntries.reduce((sum, [, v]) => sum + v, 0);
  const lowStock = stockEntries.filter(([, v]) => v < 10);
  const chartData = stockEntries.map(([group, units]) => ({ group, units }));

  return (
    <DashboardShell
      title={bank.name}
      subtitle={`${bank.city} · ${totalUnits} units in stock`}
      name={bank.name}
      roleLabel="Blood Bank"
      tabs={TABS}
      activeTab={tab}
      onTabChange={setTab}
    >
      {tab === "overview" && (
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-3">
            <StatCard label="Total units" value={totalUnits} icon={Droplets} />
            <StatCard label="Low stock groups" value={lowStock.length} icon={FileBarChart} />
            <StatCard label="Donations logged" value={0} icon={PackagePlus} />
          </div>
          <div className="rounded-2xl border border-line bg-white p-5">
            <p className="mb-4 text-sm font-semibold">Stock by blood group</p>
            <div style={{ width: "100%", height: 260 }}>
              <ResponsiveContainer>
                <BarChart data={chartData}>
                  <XAxis dataKey="group" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 12 }} axisLine={false} tickLine={false} width={30} />
                  <Tooltip cursor={{ fill: "#FAFAFA" }} />
                  <Bar dataKey="units" fill="#D32F2F" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {tab === "stock" && (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {stockEntries.map(([group, units]) => (
            <div key={group} className="rounded-2xl border border-line bg-white p-5 text-center">
              <BloodGroupChip group={group} />
              <p className={`mt-3 inline-block rounded-full px-3 py-1 font-display text-2xl font-semibold ${stockTone(units)}`}>
                {units}
              </p>
              <p className="mt-1 text-xs text-ink-soft">units available</p>
            </div>
          ))}
        </div>
      )}

      {tab === "intake" && (
        <div className="max-w-lg space-y-4 rounded-2xl border border-line bg-white p-6">
          <p className="text-sm font-semibold">Log a new donation</p>
          <div className="grid grid-cols-2 gap-3">
            <select className="rounded-xl border border-line px-3 py-2.5 text-sm">
              {groups.map((g) => (
                <option key={g}>{g}</option>
              ))}
            </select>
            <input type="number" min={1} defaultValue={1} className="rounded-xl border border-line px-3 py-2.5 text-sm" placeholder="Units" />
          </div>
          <input placeholder="Donor name or ID" className="w-full rounded-xl border border-line px-3 py-2.5 text-sm" />
          <button className="w-full rounded-xl bg-primary py-3 text-sm font-semibold text-white shadow-md shadow-primary/25">
            Add to inventory
          </button>
        </div>
      )}

      {tab === "reports" && (
        <div className="overflow-hidden rounded-2xl border border-line">
          <table className="w-full text-sm">
            <thead className="bg-card text-left text-xs uppercase tracking-wide text-ink-soft">
              <tr>
                <th className="px-4 py-3">Certificate</th>
                <th className="px-4 py-3">Hospital</th>
                <th className="px-4 py-3">Units</th>
                <th className="px-4 py-3">Date</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-ink-soft">
                  Donation reporting is currently unavailable.
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      )}
    </DashboardShell>
  );
}
