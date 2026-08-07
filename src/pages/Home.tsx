import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import {
  MapPinned,
  BellRing,
  ShieldCheck,
  Users,
  Activity,
  Clock,
  Award,
  ChevronDown,
  Quote,
} from "lucide-react";
import { useState } from "react";
import EmergencySearchBar from "../components/EmergencySearchBar";
import PulseDivider from "../components/PulseDivider";
import { Avatar } from "../components/Chips";
import { donors, bloodRequests } from "../data/mock";
import { cn } from "../lib/utils";

const fadeUp = {
  hidden: { opacity: 0, y: 22 },
  show: { opacity: 1, y: 0 },
};

const STEPS = [
  {
    title: "Search or send an alert",
    body: "Look up compatible donors near a hospital, or submit an emergency request in under a minute.",
    icon: MapPinned,
  },
  {
    title: "Nearby donors get notified",
    body: "Verified donors matching the blood group and distance receive a push, email and live socket alert instantly.",
    icon: BellRing,
  },
  {
    title: "A donor accepts",
    body: "The first compatible donor to accept is matched, and the hospital sees the update in real time.",
    icon: Activity,
  },
  {
    title: "Donation is logged",
    body: "After donation, the record, certificate and eligibility countdown are added automatically.",
    icon: ShieldCheck,
  },
];

const BENEFITS = [
  {
    title: "Verified donor network",
    body: "Every donor profile is reviewed before it's marked verified, so hospitals can trust who they're contacting.",
    icon: ShieldCheck,
  },
  {
    title: "Distance-aware matching",
    body: "Requests reach the closest compatible donors first, cutting the time between request and donation.",
    icon: MapPinned,
  },
  {
    title: "Built for emergencies",
    body: "Critical requests are broadcast instantly across push, email and in-app channels — no waiting on a callback.",
    icon: Clock,
  },
  {
    title: "Donors get recognized",
    body: "Every donation counts toward a badge, a certificate and a running lives-saved tally.",
    icon: Award,
  },
];

const TESTIMONIALS = [
  {
    quote:
      "We found a compatible O- donor eleven minutes after posting the request. That used to take us most of an afternoon of phone calls.",
    name: "Dr. Ananya Rao",
    role: "Transfusion Medicine, Meridian Medical Center",
  },
  {
    quote:
      "I get an alert when someone nearby needs my blood group. I've donated four times this year without anyone having to track me down.",
    name: "Kabir Sheikh",
    role: "Donor since 2023 · Gold badge",
  },
  {
    quote:
      "Our blood bank finally has real visibility into who's coming in and what stock we'll need to restock next.",
    name: "Priya Nair",
    role: "Inventory Lead, Brookhaven Central Blood Bank",
  },
];

const PARTNERS = [
  "Meridian Health Alliance",
  "Red Cross Volunteers",
  "Brookhaven City Hospitals",
  "Cedar Falls NGO Network",
  "Ashford Civic Trust",
];

