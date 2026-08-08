import { useState, useEffect, useCallback } from "react";
import { LayoutGrid, FilePlus2, ListChecks } from "lucide-react";
import DashboardShell, { StatCard } from "../../components/DashboardShell";
import { BloodGroupChip, Avatar } from "../../components/Chips";
import StatusPill, { toneForRequestStatus, toneForUrgency } from "../../components/StatusPill";
import { formatDate } from "../../lib/utils";
import type { UrgencyLevel, BloodGroup } from "../../types";
import { gql, MY_REQUESTS_QUERY, HOSPITALS_QUERY, CREATE_BLOOD_REQUEST_MUTATION, CANCEL_REQUEST_MUTATION } from "../../lib/graphql";
import { useApp } from "../../context/AppContext";

const TABS = [
  { key: "overview", label: "Overview", icon: LayoutGrid },
  { key: "new", label: "New request", icon: FilePlus2 },
  { key: "mine", label: "My requests", icon: ListChecks },
];

const BLOOD_GROUPS: BloodGroup[] = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

const unmapBg = (bg: string) => {
  const m: Record<string, string> = {
    "A+": "A_POS", "A-": "A_NEG", "B+": "B_POS", "B-": "B_NEG",
    "AB+": "AB_POS", "AB-": "AB_NEG", "O+": "O_POS", "O-": "O_NEG"
  };
  return m[bg] || bg;
};

const mapBg = (bg: string) => {
  const m: Record<string, string> = {
    A_POS: "A+", A_NEG: "A-", B_POS: "B+", B_NEG: "B-",
    AB_POS: "AB+", AB_NEG: "AB-", O_POS: "O+", O_NEG: "O-"
  };
  return m[bg] || bg;
};

