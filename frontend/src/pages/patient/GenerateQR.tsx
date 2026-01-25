import { useState } from "react";
import axios from "axios";
import { QRCodeCanvas } from "qrcode.react";

const API = "http://localhost:5000";

export default function GenerateQR() {
  const [accessType, setAccessType] = useState<"view" | "write">("view");
  const [duration, setDuration] = useState(15);
  const [qrToken, setQrToken] = useState<string | null>(null);

  const generateQR = async () => {
    const res = await axios.post(`${API}/api/session/create`, {
      accessType,
      durationMinutes: duration,
    });

    setQrToken(res.data.data.token);
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
          value={duration}
          onChange={(e) => setDuration(Number(e.target.value))}
          style={{ width: "100%", margin: "8px 0 24px", padding: "12px" }}
        />

        <button
          className="btn btn-primary"
          style={{ width: "100%" }}
          onClick={generateQR}
        >
          Generate QR Code
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
            <QRCodeCanvas
              value={qrToken}
              size={220}
              bgColor="#ffffff"
              fgColor="#0f172a"
              level="H"
            />
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
    </div>
  );
}
