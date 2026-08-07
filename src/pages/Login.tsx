import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Droplet, Mail, Lock } from "lucide-react";
import { useApp } from "../context/AppContext";
import type { UserRole } from "../types";

const ROLE_ROUTE: Record<UserRole, string> = {
  donor: "/dashboard/donor",
  patient: "/dashboard/patient",
  hospital: "/dashboard/hospital",
  bloodbank: "/dashboard/bloodbank",
  admin: "/dashboard/admin",
};

export default function Login() {
  const { setRole } = useApp();
  const navigate = useNavigate();
  const [role, setLocalRole] = useState<UserRole>("donor");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setRole(role);
    navigate(ROLE_ROUTE[role]);
  }

  return (
    <div className="mx-auto flex min-h-[calc(100vh-64px)] max-w-md flex-col justify-center px-5 py-16">
      <div className="text-center">
        <span className="mx-auto flex h-11 w-11 items-center justify-center rounded-full bg-primary text-white">
          <Droplet size={20} fill="white" strokeWidth={0} />
        </span>
        <h1 className="mt-4 font-display text-2xl font-semibold">Welcome back</h1>
        <p className="mt-1 text-sm text-ink-soft">Sign in to your Blood Donation Network account</p>
      </div>

      <form onSubmit={handleSubmit} className="mt-8 space-y-4">
        <div>
          <label className="text-xs font-semibold text-ink-soft">I am a</label>
          <select
            value={role}
            onChange={(e) => setLocalRole(e.target.value as UserRole)}
            className="mt-1.5 w-full rounded-xl border border-line px-3 py-2.5 text-sm"
          >
            <option value="donor">Donor</option>
            <option value="patient">Patient</option>
            <option value="hospital">Hospital</option>
            <option value="bloodbank">Blood Bank</option>
            <option value="admin">Admin</option>
          </select>
        </div>

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
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold text-ink-soft">Password</label>
            <a href="#" className="text-xs font-semibold text-primary hover:underline">
              Forgot password?
            </a>
          </div>
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
          className="w-full rounded-xl bg-primary py-3 text-sm font-semibold text-white shadow-md shadow-primary/25 transition-transform hover:scale-[1.01] active:scale-[0.99]"
        >
          Sign in
        </button>

        <button
          type="button"
          onClick={handleSubmit}
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-line py-3 text-sm font-semibold hover:bg-card"
        >
          Continue with Google
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-ink-soft">
        Don't have an account?{" "}
        <Link to="/register" className="font-semibold text-primary hover:underline">
          Register
        </Link>
      </p>
    </div>
  );
}
