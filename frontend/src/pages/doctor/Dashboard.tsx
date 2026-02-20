import { Link, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";

const DoctorDashboard = () => {
  const navigate = useNavigate();

  const [activeSession, setActiveSession] = useState<null | {
    sessionId: string;
    accessType: "view" | "write";
    patientId?: string;
    createdAt?: number;
    expiresAt?: number;
    durationMinutes?: number;
  }>(null);

  useEffect(() => {
    const sid = localStorage.getItem("doctorActiveSessionId");
    if (!sid) return;

    (async () => {
      try {
        const token = localStorage.getItem("authToken");
        const res = await fetch(`http://localhost:5000/api/session/${sid}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!res.ok) throw new Error("Session fetch failed");

        const json = await res.json();
        if (json && json.data) {
          setActiveSession(json.data);
        } else {
          setActiveSession(null);
        }
      } catch {
        setActiveSession(null);
      }
    })();
  }, []);

  const hasActiveSession = !!activeSession;

  const formatTimeLeft = (expiresAt?: number) => {
    if (!expiresAt) return "";
    const diff = Math.max(0, expiresAt - Date.now());
    const mins = Math.ceil(diff / 60000);
    return mins > 1 ? `~${mins} min` : mins === 1 ? `~1 min` : "Expired";
  };

  const formatStarted = (createdAt?: number) => {
    if (!createdAt) return "Just now";
    return new Date(createdAt).toLocaleString();
  };

  return (
    <div className="main app-ambient" style={{ maxWidth: 720, margin: "0 auto" }}>
      {/* ── Header ── */}
      <div className="app-header">
        <span className="app-kicker">Doctor Workspace</span>
        <h2 className="app-title">Dashboard</h2>
        <p className="app-subtitle">Secure, session-based access to patient records.</p>
      </div>

      {/* ── Active Session ── */}
      {hasActiveSession && activeSession && (
        <div className="doc-hero doc-hero--active" style={{ marginBottom: 28 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14, flexWrap: "wrap", gap: 10 }}>
            <h3 style={{ margin: 0, fontSize: 18, fontWeight: 800 }}>🩺 Active Consultation</h3>
            <span className="app-emergency-badge app-emergency-badge--safe">
              <span style={{ width: 8, height: 8, borderRadius: "50%", background: "currentColor" }} />
              Active
            </span>
          </div>

          <div className="doc-hero__grid">
            <div className="doc-hero__item">
              <strong>Patient</strong>
              <div style={{ marginTop: 4, fontSize: 15 }}>{activeSession.patientId || "Anonymous"}</div>
            </div>
            <div className="doc-hero__item">
              <strong>Access</strong>
              <div style={{ marginTop: 4, fontSize: 15 }}>{activeSession.accessType === "write" ? "View + Write" : "View Only"}</div>
            </div>
            <div className="doc-hero__item">
              <strong>Started</strong>
              <div style={{ marginTop: 4, fontSize: 15 }}>{formatStarted(activeSession.createdAt)}</div>
            </div>
            <div className="doc-hero__item">
              <strong>Time Left</strong>
              <div style={{ marginTop: 4, fontSize: 15 }}>{formatTimeLeft(activeSession.expiresAt)}</div>
            </div>
          </div>

          <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
            <Link to={`/doctor/session/${activeSession.sessionId}`} style={{ flex: 1 }}>
              <button className="btn btn-primary" style={{ width: "100%" }}>Continue Consultation</button>
            </Link>
            <button
              className="btn btn-secondary"
              style={{ flex: 1 }}
              onClick={async () => {
                try {
                  const token = localStorage.getItem("authToken");
                  await fetch(`http://localhost:5000/api/session/${activeSession.sessionId}`, {
                    method: "DELETE",
                    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
                  });
                } catch {
                  // ignore
                }
                localStorage.removeItem("doctorActiveSessionId");
                setActiveSession(null);
                window.dispatchEvent(new CustomEvent("toast", { detail: { message: "Session ended", type: "success" } }));
              }}
            >
              End Session
            </button>
          </div>
        </div>
      )}

      {/* ── Scan QR card ── */}
      <div className="doc-scan-card" style={{ marginBottom: 28 }}>
        <div className="doc-scan-card__icon">📷</div>
        <h3 style={{ margin: "0 0 8px", fontSize: 18, fontWeight: 800 }}>Start New Consultation</h3>
        <p style={{ color: "var(--text-muted)", margin: "0 0 22px", fontSize: 14 }}>
          Scan the patient's QR code to request temporary access to their medical records.
        </p>
        <button
          className="btn btn-primary"
          style={{ padding: "12px 32px" }}
          onClick={() => navigate("/doctor/scan")}
        >
          Scan Patient QR
        </button>
      </div>

      {/* ── Recent sessions ── */}
      <div className="doc-recent">
        <h4 style={{ margin: "0 0 12px", fontSize: 14, fontWeight: 800, letterSpacing: "0.06em", textTransform: "uppercase", color: "var(--text-muted)" }}>Recent Sessions</h4>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 14px", borderRadius: 12, background: "rgba(43,124,255,0.04)", border: "1px solid var(--border)" }}>
            <span style={{ fontSize: 14 }}>View Only</span>
            <span className="app-doc-badge app-doc-badge--other">Completed</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 14px", borderRadius: 12, background: "rgba(43,124,255,0.04)", border: "1px solid var(--border)" }}>
            <span style={{ fontSize: 14 }}>View + Write</span>
            <span className="app-doc-badge app-doc-badge--other">Expired</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DoctorDashboard;
