import { Navigate, useLocation } from "react-router-dom";
import { useApp } from "../context/AppContext";
import type { UserRole } from "../types";

export default function ProtectedRoute({
  role,
  children,
}: {
  role: UserRole;
  children: React.ReactNode;
}) {
  const { user } = useApp();
  const location = useLocation();

  if (!user) {
    return <Navigate to="/login" state={{ from: location, requiredRole: role }} replace />;
  }
  if (user.role !== role) {
    return <Navigate to={`/dashboard/${user.role === "bloodbank" ? "bloodbank" : user.role}`} replace />;
  }
  return <>{children}</>;
}
