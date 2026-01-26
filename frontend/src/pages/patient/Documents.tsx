import { useEffect, useState } from "react";
import axios from "axios";

const API = "http://localhost:5000";

type DocType = "Prescription" | "Lab Report" | "Scan" | "Other";

export default function Documents() {
  const [file, setFile] = useState<File | null>(null);
  const [documents, setDocuments] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [docType, setDocType] = useState<DocType>("Prescription");

  const sessionId = localStorage.getItem("sessionId");

  useEffect(() => {
    if (sessionId) fetchDocuments();
  }, [sessionId]);

  const fetchDocuments = async () => {
    const res = await axios.get(`${API}/api/documents/${sessionId}`);
    setDocuments(res.data.data || []);
  };

  const uploadDocument = async () => {
    if (!file || !sessionId) return;

    setLoading(true);
    setProgress(0);

    const formData = new FormData();
    formData.append("file", file);

    await axios.post(
      `${API}/api/documents/upload/${sessionId}`,
      formData,
      {
        headers: { "Content-Type": "multipart/form-data" },
        onUploadProgress: (e) => {
          if (e.total) {
            setProgress(Math.round((e.loaded * 100) / e.total));
          }
        },
      }
    );

    setFile(null);
    setLoading(false);
    setProgress(0);
    fetchDocuments();
  };

  const getFileIcon = (url: string) => {
    if (url.endsWith(".pdf")) return "📄";
    if (url.match(/\.(jpg|jpeg|png)$/)) return "🖼️";
    return "📁";
  };

  const getBadgeColor = (type: DocType) => {
    switch (type) {
      case "Prescription":
        return "#e0f2fe";
      case "Lab Report":
        return "#ecfeff";
      case "Scan":
        return "#f0fdf4";
      default:
        return "#f1f5f9";
    }
  };

  if (!sessionId) {
    return (
      <div className="card">
        <h3>No Active Session</h3>
        <p>Generate QR first to upload documents.</p>
      </div>
    );
  }

  return (
    <div className="main" style={{ maxWidth: "760px", margin: "0 auto" }}>
      <h2>Medical Documents</h2>
      <p style={{ color: "var(--text-muted)", marginBottom: "24px" }}>
        Upload prescriptions, lab reports, or medical scans.
      </p>

      {/* UPLOAD CARD */}
      <div className="card" style={{ marginBottom: "32px" }}>
        <h3>Upload New Document</h3>

        <label style={{ fontSize: "14px", fontWeight: 600 }}>
          Document Type
        </label>
        <select
          value={docType}
          onChange={(e) => setDocType(e.target.value as DocType)}
          style={{
            width: "100%",
            margin: "8px 0 16px",
            padding: "10px",
          }}
        >
          <option>Prescription</option>
          <option>Lab Report</option>
          <option>Scan</option>
          <option>Other</option>
        </select>

        <input
          type="file"
          onChange={(e) => setFile(e.target.files?.[0] || null)}
        />

        {file && (
          <p style={{ marginTop: "8px", fontSize: "13px" }}>
            Selected: <strong>{file.name}</strong>
          </p>
        )}

        <button
          className="btn btn-primary"
          onClick={uploadDocument}
          disabled={loading}
          style={{ marginTop: "16px" }}
        >
          {loading ? "Uploading…" : "Upload Document"}
        </button>

        {/* PROGRESS BAR */}
        {loading && (
          <div style={{ marginTop: "12px" }}>
            <div
              style={{
                height: "8px",
                width: "100%",
                background: "#e5e7eb",
                borderRadius: "6px",
              }}
            >
              <div
                style={{
                  height: "8px",
                  width: `${progress}%`,
                  background: "var(--primary)",
                  borderRadius: "6px",
                  transition: "width 0.2s",
                }}
              />
            </div>
            <p style={{ fontSize: "12px", marginTop: "4px" }}>
              Uploading… {progress}%
            </p>
          </div>
        )}
      </div>

      {/* DOCUMENT LIST */}
      <div className="card">
        <h3>Uploaded Files</h3>

        {documents.length === 0 ? (
          <p style={{ color: "var(--text-muted)" }}>
            No documents uploaded yet.
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
                    padding: "14px 16px",
                    border: "1px solid #e5e7eb",
                    borderRadius: "12px",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <div>
                    <div style={{ fontSize: "18px" }}>
                      {getFileIcon(url)}{" "}
                      <strong>Document {index + 1}</strong>
                    </div>

                    <span
                      style={{
                        display: "inline-block",
                        marginTop: "6px",
                        padding: "4px 10px",
                        borderRadius: "999px",
                        fontSize: "12px",
                        background: getBadgeColor(docType),
                        fontWeight: 600,
                      }}
                    >
                      {docType}
                    </span>
                  </div>

                  <a
                    href={safeUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn"
                    style={{ background: "#f8fafc" }}
                  >
                    View
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
