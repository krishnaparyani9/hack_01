import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import PatientEditor from "./PatientEditor.tsx";

const PatientLayout = ({ children }: { children: React.ReactNode }) => {
  const location = useLocation();
  const [showEditor, setShowEditor] = useState(false);
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    try {
      return localStorage.getItem("theme") === "dark";
    } catch {
      return false;
    }
  });

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

        <div className="sidebar-footer" role="region" aria-label="Sidebar footer">
          <div className="footer-left">
            <span className="footer-label">Dark mode</span>
          </div>

          <div className="footer-actions">
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
          </div>
        </div>
      </aside>

      <main className="main">{children}</main>

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
