import { useEffect, useState } from "react";
import axios from "axios";

const API = "http://localhost:5000";

export default function Records() {
  const [documents, setDocuments] = useState<string[]>([]);
  const sessionId = localStorage.getItem("sessionId");

  useEffect(() => {
    if (sessionId) fetchDocuments();
  }, [sessionId]);

  const fetchDocuments = async () => {
    const res = await axios.get(`${API}/api/documents/${sessionId}`);
    setDocuments(res.data.data || []);
  };

  if (!sessionId) {
    return (
      <div className="card">
        <h3>No Records Found</h3>
        <p>Generate a QR and upload documents first.</p>
      </div>
    );
  }

  return (
    <div className="main" style={{ maxWidth: "760px", margin: "0 auto" }}>
      <h2>My Records</h2>
      <p style={{ color: "var(--text-muted)", marginBottom: "24px" }}>
        All documents linked to your current session.
      </p>

      <div className="card">
        {documents.length === 0 ? (
          <p style={{ color: "var(--text-muted)" }}>
            No records available yet.
          </p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
            {documents.map((url, index) => {
              const safeUrl = url.startsWith("http")
                ? url
                : `https://${url}`;

              return (
                <div
                  key={index}
                  style={{
                    padding: "16px",
                    border: "1px solid #e5e7eb",
                    borderRadius: "12px",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <div>
                    <strong>Medical Record {index + 1}</strong>
                    <p style={{ fontSize: "12px", color: "var(--text-muted)" }}>
                      Secure cloud document
                    </p>
                  </div>

                  <a
                    href={safeUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn"
                    style={{
                      background: "#f8fafc",
                      fontWeight: 600,
                    }}
                  >
                    Open
                  </a>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
