import { useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { SlidersHorizontal, MapPin, Phone, ShieldCheck } from "lucide-react";
import { donors as ALL_DONORS, CITIES } from "../data/mock";
import { BLOOD_GROUPS } from "../data/mock";
import { BloodGroupChip, Avatar, BadgePill } from "../components/Chips";
import StatusPill from "../components/StatusPill";
import { daysUntilEligible, formatDate } from "../lib/utils";

type SortKey = "distance" | "recent" | "donations";

export default function Search() {
  const [params] = useSearchParams();
  const [group, setGroup] = useState(params.get("group") ?? "Any");
  const [city, setCity] = useState(params.get("city") ?? "Any");
  const [onlyAvailable, setOnlyAvailable] = useState(true);
  const [onlyEligible, setOnlyEligible] = useState(false);
  const [maxAge, setMaxAge] = useState(60);
  const [sort, setSort] = useState<SortKey>("distance");
  const [showFilters, setShowFilters] = useState(false);

  const results = useMemo(() => {
    let list = ALL_DONORS.filter((d) => {
      if (group !== "Any" && d.bloodGroup !== group) return false;
      if (city !== "Any" && d.city !== city) return false;
      if (onlyAvailable && !d.available) return false;
      if (onlyEligible && daysUntilEligible(d) > 0) return false;
      if (d.age > maxAge) return false;
      return true;
    });

    if (sort === "recent") {
      list = [...list].sort((a, b) => {
        const at = a.lastDonation ? new Date(a.lastDonation).getTime() : 0;
        const bt = b.lastDonation ? new Date(b.lastDonation).getTime() : 0;
        return bt - at;
      });
    } else if (sort === "donations") {
      list = [...list].sort((a, b) => b.totalDonations - a.totalDonations);
    }
    return list;
  }, [group, city, onlyAvailable, onlyEligible, maxAge, sort]);

  return (
    <div className="mx-auto max-w-7xl px-5 py-10 md:px-8">
      <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-primary">Find donors</p>
          <h1 className="mt-2 font-display text-3xl font-semibold">Search verified donors</h1>
          <p className="mt-1 text-sm text-ink-soft">{results.length} donors match your filters</p>
        </div>
        <button
          onClick={() => setShowFilters((v) => !v)}
          className="flex items-center gap-2 self-start rounded-full border border-line px-4 py-2 text-sm font-semibold md:hidden"
        >
          <SlidersHorizontal size={15} /> Filters
        </button>
      </div>

      <div className="mt-8 grid gap-8 md:grid-cols-[260px_1fr]">
        <aside className={`space-y-6 ${showFilters ? "block" : "hidden"} md:block`}>
          <div className="rounded-2xl border border-line bg-card p-5">
            <p className="text-xs font-semibold uppercase tracking-wide text-ink-soft">Blood group</p>
            <div className="mt-3 grid grid-cols-3 gap-2">
              <button
                onClick={() => setGroup("Any")}
                className={`rounded-lg border px-2 py-1.5 text-xs font-semibold ${
                  group === "Any" ? "border-primary bg-status-red-soft text-primary" : "border-line"
                }`}
              >
                Any
              </button>
              {BLOOD_GROUPS.map((g) => (
                <button
                  key={g}
                  onClick={() => setGroup(g)}
                  className={`rounded-lg border px-2 py-1.5 text-xs font-semibold ${
                    group === g ? "border-primary bg-status-red-soft text-primary" : "border-line"
                  }`}
                >
                  {g}
                </button>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-line bg-card p-5">
            <p className="text-xs font-semibold uppercase tracking-wide text-ink-soft">Location</p>
            <select
              value={city}
              onChange={(e) => setCity(e.target.value)}
              className="mt-3 w-full rounded-lg border border-line bg-white px-3 py-2 text-sm"
            >
              <option>Any</option>
              {CITIES.map((c) => (
                <option key={c.name}>{c.name}</option>
              ))}
            </select>
          </div>

          <div className="rounded-2xl border border-line bg-card p-5">
            <p className="text-xs font-semibold uppercase tracking-wide text-ink-soft">Max age</p>
            <input
              type="range"
              min={18}
              max={60}
              value={maxAge}
              onChange={(e) => setMaxAge(Number(e.target.value))}
              className="mt-3 w-full accent-primary"
            />
            <p className="mt-1 text-xs text-ink-soft">Up to {maxAge} years</p>
          </div>

          <div className="space-y-3 rounded-2xl border border-line bg-card p-5">
            <label className="flex items-center justify-between text-sm">
              Available now
              <input
                type="checkbox"
                checked={onlyAvailable}
                onChange={(e) => setOnlyAvailable(e.target.checked)}
                className="h-4 w-4 accent-primary"
              />
            </label>
            <label className="flex items-center justify-between text-sm">
              Eligible to donate
              <input
                type="checkbox"
                checked={onlyEligible}
                onChange={(e) => setOnlyEligible(e.target.checked)}
                className="h-4 w-4 accent-primary"
              />
            </label>
          </div>
        </aside>

        <div>
          <div className="mb-4 flex items-center justify-end gap-2">
            <span className="text-xs text-ink-soft">Sort by</span>
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as SortKey)}
              className="rounded-lg border border-line px-3 py-1.5 text-xs font-semibold"
            >
              <option value="distance">Closest</option>
              <option value="recent">Recently active</option>
              <option value="donations">Most donations</option>
            </select>
          </div>

          {results.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-line p-14 text-center text-sm text-ink-soft">
              No donors match these filters yet. Try widening the search.
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {results.map((d, i) => {
                const eligDays = daysUntilEligible(d);
                return (
                  <motion.div
                    key={d.id}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: Math.min(i * 0.03, 0.3) }}
                    className="rounded-2xl border border-line bg-white p-5 transition-shadow hover:shadow-md"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <Avatar name={d.name} />
                        <div>
                          <p className="flex items-center gap-1.5 text-sm font-semibold">
                            {d.name}
                            {d.verified && <ShieldCheck size={13} className="text-status-green" />}
                          </p>
                          <p className="flex items-center gap-1 text-xs text-ink-soft">
                            <MapPin size={11} /> {d.city}
                          </p>
                        </div>
                      </div>
                      <BloodGroupChip group={d.bloodGroup} size="sm" />
                    </div>

                    <div className="mt-4 flex flex-wrap items-center gap-2">
                      <StatusPill tone={d.available ? "green" : "neutral"} dot>
                        {d.available ? "Available" : "Unavailable"}
                      </StatusPill>
                      <BadgePill badge={d.badge} />
                      {eligDays > 0 && (
                        <StatusPill tone="orange">Eligible in {eligDays}d</StatusPill>
                      )}
                    </div>

                    <dl className="mt-4 grid grid-cols-2 gap-y-1 text-xs text-ink-soft">
                      <dt>Age</dt>
                      <dd className="text-right text-ink">{d.age}</dd>
                      <dt>Donations</dt>
                      <dd className="text-right text-ink">{d.totalDonations}</dd>
                      <dt>Last donation</dt>
                      <dd className="text-right text-ink">{formatDate(d.lastDonation)}</dd>
                    </dl>

                    <button className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-2.5 text-xs font-semibold text-white transition-transform hover:scale-[1.02] active:scale-[0.98]">
                      <Phone size={13} /> Request contact
                    </button>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
