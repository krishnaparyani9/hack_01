import { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import DoctorDetailsModal from "./DoctorDetailsModal";

const DoctorLayout = ({ children }: { children: React.ReactNode }) => {
  const location = useLocation();
  const navigate = useNavigate();

  const [darkMode, setDarkMode] = useState<boolean>(() => {
    try {
      return localStorage.getItem("theme") === "dark";
    } catch {
      return false;
    }
  });

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

  useEffect(() => {
    try {
      if (darkMode) document.body.classList.add("dark");
      else document.body.classList.remove("dark");
      localStorage.setItem("theme", darkMode ? "dark" : "light");
    } catch (e) {
      // ignore storage errors
    }
  }, [darkMode]);

  const toggleTheme = () => setDarkMode((v) => !v);

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
    <div className="layout">
      <aside className="sidebar">
        <div className="sidebar-header">
          <h2>HealthVault</h2>

          <div className="profile">
            <div className="avatar-wrap">
              <div className="avatar" aria-hidden>{doctorName.charAt(0).toUpperCase()}</div>
            </div>

            <div className="meta">
              <div className="name">{doctorName}</div>
              <a className="view-profile" href="#" onClick={(e) => { e.preventDefault(); setShowDetails(true); }}>
                View Details →
              </a>
            </div>
          </div>
        </div>

        <nav>
          <Link className={isActive("/doctor/dashboard")} to="/doctor/dashboard">Dashboard</Link>
          <Link className={isActive("/doctor/scan")} to="/doctor/scan">Scan QR</Link>
        </nav>

        <div className="sidebar-footer" role="region" aria-label="Sidebar footer">
          <div className="footer-left">
            <span className="footer-label">Dark mode</span>
          </div>

          <div className="footer-actions vertical">
            <button
              className={`theme-toggle btn-icon ${darkMode ? "dark" : "light"}`}
              title="Toggle theme"
              onClick={toggleTheme}
              aria-pressed={darkMode}
              aria-label="Toggle theme"
            >
              <svg className="icon-sun" width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
                <path d="M12 4V2M12 22v-2M4 12H2M22 12h-2M4.9 4.9L3.5 3.5M20.5 20.5l-1.4-1.4M4.9 19.1l-1.4 1.4M20.5 3.5l-1.4 1.4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
                <circle cx="12" cy="12" r="3.2" stroke="currentColor" strokeWidth="1.6"/>
              </svg>
              <svg className="icon-moon" width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
                <path d="M21 12.8A9 9 0 1111.2 3 7 7 0 0021 12.8z" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>

            <button className="btn btn-outline" onClick={handleSignOut}>Sign Out</button>
          </div>
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