const FAQS = [
  {
    q: "How quickly are nearby donors notified?",
    a: "The moment a request is submitted, matching runs against blood-group compatibility and distance, and notifications go out over push, email and in-app sockets within seconds.",
  },
  {
    q: "How is donor eligibility tracked?",
    a: "Each donor's profile keeps a running eligibility countdown from their last logged donation, so they're only shown as available once it's safe to donate again.",
  },
  {
    q: "Is my information visible to everyone?",
    a: "Your contact details are only shared with a hospital or patient once you accept a specific request. Your profile is otherwise only visible as an anonymized match.",
  },
  {
    q: "Can hospitals and blood banks see live donor availability?",
    a: "Yes — verified hospitals and blood banks get a live map view of nearby available, compatible donors for active requests.",
  },
];

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
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const availableDonors = donors.filter((d) => d.available).length;
  const openCritical = bloodRequests.filter(
    (r) => r.status === "Open" && r.urgency === "Critical"
  ).length;

  return (
    <div>
      {/* HERO */}
      <section className="relative overflow-hidden border-b border-line">
        <div className="pointer-events-none absolute -right-24 -top-24 h-96 w-96 rounded-full bg-status-red-soft blur-3xl" />
        <div className="pointer-events-none absolute -left-32 top-40 h-72 w-72 rounded-full bg-orange-50 blur-3xl" />

        <div className="relative mx-auto max-w-7xl px-5 pb-16 pt-14 md:px-8 md:pb-24 md:pt-20">
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
              A real-time network that finds compatible, nearby blood donors the moment a
              patient needs one — no more phone chains, no more guesswork.
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
            className="mx-auto mt-14 grid max-w-4xl grid-cols-2 gap-3 md:grid-cols-4"
          >
            <AnimatedStat value={`${donors.length * 41}+`} label="Registered donors" icon={Users} />
            <AnimatedStat value={`${availableDonors}`} label="Available right now" icon={Activity} />
            <AnimatedStat value="6 min" label="Median match time" icon={Clock} />
            <AnimatedStat value="1,140+" label="Lives supported" icon={Award} />
          </motion.div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section id="how-it-works" className="mx-auto max-w-7xl px-5 py-20 md:px-8">
        <div className="mx-auto max-w-xl text-center">
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-primary">The flow</p>
          <h2 className="mt-3 font-display text-3xl font-semibold md:text-4xl">How it works</h2>
        </div>
        <PulseDivider className="my-10" />
        <div className="grid gap-6 md:grid-cols-4">
          {STEPS.map((step, i) => (
            <motion.div
              key={step.title}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ delay: i * 0.08 }}
              className="rounded-2xl border border-line bg-card p-6"
            >
              <div className="flex items-center justify-between">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-primary shadow-sm">
                  <step.icon size={18} />
                </span>
                <span className="font-mono text-xs text-ink-soft">0{i + 1}</span>
              </div>
              <h3 className="mt-4 font-semibold">{step.title}</h3>
              <p className="mt-1.5 text-sm text-ink-soft">{step.body}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* BENEFITS */}
      <section className="border-y border-line bg-card">
        <div className="mx-auto max-w-7xl px-5 py-20 md:px-8">
          <div className="grid gap-12 md:grid-cols-2 md:items-center">
            <div>
              <p className="font-mono text-xs uppercase tracking-[0.2em] text-primary">Why it works</p>
              <h2 className="mt-3 font-display text-3xl font-semibold md:text-4xl">
                Built around the moments that matter
              </h2>
              <p className="mt-4 text-ink-soft">
                Every feature exists to shorten the distance between someone needing blood and
                someone able to give it — verified people, real locations, live status.
              </p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              {BENEFITS.map((b) => (
                <div key={b.title} className="rounded-2xl border border-line bg-white p-5">
                  <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-status-red-soft text-primary">
                    <b.icon size={16} />
                  </span>
                  <h3 className="mt-3 text-sm font-semibold">{b.title}</h3>
                  <p className="mt-1 text-xs text-ink-soft">{b.body}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section className="mx-auto max-w-7xl px-5 py-20 md:px-8">
        <div className="mx-auto max-w-xl text-center">
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-primary">Voices</p>
          <h2 className="mt-3 font-display text-3xl font-semibold md:text-4xl">
            Trusted by donors and hospitals
          </h2>
        </div>
        <div className="mt-12 grid gap-5 md:grid-cols-3">
          {TESTIMONIALS.map((t) => (
            <div key={t.name} className="flex flex-col rounded-2xl border border-line bg-white p-6">
              <Quote size={20} className="text-primary/40" />
              <p className="mt-3 flex-1 text-sm text-ink">{t.quote}</p>
              <div className="mt-5 flex items-center gap-3">
                <Avatar name={t.name} size="sm" />
                <div>
                  <p className="text-sm font-semibold">{t.name}</p>
                  <p className="text-xs text-ink-soft">{t.role}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* PARTNERS */}
      <section id="partners" className="border-y border-line bg-card py-14">
        <div className="mx-auto max-w-7xl px-5 md:px-8">
          <p className="text-center font-mono text-xs uppercase tracking-[0.2em] text-ink-soft">
            Working alongside
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-x-10 gap-y-4">
            {PARTNERS.map((p) => (
              <span key={p} className="font-display text-sm font-medium text-ink-soft/80">
                {p}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="mx-auto max-w-3xl px-5 py-20 md:px-8">
        <div className="text-center">
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-primary">Questions</p>
          <h2 className="mt-3 font-display text-3xl font-semibold md:text-4xl">Frequently asked</h2>
        </div>
        <div className="mt-10 divide-y divide-line rounded-2xl border border-line">
          {FAQS.map((f, i) => (
            <div key={f.q}>
              <button
                onClick={() => setOpenFaq(openFaq === i ? null : i)}
                className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left"
              >
                <span className="text-sm font-semibold">{f.q}</span>
                <ChevronDown
                  size={16}
                  className={cn(
                    "shrink-0 text-ink-soft transition-transform",
                    openFaq === i && "rotate-180 text-primary"
                  )}
                />
              </button>
              {openFaq === i && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  className="overflow-hidden px-5 pb-4 text-sm text-ink-soft"
                >
                  {f.a}
                </motion.div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-7xl px-5 pb-24 md:px-8">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary to-primary-dark px-8 py-14 text-center text-white md:py-16">
          <div className="pointer-events-none absolute -right-10 -top-10 h-52 w-52 rounded-full bg-white/10 animate-float" />
          <h2 className="font-display text-3xl font-semibold md:text-4xl">
            Someone nearby needs your blood group today.
          </h2>
          <p className="mx-auto mt-3 max-w-lg text-white/85">
            Registration takes three minutes. Your next donation could be the one that matters.
          </p>
          <Link
            to="/register"
            className="mt-7 inline-flex items-center justify-center rounded-full bg-white px-7 py-3 text-sm font-semibold text-primary shadow-lg transition-transform hover:scale-[1.03] active:scale-[0.98]"
          >
            Register as a donor
          </Link>
        </div>
      </section>
    </div>
  );
}
