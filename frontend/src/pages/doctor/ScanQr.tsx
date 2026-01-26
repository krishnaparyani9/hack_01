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
          const res = await axios.post(`${API}/api/session/validate`, {
            token: decodedText,
          });

          const { sessionId, accessType } = res.data.data;

          // ✅ SINGLE SOURCE OF TRUTH
          localStorage.setItem("doctorAccessType", accessType);

          await scanner.clear();

          navigate(`/doctor/session/${sessionId}`);
        } catch {
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
    <div className="main" style={{ maxWidth: 720, margin: "0 auto" }}>
      <h2>Doctor QR Scan</h2>
      <p style={{ color: "var(--text-muted)", marginBottom: 28 }}>
        Scan the patient’s QR code to begin consultation.
      </p>

      <div className="card" style={{ textAlign: "center", padding: 28 }}>
        <p style={{ fontWeight: 500, marginBottom: 16 }}>
          Align the QR code inside the frame
        </p>

        <div id="qr-reader" style={{ width: 280, margin: "0 auto" }} />

        <p style={{ marginTop: 16, fontSize: 13, color: "var(--text-muted)" }}>
          Camera access required
        </p>
      </div>
    </div>
  );
}

