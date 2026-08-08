import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Users, Activity, Clock, Award, ArrowRight } from "lucide-react";
import EmergencySearchBar from "../components/EmergencySearchBar";
import { donors, bloodRequests } from "../data/mock";

const fadeUp = {
  hidden: { opacity: 0, y: 22 },
  show: { opacity: 1, y: 0 },
};

function AnimatedStat({ value, label, icon: Icon }: { value: string; label: string; icon: any }) {
  return (
    <motion.div
      variants={fadeUp}
      className="flex items-center gap-3 rounded-2xl border border-line bg-white px-5 py-4"
    >
      <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-status-red-soft text-primary">
        <Icon size={18} />
      </span>
      <div>
        <p className="font-display text-2xl font-semibold leading-none">{value}</p>
        <p className="mt-1 text-xs text-ink-soft">{label}</p>
      </div>
    </motion.div>
  );
}

export default function Home() {
  const availableDonors = donors.filter((d) => d.available).length;
  const openCritical = bloodRequests.filter(
    (r) => r.status === "Open" && r.urgency === "Critical"
  ).length;

  return (
    <div>
      {/* HERO — the search bar is the whole point, everything else is secondary */}
      <section className="relative overflow-hidden">
        <div className="pointer-events-none absolute -right-24 -top-24 h-96 w-96 rounded-full bg-status-red-soft blur-3xl" />
        <div className="pointer-events-none absolute -left-32 top-40 h-72 w-72 rounded-full bg-orange-50 blur-3xl" />

        <div className="relative mx-auto max-w-7xl px-5 pb-14 pt-14 md:px-8 md:pb-20 md:pt-20">
          <motion.div
            initial="hidden"
            animate="show"
            variants={{ show: { transition: { staggerChildren: 0.08 } } }}
            className="mx-auto max-w-3xl text-center"
          >
            <motion.span
              variants={fadeUp}
              className="inline-flex items-center gap-2 rounded-full border border-line bg-white px-3.5 py-1.5 text-xs font-semibold text-ink-soft"
            >
              <span className="relative flex h-1.5 w-1.5">
                <span className="absolute h-full w-full animate-pulse-ring rounded-full bg-status-green opacity-75" />
                <span className="relative h-1.5 w-1.5 rounded-full bg-status-green" />
              </span>
              {availableDonors} donors online right now
            </motion.span>

            <motion.h1
              variants={fadeUp}
              className="mt-6 font-display text-4xl font-semibold leading-[1.08] tracking-tight md:text-6xl"
            >
              Connecting donors.
              <br />
              <span className="text-primary">Saving lives.</span>
            </motion.h1>

            <motion.p variants={fadeUp} className="mx-auto mt-5 max-w-xl text-base text-ink-soft md:text-lg">
              Need blood right now? Search by group and location below — no calls, no waiting.
            </motion.p>

            <motion.div variants={fadeUp} className="mx-auto mt-8 max-w-2xl">
              <EmergencySearchBar />
              {openCritical > 0 && (
                <p className="mt-3 text-xs text-status-red">
                  {openCritical} critical request{openCritical > 1 ? "s" : ""} open right now —
                  every match helps.
                </p>
              )}
            </motion.div>

            <motion.div variants={fadeUp} className="mt-4 flex items-center justify-center gap-4 text-sm">
              <Link to="/register" className="font-semibold text-primary hover:underline">
                Become a donor →
              </Link>
              <span className="text-line">·</span>
              <Link to="/dashboard/patient" className="font-semibold text-ink-soft hover:text-ink">
                Request blood for a patient
              </Link>
            </motion.div>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "-80px" }}
            variants={{ show: { transition: { staggerChildren: 0.07 } } }}
            className="mx-auto mt-12 grid max-w-4xl grid-cols-2 gap-3 md:grid-cols-4"
          >
            <AnimatedStat value={`${donors.length * 41}+`} label="Registered donors" icon={Users} />
            <AnimatedStat value={`${availableDonors}`} label="Available right now" icon={Activity} />
            <AnimatedStat value="6 min" label="Median match time" icon={Clock} />
            <AnimatedStat value="1,140+" label="Lives supported" icon={Award} />
          </motion.div>
        </div>
      </section>

      {/* One quiet link out — for people who want more, not the people who need blood now */}
      <section className="border-t border-line py-8">
        <div className="mx-auto flex max-w-7xl items-center justify-center px-5 md:px-8">
          <Link
            to="/how-it-works"
            className="flex items-center gap-1.5 text-sm font-semibold text-ink-soft hover:text-primary"
          >
            Curious how the matching works? <ArrowRight size={14} />
          </Link>
        </div>
      </section>
    </div>
  );
}
