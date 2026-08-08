import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Droplet, Mail, Lock, AlertCircle, Copy, Check } from "lucide-react";
import { useApp } from "../context/AppContext";
import { demoUsers } from "../data/mock";
import type { UserRole } from "../types";

const ROLE_ROUTE: Record<UserRole, string> = {
  donor: "/dashboard/donor",
  patient: "/dashboard/patient",
  hospital: "/dashboard/hospital",
  bloodbank: "/dashboard/bloodbank",
  admin: "/dashboard/admin",
};

const ROLE_LABEL: Record<UserRole, string> = {
  donor: "Donor",
  patient: "Patient",
  hospital: "Hospital",
  bloodbank: "Blood Bank",
  admin: "Admin",
};

export default function Login() {
  const { loginAsync } = useApp();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const requiredRole = (location.state as { requiredRole?: UserRole } | null)?.requiredRole;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const result = await loginAsync(email, password);
    setLoading(false);
    if (!result.ok || !result.role) {
      setError(result.error ?? "Could not sign in.");
      return;
    }
    navigate(ROLE_ROUTE[result.role]);
  }

  function fillDemo(u: (typeof demoUsers)[number]) {
    setEmail(u.email);
    setPassword(u.password);
    setError(null);
  }

  function copyCreds(u: (typeof demoUsers)[number]) {
    navigator.clipboard?.writeText(`${u.email} / ${u.password}`);
    setCopied(u.email);
    setTimeout(() => setCopied(null), 1500);
  }

  return (
    <div className="mx-auto flex min-h-[calc(100vh-64px)] max-w-4xl flex-col items-center justify-center gap-10 px-5 py-14 md:flex-row md:items-start md:gap-14">
      <div className="w-full max-w-sm">
        <div className="text-center md:text-left">
          <span className="mx-auto flex h-11 w-11 items-center justify-center rounded-full bg-primary text-white md:mx-0">
            <Droplet size={20} fill="white" strokeWidth={0} />
          </span>
          <h1 className="mt-4 font-display text-2xl font-semibold">Welcome back</h1>
          <p className="mt-1 text-sm text-ink-soft">
            {requiredRole
              ? `Sign in with a ${ROLE_LABEL[requiredRole]} account to continue.`
              : "Sign in to your Blood Connect account"}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="mt-8 space-y-4">
          {error && (
            <div className="flex items-center gap-2 rounded-xl bg-status-red-soft px-3 py-2.5 text-xs font-medium text-status-red">
              <AlertCircle size={14} className="shrink-0" />
              {error}
            </div>
          )}
          <div>
            <label className="text-xs font-semibold text-ink-soft">Email</label>
            <div className="mt-1.5 flex items-center gap-2 rounded-xl border border-line px-3 py-2.5">
              <Mail size={15} className="text-ink-soft" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full bg-transparent text-sm outline-none"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-ink-soft">Password</label>
            <div className="mt-1.5 flex items-center gap-2 rounded-xl border border-line px-3 py-2.5">
              <Lock size={15} className="text-ink-soft" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-transparent text-sm outline-none"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-primary py-3 text-sm font-semibold text-white shadow-md shadow-primary/25 transition-transform hover:scale-[1.01] active:scale-[0.99] disabled:opacity-70 disabled:hover:scale-100"
          >
            {loading ? "Signing in..." : "Sign in"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-ink-soft md:text-left">
          Don't have an account?{" "}
          <Link to="/register" className="font-semibold text-primary hover:underline">
            Register
          </Link>
        </p>
      </div>

      <div className="w-full max-w-sm rounded-2xl border border-line bg-card p-5">
        <p className="text-xs font-semibold uppercase tracking-wide text-ink-soft">
          Demo credentials
        </p>
        <p className="mt-1 text-xs text-ink-soft">
          No signup needed — tap a role to autofill, or use the credentials directly.
        </p>
        <div className="mt-4 space-y-2">
          {demoUsers.map((u) => (
            <button
              key={u.email}
              type="button"
              onClick={() => fillDemo(u)}
              className="group flex w-full items-center justify-between rounded-xl border border-line bg-white px-3.5 py-2.5 text-left transition-colors hover:border-primary"
            >
              <div>
                <p className="text-xs font-semibold">{ROLE_LABEL[u.role]}</p>
                <p className="font-mono text-[11px] text-ink-soft">
                  {u.email} · {u.password}
                </p>
              </div>
              <span
                onClick={(e) => {
                  e.stopPropagation();
                  copyCreds(u);
                }}
                className="shrink-0 rounded-lg p-1.5 text-ink-soft opacity-0 transition-opacity group-hover:opacity-100 hover:text-primary"
              >
                {copied === u.email ? <Check size={14} /> : <Copy size={14} />}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
