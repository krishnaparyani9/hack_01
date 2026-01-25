import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";

const API = "http://localhost:5000";

type SessionData = {
  accessType: "view" | "write";
  expiresAt: string;
};

export default function DoctorSession() {
  const { sessionId } = useParams();
  const [session, setSession] = useState<SessionData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!sessionId) return;

    axios
      .get(`${API}/api/session/${sessionId}`)
      .then((res) => {
        setSession(res.data.data);
      })
      .catch(() => {
        setError("Session expired or invalid");
      });
  }, [sessionId]);

  if (error) {
    return (
      <div className="main">
        <h2>Session Error</h2>
        <p style={{ color: "var(--danger)" }}>{error}</p>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="main">
        <p>Loading session…</p>
      </div>
    );
  }

  return (
    <div className="main" style={{ maxWidth: "720px", margin: "0 auto" }}>
      <h2>Active Consultation</h2>

      <div className="card" style={{ marginBottom: "20px" }}>
        <p>
          <strong>Access Mode:</strong>{" "}
          <span
            style={{
              color:
                session.accessType === "write"
                  ? "var(--success)"
                  : "var(--danger)",
              fontWeight: 700,
              textTransform: "uppercase",
            }}
          >
            {session.accessType}
          </span>
        </p>

        <p style={{ color: "var(--text-muted)", marginTop: "6px" }}>
          Session ID: {sessionId}
        </p>
      </div>

      <div className="card">
        <h3>Doctor Notes</h3>

        <textarea
          placeholder="Enter consultation notes…"
          disabled={session.accessType === "view"}
          style={{
            width: "100%",
            height: "160px",
            marginTop: "12px",
            padding: "14px",
            borderRadius: "10px",
            border: "1px solid #e5e7eb",
            resize: "none",
            backgroundColor:
              session.accessType === "view" ? "#f8fafc" : "#ffffff",
          }}
        />

        {session.accessType === "view" && (
          <p style={{ color: "var(--danger)", marginTop: "10px" }}>
            Write access disabled for this session
          </p>
        )}
      </div>
    </div>
  );
}

