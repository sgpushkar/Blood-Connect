import { Link } from "react-router-dom";
import { Droplet } from "lucide-react";

export default function NotFound() {
  return (
    <div className="flex min-h-[calc(100vh-64px)] flex-col items-center justify-center px-5 text-center">
      <span className="flex h-14 w-14 items-center justify-center rounded-full bg-status-red-soft text-primary">
        <Droplet size={26} fill="currentColor" strokeWidth={0} />
      </span>
      <h1 className="mt-5 font-display text-3xl font-semibold">Page not found</h1>
      <p className="mt-2 max-w-sm text-sm text-ink-soft">
        This page doesn't exist yet, but there's a network of donors waiting on the home page.
      </p>
      <Link
        to="/"
        className="mt-6 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-white shadow-md shadow-primary/25"
      >
        Back to home
      </Link>
    </div>
  );
}
