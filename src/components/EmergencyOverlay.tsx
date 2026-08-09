import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, X } from "lucide-react";
import { BloodGroupChip } from "./Chips";

interface EmergencyData {
  message: string;
  bloodGroup: string;
  timestamp: number;
}

export default function EmergencyOverlay() {
  const [activeEmergency, setActiveEmergency] = useState<EmergencyData | null>(null);

  useEffect(() => {
    const handleEmergency = (e: Event) => {
      const customEvent = e as CustomEvent<EmergencyData>;
      setActiveEmergency(customEvent.detail);
      
      // Play alert sound if available, otherwise just beep
      try {
        const audio = new Audio("https://actions.google.com/sounds/v1/alarms/alarm_clock.ogg");
        audio.play().catch(() => {});
      } catch (err) {}
    };

    window.addEventListener("emergency_broadcast", handleEmergency);
    return () => window.removeEventListener("emergency_broadcast", handleEmergency);
  }, []);

  return (
    <AnimatePresence>
      {activeEmergency && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-5"
        >
          <motion.div
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.9, y: 20 }}
            className="relative w-full max-w-lg overflow-hidden rounded-3xl bg-white shadow-2xl"
          >
            <div className="absolute inset-0 bg-status-red/10 animate-pulse pointer-events-none" />
            
            <button 
              onClick={() => setActiveEmergency(null)}
              className="absolute right-4 top-4 z-10 rounded-full p-2 text-ink-soft hover:bg-black/5 hover:text-ink transition-colors"
            >
              <X size={20} />
            </button>
            
            <div className="p-8 text-center relative z-0">
              <span className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-status-red-soft text-status-red mb-6 animate-pulse-ring">
                <AlertTriangle size={36} />
              </span>
              
              <h2 className="font-display text-2xl font-bold uppercase tracking-wide text-status-red">
                Emergency Broadcast
              </h2>
              
              <div className="mt-6 flex flex-col items-center gap-4">
                <p className="text-sm font-medium uppercase tracking-widest text-ink-soft">Target Blood Group</p>
                <div className="scale-150 transform origin-top">
                  <BloodGroupChip group={activeEmergency.bloodGroup} />
                </div>
              </div>
              
              <div className="mt-8 rounded-2xl bg-card p-6 border border-status-red/20">
                <p className="text-lg font-medium leading-relaxed">
                  "{activeEmergency.message}"
                </p>
              </div>
              
              <button
                onClick={() => setActiveEmergency(null)}
                className="mt-8 w-full rounded-xl bg-status-red py-4 text-sm font-bold uppercase tracking-wider text-white shadow-lg shadow-status-red/30 transition-transform hover:scale-[1.02] active:scale-[0.98]"
              >
                Acknowledge Alert
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
