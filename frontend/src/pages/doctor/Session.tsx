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

  const [accessType, setAccessType] =
    useState<"view" | "write" | null>(null);
  const [documents, setDocuments] = useState<Doc[]>([]);
  const [file, setFile] = useState<File | null>(null);
  const [activeTab, setActiveTab] =
    useState<"summary" | "documents">("summary");
  const [uploading, setUploading] = useState(false);

  /* ---------------- INIT ---------------- */
// inside useEffect
useEffect(() => {
  if (!sessionId) return;

  const storedAccess = localStorage.getItem("doctorAccessType");

  if (storedAccess === "write" || storedAccess === "view") {
    setAccessType(storedAccess);
  }

  fetchDocuments();
}, [sessionId]);


  const fetchDocuments = async () => {
    const res = await axios.get(`${API}/api/documents/${sessionId}`);
    setDocuments(res.data.data || []);
  };

  /* ---------------- UPLOAD ---------------- */
  const uploadDocument = async (type: Doc["type"]) => {
    if (!file || !sessionId) return;

    setUploading(true);

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
    setUploading(false);
    fetchDocuments();
  };

  if (!accessType) return <p style={{ padding: 20 }}>Loading…</p>;

  /* ---------------- UI ---------------- */
  return (
    <div className="main" style={{ maxWidth: 900, margin: "0 auto" }}>
      <h2>Doctor Consultation</h2>

      {/* ACCESS BADGE */}
      <span
        style={{
          padding: "6px 12px",
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
      <div style={{ display: "flex", gap: 10, marginTop: 24 }}>
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
            Generate a quick summary from patient documents.
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

          {/* DOCUMENT LIST */}
          {documents.length === 0 ? (
            <p style={{ color: "var(--text-muted)", marginTop: 12 }}>
              No documents uploaded yet.
            </p>
          ) : (
            <div style={{ marginTop: 16 }}>
              {documents.map((doc, i) => (
                <div
                  key={i}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "12px",
                    border: "1px solid #e5e7eb",
                    borderRadius: 10,
                    marginBottom: 10,
                  }}
                >
                  <div>
                    <strong>
                      {doc.type.toUpperCase()}
                    </strong>
                    <span
                      style={{
                        marginLeft: 8,
                        fontSize: 12,
                        color: "#64748b",
                      }}
                    >
                      • uploaded by {doc.uploadedBy}
                    </span>
                  </div>

                  <a
                    href={doc.url}
                    target="_blank"
                    rel="noreferrer"
                    className="btn"
                  >
                    View
                  </a>
                </div>
              ))}
            </div>
          )}

          {/* UPLOAD SECTION (WRITE ONLY) */}
          {accessType === "write" && (
            <div
              style={{
                marginTop: 24,
                paddingTop: 20,
                borderTop: "1px dashed #e5e7eb",
              }}
            >
              <h4>Upload Document</h4>

              <input
                type="file"
                onChange={(e) =>
                  setFile(e.target.files?.[0] || null)
                }
                style={{ marginTop: 8 }}
              />

              {file && (
                <p style={{ fontSize: 12, marginTop: 6 }}>
                  Selected: {file.name}
                </p>
              )}

              <div style={{ display: "flex", gap: 10, marginTop: 12 }}>
                <button
                  disabled={!file || uploading}
                  onClick={() => uploadDocument("prescription")}
                >
                  Prescription
                </button>
                <button
                  disabled={!file || uploading}
                  onClick={() => uploadDocument("lab")}
                >
                  Lab
                </button>
                <button
                  disabled={!file || uploading}
                  onClick={() => uploadDocument("scan")}
                >
                  Scan
                </button>
              </div>

              {uploading && (
                <p style={{ fontSize: 12, marginTop: 8 }}>
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
