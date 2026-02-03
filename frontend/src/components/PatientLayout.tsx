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

  const isActive = (path: string) =>
    location.pathname === path ? "active" : "";

  const patientId = localStorage.getItem("patientId");
  const patientName = localStorage.getItem("patientName") || "Patient";
  const patientEmail = localStorage.getItem("patientEmail") || "";



  // load dynamic PatientEditor component lazily (declared below)
  return (
    <div className="layout">
      <aside className="sidebar">
        <div className="sidebar-header">
          <h2>HealthVault</h2>

          <div className="profile">
            <div className="avatar-wrap">
              <div className="avatar" aria-hidden>{patientName.charAt(0).toUpperCase()}</div>
            </div>

            <div className="meta">
              <div className="name">{patientName}</div>
              <div className="email">{patientEmail || "your.email@example.com"}</div>
              <a className="view-profile" href="#" onClick={(e) => { e.preventDefault(); setShowEditor(true); }}>
                View Profile →
              </a>
            </div>


          </div>
        </div>



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
            Tap to share
          </Link>

          {/* ✅ NEW: Upload Documents */}
          <Link
            className={isActive("/patient/documents")}
            to="/patient/documents"
          >
            Upload Documents
          </Link>

          
          <Link
            className={isActive("/patient/emergency")}
            to="/patient/emergency"
          >
            Emergency Mode
          </Link>
        </nav>

        <div className="sidebar-footer" role="region" aria-label="Sidebar footer">
          <div className="footer-left">
            <span className="footer-label">Dark mode</span>
          </div>

          <div className="footer-actions vertical">
            <ThemeToggle ariaLabel="Toggle dark mode" />

            <button className="btn btn-outline" onClick={handleSignOut}>Sign Out</button>
          </div>
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
