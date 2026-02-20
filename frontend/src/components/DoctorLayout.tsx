import { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import DoctorDetailsModal from "./DoctorDetailsModal";
import ThemeToggle from "./ThemeToggle";

const DoctorLayout = ({ children }: { children: React.ReactNode }) => {
  const location = useLocation();
  const navigate = useNavigate();


  const handleSignOut = () => {
    try {
      localStorage.removeItem("authToken");
      localStorage.removeItem("userId");
      localStorage.removeItem("userName");
      localStorage.removeItem("userEmail");
      localStorage.removeItem("userRole");
      window.dispatchEvent(new CustomEvent("toast", { detail: { message: "Signed out", type: "success" } }));
      navigate("/");
    } catch (e) {
      navigate("/");
    }
  }; 

  // toast notifications
  const [toast, setToast] = useState<{ message: string; type?: string } | null>(null);
  useEffect(() => {
    const onToast = (e: any) => {
      const payload = (e && e.detail) || { message: String(e) };
      setToast(payload);
      window.setTimeout(() => setToast(null), 3400);
    };
    window.addEventListener("toast", onToast as any);
    return () => window.removeEventListener("toast", onToast as any);
  }, []);

  const isActive = (path: string) => (location.pathname === path ? "active" : "");

  const [showDetails, setShowDetails] = useState(false);
  const [doctorName, setDoctorName] = useState(() => localStorage.getItem("userName") || localStorage.getItem("doctorName") || "Doctor");

  // collapsible sidebar
  const [collapsed, setCollapsed] = useState(() => localStorage.getItem("sb-collapsed") === "1");
  const toggleCollapse = () => {
    setCollapsed((prev) => {
      localStorage.setItem("sb-collapsed", prev ? "0" : "1");
      return !prev;
    });
  };

  useEffect(() => {
    const onUpdate = () => {
      setDoctorName(localStorage.getItem("doctorName") || "Doctor");
    };

    const onShowDetails = () => setShowDetails(true);

    window.addEventListener("doctor-updated", onUpdate);
    window.addEventListener("doctor-show-details", onShowDetails);

    return () => {
      window.removeEventListener("doctor-updated", onUpdate);
      window.removeEventListener("doctor-show-details", onShowDetails);
    };
  }, []);

  return (
    <div className={`layout ${collapsed ? "sb-is-collapsed" : ""}`}>
      <aside className={`sidebar sb-premium ${collapsed ? "sb-collapsed" : ""}`}>
        {/* Brand + collapse toggle */}
        <div className="sb-brand">
          <span className="sb-brand__icon">🏥</span>
          <span className="sb-brand__text sb-hide-collapsed">HealthKey</span>
          <button className="sb-toggle" onClick={toggleCollapse} aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"} type="button">
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <path d={collapsed ? "M6 4l5 5-5 5" : "M12 4L7 9l5 5"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        </div>

        {/* Profile card */}
        <button className="sb-profile" onClick={() => setShowDetails(true)} type="button" data-tooltip="View Details">
          <div className="sb-profile__avatar">
            <span>{doctorName.charAt(0).toUpperCase()}</span>
          </div>
          <div className="sb-profile__info sb-hide-collapsed">
            <div className="sb-profile__name">{doctorName}</div>
            <div className="sb-profile__email">Doctor</div>
          </div>
          <svg className="sb-profile__chevron sb-hide-collapsed" width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M6 4l4 4-4 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
        </button>

        <div className="sb-divider" />

        {/* Navigation */}
        <nav className="sb-nav">
          <span className="sb-nav__label sb-hide-collapsed">Menu</span>

          <Link className={`sb-nav__item ${isActive("/doctor/dashboard")}`} to="/doctor/dashboard" data-tooltip="Dashboard">
            <span className="sb-nav__icon">📊</span>
            <span className="sb-hide-collapsed">Dashboard</span>
          </Link>

          <Link className={`sb-nav__item ${isActive("/doctor/scan")}`} to="/doctor/scan" data-tooltip="Scan QR">
            <span className="sb-nav__icon">📷</span>
            <span className="sb-hide-collapsed">Scan QR</span>
          </Link>
        </nav>

        {/* Footer */}
        <div className="sb-footer">
          <div className="sb-footer__row">
            <ThemeToggle ariaLabel="Toggle dark mode" />
            <span className="sb-footer__label sb-hide-collapsed">Dark mode</span>
          </div>
          <button className="sb-footer__signout" onClick={handleSignOut} data-tooltip="Sign Out">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M6 14H3.333A1.333 1.333 0 012 12.667V3.333A1.333 1.333 0 013.333 2H6M10.667 11.333L14 8l-3.333-3.333M14 8H6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
            <span className="sb-hide-collapsed">Sign Out</span>
          </button>
        </div>
      </aside>

      <main className="main">{children}</main>

      {showDetails && <DoctorDetailsModal onClose={() => setShowDetails(false)} />}

      {toast && (
        <div className={`toast ${toast.type || ""} ${toast ? "show" : ""}`}>{toast.message}</div>
      )}
    </div>
  );
};

export default DoctorLayout;
