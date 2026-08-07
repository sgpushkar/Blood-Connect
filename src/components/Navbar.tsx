import { useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, Droplet, ChevronDown } from "lucide-react";
import { useApp } from "../context/AppContext";
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
  const [roleMenu, setRoleMenu] = useState(false);
  const { role, setRole } = useApp();
  const navigate = useNavigate();

  const navLinks = [
    { to: "/", label: "Home" },
    { to: "/search", label: "Find Donors" },
    { to: "/how-it-works", label: "How It Works" },
  ];

  function switchRole(r: UserRole) {
    setRole(r);
    setRoleMenu(false);
    setOpen(false);
    navigate(ROLE_ROUTE[r]);
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
          <div className="relative">
            <button
              onClick={() => setRoleMenu((v) => !v)}
              className="flex items-center gap-1.5 rounded-full border border-line px-3 py-1.5 text-xs font-semibold text-ink-soft hover:border-primary hover:text-primary transition-colors"
            >
              Viewing as {ROLE_LABEL[role]}
              <ChevronDown size={13} />
            </button>
            <AnimatePresence>
              {roleMenu && (
                <motion.div
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.15 }}
                  className="absolute right-0 mt-2 w-44 overflow-hidden rounded-xl border border-line bg-white shadow-lg"
                >
                  {(Object.keys(ROLE_LABEL) as UserRole[]).map((r) => (
                    <button
                      key={r}
                      onClick={() => switchRole(r)}
                      className={cn(
                        "block w-full px-4 py-2.5 text-left text-sm hover:bg-card",
                        role === r && "text-primary font-semibold"
                      )}
                    >
                      {ROLE_LABEL[r]} dashboard
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          <Link
            to={ROLE_ROUTE[role]}
            className="rounded-full bg-primary px-4 py-2 text-sm font-semibold text-white shadow-sm shadow-primary/20 transition-transform hover:scale-[1.03] active:scale-[0.98]"
          >
            Dashboard
          </Link>
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
                <p className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-wide text-ink-soft">
                  Switch dashboard
                </p>
                {(Object.keys(ROLE_LABEL) as UserRole[]).map((r) => (
                  <button
                    key={r}
                    onClick={() => switchRole(r)}
                    className={cn(
                      "block w-full rounded-lg px-3 py-2.5 text-left text-sm hover:bg-card",
                      role === r && "text-primary font-semibold"
                    )}
                  >
                    {ROLE_LABEL[r]}
                  </button>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
