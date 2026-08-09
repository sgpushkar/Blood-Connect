import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { SlidersHorizontal, MapPin, Phone, ShieldCheck, Loader2, Filter } from "lucide-react";
import { donors as ALL_DONORS, CITIES } from "../data/mock";
import { BLOOD_GROUPS } from "../data/mock";
import { BloodGroupChip, Avatar, BadgePill } from "../components/Chips";
import StatusPill from "../components/StatusPill";
import { daysUntilEligible, formatDate } from "../lib/utils";
import { gql, DONORS_QUERY } from "../lib/graphql";
import type { Donor } from "../types";
import { useToast } from "../context/ToastContext";
import { useApp } from "../context/AppContext";
import MapboxView from "../components/MapboxView";
import { Link } from "react-router-dom";

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
  const [viewMode, setViewMode] = useState<"list" | "map">("list");

  const [liveDonors, setLiveDonors] = useState<Donor[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [requested, setRequested] = useState<Record<string, boolean>>({});
  const [showSignInModal, setShowSignInModal] = useState(false);
  const { showToast } = useToast();
  const { user } = useApp();

  useEffect(() => {
    setLoading(true);
    const filter: Record<string, any> = { maxAge };
    if (group !== "Any") filter.bloodGroup = group;
    if (city !== "Any") filter.city = city;
    if (onlyAvailable) filter.availableOnly = true;
    if (onlyEligible) filter.eligibleOnly = true;

    gql<{ donors: { edges: { node: Donor }[] } }>(DONORS_QUERY, { filter })
      .then((data) => {
        setLiveDonors(data.donors.edges.map((e) => e.node));
      })
      .catch(() => {
        setLiveDonors(null); // Fallback to mock
      })
      .finally(() => setLoading(false));
  }, [group, city, onlyAvailable, onlyEligible, maxAge]);

  const results = useMemo(() => {
    let list = liveDonors ?? ALL_DONORS.filter((d) => {
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
  }, [liveDonors, group, city, onlyAvailable, onlyEligible, maxAge, sort]);

  return (
    <div className="mx-auto max-w-7xl px-5 py-10 md:px-8">
      <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-primary">Find donors</p>
          <h1 className="mt-2 font-display text-3xl font-semibold">Search verified donors</h1>
          <p className="mt-1 text-sm text-ink-soft">{results.length} donors match your filters</p>
        </div>
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
              <div className="flex gap-2">
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className="flex items-center gap-2 rounded-xl border border-line bg-white px-4 py-2.5 text-sm font-semibold transition-colors hover:bg-card"
                >
                  <Filter size={16} /> Filters
                </button>
                <div className="flex rounded-xl border border-line bg-white p-1">
                  <button 
                    onClick={() => setViewMode("list")}
                    className={`rounded-lg px-4 py-1.5 text-sm font-semibold transition-colors ${viewMode === "list" ? "bg-ink text-white" : "text-ink-soft hover:bg-card hover:text-ink"}`}
                  >
                    List
                  </button>
                  <button 
                    onClick={() => setViewMode("map")}
                    className={`rounded-lg px-4 py-1.5 text-sm font-semibold transition-colors ${viewMode === "map" ? "bg-ink text-white" : "text-ink-soft hover:bg-card hover:text-ink"}`}
                  >
                    Map
                  </button>
                </div>
              </div>
        </div>
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

          {loading ? (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-line p-14 text-sm text-ink-soft">
              <Loader2 className="mb-3 animate-spin text-primary" size={24} />
              Loading donors...
            </div>
          ) : results.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-line p-14 text-center text-sm text-ink-soft">
              No donors match these filters yet. Try widening the search.
            </div>
          ) : viewMode === "map" ? (
            <div className="mt-6">
              <MapboxView donors={results} />
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

                    <button 
                      onClick={() => {
                        if (!user) {
                          setShowSignInModal(true);
                          return;
                        }
                        setRequested(prev => ({ ...prev, [d.id]: true }));
                        showToast(`Contact request sent to ${d.name}. They will be notified.`, "success");
                        window.dispatchEvent(new CustomEvent("contact_requested", { detail: { donorId: d.id, donorName: d.name } }));
                      }}
                      disabled={requested[d.id]}
                      className={`mt-4 flex w-full items-center justify-center gap-2 rounded-xl py-2.5 text-xs font-semibold text-white transition-all ${
                        requested[d.id]
                          ? "bg-status-green cursor-not-allowed"
                          : "bg-primary hover:scale-[1.02] active:scale-[0.98]"
                      }`}
                    >
                      {requested[d.id] ? (
                        <>
                          <ShieldCheck size={13} /> Request sent
                        </>
                      ) : (
                        <>
                          <Phone size={13} /> Request contact
                        </>
                      )}
                    </button>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      </div>
      
      {showSignInModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-sm rounded-3xl bg-white p-8 text-center shadow-2xl"
          >
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary mb-4">
              <ShieldCheck size={32} />
            </div>
            <h2 className="font-display text-2xl font-bold text-ink">Sign in required</h2>
            <p className="mt-2 text-sm text-ink-soft">
              You need to be signed in as a Hospital or Patient to request contact with donors.
            </p>
            <div className="mt-6 flex flex-col gap-3">
              <Link
                to="/login"
                className="w-full rounded-xl bg-primary py-3 text-sm font-bold text-white shadow-md hover:scale-[1.02] transition-transform"
              >
                Go to Sign In
              </Link>
              <button
                onClick={() => setShowSignInModal(false)}
                className="w-full rounded-xl border border-line py-3 text-sm font-semibold text-ink hover:bg-card transition-colors"
              >
                Cancel
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
