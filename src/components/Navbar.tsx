import { useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, Droplet, LogOut } from "lucide-react";
import { useApp } from "../context/AppContext";
import { Avatar } from "./Chips";
import type { UserRole } from "../types";
import { cn } from "../lib/utils";

const ROLE_LABEL: Record<UserRole, string> = {
  donor: "Donor",
  patient: "Patient",
  hospital: "Hospital",
  bloodbank: "Blood Bank",
  admin: "Admin",
};

const ROLE_ROUTE: Record<UserRole, string> = {
  donor: "/dashboard/donor",
  patient: "/dashboard/patient",
  hospital: "/dashboard/hospital",
  bloodbank: "/dashboard/bloodbank",
  admin: "/dashboard/admin",
};

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const { user, logout } = useApp();
  const navigate = useNavigate();

  const navLinks = [
    { to: "/", label: "Home" },
    { to: "/search", label: "Find Donors" },
    { to: "/how-it-works", label: "How It Works" },
  ];

  function handleLogout() {
    logout();
    setOpen(false);
    navigate("/");
  }

  return (
    <header className="sticky top-0 z-50 border-b border-line bg-white/85 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-3.5 md:px-8">
        <Link to="/" className="flex items-center gap-2">
          <span className="relative flex h-8 w-8 items-center justify-center rounded-full bg-primary text-white">
            <Droplet size={16} fill="white" strokeWidth={0} />
          </span>
          <span className="font-display text-lg font-semibold tracking-tight">
            Blood Donation Network
          </span>
        </Link>

        <nav className="hidden items-center gap-8 md:flex">
          {navLinks.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              className={({ isActive }) =>
                cn(
                  "text-sm font-medium text-ink-soft transition-colors hover:text-ink",
                  isActive && "text-primary"
                )
              }
            >
              {l.label}
            </NavLink>
          ))}
        </nav>

        <div className="hidden items-center gap-3 md:flex">
          {user ? (
            <>
              <Link
                to={ROLE_ROUTE[user.role]}
                className="flex items-center gap-2 rounded-full border border-line py-1 pl-1 pr-3.5 text-xs font-semibold text-ink-soft hover:border-primary hover:text-primary transition-colors"
              >
                <Avatar name={user.name} size="sm" />
                {ROLE_LABEL[user.role]} dashboard
              </Link>
              <button
                onClick={handleLogout}
                aria-label="Sign out"
                className="flex items-center gap-1.5 rounded-full px-3 py-2 text-xs font-semibold text-ink-soft hover:text-status-red"
              >
                <LogOut size={14} /> Sign out
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="text-sm font-semibold text-ink-soft hover:text-ink">
                Sign in
              </Link>
              <Link
                to="/register"
                className="rounded-full bg-primary px-4 py-2 text-sm font-semibold text-white shadow-sm shadow-primary/20 transition-transform hover:scale-[1.03] active:scale-[0.98]"
              >
                Register
              </Link>
            </>
          )}
        </div>

        <button
          className="md:hidden"
          onClick={() => setOpen((v) => !v)}
          aria-label={open ? "Close menu" : "Open menu"}
        >
          {open ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden border-t border-line bg-white md:hidden"
          >
            <div className="flex flex-col gap-1 px-5 py-4">
              {navLinks.map((l) => (
                <Link
                  key={l.to}
                  to={l.to}
                  onClick={() => setOpen(false)}
                  className="rounded-lg px-3 py-2.5 text-sm font-medium hover:bg-card"
                >
                  {l.label}
                </Link>
              ))}
              <div className="mt-2 border-t border-line pt-3">
                {user ? (
                  <>
                    <Link
                      to={ROLE_ROUTE[user.role]}
                      onClick={() => setOpen(false)}
                      className="block rounded-lg px-3 py-2.5 text-sm font-semibold text-primary"
                    >
                      {ROLE_LABEL[user.role]} dashboard
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="flex w-full items-center gap-1.5 rounded-lg px-3 py-2.5 text-left text-sm font-medium text-status-red"
                    >
                      <LogOut size={14} /> Sign out
                    </button>
                  </>
                ) : (
                  <>
                    <Link
                      to="/login"
                      onClick={() => setOpen(false)}
                      className="block rounded-lg px-3 py-2.5 text-sm font-medium hover:bg-card"
                    >
                      Sign in
                    </Link>
                    <Link
                      to="/register"
                      onClick={() => setOpen(false)}
                      className="block rounded-lg px-3 py-2.5 text-sm font-semibold text-primary"
                    >
                      Register
                    </Link>
                  </>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