export default function PatientDashboard() {
  const [tab, setTab] = useState("overview");
  const { user } = useApp();
  const PATIENT_NAME = user?.name || "Patient";

  const [mine, setMine] = useState<any[]>([]);
  const [hospitals, setHospitals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [form, setForm] = useState<{
    bloodGroup: BloodGroup;
    unitsRequired: number;
    urgency: UrgencyLevel;
    hospitalId: string;
    requiredDate: string;
    doctorContact: string;
  }>({
    bloodGroup: BLOOD_GROUPS[0],
    unitsRequired: 1,
    urgency: "CRITICAL" as UrgencyLevel,
    hospitalId: "",
    requiredDate: new Date().toISOString().slice(0, 10),
    doctorContact: "",
  });

  const fetchData = useCallback(async () => {
    try {
      const hData = await gql<{ hospitals: any[] }>(HOSPITALS_QUERY);
      setHospitals(hData.hospitals);
      if (hData.hospitals.length > 0) {
        setForm(f => ({ ...f, hospitalId: hData.hospitals[0].id }));
      }

      const rData = await gql<{ myRequests: any[] }>(MY_REQUESTS_QUERY);
      setMine(rData.myRequests.map(r => ({
        ...r,
        bloodGroup: mapBg(r.bloodGroup)
      })));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.hospitalId) return;
    
    try {
      await gql(CREATE_BLOOD_REQUEST_MUTATION, {
        input: {
          patientName: PATIENT_NAME,
          bloodGroup: unmapBg(form.bloodGroup),
          unitsRequired: Number(form.unitsRequired),
          urgency: form.urgency.toUpperCase(),
          hospitalId: form.hospitalId,
          requiredDate: new Date(form.requiredDate).toISOString(),
          doctorContact: form.doctorContact || "Not specified"
        }
      });
      await fetchData();
      setTab("mine");
    } catch (err) {
      console.error(err);
      alert("Failed to submit request.");
    }
  }

  async function handleCancel(id: string) {
    try {
      await gql(CANCEL_REQUEST_MUTATION, { id });
      await fetchData();
    } catch (err) {
      console.error(err);
    }
  }

  if (loading) {
    return <DashboardShell title="Loading..." roleLabel="Patient" name="" tabs={TABS} activeTab={tab} onTabChange={setTab}><div className="p-8 text-center text-ink-soft">Loading data...</div></DashboardShell>;
  }

  return (
    <DashboardShell
      title="Patient dashboard"
      subtitle="Request blood and track donor matches in real time"
      name={PATIENT_NAME}
      roleLabel="Patient"
      tabs={TABS}
      activeTab={tab}
      onTabChange={setTab}
    >
      {tab === "overview" && (
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-3">
            <StatCard label="My requests" value={mine.length} icon={ListChecks} />
            <StatCard
              label="Open"
              value={mine.filter((r) => r.status === "OPEN").length}
              icon={FilePlus2}
            />
            <StatCard
              label="Matched donors"
              value={mine.reduce((sum, r) => sum + r.acceptedDonors.length, 0)}
              icon={LayoutGrid}
            />
          </div>
          <button
            onClick={() => setTab("new")}
            className="w-full rounded-2xl border-2 border-dashed border-line bg-card py-8 text-sm font-semibold text-ink-soft transition-colors hover:border-primary hover:text-primary"
          >
            + Submit a new blood request
          </button>
        </div>
      )}

      {tab === "new" && (
        <form onSubmit={submit} className="max-w-xl space-y-4 rounded-2xl border border-line bg-white p-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-ink-soft">Blood group needed</label>
              <select
                value={form.bloodGroup}
                onChange={(e) => setForm((f) => ({ ...f, bloodGroup: e.target.value as BloodGroup }))}
                className="mt-1.5 w-full rounded-xl border border-line px-3 py-2.5 text-sm"
              >
                {BLOOD_GROUPS.map((g) => (
                  <option key={g}>{g}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-ink-soft">Units required</label>
              <input
                type="number"
                min={1}
                max={6}
                value={form.unitsRequired}
                onChange={(e) => setForm((f) => ({ ...f, unitsRequired: Number(e.target.value) }))}
                className="mt-1.5 w-full rounded-xl border border-line px-3 py-2.5 text-sm"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-ink-soft">Urgency</label>
            <div className="mt-1.5 grid grid-cols-3 gap-2">
              {(["CRITICAL", "URGENT", "STANDARD"] as UrgencyLevel[]).map((u) => (
                <button
                  type="button"
                  key={u}
                  onClick={() => setForm((f) => ({ ...f, urgency: u }))}
                  className={`rounded-xl border py-2 text-xs font-semibold ${
                    form.urgency === u ? "border-primary bg-status-red-soft text-primary" : "border-line"
                  }`}
                >
                  {u}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-ink-soft">Hospital</label>
            <select
              value={form.hospitalId}
              onChange={(e) => setForm((f) => ({ ...f, hospitalId: e.target.value }))}
              className="mt-1.5 w-full rounded-xl border border-line px-3 py-2.5 text-sm"
            >
              {hospitals.map((h) => (
                <option key={h.id} value={h.id}>{h.name}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-ink-soft">Required by</label>
              <input
                type="date"
                value={form.requiredDate}
                onChange={(e) => setForm((f) => ({ ...f, requiredDate: e.target.value }))}
                className="mt-1.5 w-full rounded-xl border border-line px-3 py-2.5 text-sm"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-ink-soft">Doctor contact</label>
              <input
                value={form.doctorContact}
                onChange={(e) => setForm((f) => ({ ...f, doctorContact: e.target.value }))}
                placeholder="Dr. Rao · +91..."
                className="mt-1.5 w-full rounded-xl border border-line px-3 py-2.5 text-sm"
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full rounded-xl bg-primary py-3 text-sm font-semibold text-white shadow-md shadow-primary/25"
          >
            Submit request
          </button>
        </form>
      )}

      {tab === "mine" && (
        <div className="space-y-3">
          {mine.length === 0 && (
            <p className="rounded-2xl border border-dashed border-line p-8 text-center text-sm text-ink-soft">
              You haven't submitted any requests yet.
            </p>
          )}
          {mine.map((r) => (
            <div key={r.id} className="rounded-2xl border border-line bg-white p-5">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <BloodGroupChip group={r.bloodGroup} size="sm" />
                  <div>
                    <p className="text-sm font-semibold">{r.hospital.name}</p>
                    <p className="text-xs text-ink-soft">
                      {r.unitsRequired} units · Needed by {formatDate(r.requiredDate)}
                    </p>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1.5">
                  <StatusPill tone={toneForUrgency(r.urgency)}>{r.urgency}</StatusPill>
                  <StatusPill tone={toneForRequestStatus(r.status)} dot>
                    {r.status}
                  </StatusPill>
                </div>
              </div>

              {r.acceptedDonors.length > 0 && (
                <div className="mt-4 border-t border-line pt-4">
                  <p className="text-xs font-semibold text-ink-soft">Matched donors</p>
                  <div className="mt-2 flex flex-wrap gap-3">
                    {r.acceptedDonors.map((d: any) => (
                      <div key={d.id} className="flex items-center gap-2 rounded-full border border-line py-1 pl-1 pr-3">
                        <Avatar name={d.name} size="sm" />
                        <span className="text-xs font-medium">{d.name}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {r.status === "OPEN" && (
                <button
                  onClick={() => handleCancel(r.id)}
                  className="mt-4 text-xs font-semibold text-status-red hover:underline"
                >
                  Cancel request
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </DashboardShell>
  );
}
