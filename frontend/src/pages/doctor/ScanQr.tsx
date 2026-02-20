import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { Html5QrcodeScanner } from "html5-qrcode";

const API = "http://localhost:5000";

export default function ScanQR() {
  const scannerRef = useRef<Html5QrcodeScanner | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const scanner = new Html5QrcodeScanner(
      "qr-reader",
      { fps: 10, qrbox: 250 },
      false
    );

    scanner.render(
      async (decodedText) => {
        try {
          const token = decodedText?.toString().trim();
          const authToken = localStorage.getItem("authToken");
          if (!authToken) {
            alert("Please sign in as a doctor before scanning");
            return;
          }

          const res = await axios.post(
            `${API}/api/session/validate`,
            { token },
            { headers: { Authorization: `Bearer ${authToken}` } }
          );

          const { sessionId, accessType } = res.data.data;

          localStorage.setItem("doctorAccessType", accessType);

          await scanner.clear();

          navigate(`/doctor/session/${sessionId}`);
        } catch (err: any) {
          console.error("QR validate error:", err?.response ?? err);
          const status = err?.response?.status;
          if (status === 401 || status === 403) {
            window.dispatchEvent(new CustomEvent("toast", { detail: { message: "Authentication required — please sign in again", type: "error" } }));
            await scanner.clear();
            navigate("/auth/login");
            return;
          }

          alert("Invalid or expired QR");
        }
      },
      () => {}
    );

    scannerRef.current = scanner;

    return () => {
      scanner.clear().catch(() => {});
    };
  }, [navigate]);

  return (
    <div className="main app-ambient" style={{ maxWidth: 720, margin: "0 auto" }}>
      {/* ── Header ── */}
      <div className="app-header">
        <span className="app-kicker">QR Scanner</span>
        <h2 className="app-title">Scan Patient QR</h2>
        <p className="app-subtitle">Align the patient's QR code inside the scanner frame to begin a consultation.</p>
      </div>

      {/* ── Scanner card ── */}
      <div className="qr-scan-hero">
        <p style={{ fontWeight: 700, fontSize: 15, margin: "0 0 4px" }}>📷 Camera Scanner</p>
        <p style={{ fontSize: 13, color: "var(--text-muted)", margin: "0 0 16px" }}>Position the QR code within the frame below</p>

        <div className="qr-scan-hero__frame">
          <div id="qr-reader" style={{ width: "100%" }} />
        </div>

        <p style={{ marginTop: 16, fontSize: 12, color: "var(--text-muted)" }}>
          Camera access required · The scan is processed locally
        </p>
      </div>

      {/* ── Steps ── */}
      <div className="qr-scan-steps" style={{ marginTop: 24 }}>
        <div className="qr-scan-step">
          <div className="qr-scan-step__num">1</div>
          <p style={{ margin: 0, fontWeight: 700, fontSize: 14 }}>Allow Camera</p>
          <p style={{ margin: "6px 0 0", fontSize: 12, color: "var(--text-muted)" }}>Grant browser permission</p>
        </div>
        <div className="qr-scan-step">
          <div className="qr-scan-step__num">2</div>
          <p style={{ margin: 0, fontWeight: 700, fontSize: 14 }}>Scan Code</p>
          <p style={{ margin: "6px 0 0", fontSize: 12, color: "var(--text-muted)" }}>Align QR within frame</p>
        </div>
        <div className="qr-scan-step">
          <div className="qr-scan-step__num">3</div>
          <p style={{ margin: 0, fontWeight: 700, fontSize: 14 }}>Access Records</p>
          <p style={{ margin: "6px 0 0", fontSize: 12, color: "var(--text-muted)" }}>Session starts automatically</p>
        </div>
      </div>
    </div>
  );
}
