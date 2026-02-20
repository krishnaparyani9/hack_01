import React, { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import PatientEditor from "./PatientEditor.tsx";
import ThemeToggle from "./ThemeToggle";

const PatientLayout = ({ children }: { children: React.ReactNode }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [showEditor, setShowEditor] = useState(false);

  const handleSignOut = () => {
    try {
      // remove auth-related keys
      localStorage.removeItem("authToken");
      localStorage.removeItem("userId");
      localStorage.removeItem("userName");
      localStorage.removeItem("userEmail");
      localStorage.removeItem("userRole");

      // Preserve patient-specific local data (patientId, name, email) to avoid losing uploaded documents on sign-out.
      // If the user wants to remove local patient data they can use the 'Clear Local Data' option (not implemented yet).

      // clear any active session info
      localStorage.removeItem("sessionId");

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

  // keyboard handling: Esc to close editor and focus first input on open
  useEffect(() => {
    if (!showEditor) return;

    const onKey = (ev: KeyboardEvent) => {
      if (ev.key === "Escape") setShowEditor(false);
    };

    document.addEventListener("keydown", onKey);
    // focus first input in modal
    setTimeout(() => {
      const el = document.querySelector(".editor-card input") as HTMLElement | null;
      if (el) el.focus();
    }, 80);

    return () => document.removeEventListener("keydown", onKey);
  }, [showEditor]);

  // allow pages (e.g., Emergency) to open editor without prop drilling
  useEffect(() => {
    const onOpen = () => setShowEditor(true);
    window.addEventListener("patient-open-editor", onOpen);
    return () => window.removeEventListener("patient-open-editor", onOpen);
  }, []);

  const isActive = (path: string) =>
    location.pathname === path ? "active" : "";

  const patientId = localStorage.getItem("patientId");
  const patientName = localStorage.getItem("patientName") || "Patient";
  const patientEmail = localStorage.getItem("patientEmail") || "";

  // collapsible sidebar
  const [collapsed, setCollapsed] = useState(() => localStorage.getItem("sb-collapsed") === "1");
  const toggleCollapse = () => {
    setCollapsed((prev) => {
      localStorage.setItem("sb-collapsed", prev ? "0" : "1");
      return !prev;
    });
  };

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
        <button className="sb-profile" onClick={() => setShowEditor(true)} type="button" data-tooltip="View Profile">
          <div className="sb-profile__avatar">
            <span>{patientName.charAt(0).toUpperCase()}</span>
          </div>
          <div className="sb-profile__info sb-hide-collapsed">
            <div className="sb-profile__name">{patientName}</div>
            <div className="sb-profile__email">{patientEmail || "your.email@example.com"}</div>
          </div>
          <svg className="sb-profile__chevron sb-hide-collapsed" width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M6 4l4 4-4 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
        </button>

        <div className="sb-divider" />

        {/* Navigation */}
        <nav className="sb-nav">
          <span className="sb-nav__label sb-hide-collapsed">Menu</span>

          <Link className={`sb-nav__item ${isActive("/patient/dashboard")}`} to="/patient/dashboard" data-tooltip="Dashboard">
            <span className="sb-nav__icon">📊</span>
            <span className="sb-hide-collapsed">Dashboard</span>
          </Link>

          <Link className={`sb-nav__item ${isActive("/patient/records")}`} to="/patient/records" data-tooltip="Tap to Share">
            <span className="sb-nav__icon">🔗</span>
            <span className="sb-hide-collapsed">Tap to Share</span>
          </Link>

          <Link className={`sb-nav__item ${isActive("/patient/documents")}`} to="/patient/documents" data-tooltip="Documents">
            <span className="sb-nav__icon">📁</span>
            <span className="sb-hide-collapsed">Documents</span>
          </Link>

          <Link className={`sb-nav__item ${isActive("/patient/analytics")}`} to="/patient/analytics" data-tooltip="Analytics">
            <span className="sb-nav__icon">📈</span>
            <span className="sb-hide-collapsed">Analytics</span>
          </Link>

          <Link className={`sb-nav__item ${isActive("/patient/emergency")}`} to="/patient/emergency" data-tooltip="Emergency">
            <span className="sb-nav__icon">🚨</span>
            <span className="sb-hide-collapsed">Emergency</span>
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

      <main className="main">
        <div className="content">{children}</div>
        <div className="main-bg-icons" aria-hidden>
          <div className="bg-icon icon-stethoscope" />
        </div>
      </main>

      {/* Modal is rendered here (outside sidebar) so it isn't clipped by sidebar/container stacking contexts */}
      {showEditor && (
        <div
          className={`editor-modal ${showEditor ? 'show' : ''}`}
          role="dialog"
          aria-modal
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowEditor(false);
          }}
        >
          <div className="editor-card">
            <button className="editor-close" aria-label="Close" onClick={() => setShowEditor(false)}>✕</button>
            <h3>Edit Emergency Details</h3>

            <PatientEditor patientId={patientId || ""} onClose={() => setShowEditor(false)} />
          </div>
        </div>
      )}

      {/* Toast notification */}
      {toast && (
        <div className={`toast ${toast.type || ""} ${toast ? "show" : ""}`}>{toast.message}</div>
      )}
    </div>
  );
};

export default PatientLayout;
