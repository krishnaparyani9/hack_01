import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";

const API = "http://localhost:5000";

type Doc = {
  url: string;
  uploadedBy: "patient" | "doctor";
  type: "prescription" | "lab" | "scan";
};

export default function DoctorSession() {
  const { sessionId } = useParams();

  const [accessType, setAccessType] = useState<"view" | "write">("view");
  const [documents, setDocuments] = useState<Doc[]>([]);
  const [file, setFile] = useState<File | null>(null);
  const [activeTab, setActiveTab] = useState<"summary" | "documents">("summary");
  const [loading, setLoading] = useState(false);

  /* ---------------- FETCH SESSION DATA ---------------- */
  useEffect(() => {
    if (!sessionId) return;

    // accessType was already validated during scan
    const storedAccess = localStorage.getItem("accessType");
    if (storedAccess === "write" || storedAccess === "view") {
      setAccessType(storedAccess);
    }

    fetchDocuments();
  }, [sessionId]);

  const fetchDocuments = async () => {
    try {
      const res = await axios.get(`${API}/api/documents/${sessionId}`);
      setDocuments(res.data.data || []);
    } catch {
      console.error("Failed to load documents");
    }
  };

  /* ---------------- UPLOAD ---------------- */
  const uploadDocument = async (type: Doc["type"]) => {
    if (!file || !sessionId) return;

    setLoading(true);

    const formData = new FormData();
    formData.append("file", file);
    formData.append("uploadedBy", "doctor");
    formData.append("type", type);

    await axios.post(
      `${API}/api/documents/upload/${sessionId}`,
      formData,
      { headers: { "Content-Type": "multipart/form-data" } }
    );

    setFile(null);
    setLoading(false);
    fetchDocuments();
  };

  return (
    <div className="main" style={{ maxWidth: "900px", margin: "0 auto" }}>
      <h2>Doctor Consultation</h2>

      {/* ACCESS BADGE */}
      <span
        style={{
          padding: "4px 10px",
          borderRadius: "999px",
          fontSize: "12px",
          fontWeight: 600,
          background:
            accessType === "write" ? "#dcfce7" : "#fee2e2",
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

      {/* ---------------- SUMMARY ---------------- */}
      {activeTab === "summary" && (
        <div className="card" style={{ marginTop: 24 }}>
          <h3>AI Medical Summary</h3>
          <p style={{ color: "var(--text-muted)" }}>
            Generate a quick overview from uploaded records.
          </p>
          <button className="btn btn-primary" style={{ marginTop: 12 }}>
            Generate AI Summary
          </button>
        </div>
      )}

      {/* ---------------- DOCUMENTS ---------------- */}
      {activeTab === "documents" && (
        <div className="card" style={{ marginTop: 24 }}>
          <h3>Shared Documents</h3>

          {documents.length === 0 && (
            <p style={{ color: "var(--text-muted)" }}>
              No documents uploaded yet.
            </p>
          )}

          <ul style={{ marginTop: 16 }}>
            {documents.map((doc, i) => (
              <li
                key={i}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  marginBottom: 10,
                }}
              >
                <a href={doc.url} target="_blank" rel="noreferrer">
                  {doc.type.toUpperCase()}
                </a>
                <span style={{ fontSize: 12, color: "#64748b" }}>
                  uploaded by {doc.uploadedBy}
                </span>
              </li>
            ))}
          </ul>

          {/* UPLOAD (WRITE ONLY) */}
          {accessType === "write" && (
            <div style={{ marginTop: 24 }}>
              <input
                type="file"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
              />

              <div style={{ display: "flex", gap: 10, marginTop: 12 }}>
                <button onClick={() => uploadDocument("prescription")}>
                  Prescription
                </button>
                <button onClick={() => uploadDocument("lab")}>
                  Lab Report
                </button>
                <button onClick={() => uploadDocument("scan")}>
                  Scan
                </button>
              </div>

              {loading && (
                <p style={{ marginTop: 8, fontSize: 12 }}>
                  Uploading…
                </p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
