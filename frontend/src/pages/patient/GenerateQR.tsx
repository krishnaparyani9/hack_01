import { useState } from "react";
import axios from "axios";
import QrModal from "../../components/QrModal";

const API = "http://localhost:5000";

export default function GenerateQR() {
  const [accessType, setAccessType] = useState<"view" | "write">("view");
  const [duration, setDuration] = useState(15);
  const [qrToken, setQrToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showQrModal, setShowQrModal] = useState(false);

  const generateQR = async () => {
    try {
      setLoading(true);

      const userId = localStorage.getItem("userId") || localStorage.getItem("patientId");
      const userRoleRaw = localStorage.getItem("userRole");
      const isPatient = (userRoleRaw || "").toLowerCase() === "patient" || !!localStorage.getItem("patientId");

      if (!userId || !isPatient) {
        window.dispatchEvent(new CustomEvent("toast", { detail: { message: "Please sign in as a patient to generate a QR", type: "error" } }));
        return;
      }

      const patientId = userId as string;
      // Persist a stable patientId so the patient UI and sessions align
      try {
        localStorage.setItem("patientId", patientId);
      } catch {}
      const res = await axios.post(`${API}/api/session/create`, {
        accessType,
        durationMinutes: duration,
        patientId,
      });

      const { token, sessionId } = res.data.data;

      // 🔑 VERY IMPORTANT (used by Documents upload)
      localStorage.setItem("sessionId", sessionId);

      setQrToken(token);
      setShowQrModal(true);
    } catch (err) {
      alert("Failed to generate QR");
    } finally {
      setLoading(false);
    }
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
          disabled={loading}
        >
          {loading ? "Generating..." : "Generate QR Code"}
        </button>
      </div>

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
