import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";

const API = "http://localhost:5000";

type DocType = "Prescription" | "Lab Report" | "Scan" | "Other";

export default function UploadDocument() {
  const { sessionId } = useParams();
  const navigate = useNavigate();

  const [file, setFile] = useState<File | null>(null);
  const [docType, setDocType] = useState<DocType>("Prescription");
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);

  const uploadDocument = async () => {
    if (!file || !sessionId) return;

    setLoading(true);
    setProgress(0);

    const formData = new FormData();
    formData.append("file", file);
    formData.append("type", docType);
    formData.append("uploaderName", localStorage.getItem("doctorName") || "Doctor");
    formData.append("uploaderRole", "doctor");

    try {
      const authToken = localStorage.getItem("authToken");
      const opts: any = {
        onUploadProgress: (e: ProgressEvent) => {
          if (e.total) setProgress(Math.round((e.loaded * 100) / e.total));
        },
      };
      if (authToken) opts.headers = { Authorization: `Bearer ${authToken}` };

      await axios.post(`${API}/api/documents/upload/${sessionId}`, formData, opts);

      window.dispatchEvent(new CustomEvent("toast", { detail: { message: "Document uploaded", type: "success" } }));
      // navigate back to session documents view
      navigate(`/doctor/session/${sessionId}`);
    } catch (err: any) {
      window.dispatchEvent(new CustomEvent("toast", { detail: { message: err?.response?.data?.message || "Upload failed", type: "error" } }));
    } finally {
      setLoading(false);
      setProgress(0);
      setFile(null);
      setDocType("Prescription");
    }
  };

  if (!sessionId) return (
    <div className="main" style={{ maxWidth: 900, margin: "0 auto" }}>
      <div className="card">
        <h3>No Session</h3>
        <p>Open a session via QR scan first.</p>
      </div>
    </div>
  );

  return (
    <div className="main" style={{ maxWidth: 900, margin: "0 auto" }}>
      <h2>Upload Document</h2>

      <div className="card" style={{ marginTop: 18 }}>
        <p style={{ color: "var(--text-muted)", marginBottom: 12 }}>Upload a document to share with the patient for this consultation.</p>

        <label style={{ fontSize: 13, fontWeight: 700 }}>Document Type</label>
        <select value={docType} onChange={(e) => setDocType(e.target.value as DocType)} className="form-select" style={{ marginTop: 8 }}>
          <option>Prescription</option>
          <option>Lab Report</option>
          <option>Scan</option>
          <option>Other</option>
        </select>

        <input
          type="file"
          onChange={(e) => setFile(e.target.files?.[0] || null)}
          style={{ marginTop: 12 }}
        />

        <div style={{ display: "flex", gap: 12, marginTop: 16, alignItems: "center" }}>
          <button className="btn btn-primary" onClick={uploadDocument} disabled={loading || !file}>
            {loading ? `Uploading… ${progress}%` : "Upload Document"}
          </button>

          <button className="btn" onClick={() => navigate(-1)}>
            Cancel
          </button>
        </div>

        <p style={{ marginTop: 12, fontSize: 13, color: "var(--text-muted)" }}>
          You are uploading as <strong>{localStorage.getItem("userName") || localStorage.getItem("doctorName") || "Doctor"}</strong>.
        </p>
      </div>
    </div>
  );
}
