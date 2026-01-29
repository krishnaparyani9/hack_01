import { useState, useEffect } from "react";
import axios from "axios";
import QrModal from "../../components/QrModal";

const API = "http://localhost:5000";

export default function GenerateQR() {
  const [accessType, setAccessType] = useState<"view" | "write">("view");
  const [duration, setDuration] = useState(15);
  const [qrToken, setQrToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showQrModal, setShowQrModal] = useState(false);
  const [activeSession, setActiveSession] = useState<{ sessionId: string; expiresAt: number; accessType: "view" | "write" } | null>(null);
  const [timeLeft, setTimeLeft] = useState<number>(0);

  const generateQR = async () => {
    try {
      setLoading(true);

      // Prevent generating while an active session exists
      if (activeSession && activeSession.expiresAt > Date.now()) {
        window.dispatchEvent(new CustomEvent("toast", { detail: { message: "An active session already exists — wait until it expires", type: "error" } }));
        return;
      }

      const userId = localStorage.getItem("userId") || localStorage.getItem("patientId");
      const userRoleRaw = localStorage.getItem("userRole");
      const authToken = localStorage.getItem("authToken");

      const isSignedInPatient = (userRoleRaw || "").toLowerCase() === "patient" && !!authToken;

      if (!userId) {
        window.dispatchEvent(new CustomEvent("toast", { detail: { message: "Please sign in as a patient to generate a QR", type: "error" } }));
        return;
      }

      const patientId = userId as string;
      // Persist a stable patientId so the patient UI and sessions align.
      // Do not overwrite an existing `patientId` unless the signed-in user
      // is actually a patient (prevents accidentally setting the id to a
      // non-patient user when role/state is inconsistent).
      try {
        const storedPid = localStorage.getItem("patientId");
        const isSignedInPatient = (userRoleRaw || "").toLowerCase() === "patient" && !!authToken;
        if (!storedPid || isSignedInPatient) {
          localStorage.setItem("patientId", patientId);
        }
      } catch {}
      // If the user is signed in as a patient, call the authenticated create
      // endpoint. Otherwise (no auth token but a stored patientId) fall back
      // to the anon endpoint so patients who previously persisted a patientId
      // can generate a QR without re-signing in.
      let res;
      try {
        if (isSignedInPatient) {
          res = await axios.post(
            `${API}/api/session/create`,
            { accessType, durationMinutes: duration, patientId },
            { headers: { Authorization: `Bearer ${authToken}` } }
          );
        } else {
          // fallback anonymous creation using persisted patientId
          res = await axios.post(`${API}/api/session/create-anon`, { accessType, durationMinutes: duration, patientId });
        }
      } catch (err: any) {
        // If server reports an active session, show a clearer message
        if (err?.response?.status === 409) {
          window.dispatchEvent(new CustomEvent("toast", { detail: { message: "An active session already exists — wait until it expires", type: "error" } }));
          return;
        }
        throw err;
      }

      const { token, sessionId } = res.data.data;

      // 🔑 VERY IMPORTANT (used by Documents upload)
      localStorage.setItem("sessionId", sessionId);

      // mark active session locally
      try {
        const exp = res.data.data.expiresAt as number | undefined;
        if (exp) {
          setActiveSession({ sessionId, expiresAt: exp, accessType });
          setTimeLeft(Math.max(0, exp - Date.now()));
        }
      } catch {}

      setQrToken(token);
      setShowQrModal(true);
    } catch (err) {
      alert("Failed to generate QR");
    } finally {
      setLoading(false);
    }
  };

  // Check for an existing session on mount and subscribe to countdown
  useEffect(() => {
    let mounted = true;
    let tid: number | undefined;

    const syncSession = async () => {
      const stored = localStorage.getItem("sessionId");
      if (!stored) return;
      try {
        const res = await axios.get(`${API}/api/session/${stored}`);
        const data = res.data?.data;
        if (data && data.expiresAt && Date.now() < data.expiresAt) {
          if (!mounted) return;
          setActiveSession({ sessionId: data.sessionId, expiresAt: data.expiresAt, accessType: data.accessType });
          setTimeLeft(Math.max(0, data.expiresAt - Date.now()));

          tid = window.setInterval(() => {
            const left = Math.max(0, data.expiresAt - Date.now());
            setTimeLeft(left);
            if (left <= 0) {
              setActiveSession(null);
              localStorage.removeItem("sessionId");
              if (tid) window.clearInterval(tid);
            }
          }, 1000) as unknown as number;
        } else {
          // expired or missing
          localStorage.removeItem("sessionId");
          // clear any shown QR token because session is not valid
          setQrToken(null);
        }
      } catch (e) {
        // ignore failures — session may be gone
        localStorage.removeItem("sessionId");
        setQrToken(null);
      }
    };

    syncSession();

    return () => {
      mounted = false;
      if (tid) window.clearInterval(tid);
    };
  }, []);

  // keep countdown in sync for newly created sessions
  useEffect(() => {
    if (!activeSession) {
      setTimeLeft(0);
      return;
    }

    const id = window.setInterval(() => {
      const left = Math.max(0, activeSession.expiresAt - Date.now());
      setTimeLeft(left);
      if (left <= 0) {
        setActiveSession(null);
        localStorage.removeItem("sessionId");
        window.clearInterval(id);
      }
    }, 1000) as unknown as number;

    return () => window.clearInterval(id);
  }, [activeSession]);

  const formatTime = (ms: number) => {
    if (!ms || ms <= 0) return "Expired";
    const s = Math.floor(ms / 1000);
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}m ${String(sec).padStart(2, "0")}s`;
  };

  return (
    <div className="main" style={{ maxWidth: "520px", margin: "0 auto" }}>
      <h2>Share Medical Records</h2>
      <p style={{ color: "var(--text-muted)", marginBottom: "28px" }}>
        Generate a secure, time-bound QR code for doctor access.
      </p>

      {/* FORM */}
      <div className="card">
        <label><strong>Access Type</strong></label>
        <select
          value={accessType}
          onChange={(e) => setAccessType(e.target.value as "view" | "write")}
          style={{ width: "100%", margin: "8px 0 20px", padding: "12px" }}
        >
          <option value="view">View Only</option>
          <option value="write">View + Write</option>
        </select>

        <label><strong>Duration (minutes)</strong></label>
        <input
          type="number"
          min={1}
          value={duration}
          onChange={(e) => setDuration(Number(e.target.value))}
          style={{ width: "100%", margin: "8px 0 24px", padding: "12px" }}
        />

        <button
          className="btn btn-primary"
          style={{ width: "100%" }}
          onClick={generateQR}
          disabled={loading || !!(activeSession && activeSession.expiresAt > Date.now())}
        >
          {loading ? "Generating..." : "Generate QR Code"}
        </button>
      </div>

        {activeSession && (
          <div style={{ marginTop: 12 }}>
            <div style={{ color: "var(--text-muted)", fontSize: 13 }}>
              Active session: {activeSession.accessType.toUpperCase()} — expires in {formatTime(timeLeft)}
            </div>
          </div>
        )}

      {/* QR DISPLAY */}
      {qrToken && (
        <div
          className="card"
          style={{
            marginTop: "32px",
            textAlign: "center",
          }}
        >
          <h3>Patient QR Code</h3>
          <p style={{ color: "var(--text-muted)" }}>
            Doctor scans this QR to access records
          </p>

          <div style={{ marginTop: "20px" }}>
            <button className="btn btn-secondary" onClick={() => setShowQrModal(true)}>Open QR in modal</button>
          </div>

          <p
            style={{
              marginTop: "14px",
              fontSize: "12px",
              color: "var(--text-muted)",
            }}
          >
            Secure • Time-bound • Patient-controlled
          </p>
        </div>
      )}

      {showQrModal && qrToken && <QrModal token={qrToken} onClose={() => setShowQrModal(false)} />}
    </div>
  );
}
