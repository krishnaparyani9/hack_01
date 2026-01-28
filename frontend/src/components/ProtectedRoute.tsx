import React from "react";
import { Navigate, useLocation } from "react-router-dom";

interface Props {
  children: React.ReactNode;
  allowedRoles?: Array<"patient" | "doctor">;
}

const ProtectedRoute = ({ children, allowedRoles }: Props) => {
  const token = localStorage.getItem("authToken");
  const role = localStorage.getItem("userRole");
  const location = useLocation();

  // Not authenticated
  if (!token) {
    window.dispatchEvent(new CustomEvent("toast", { detail: { message: "Please sign in to continue", type: "error" } }));
    return <Navigate to="/" state={{ from: location }} replace />;
  }

  // Role check
  if (allowedRoles && role && !allowedRoles.includes(role as any)) {
    window.dispatchEvent(new CustomEvent("toast", { detail: { message: "Insufficient permissions for this page", type: "error" } }));
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
