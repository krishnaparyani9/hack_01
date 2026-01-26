import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { Html5QrcodeScanner } from "html5-qrcode";

const API = "http://localhost:5000";

export default function ScanQR() {
  const scannerRef = useRef<Html5QrcodeScanner | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    // ⛔ prevent double mount (React strict mode / refresh)
    if (scannerRef.current) return;

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

          // ✅ store access type for doctor session
          localStorage.setItem("doctorAccessType", accessType);

          // ✅ stop scanner safely
          await scanner.clear();
          scannerRef.current = null;

          // ✅ redirect
          navigate(`/doctor/session/${sessionId}`);
        } catch (err) {
          console.error(err);
          alert("Invalid or expired QR");
        }
      },
      () => {
        // required error callback (keep silent)
      }
    );

    scannerRef.current = scanner;

    return () => {
      if (scannerRef.current) {
        scannerRef.current.clear().catch(() => {});
        scannerRef.current = null;
      }
    };
  }, [navigate]);

  return (
    <div
      className="main"
      style={{
        maxWidth: "720px",
        margin: "0 auto",
      }}
    >
      {/* HEADER */}
      <h2>Doctor QR Scan</h2>
      <p
        style={{
          color: "var(--text-muted)",
          marginBottom: "28px",
        }}
      >
        Scan the patient’s QR code to begin a secure consultation.
      </p>

      {/* SCANNER CARD */}
      <div
        className="card"
        style={{
          textAlign: "center",
          padding: "28px",
        }}
      >
        <p
          style={{
            fontWeight: 500,
            marginBottom: "16px",
          }}
        >
          Align the QR code inside the frame
        </p>

        <div
          id="qr-reader"
          style={{
            width: "280px",
            margin: "0 auto",
          }}
        />

        <p
          style={{
            marginTop: "16px",
            fontSize: "13px",
            color: "var(--text-muted)",
          }}
        >
          Camera access is required
        </p>
      </div>
    </div>
  );
}
