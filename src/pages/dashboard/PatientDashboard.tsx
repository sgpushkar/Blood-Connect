import { useState } from "react";
import { LayoutGrid, FilePlus2, ListChecks } from "lucide-react";
import DashboardShell, { StatCard } from "../../components/DashboardShell";
import { BloodGroupChip, Avatar } from "../../components/Chips";
import StatusPill, { toneForRequestStatus, toneForUrgency } from "../../components/StatusPill";
import { useApp } from "../../context/AppContext";
import { BLOOD_GROUPS, hospitals, donors } from "../../data/mock";
import { formatDate } from "../../lib/utils";
import type { UrgencyLevel, BloodGroup } from "../../types";

const TABS = [
  { key: "overview", label: "Overview", icon: LayoutGrid },
  { key: "new", label: "New request", icon: FilePlus2 },
  { key: "mine", label: "My requests", icon: ListChecks },
];

const PATIENT_NAME = "Neha Verma";

export default function PatientDashboard() {
  const [tab, setTab] = useState("overview");
  const { requests, createRequest, cancelRequest } = useApp();
  const mine = requests.filter((r) => r.patientName === PATIENT_NAME);

  const [form, setForm] = useState<{
    bloodGroup: BloodGroup;
    unitsRequired: number;
    urgency: UrgencyLevel;
    hospital: string;
    requiredDate: string;
    doctorContact: string;
  }>({
    bloodGroup: BLOOD_GROUPS[0],
    unitsRequired: 1,
    urgency: "Critical" as UrgencyLevel,
    hospital: hospitals[0].name,
    requiredDate: new Date().toISOString().slice(0, 10),
    doctorContact: "",
  });

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const hospital = hospitals.find((h) => h.name === form.hospital) ?? hospitals[0];
    createRequest({
      patientName: PATIENT_NAME,
      bloodGroup: form.bloodGroup,
      unitsRequired: Number(form.unitsRequired),
      urgency: form.urgency,
      hospital: hospital.name,
      hospitalAddress: hospital.address,
      requiredDate: new Date(form.requiredDate).toISOString(),
      doctorContact: form.doctorContact || "Not specified",
      lat: hospital.lat,
      lng: hospital.lng,
    });
    setTab("mine");
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
              value={mine.filter((r) => r.status === "Open").length}
              icon={FilePlus2}
            />
            <StatCard
              label="Matched donors"
              value={mine.reduce((sum, r) => sum + r.acceptedDonorIds.length, 0)}
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
              {(["Critical", "Urgent", "Standard"] as UrgencyLevel[]).map((u) => (
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
              value={form.hospital}
              onChange={(e) => setForm((f) => ({ ...f, hospital: e.target.value }))}
              className="mt-1.5 w-full rounded-xl border border-line px-3 py-2.5 text-sm"
            >
              {hospitals.map((h) => (
                <option key={h.id}>{h.name}</option>
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
                    <p className="text-sm font-semibold">{r.hospital}</p>
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

              {r.acceptedDonorIds.length > 0 && (
                <div className="mt-4 border-t border-line pt-4">
                  <p className="text-xs font-semibold text-ink-soft">Matched donors</p>
                  <div className="mt-2 flex flex-wrap gap-3">
                    {r.acceptedDonorIds.map((id) => {
                      const d = donors.find((x) => x.id === id);
                      if (!d) return null;
                      return (
                        <div key={id} className="flex items-center gap-2 rounded-full border border-line py-1 pl-1 pr-3">
                          <Avatar name={d.name} size="sm" />
                          <span className="text-xs font-medium">{d.name}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {r.status === "Open" && (
                <button
                  onClick={() => cancelRequest(r.id)}
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
