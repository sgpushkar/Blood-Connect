import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Link, useNavigate } from "react-router-dom";
import { Droplet, CheckCircle2 } from "lucide-react";
import { useApp } from "../context/AppContext";
import { BLOOD_GROUPS } from "../data/mock";
import type { UserRole } from "../types";

const schema = z.object({
  name: z.string().min(2, "Enter your full name"),
  email: z.string().email("Enter a valid email"),
  phone: z.string().min(8, "Enter a valid phone number"),
  bloodGroup: z.string().optional(),
  city: z.string().min(2, "Enter your city"),
  age: z
    .string()
    .refine((v) => Number(v) >= 18 && Number(v) <= 65, "Age must be between 18 and 65")
    .optional(),
});

type FormValues = z.infer<typeof schema>;

const ROLE_ROUTE: Record<UserRole, string> = {
  donor: "/dashboard/donor",
  patient: "/dashboard/patient",
  hospital: "/dashboard/hospital",
  bloodbank: "/dashboard/bloodbank",
  admin: "/dashboard/admin",
};

export default function Register() {
  const [role, setLocalRole] = useState<UserRole>("donor");
  const [done, setDone] = useState(false);
  const { setRole } = useApp();
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  function onSubmit() {
    setDone(true);
  }

  function goToDashboard() {
    setRole(role);
    navigate(ROLE_ROUTE[role]);
  }

  if (done) {
    return (
      <div className="mx-auto flex min-h-[calc(100vh-64px)] max-w-md flex-col items-center justify-center px-5 text-center">
        <span className="flex h-14 w-14 items-center justify-center rounded-full bg-status-green-soft text-status-green">
          <CheckCircle2 size={26} />
        </span>
        <h1 className="mt-5 font-display text-2xl font-semibold">You're registered</h1>
        <p className="mt-2 text-sm text-ink-soft">
          A verification email is on its way. Once verified, your profile will be visible to
          matching requests nearby.
        </p>
        <button
          onClick={goToDashboard}
          className="mt-7 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-white shadow-md shadow-primary/25"
        >
          Go to my dashboard
        </button>
      </div>
    );
  }

  return (
    <div className="mx-auto flex min-h-[calc(100vh-64px)] max-w-md flex-col justify-center px-5 py-16">
      <div className="text-center">
        <span className="mx-auto flex h-11 w-11 items-center justify-center rounded-full bg-primary text-white">
          <Droplet size={20} fill="white" strokeWidth={0} />
        </span>
        <h1 className="mt-4 font-display text-2xl font-semibold">Create your account</h1>
        <p className="mt-1 text-sm text-ink-soft">Join the network in under three minutes</p>
      </div>

      <div className="mt-6 grid grid-cols-5 gap-1.5 rounded-xl bg-card p-1">
        {(["donor", "patient", "hospital", "bloodbank", "admin"] as UserRole[]).map((r) => (
          <button
            key={r}
            onClick={() => setLocalRole(r)}
            className={`rounded-lg py-2 text-[11px] font-semibold capitalize ${
              role === r ? "bg-white text-primary shadow-sm" : "text-ink-soft"
            }`}
          >
            {r === "bloodbank" ? "Blood Bank" : r}
          </button>
        ))}
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-4">
        <div>
          <label className="text-xs font-semibold text-ink-soft">Full name</label>
          <input
            {...register("name")}
            className="mt-1.5 w-full rounded-xl border border-line px-3 py-2.5 text-sm"
            placeholder="Aarav Mehta"
          />
          {errors.name && <p className="mt-1 text-xs text-status-red">{errors.name.message}</p>}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-semibold text-ink-soft">Email</label>
            <input
              {...register("email")}
              className="mt-1.5 w-full rounded-xl border border-line px-3 py-2.5 text-sm"
              placeholder="you@example.com"
            />
            {errors.email && <p className="mt-1 text-xs text-status-red">{errors.email.message}</p>}
          </div>
          <div>
            <label className="text-xs font-semibold text-ink-soft">Phone</label>
            <input
              {...register("phone")}
              className="mt-1.5 w-full rounded-xl border border-line px-3 py-2.5 text-sm"
              placeholder="+91 90000 00000"
            />
            {errors.phone && <p className="mt-1 text-xs text-status-red">{errors.phone.message}</p>}
          </div>
        </div>

        {role === "donor" && (
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-ink-soft">Blood group</label>
              <select
                {...register("bloodGroup")}
                className="mt-1.5 w-full rounded-xl border border-line px-3 py-2.5 text-sm"
              >
                {BLOOD_GROUPS.map((g) => (
                  <option key={g}>{g}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-ink-soft">Age</label>
              <input
                {...register("age")}
                className="mt-1.5 w-full rounded-xl border border-line px-3 py-2.5 text-sm"
                placeholder="28"
              />
              {errors.age && <p className="mt-1 text-xs text-status-red">{errors.age.message}</p>}
            </div>
          </div>
        )}

        <div>
          <label className="text-xs font-semibold text-ink-soft">City</label>
          <input
            {...register("city")}
            className="mt-1.5 w-full rounded-xl border border-line px-3 py-2.5 text-sm"
            placeholder="Meridian City"
          />
          {errors.city && <p className="mt-1 text-xs text-status-red">{errors.city.message}</p>}
        </div>

        <button
          type="submit"
          className="w-full rounded-xl bg-primary py-3 text-sm font-semibold text-white shadow-md shadow-primary/25 transition-transform hover:scale-[1.01] active:scale-[0.99]"
        >
          Create account
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-ink-soft">
        Already registered?{" "}
        <Link to="/login" className="font-semibold text-primary hover:underline">
          Sign in
        </Link>
      </p>
    </div>
  );
}
