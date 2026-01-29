import React from "react";
import { Link } from "react-router-dom";

interface Props {
  children: React.ReactNode;
  allowedRoles?: Array<"patient" | "doctor">;
}

const AuthGuard = ({ children, allowedRoles }: Props) => {
  const token = localStorage.getItem("authToken");
  const role = localStorage.getItem("userRole");

  // Not authenticated — render an inline message without redirecting
  if (!token) {
    return (
      <div style={{ padding: 24, maxWidth: 700, margin: "0 auto" }}>
        <div className="card">
          <h3 style={{ margin: 0 }}>Sign in required</h3>
          <p style={{ color: "var(--text-muted)" }}>You must sign in to access this page. Click below to go to the sign-in page when ready.</p>
          <div style={{ marginTop: 12 }}>
            <Link to="/" className="btn btn-primary">Go to Sign In</Link>
          </div>
        </div>
      </div>
    );
  }

  // Role mismatch — show access denied inline (no redirect/toast)
  if (allowedRoles && role && !allowedRoles.includes(role as "patient" | "doctor")) {
    return (
      <div style={{ padding: 24, maxWidth: 700, margin: "0 auto" }}>
        <div className="card">
          <h3 style={{ margin: 0 }}>Access denied</h3>
          <p style={{ color: "var(--text-muted)" }}>You do not have permission to view this page.</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

export default AuthGuard;
