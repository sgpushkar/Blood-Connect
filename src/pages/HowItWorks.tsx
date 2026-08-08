import { motion } from "framer-motion";
import { MapPinned, BellRing, Activity, ShieldCheck, Siren, Users } from "lucide-react";
import PulseDivider from "../components/PulseDivider";

const FLOW = [
  { title: "Patient submits a request", body: "Blood group, urgency, hospital and required units are logged in seconds.", icon: Siren },
  { title: "Backend finds matching donors", body: "Compatibility rules and live location narrow the pool to nearby, eligible donors.", icon: MapPinned },
  { title: "Nearby donors are notified", body: "Push, email and an in-app socket alert reach compatible donors simultaneously.", icon: BellRing },
  { title: "A donor accepts or declines", body: "The first compatible donor to accept is matched to the request.", icon: Users },
  { title: "Hospital sees it live", body: "The requesting hospital's dashboard updates instantly over the same socket connection.", icon: Activity },
  { title: "Donation is verified & logged", body: "After donation, eligibility resets and a certificate is issued automatically.", icon: ShieldCheck },
];

export default function HowItWorks() {
  return (
    <div className="mx-auto max-w-4xl px-5 py-16 md:px-8">
      <div className="text-center">
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-primary">The emergency alert system</p>
        <h1 className="mt-3 font-display text-4xl font-semibold">How Blood Connect works</h1>
        <p className="mx-auto mt-4 max-w-xl text-ink-soft">
          From a submitted request to a completed donation, every step happens in real time —
          here's the full path a request takes.
        </p>
      </div>

      <PulseDivider className="my-12" />

      <div className="space-y-6">
        {FLOW.map((step, i) => (
          <motion.div
            key={step.title}
            initial={{ opacity: 0, x: -16 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ delay: i * 0.06 }}
            className="flex gap-5 rounded-2xl border border-line bg-white p-5"
          >
            <div className="flex flex-col items-center">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-status-red-soft text-primary">
                <step.icon size={17} />
              </span>
              {i < FLOW.length - 1 && <span className="mt-2 w-px flex-1 bg-line" />}
            </div>
            <div>
              <p className="font-mono text-[11px] text-ink-soft">STEP 0{i + 1}</p>
              <h3 className="mt-1 font-semibold">{step.title}</h3>
              <p className="mt-1 text-sm text-ink-soft">{step.body}</p>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
