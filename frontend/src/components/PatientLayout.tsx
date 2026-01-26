import { Link, useLocation } from "react-router-dom";

const PatientLayout = ({ children }: { children: React.ReactNode }) => {
  const location = useLocation();

  const isActive = (path: string) =>
    location.pathname === path ? "active" : "";

  return (
    <div className="layout">
      <aside className="sidebar">
        <h2>HealthVault</h2>

        <nav>
          <Link
            className={isActive("/patient/dashboard")}
            to="/patient/dashboard"
          >
            Dashboard
          </Link>

          <Link
            className={isActive("/patient/records")}
            to="/patient/records"
          >
            My Records
          </Link>

          {/* ✅ NEW: Upload Documents */}
          <Link
            className={isActive("/patient/documents")}
            to="/patient/documents"
          >
            Upload Documents
          </Link>

          <Link
            className={isActive("/patient/generate-qr")}
            to="/patient/generate-qr"
          >
            Generate QR
          </Link>

          <Link
            className={isActive("/patient/emergency")}
            to="/patient/emergency"
          >
            Emergency Mode
          </Link>
        </nav>
      </aside>

      <main className="main">{children}</main>
    </div>
  );
};

export default PatientLayout;
