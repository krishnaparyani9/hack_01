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

        const res = await fetch(
          `http://localhost:5000/api/session/${sid}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

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
    <div
      className="main"
      style={{
        maxWidth: "680px",
        margin: "0 auto",
      }}
    >
      <h2>Doctor Workspace</h2>
      <p style={{ color: "var(--text-muted)", marginBottom: "36px" }}>
        Secure, session-based access to patient records.
      </p>

      {/* ACTIVE SESSION */}
      {hasActiveSession && activeSession && (
        <div
          className="card"
          style={{
            marginBottom: "36px",
            borderLeft: "5px solid var(--primary)",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 12,
            }}
          >
            <h3>Active Consultation</h3>
            <span
              className="doc-badge"
              style={{ background: "#ecfeff", color: "#064e3b" }}
            >
              ACTIVE
            </span>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 12,
              marginBottom: 18,
            }}
          >
            <div>
              <strong>Patient</strong>
              <div className="muted">
                {activeSession.patientId || "Anonymous"}
              </div>
            </div>

            <div>
              <strong>Access</strong>
              <div className="muted">
                {activeSession.accessType === "write"
                  ? "View + Write"
                  : "View"}
              </div>
            </div>

            <div>
              <strong>Started</strong>
              <div className="muted">
                {formatStarted(activeSession.createdAt)}
              </div>
            </div>

            <div>
              <strong>Time Left</strong>
              <div className="muted">
                {formatTimeLeft(activeSession.expiresAt)}
              </div>
            </div>
          </div>

          <Link to={`/doctor/session/${activeSession.sessionId}`}>
            <button className="btn btn-primary" style={{ width: "100%" }}>
              Continue Consultation
            </button>
          </Link>
        </div>
      )}

      {/* SCAN QR */}
      <div
        className="card"
        style={{
          textAlign: "center",
          padding: "32px 24px",
        }}
      >
        <h3>Start New Consultation</h3>
        <p
          style={{
            color: "var(--text-muted)",
            margin: "12px 0 20px",
          }}
        >
          Scan the patient’s QR code to request temporary access.
        </p>

        <button
          className="btn"
          style={{
            padding: "12px 32px",
            backgroundColor: "var(--primary-light)",
            color: "var(--primary)",
            fontWeight: 600,
          }}
          onClick={() => navigate("/doctor/scan")}
        >
          Scan Patient QR
        </button>
      </div>

      {/* RECENT */}
      <div
        style={{
          marginTop: "40px",
          fontSize: "13px",
          color: "var(--text-muted)",
        }}
      >
        <p style={{ marginBottom: "8px" }}>
          <strong>Recent Sessions</strong>
        </p>
        <ul>
          <li>View Only • Completed</li>
          <li>View + Write • Expired</li>
        </ul>
      </div>
    </div>
  );
};

export default DoctorDashboard;
