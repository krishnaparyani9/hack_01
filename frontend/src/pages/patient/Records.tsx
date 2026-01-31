import { useEffect, useState } from "react";
import axios from "axios";
import DocumentModal from "../../components/DocumentModal";
import QrModal from "../../components/QrModal";

const API = "http://localhost:5000";

type DocType = "Prescription" | "Lab Report" | "Scan" | "Other";

type DocumentItem = { id: string; url: string; type: DocType; uploadedByName?: string; uploadedByRole?: string; createdAt?: string };

export default function Records() {
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [activeDoc, setActiveDoc] = useState<DocumentItem | null>(null);
  const [patientId, setPatientId] = useState<string>(() => localStorage.getItem("patientId") || "");

  // NEW: multi-select + share state
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [shareDocs, setShareDocs] = useState<DocumentItem[] | null>(null);
  const [showShareModal, setShowShareModal] = useState(false);
  const [shareAccessType, setShareAccessType] = useState<"view" | "write">("view");
  const [shareDuration, setShareDuration] = useState<number>(15);
  const [qrToken, setQrToken] = useState<string | null>(null);
  const [showQrModal, setShowQrModal] = useState(false);
  const [generatingShare, setGeneratingShare] = useState(false);

  useEffect(() => {
    let mounted = true;

    (async () => {
      let pidForFetch = patientId; // default to stored component state
      // If a sessionId exists (QR session created), prefer the session's patientId
      try {
        const sessionId = localStorage.getItem("sessionId");
        if (sessionId) {
          const sessRes = await axios.get(`${API}/api/session/${sessionId}`);
          const sessPid = sessRes.data?.data?.patientId;
          if (sessPid) {
            // Use session's patientId for this fetch only; do NOT overwrite
            // global `patientId` in localStorage to avoid accidental changes.
            pidForFetch = sessPid;
          }
        }
      } catch (e) {
        // ignore session lookup failures
      }

      if (!pidForFetch) {
        const userId = localStorage.getItem("userId");
        const userRole = (localStorage.getItem("userRole") || "").toLowerCase();
        // Only default to the signed-in user id when they're actually a patient
        if (userId && userRole === "patient") {
          pidForFetch = userId;
          // only persist when there was no stored patientId previously
          if (!localStorage.getItem("patientId")) {
            localStorage.setItem("patientId", pidForFetch);
            setPatientId(pidForFetch);
          }
        } else {
          setPatientId("");
          if (mounted) setDocuments([]);
          return;
        }
      }

      if (mounted) await fetchDocuments(pidForFetch);
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
  }, [patientId]);

  const fetchDocuments = async (pid?: string) => {
    const id = pid || patientId;
    if (!id) {
      setDocuments([]);
      return;
    }

    try {
      console.log("Fetching records for patientId:", id);
      const res = await axios.get(`${API}/api/documents/patient/${id}`);
      setDocuments(res.data.data || []);
    } catch (err) {
      console.error("Failed to fetch records:", err);
      window.dispatchEvent(new CustomEvent("toast", { detail: { message: "Failed to load records", type: "error" } }));
      setDocuments([]);
    }
  };

  // NEW: toggle selection for a document
  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      if (prev.includes(id)) return prev.filter((p) => p !== id);
      return [...prev, id];
    });
  };

  // NEW: open share modal for currently selected documents
  const openShareForSelected = () => {
    if (selectedIds.length === 0) {
      window.dispatchEvent(new CustomEvent("toast", { detail: { message: "Select one or more documents to share", type: "error" } }));
      return;
    }
    const docs = documents.filter((d) => selectedIds.includes(d.id));
    setShareDocs(docs);
    setShareAccessType("view");
    setShareDuration(15);
    setShowShareModal(true);
  };

  // NEW: quick-open share modal for a single document (keeps selection in sync)
  const openShareForDoc = (doc: DocumentItem) => {
    setSelectedIds([doc.id]);
    setShareDocs([doc]);
    setShareAccessType("view");
    setShareDuration(15);
    setShowShareModal(true);
  };

  // NEW: generate session & QR including sharedDocIds array
  const generateShare = async () => {
    if (!shareDocs || shareDocs.length === 0) return;
    try {
      setGeneratingShare(true);

      const userId = localStorage.getItem("userId") || localStorage.getItem("patientId");
      const userRoleRaw = localStorage.getItem("userRole");
      const authToken = localStorage.getItem("authToken");
      const isSignedInPatient = (userRoleRaw || "").toLowerCase() === "patient" && !!authToken;

      if (!userId) {
        window.dispatchEvent(new CustomEvent("toast", { detail: { message: "Please sign in as a patient to generate a QR", type: "error" } }));
        return;
      }

      const patientIdToUse = userId as string;
      try {
        const storedPid = localStorage.getItem("patientId");
        const isSignedInPatientLocal = (userRoleRaw || "").toLowerCase() === "patient" && !!authToken;
        if (!storedPid || isSignedInPatientLocal) {
          localStorage.setItem("patientId", patientIdToUse);
          setPatientId(patientIdToUse);
        }
      } catch {}

      const sharedDocIds = shareDocs.map((d) => d.id);

      let res;
      try {
        if (isSignedInPatient) {
          res = await axios.post(
            `${API}/api/session/create`,
            { accessType: shareAccessType, durationMinutes: shareDuration, patientId: patientIdToUse, sharedDocIds },
            { headers: { Authorization: `Bearer ${authToken}` } }
          );
        } else {
          // fallback anonymous creation
          res = await axios.post(`${API}/api/session/create-anon`, { accessType: shareAccessType, durationMinutes: shareDuration, patientId: patientIdToUse, sharedDocIds });
        }
      } catch (err: any) {
        if (err?.response?.status === 409) {
          window.dispatchEvent(new CustomEvent("toast", { detail: { message: "An active session already exists — wait until it expires", type: "error" } }));
          return;
        }
        throw err;
      }

      const { token, sessionId } = res.data.data;

      // persist session and the array of doc ids
      localStorage.setItem("sessionId", sessionId);
      localStorage.setItem("sessionSharedDocIds", JSON.stringify(sharedDocIds));

      setQrToken(token);
      setShowQrModal(true);
      setShowShareModal(false);
      window.dispatchEvent(new CustomEvent("toast", { detail: { message: `QR created — sharing ${sharedDocIds.length} document(s)`, type: "success" } }));
    } catch (err) {
      window.dispatchEvent(new CustomEvent("toast", { detail: { message: "Failed to generate QR", type: "error" } }));
    } finally {
      setGeneratingShare(false);
    }
  };

  if (!patientId) {
    return (
      <div className="card">
        <h3>Sign In Required</h3>
        <p>Please sign in as a patient to view your records.</p>
      </div>
    );
  }

  return (
    <div className="main" style={{ maxWidth: "760px", margin: "0 auto" }}>
      <h2>My Records</h2>
      <p style={{ color: "var(--text-muted)", marginBottom: "8px" }}>
        All documents linked to your account.
      </p>

      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 12 }}>
        <button className="btn btn-primary" onClick={openShareForSelected} disabled={selectedIds.length === 0}>
          Share Selected ({selectedIds.length})
        </button>
      </div>

      <div className="card">
        {documents.length === 0 ? (
          <p style={{ color: "var(--text-muted)" }}>
            No records available yet.
          </p>
        ) : (
          <div className="scroll-list" style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
            {documents.map((doc, index) => {
              const safeUrl = /^(https?:|data:|blob:)/i.test(doc.url) ? doc.url : `https://${doc.url}`;

              return (
                <div
                  key={doc.id || index}
                  style={{
                    padding: "16px",
                    border: "1px solid #e5e7eb",
                    borderRadius: "12px",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                    <input
                      type="checkbox"
                      aria-label={`Select document ${index + 1}`}
                      checked={selectedIds.includes(doc.id)}
                      onChange={() => toggleSelect(doc.id)}
                    />
                    <div>
                      <strong>Medical Record {index + 1}</strong>
                      <p style={{ fontSize: "12px", color: "var(--text-muted)" }}>
                        {doc.type} • {doc.uploadedByName ? `Uploaded by ${doc.uploadedByName}` : "Uploaded"} {doc.createdAt ? `• ${new Date(doc.createdAt).toLocaleString()}` : ""} • Secure cloud document
                      </p>
                    </div>
                  </div>

                  <div style={{ display: "flex", gap: 8 }}>
                    <button
                      className="btn btn-secondary"
                      onClick={() => setActiveDoc({ id: doc.id, url: safeUrl, type: doc.type, uploadedByName: doc.uploadedByName, uploadedByRole: doc.uploadedByRole, createdAt: doc.createdAt })}
                    >
                      View
                    </button>

                    <button className="btn btn-primary" onClick={() => openShareForDoc(doc)}>
                      Share
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Share modal for multiple docs */}
      {showShareModal && shareDocs && (
        <div className="editor-modal" role="dialog" aria-modal onClick={() => setShowShareModal(false)}>
          <div className="editor-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 520 }}>
            <button aria-label="Close" className="btn btn-secondary" style={{ position: "absolute", right: 12, top: 12 }} onClick={() => setShowShareModal(false)}>✕</button>
            <h3>Share {shareDocs.length} Document{shareDocs.length > 1 ? "s" : ""}</h3>
            <p style={{ color: "var(--text-muted)" }}>{shareDocs.map((d) => d.type).join(", ")}</p>

            <label><strong>Access Type</strong></label>
            <select value={shareAccessType} onChange={(e) => setShareAccessType(e.target.value as "view" | "write")} style={{ width: "100%", margin: "8px 0 16px", padding: "10px" }}>
              <option value="view">View Only</option>
              <option value="write">View + Write</option>
            </select>

            <label><strong>Duration (minutes)</strong></label>
            <input type="number" min={1} value={shareDuration} onChange={(e) => setShareDuration(Number(e.target.value))} style={{ width: "100%", margin: "8px 0 16px", padding: "10px" }} />

            <div style={{ display: "flex", gap: 8 }}>
              <button className="btn btn-primary" onClick={generateShare} disabled={generatingShare}>
                {generatingShare ? "Generating…" : `Generate QR for ${shareDocs.length} file${shareDocs.length > 1 ? "s" : ""}`}
              </button>
              <button className="btn" onClick={() => setShowShareModal(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* existing document modal */}
      {activeDoc && (
        <DocumentModal
          url={activeDoc.url}
          title={`Record — ${activeDoc.type}`}
          uploadedByName={activeDoc.uploadedByName}
          uploadedByRole={activeDoc.uploadedByRole}
          createdAt={activeDoc.createdAt}
          onClose={() => setActiveDoc(null)}
        />
      )}

      {/* QR modal */}
      {showQrModal && qrToken && <QrModal token={qrToken} onClose={() => { setShowQrModal(false); setQrToken(null); }} />}
    </div>
  );
}
