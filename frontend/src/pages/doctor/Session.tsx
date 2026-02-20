import { useCallback, useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import DocumentModal from "../../components/DocumentModal";
import TiltCard from "../../components/TiltCard";

const API = "http://localhost:5000";

type DocType = "Prescription" | "Lab Report" | "Scan" | "Other";

type DocumentItem = { id: string; url: string; type: DocType; uploadedByName?: string; uploadedByRole?: string; createdAt?: string };

export default function DoctorSession() {
  const { sessionId } = useParams();
  const navigate = useNavigate();

  const [accessType, setAccessType] = useState<"view" | "write">("view");
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [activeTab, setActiveTab] = useState<"summary" | "documents">("documents");
  const [activeDoc, setActiveDoc] = useState<DocumentItem | null>(null);
  const [summaries, setSummaries] = useState<{ [docId: string]: string }>({});
  const [generating, setGenerating] = useState(false);

  // countdown / expiry handling
  const [expiresAt, setExpiresAt] = useState<number | null>(null);
  const [timeLeft, setTimeLeft] = useState<number>(0);

  useEffect(() => {
    if (!sessionId) return;

    (async () => {
      try {
        const res = await axios.get(`${API}/api/session/${sessionId}`);
        const { accessType, expiresAt: exp } = res.data.data;

        if (accessType === "view" || accessType === "write") {
          setAccessType(accessType);
          localStorage.setItem("doctorAccessType", accessType);
          // persist which session the doctor is actively viewing
          localStorage.setItem("doctorActiveSessionId", sessionId as string);
        }

        // set countdown values if provided
        if (exp) {
          setExpiresAt(exp);
          setTimeLeft(Math.max(0, exp - Date.now()));
        }
      } catch (err) {
        // If the session was deleted/ended on the server, redirect back to dashboard
        const status = (err as any)?.response?.status;
        if (status === 404) {
          window.dispatchEvent(new CustomEvent("toast", { detail: { message: "Session ended", type: "error" } }));
          navigate("/doctor/dashboard");
          return;
        }

        // fallback to localStorage if server call fails for other reasons
        const storedAccess = localStorage.getItem("doctorAccessType");
        if (storedAccess === "view" || storedAccess === "write") {
          setAccessType(storedAccess);
        }
      }
    })();

    fetchDocuments();
  }, [sessionId]);

  const fetchDocuments = async () => {
    const res = await axios.get(`${API}/api/documents/${sessionId}`);
    // backend returns array of objects { id, url, type }
    setDocuments(res.data.data || []);

  };

  const generateSummary = async () => {
    if (documents.length === 0) {
      window.dispatchEvent(new CustomEvent("toast", { detail: { message: "No documents to summarize", type: "error" } }));
      return;
    }

    setGenerating(true);
    const newSummaries: { [docId: string]: string } = {};

    try {
      for (const doc of documents) {
        try {
          const res = await axios.post(`${API}/api/documents/${doc.id}/summarize`);
          newSummaries[doc.id] = res.data.data.summary;
        } catch (err: any) {
          console.error(`Failed to summarize document ${doc.id}:`, err);
          newSummaries[doc.id] = "Error generating summary. Please try again.";
        }
      }
      setSummaries(newSummaries);
      window.dispatchEvent(new CustomEvent("toast", { detail: { message: "Summaries generated successfully", type: "success" } }));
    } catch (err) {
      window.dispatchEvent(new CustomEvent("toast", { detail: { message: "Failed to generate summaries", type: "error" } }));
    } finally {
      setGenerating(false);
    }
  };



  // Memoized so a stable reference is passed to DocumentModal — prevents
  // the countdown timer's setTimeLeft from causing DocumentModal to re-mount.
  const useCloseDoc = useCallback(() => setActiveDoc(null), []);

  const getSafeUrl = (url: string) =>
    /^(https?:|data:|blob:)/i.test(url) ? url : `https://${url}`;

  const inferType = (doc: DocumentItem) => {
    if (doc.type) return doc.type.toUpperCase();
    const name = doc.url.toLowerCase();
    if (name.includes("pres")) return "PRESCRIPTION";
    if (name.includes("lab")) return "LAB REPORT";
    return "SCAN";
  };

  // countdown tick
  const formatCountdown = (ms: number) => {
    if (ms <= 0) return "Expired";
    const sec = Math.floor(ms / 1000);
    const h = Math.floor(sec / 3600);
    const m = Math.floor((sec % 3600) / 60);
    const s = sec % 60;
    if (h > 0) return `${h}h ${m}m`;
    return `${m}m ${String(s).padStart(2, "0")}s`;
  };

  useEffect(() => {
    if (!expiresAt) return;
    let notified = false;

    const tick = () => {
      const left = Math.max(0, (expiresAt || 0) - Date.now());
      setTimeLeft(left);
      if (left === 0 && !notified) {
        notified = true;
        window.dispatchEvent(new CustomEvent("toast", { detail: { message: "Session expired", type: "error" } }));
        // switch to view mode locally
        setAccessType("view");
        localStorage.removeItem("doctorAccessType");
        // Redirect doctor back to dashboard when session expires
        navigate("/doctor/dashboard");
      }
    };

    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [expiresAt]);

  // Listen for storage changes (session cleared from another tab) and redirect
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === "doctorActiveSessionId" && !e.newValue) {
        window.dispatchEvent(new CustomEvent("toast", { detail: { message: "Session ended", type: "error" } }));
        navigate("/doctor/dashboard");
      }
    };

    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, [navigate]);

  /* UI BELOW — unchanged */


  return (
    <div className="main" style={{ maxWidth: 1100, margin: "0 auto" }}>
      <div className="hk-session-header">
        <div className="hk-session-title">
          <h2>Consultation Session</h2>
          <div className="muted">Session-based access to patient records (time-limited).</div>
        </div>

        <div className="hk-session-meta">
          <span className={`hk-badge ${accessType === "write" ? "hk-badge--write" : "hk-badge--view"}`}>{accessType.toUpperCase()}</span>
          {expiresAt ? <span className="hk-badge">Time left: {formatCountdown(timeLeft)}</span> : null}
          {sessionId ? <span className="hk-badge">Session: {sessionId}</span> : null}
          {accessType === "write" && sessionId && (
            <a className="btn btn-primary" href={`/doctor/session/${sessionId}/upload`} style={{ whiteSpace: "nowrap" }}>
              Upload Document
            </a>
          )}
        </div>
      </div>

      <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
        <button className={activeTab === "documents" ? "btn btn-primary" : "btn"} onClick={() => setActiveTab("documents")}>
          Documents
        </button>
        <button className={activeTab === "summary" ? "btn btn-primary" : "btn"} onClick={() => setActiveTab("summary")}>
          AI Summary
        </button>
      </div>

      {activeTab === "documents" && (
        <div className="hk-split">
          <TiltCard className="card" tiltMaxDeg={5}>
            <h3>Shared documents</h3>
            <p className="muted">Click "View" on any document to open it.</p>

            {documents.length === 0 ? (
              <div className="card" style={{ marginTop: 14 }}>
                <p className="muted">No documents uploaded yet.</p>
              </div>
            ) : (
              <div className="hk-doc-list" style={{ marginTop: 14 }}>
                {documents.map((doc) => {
                  return (
                    <div
                      key={doc.id}
                      className="hk-doc-item"
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10 }}>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontWeight: 900 }}>{inferType(doc)}</div>
                          <div className="muted" style={{ marginTop: 6 }}>
                            {doc.uploadedByName ? `Uploaded by ${doc.uploadedByName}` : "Uploaded"}
                            {doc.createdAt ? ` • ${new Date(doc.createdAt).toLocaleString()}` : ""}
                          </div>
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
                          <span className="doc-badge">{doc.type}</span>
                          <button
                            className="btn btn-secondary"
                            style={{ padding: "5px 14px", fontSize: 13 }}
                            onClick={() => setActiveDoc({ id: doc.id, url: getSafeUrl(doc.url), type: doc.type, uploadedByName: doc.uploadedByName, uploadedByRole: doc.uploadedByRole, createdAt: doc.createdAt })}
                          >
                            View
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </TiltCard>

        </div>
      )}

      {activeTab === "summary" && (
        <TiltCard className="card" tiltMaxDeg={4}>
          <h3>AI Medical Summary</h3>
          <p className="muted">Generates structured summaries derived only from the document text content.</p>
          <button className="btn btn-primary" style={{ marginTop: 12 }} onClick={generateSummary} disabled={generating}>
            {generating ? "Generating…" : "Generate AI Summary"}
          </button>

          {Object.keys(summaries).length > 0 && (
            <div style={{ marginTop: 16 }}>
              {documents.map((doc) =>
                summaries[doc.id] ? (
                  <div key={doc.id} className="card" style={{ marginBottom: 12, background: "var(--surface-2)", border: "1px solid var(--border)" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10 }}>
                      <strong>{inferType(doc)}</strong>
                      <span className="doc-badge">{doc.type}</span>
                    </div>
                    <div style={{ whiteSpace: "pre-line", marginTop: 10, lineHeight: 1.65 }}>{summaries[doc.id]}</div>
                  </div>
                ) : null
              )}
            </div>
          )}
        </TiltCard>
      )}

      {activeDoc && (
        <DocumentModal
          url={activeDoc.url}
          title={`Shared — ${activeDoc.type}`}
          uploadedByName={activeDoc.uploadedByName}
          uploadedByRole={activeDoc.uploadedByRole}
          createdAt={activeDoc.createdAt}
          onClose={useCloseDoc}
        />
      )}
    </div>
  );
}
