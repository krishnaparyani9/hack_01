import { useEffect, useRef, useState } from "react";
import axios from "axios";
import { Html5QrcodeScanner } from "html5-qrcode";

const API = "http://localhost:5000";

export default function ScanQR() {
  const scannerRef = useRef<Html5QrcodeScanner | null>(null);
  const [accessType, setAccessType] = useState<"view" | "write" | null>(null);

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

          setAccessType(res.data.data.accessType);
          scanner.clear();
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
  }, []);

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
      {!accessType && (
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
      )}

      {/* SESSION UI */}
      {accessType && (
        <div className="card">
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "14px",
            }}
          >
            <h3>Consultation Active</h3>

            <span
              style={{
                padding: "6px 12px",
                borderRadius: "999px",
                fontSize: "12px",
                fontWeight: 700,
                backgroundColor:
                  accessType === "write" ? "#ecfdf5" : "#fef2f2",
                color:
                  accessType === "write" ? "#047857" : "#b91c1c",
                textTransform: "uppercase",
              }}
            >
              {accessType}
            </span>
          </div>

          <textarea
            placeholder="Doctor notes"
            disabled={accessType === "view"}
            style={{
              width: "100%",
              height: "150px",
              padding: "14px",
              borderRadius: "10px",
              border: "1px solid #e5e7eb",
              resize: "none",
              backgroundColor:
                accessType === "view" ? "#f8fafc" : "#ffffff",
            }}
          />

          {accessType === "view" && (
            <p
              style={{
                color: "var(--danger)",
                marginTop: "10px",
                fontSize: "14px",
              }}
            >
              Write access is disabled for this session
            </p>
          )}
        </div>
      )}
    </div>
  );
}
