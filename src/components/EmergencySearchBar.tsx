import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search, MapPin, Siren } from "lucide-react";
import { BLOOD_GROUPS } from "../data/mock";

export default function EmergencySearchBar() {
  const [group, setGroup] = useState("O+");
  const [location, setLocation] = useState("");
  const navigate = useNavigate();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const params = new URLSearchParams();
    if (group) params.set("group", group);
    if (location) params.set("city", location);
    navigate(`/search?${params.toString()}`);
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex w-full flex-col gap-2 rounded-2xl border border-line bg-white p-2 shadow-xl shadow-primary/[0.06] sm:flex-row sm:items-center"
    >
      <div className="flex flex-1 items-center gap-2 rounded-xl px-3 py-2.5">
        <Siren size={17} className="shrink-0 text-primary" />
        <select
          value={group}
          onChange={(e) => setGroup(e.target.value)}
          className="w-full bg-transparent text-sm font-semibold outline-none"
          aria-label="Blood group needed"
        >
          {BLOOD_GROUPS.map((g) => (
            <option key={g} value={g}>
              Need {g} blood
            </option>
          ))}
        </select>
      </div>
      <div className="hidden h-8 w-px bg-line sm:block" />
      <div className="flex flex-1 items-center gap-2 rounded-xl px-3 py-2.5">
        <MapPin size={17} className="shrink-0 text-ink-soft" />
        <input
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          placeholder="City or hospital area"
          className="w-full bg-transparent text-sm outline-none placeholder:text-ink-soft/70"
        />
      </div>
      <button
        type="submit"
        className="flex items-center justify-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-white shadow-md shadow-primary/25 transition-transform hover:scale-[1.02] active:scale-[0.98]"
      >
        <Search size={16} />
        Search now
      </button>
    </form>
  );
}
