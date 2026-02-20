import { useEffect, useState } from "react";
import axios from "axios";
import DocumentModal from "../../components/DocumentModal";
import PatientLayout from "../../components/PatientLayout";

const API = "http://localhost:5000";

type DocType = "Prescription" | "Lab Report" | "Scan" | "Other";

type DocumentItem = { id: string; url: string; type: DocType; uploadedByName?: string; uploadedByRole?: string; createdAt?: string };

const getBadgeClass = (type: DocType) => {
  switch (type) {
    case "Prescription": return "app-doc-badge app-doc-badge--prescription";
    case "Lab Report": return "app-doc-badge app-doc-badge--lab";
    case "Scan": return "app-doc-badge app-doc-badge--scan";
    default: return "app-doc-badge app-doc-badge--other";
  }
};

const getFileIcon = (url: string) => {
  if (url.startsWith("data:image")) return "🖼️";
  if (url.endsWith(".pdf") || url.startsWith("data:application/pdf")) return "📄";
  if (url.match(/\.(jpg|jpeg|png)$/) || url.startsWith("data:image")) return "🖼️";
  return "📁";
};

export default function Documents() {
  const [file, setFile] = useState<File | null>(null);
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [docType, setDocType] = useState<DocType>("Prescription");
  const [activeDoc, setActiveDoc] = useState<DocumentItem | null>(null);

  const [patientId, setPatientId] = useState<string>(() => localStorage.getItem("patientId") || "");

  useEffect(() => {
    let mounted = true;
    (async () => {
      let pid = patientId;
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
        const userId = localStorage.getItem("userId");
        if (userId) {
          pid = userId;
          localStorage.setItem("patientId", pid);
          setPatientId(pid);
        } else {
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
    if (!file) return;

    let pid = patientId;
    if (!pid) {
      const userId = localStorage.getItem("userId");
      if (userId) {
        pid = userId;
        localStorage.setItem("patientId", pid);
        setPatientId(pid);
      } else {
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

      if (axios.isAxiosError(err) && err.response?.data?.message) {
        const msg = err.response.data.message;
        window.dispatchEvent(new CustomEvent("toast", { detail: { message: `Upload failed: ${msg}`, type: "error" } }));
      } else {
        window.dispatchEvent(new CustomEvent("toast", { detail: { message: "Upload failed, trying fallback...", type: "error" } }));
      }

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

  return (
    <PatientLayout>
      <div className="app-ambient">
        {/* ── Page header ── */}
        <div className="app-header">
          <span className="app-kicker">Documents</span>
          <h2 className="app-title">Medical Documents</h2>
          <p className="app-subtitle">Upload prescriptions, lab reports, or medical scans securely to your profile.</p>
        </div>

        {/* ── Upload card ── */}
        <section className="app-upload-card">
          <div className="app-upload-card__header">
            <div className="app-upload-card__icon">📤</div>
            <div>
              <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800 }}>Upload New Document</h3>
              {!localStorage.getItem("sessionId") && (
                <p style={{ color: "var(--text-muted)", fontSize: 13, margin: "4px 0 0" }}>
                  No active QR session — you can still upload. Generate a QR to allow doctors access.
                </p>
              )}
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            <div>
              <label style={{ fontSize: 13, fontWeight: 700, display: "block", marginBottom: 6 }}>Document Type</label>
              <select
                className="app-select"
                value={docType}
                onChange={(e) => setDocType(e.target.value as DocType)}
              >
                <option>Prescription</option>
                <option>Lab Report</option>
                <option>Scan</option>
                <option>Other</option>
              </select>
            </div>
            <div>
              <label style={{ fontSize: 13, fontWeight: 700, display: "block", marginBottom: 6 }}>Choose File</label>
              <input
                className="app-file-input"
                type="file"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
              />
            </div>
          </div>

          {file && (
            <div style={{
              marginTop: 14,
              padding: "12px 16px",
              borderRadius: 14,
              background: "rgba(43,124,255,0.06)",
              border: "1px solid rgba(43,124,255,0.12)",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 12
            }}>
              <div>
                <p style={{ margin: 0, fontWeight: 700, fontSize: 14 }}>📎 {file.name}</p>
                <p style={{ margin: "2px 0 0", fontSize: 12, color: "var(--text-muted)" }}>{(file.size / 1024).toFixed(1)} KB</p>
              </div>
              <button className="btn btn-secondary" onClick={() => setFile(null)} style={{ padding: "6px 12px", fontSize: 12 }}>Remove</button>
            </div>
          )}

          <div style={{ display: "flex", gap: 12, alignItems: "center", marginTop: 18 }}>
            <button
              className="btn btn-primary"
              onClick={uploadDocument}
              disabled={loading || !file}
              style={{ padding: "12px 24px" }}
            >
              {loading ? "Uploading…" : "Upload Document"}
            </button>

            {loading && (
              <div style={{ flex: 1, maxWidth: 260 }}>
                <div style={{ height: 8, borderRadius: 20, background: "rgba(43,124,255,0.08)", overflow: "hidden" }}>
                  <div style={{
                    height: "100%",
                    borderRadius: 20,
                    background: "linear-gradient(90deg, var(--primary), var(--accent))",
                    width: `${progress}%`,
                    transition: "width 160ms ease"
                  }} />
                </div>
                <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 4 }}>Uploading… {progress}%</div>
              </div>
            )}
          </div>
        </section>

        {/* ── Document list ── */}
        <section className="app-glass-card">
          <h3 style={{ margin: "0 0 18px", fontSize: 16, fontWeight: 800 }}>Uploaded Files</h3>

          {documents.length === 0 ? (
            <div style={{ textAlign: "center", padding: 28 }}>
              <div style={{ fontSize: 48, marginBottom: 14 }}>📂</div>
              <p style={{ color: "var(--text-muted)", fontSize: 15 }}>No documents uploaded yet.</p>
              <p style={{ color: "var(--text-muted)", fontSize: 13, marginTop: 4 }}>Use the upload form above to add your first document.</p>
            </div>
          ) : (
            <div className="scroll-list" style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {documents.map((doc, index) => {
                const safeUrl = /^(https?:|data:|blob:)/i.test(doc.url) ? doc.url : `https://${doc.url}`;

                return (
                  <div key={doc.id || index} className="app-doc-item">
                    <div className="app-doc-item__info">
                      <div className="app-doc-item__title">
                        {getFileIcon(doc.url)} <strong>Document {index + 1}</strong>
                        <span className={getBadgeClass(doc.type as DocType)}>{doc.type}</span>
                      </div>
                      <div className="app-doc-item__meta">
                        {doc.uploadedByName ? `Uploaded by ${doc.uploadedByName}` : "Uploaded"}
                        {doc.createdAt && ` • ${new Date(doc.createdAt).toLocaleString()}`}
                      </div>
                    </div>

                    <div className="app-doc-item__actions">
                      <button
                        className="btn btn-secondary"
                        onClick={() => setActiveDoc({ id: doc.id, url: safeUrl, type: doc.type, uploadedByName: doc.uploadedByName, uploadedByRole: doc.uploadedByRole, createdAt: doc.createdAt })}
                      >
                        View
                      </button>

                      <button
                        className="btn"
                        style={{ color: "#dc2626", fontWeight: 700, fontSize: 13 }}
                        onClick={async () => {
                          if (!confirm("Delete this document?")) return;
                          try {
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
        </section>

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
    </PatientLayout>
  );
}
