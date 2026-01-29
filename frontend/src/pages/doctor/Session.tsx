import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import DocumentModal from "../../components/DocumentModal";

const API = "http://localhost:5000";

type DocType = "Prescription" | "Lab Report" | "Scan" | "Other";

type DocumentItem = { id: string; url: string; type: DocType; uploadedByName?: string; uploadedByRole?: string; createdAt?: string };

export default function DoctorSession() {
  const { sessionId } = useParams();

  const [accessType, setAccessType] = useState<"view" | "write">("view");
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [activeTab, setActiveTab] = useState<"summary" | "documents">("documents");
  const [activeDoc, setActiveDoc] = useState<DocumentItem | null>(null);

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
      } catch {
        // fallback to localStorage if server call fails
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



  const getSafeUrl = (url: string) =>
    url.startsWith("http") ? url : `https://${url}`;

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
      }
    };

    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [expiresAt]);

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

      {/* countdown */}
      <span style={{ marginLeft: 12, fontSize: 13, color: "var(--text-muted)", fontWeight: 600 }}>
        {expiresAt ? formatCountdown(timeLeft) : ""}
      </span>

      {/* TABS */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, marginTop: 24 }}>
        <div style={{ display: "flex", gap: 12 }}>
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

        {accessType === "write" && sessionId && (
          <a className="btn btn-primary" href={`/doctor/session/${sessionId}/upload`} style={{ whiteSpace: "nowrap" }}>Upload Document</a>
        )}
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

          <div className="scroll-list" style={{ marginTop: 16 }}>
            {documents.map((doc, i) => (
              <div
                key={doc.id || i}
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
                  <strong>{inferType(doc)}</strong>
                  <div style={{ fontSize: 12, color: "#64748b" }}>
                    {doc.type} • {doc.uploadedByName ? `Uploaded by ${doc.uploadedByName}` : "Uploaded"} • {doc.createdAt ? new Date(doc.createdAt).toLocaleString() : ""}
                  </div>
                </div>

                <div style={{ display: "flex", gap: 8 }}>
                  <button
                    className="btn btn-secondary"
                    onClick={() => setActiveDoc({ id: doc.id, url: getSafeUrl(doc.url), type: doc.type, uploadedByName: doc.uploadedByName, uploadedByRole: doc.uploadedByRole, createdAt: doc.createdAt })}
                  >
                    View
                  </button>
                  <a href={getSafeUrl(doc.url)} target="_blank" rel="noreferrer" className="btn btn-primary">Open</a>
                </div>
              </div>
            ))}
          </div>

          {/* UPLOAD (WRITE ONLY) */}


          {activeDoc && (
            <DocumentModal
              url={activeDoc.url}
              title={`Shared — ${activeDoc.type}`}
              uploadedByName={activeDoc.uploadedByName}
              uploadedByRole={activeDoc.uploadedByRole}
              createdAt={activeDoc.createdAt}
              onClose={() => setActiveDoc(null)}
            />
          )}
        </div>
      )}
    </div>
  );
}
