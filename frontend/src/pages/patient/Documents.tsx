import { useEffect, useState } from "react";
import axios from "axios";
import DocumentModal from "../../components/DocumentModal";

const API = "http://localhost:5000";

type DocType = "Prescription" | "Lab Report" | "Scan" | "Other";

type DocumentItem = { id: string; url: string; type: DocType; uploadedByName?: string; uploadedByRole?: string; createdAt?: string };

export default function Documents() {
  const [file, setFile] = useState<File | null>(null);
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [docType, setDocType] = useState<DocType>("Prescription");
  const [activeDoc, setActiveDoc] = useState<DocumentItem | null>(null);

  const [patientId, setPatientId] = useState<string>(() => localStorage.getItem("patientId") || "");

  useEffect(() => {
    // Ensure a persistent patientId and fetch documents on mount
    let mounted = true;
    (async () => {
      let pid = patientId;
      // If a sessionId exists (QR session created), prefer the session's patientId
      try {
        const sessionId = localStorage.getItem("sessionId");
        if (sessionId) {
          const sessRes = await axios.get(`${API}/api/session/${sessionId}`);
          const sessPid = sessRes.data?.data?.patientId;
          if (sessPid) {
            pid = sessPid;
            localStorage.setItem("patientId", pid);
            setPatientId(pid);
          }
        }
      } catch (e) {
        // ignore session lookup failures
      }
      if (!pid) {
        // For hackathon convenience: fall back to any stored userId (no strict role check)
        const userId = localStorage.getItem("userId");
        if (userId) {
          pid = userId;
          localStorage.setItem("patientId", pid);
          setPatientId(pid);
        } else {
          // No id available — show empty list but don't block navigation
          setPatientId("");
          if (mounted) setDocuments([]);
          return;
        }
      }

      if (mounted) await fetchDocuments(pid);
    })();

    const onVisibility = () => {
      if (document.visibilityState === "visible") fetchDocuments();
    };

    const onFocus = () => fetchDocuments();

    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("focus", onFocus);

    return () => {
      mounted = false;
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("focus", onFocus);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchDocuments = async (pid?: string) => {
    const id = pid || patientId;
    if (!id) {
      setDocuments([]);
      return;
    }

    try {
      console.log("Fetching documents for patientId:", id);
      const res = await axios.get(`${API}/api/documents/patient/${id}`);
      setDocuments(res.data.data || []);
    } catch (err: unknown) {
      console.error("Failed to fetch documents:", err);
      window.dispatchEvent(new CustomEvent("toast", { detail: { message: "Failed to load documents", type: "error" } }));
      setDocuments([]);
    }
  };

  // convert File to data URL
  const fileToDataUrl = (f: File) =>
    new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        resolve(String(reader.result));
      };
      reader.onerror = (e) => reject(e);
      reader.readAsDataURL(f);
    });

  const uploadDocument = async () => {
    // Patients should always upload with their persistent patientId — QR restrictions apply only to doctors
    if (!file) return;

    // Ensure we have a patient id — if none, generate a lightweight anonymous id so uploads are possible without auth
    let pid = patientId;
    if (!pid) {
      const userId = localStorage.getItem("userId");
      if (userId) {
        pid = userId;
        localStorage.setItem("patientId", pid);
        setPatientId(pid);
      } else {
        // generate a temporary anon id for this client
        pid = `anon-${Date.now()}`;
        localStorage.setItem("patientId", pid);
        setPatientId(pid);
      }
    }

    setLoading(true);
    setProgress(0);

    const formData = new FormData();
    formData.append("file", file);
    formData.append("patientId", pid);
    formData.append("type", docType);
    formData.append("uploaderName", localStorage.getItem("userName") || localStorage.getItem("patientName") || "Patient");
    formData.append("uploaderRole", "patient");

    try {
      // Always use the patient upload endpoint on patient pages so expired sessions don't block uploads
      // Do NOT set Content-Type manually; the browser will add the proper boundary.
      await axios.post(`${API}/api/documents/upload/by-patient`, formData, {
        onUploadProgress: (e) => {
          if (e.total) {
            setProgress(Math.round((e.loaded * 100) / e.total));
          }
        },
      });

      setFile(null);
      fetchDocuments(pid);
    } catch (err: unknown) {
      console.error("Upload error (multipart):", err);

      // show server message when available
      if (axios.isAxiosError(err) && err.response?.data?.message) {
        const msg = err.response.data.message;
        window.dispatchEvent(new CustomEvent("toast", { detail: { message: `Upload failed: ${msg}`, type: "error" } }));
      } else {
        window.dispatchEvent(new CustomEvent("toast", { detail: { message: "Upload failed, trying fallback...", type: "error" } }));
      }

      // FALLBACK: try sending file as data URL via JSON endpoint
      try {
        if (!file) throw new Error("No file for fallback");
        const dataUrl = await fileToDataUrl(file);
        const payload = {
          patientId: pid,
          type: docType,
          uploaderName: localStorage.getItem("userName") || localStorage.getItem("patientName") || "Patient",
          uploaderRole: "patient",
          dataUrl,
        };

        const res = await axios.post(`${API}/api/documents/upload/by-patient-json`, payload, { headers: { "Content-Type": "application/json" } });
        console.log("Fallback upload result:", res.data);
        window.dispatchEvent(new CustomEvent("toast", { detail: { message: "Uploaded via fallback", type: "success" } }));
        setFile(null);
        fetchDocuments(pid);
      } catch (fbErr) {
        console.error("Fallback upload failed:", fbErr);
        if (axios.isAxiosError(fbErr) && fbErr.response?.data?.message) {
          alert(fbErr.response.data.message);
        } else {
          alert("Upload failed");
        }
      }
    } finally {
      setLoading(false);
      setProgress(0);
    }
  };

  const getFileIcon = (url: string) => {
    // accept data: URIs and treat data:image/* as images
    if (url.startsWith("data:image")) return "🖼️";
    if (url.endsWith(".pdf") || url.startsWith("data:application/pdf")) return "📄";
    if (url.match(/\.(jpg|jpeg|png)$/) || url.startsWith("data:image")) return "🖼️";
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

  // Patient ID is auto-created on first visit. QR sessions are optional and only required for granting doctor access.

  return (
    <div className="main" style={{ maxWidth: "760px", margin: "0 auto" }}>
      <h2>Medical Documents</h2>
      <p style={{ color: "var(--text-muted)", marginBottom: "8px" }}>
        Upload prescriptions, lab reports, or medical scans.
      </p>
      <p style={{ color: "var(--text-muted)", marginBottom: "16px", fontSize: 12 }}>
        Viewing patientId: {patientId || "(none)"}
      </p>

      {/* UPLOAD CARD */}
      <div className="card" style={{ marginBottom: "32px" }}>
        <h3>Upload New Document</h3>

        {/* session is optional — patient can still upload; QR is for granting doctor access */}
        {!localStorage.getItem("sessionId") && (
          <p style={{ color: "var(--text-muted)", marginBottom: 12 }}>
            No active QR session. You can still upload documents — generate a QR to allow doctors to access them.
          </p>
        )}

        <label style={{ fontSize: "14px", fontWeight: 600 }}>
          Document Type
        </label>
        <select
          className="form-select"
          value={docType}
          onChange={(e) => setDocType(e.target.value as DocType)}
        >
          <option>Prescription</option>
          <option>Lab Report</option>
          <option>Scan</option>
          <option>Other</option>
        </select>

        <input
          className="file-input"
          type="file"
          onChange={(e) => setFile(e.target.files?.[0] || null)}
        />

        {file && (
          <p className="file-selected">Selected: <strong>{file.name}</strong></p>
        )}

        <div style={{ display: "flex", gap: 12, alignItems: "center", marginTop: 16 }}>
          <button
            className="btn btn-primary"
            onClick={uploadDocument}
            disabled={loading}
          >
            {loading ? "Uploading…" : "Upload Document"}
          </button>

          {loading && (
            <div className="progress-wrap">
              <div className="progress-track">
                <div className="progress-fill" style={{ width: `${progress}%` }} />
              </div>
              <div className="progress-text">Uploading… {progress}%</div>
            </div>
          )}
        </div>
      </div>

      {/* DOCUMENT LIST */}
      <div className="card">
        <h3>Uploaded Files</h3>

        {documents.length === 0 ? (
          <p style={{ color: "var(--text-muted)" }}>
            No documents uploaded yet.
          </p>
        ) : (
          <div className="scroll-list" style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
            {documents.map((doc, index) => {
              const safeUrl = /^(https?:|data:|blob:)/i.test(doc.url) ? doc.url : `https://${doc.url}`;

              return (
                <div key={doc.id || index} className="file-row">
                  <div className="file-left">
                    <div className="file-title">{getFileIcon(doc.url)} <strong>Document {index + 1}</strong></div>

                    <span
                      className="doc-badge"
                      style={{ background: getBadgeColor(doc.type as DocType), color: "#0b1220" }}
                    >
                      {doc.type}
                    </span>

                    <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 6 }}>
                      <span>{doc.uploadedByName ? `Uploaded by ${doc.uploadedByName}` : "Uploaded"}</span>
                      <span style={{ marginLeft: 8 }}>•</span>
                      <span style={{ marginLeft: 8 }}>{doc.createdAt ? new Date(doc.createdAt).toLocaleString() : ""}</span>
                    </div>
                  </div>

                  <div className="file-actions">
                    <button
                      className="btn btn-secondary"
                      onClick={() => setActiveDoc({ id: doc.id, url: safeUrl, type: doc.type, uploadedByName: doc.uploadedByName, uploadedByRole: doc.uploadedByRole, createdAt: doc.createdAt })}
                    >
                      View
                    </button>

                    <button
                      className="btn btn-ghost"
                      onClick={async () => {
                        if (!confirm("Delete this document?")) return;
                        try {
                          // require auth token for delete
                          const token = localStorage.getItem("authToken");
                          if (!token) {
                            window.dispatchEvent(new CustomEvent("toast", { detail: { message: "Sign in to delete documents", type: "error" } }));
                            return;
                          }

                          await axios.delete(`${API}/api/documents/${doc.id}`, {
                            headers: { Authorization: `Bearer ${token}` },
                          });

                          window.dispatchEvent(new CustomEvent("toast", { detail: { message: "Document deleted", type: "success" } }));
                          fetchDocuments();
                        } catch (err: unknown) {
                          if (axios.isAxiosError(err) && err.response?.data?.message) {
                            window.dispatchEvent(new CustomEvent("toast", { detail: { message: err.response.data.message, type: "error" } }));
                          } else {
                            window.dispatchEvent(new CustomEvent("toast", { detail: { message: "Delete failed", type: "error" } }));
                          }
                        }
                      }}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {activeDoc && (
        <DocumentModal
          url={activeDoc.url}
          title={`Document — ${activeDoc.type}`}
          uploadedByName={activeDoc.uploadedByName}
          uploadedByRole={activeDoc.uploadedByRole}
          createdAt={activeDoc.createdAt}
          onClose={() => setActiveDoc(null)}
        />
      )}
    </div>
  );
}
