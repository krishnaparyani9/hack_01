import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";

const API = "http://localhost:5000";

export default function DoctorSession() {
  const { sessionId } = useParams();

  const [accessType, setAccessType] = useState<"view" | "write">("view");
  const [documents, setDocuments] = useState<string[]>([]);
  const [file, setFile] = useState<File | null>(null);
  const [activeTab, setActiveTab] = useState<"summary" | "documents">("documents");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!sessionId) return;

    const storedAccess = localStorage.getItem("doctorAccessType");
    if (storedAccess === "view" || storedAccess === "write") {
      setAccessType(storedAccess);
    }

    fetchDocuments();
  }, [sessionId]);

  const fetchDocuments = async () => {
    const res = await axios.get(`${API}/api/documents/${sessionId}`);
    setDocuments(res.data.data || []);
  };

  const uploadDocument = async () => {
    if (!file || !sessionId) return;

    setLoading(true);

    const formData = new FormData();
    formData.append("file", file);

    await axios.post(
      `${API}/api/documents/upload/${sessionId}`,
      formData,
      { headers: { "Content-Type": "multipart/form-data" } }
    );

    setFile(null);
    setLoading(false);
    fetchDocuments();
  };

  const getSafeUrl = (url: string) =>
    url.startsWith("http") ? url : `https://${url}`;

  const inferType = (url: string) => {
    const name = url.toLowerCase();
    if (name.includes("pres")) return "PRESCRIPTION";
    if (name.includes("lab")) return "LAB REPORT";
    return "SCAN";
  };

  /* UI BELOW — unchanged */



  return (
    <div className="main" style={{ maxWidth: 900, margin: "0 auto" }}>
      <h2>Doctor Consultation</h2>

      {/* ACCESS BADGE */}
      <span
        style={{
          padding: "4px 12px",
          borderRadius: 999,
          fontSize: 12,
          fontWeight: 600,
          background: accessType === "write" ? "#dcfce7" : "#fee2e2",
          color: accessType === "write" ? "#166534" : "#991b1b",
        }}
      >
        {accessType.toUpperCase()}
      </span>

      {/* TABS */}
      <div style={{ display: "flex", gap: 12, marginTop: 24 }}>
        <button
          className={activeTab === "summary" ? "btn btn-primary" : "btn"}
          onClick={() => setActiveTab("summary")}
        >
          Summary
        </button>
        <button
          className={activeTab === "documents" ? "btn btn-primary" : "btn"}
          onClick={() => setActiveTab("documents")}
        >
          Documents
        </button>
      </div>

      {/* SUMMARY */}
      {activeTab === "summary" && (
        <div className="card" style={{ marginTop: 24 }}>
          <h3>AI Medical Summary</h3>
          <button className="btn btn-primary" style={{ marginTop: 12 }}>
            Generate AI Summary
          </button>
        </div>
      )}

      {/* DOCUMENTS */}
      {activeTab === "documents" && (
        <div className="card" style={{ marginTop: 24 }}>
          <h3>Shared Documents</h3>

          {documents.length === 0 && (
            <p style={{ color: "var(--text-muted)" }}>
              No documents uploaded yet.
            </p>
          )}

          <div style={{ marginTop: 16 }}>
            {documents.map((url, i) => (
              <div
                key={i}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: 14,
                  border: "1px solid #e5e7eb",
                  borderRadius: 12,
                  marginBottom: 10,
                }}
              >
                <div>
                  <strong>{inferType(url)}</strong>
                  <div style={{ fontSize: 12, color: "#64748b" }}>
                    shared document
                  </div>
                </div>

                <a
                  href={getSafeUrl(url)}
                  target="_blank"
                  rel="noreferrer"
                  className="btn"
                >
                  View
                </a>
              </div>
            ))}
          </div>

          {/* UPLOAD (WRITE ONLY) */}
          {accessType === "write" && (
            <div
              style={{
                marginTop: 28,
                paddingTop: 20,
                borderTop: "1px solid #e5e7eb",
              }}
            >
              <h4>Upload New Document</h4>

              <input
                type="file"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
                style={{ marginTop: 12 }}
              />

              <button
                className="btn btn-primary"
                onClick={uploadDocument}
                disabled={loading}
                style={{ marginTop: 12 }}
              >
                {loading ? "Uploading..." : "Upload Document"}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
