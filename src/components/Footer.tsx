import { Link } from "react-router-dom";
import { Droplet, Mail, Phone, MapPin } from "lucide-react";

export default function Footer() {
  return (
    <footer className="border-t border-line bg-card">
      <div className="mx-auto max-w-7xl px-5 py-14 md:px-8">
        <div className="grid gap-10 md:grid-cols-[1.4fr_1fr_1fr_1.2fr]">
          <div>
            <div className="flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-white">
                <Droplet size={16} fill="white" strokeWidth={0} />
              </span>
              <span className="font-display text-lg font-semibold">Blood Donation Network</span>
            </div>
            <p className="mt-3 max-w-xs text-sm text-ink-soft">
              Connecting Donors. Saving Lives. A real-time network matching donors, patients,
              hospitals and blood banks the moment it matters.
            </p>
          </div>

          <div>
            <p className="text-sm font-semibold">Platform</p>
            <ul className="mt-3 space-y-2 text-sm text-ink-soft">
              <li><Link to="/search" className="hover:text-primary">Find donors</Link></li>
              <li><Link to="/how-it-works" className="hover:text-primary">How it works</Link></li>
              <li><Link to="/dashboard/hospital" className="hover:text-primary">For hospitals</Link></li>
              <li><Link to="/dashboard/bloodbank" className="hover:text-primary">For blood banks</Link></li>
            </ul>
          </div>

          <div>
            <p className="text-sm font-semibold">Company</p>
            <ul className="mt-3 space-y-2 text-sm text-ink-soft">
              <li><a href="#faq" className="hover:text-primary">FAQ</a></li>
              <li><a href="#partners" className="hover:text-primary">Partners</a></li>
              <li><Link to="/register" className="hover:text-primary">Become a donor</Link></li>
              <li><Link to="/login" className="hover:text-primary">Sign in</Link></li>
            </ul>
          </div>

          <div>
            <p className="text-sm font-semibold">Emergency contact</p>
            <ul className="mt-3 space-y-2.5 text-sm text-ink-soft">
              <li className="flex items-center gap-2"><Phone size={14} /> 1800-BLOOD-NOW</li>
              <li className="flex items-center gap-2"><Mail size={14} /> help@blooddonationnetwork.org</li>
              <li className="flex items-center gap-2"><MapPin size={14} /> Available in 5 cities</li>
            </ul>
          </div>
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-3 border-t border-line pt-6 text-xs text-ink-soft md:flex-row">
          <p>&copy; {new Date().getFullYear()} Blood Donation Network. All rights reserved.</p>
          <p>Every 2 seconds, someone needs blood.</p>
        </div>
      </div>
    </footer>
  );
}
