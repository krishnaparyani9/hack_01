import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import DocumentModal from "../../components/DocumentModal";
import QrModal from "../../components/QrModal";
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

export default function Records() {
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [activeDoc, setActiveDoc] = useState<DocumentItem | null>(null);
  const [patientId, setPatientId] = useState<string>(() => localStorage.getItem("patientId") || "");

  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [shareDocs, setShareDocs] = useState<DocumentItem[] | null>(null);
  const [showShareModal, setShowShareModal] = useState(false);
  const [shareAccessType, setShareAccessType] = useState<"view" | "write">("view");
  const [shareDuration, setShareDuration] = useState<number>(15);
  const [qrToken, setQrToken] = useState<string | null>(null);
  const [showQrModal, setShowQrModal] = useState(false);
  const [generatingShare, setGeneratingShare] = useState(false);
  const [typeFilter, setTypeFilter] = useState<DocType | "All">("All");

  const typeOptions = useMemo(() => {
    const unique = Array.from(new Set(documents.map((doc) => doc.type)));
    return ["All", ...unique];
  }, [documents]);

  const filteredDocuments = useMemo(() => {
    if (typeFilter === "All") return documents;
    return documents.filter((doc) => doc.type === typeFilter);
  }, [documents, typeFilter]);

  useEffect(() => {
    let mounted = true;

    (async () => {
      let pidForFetch = patientId;
      try {
        const sessionId = localStorage.getItem("sessionId");
        if (sessionId) {
          const sessRes = await axios.get(`${API}/api/session/${sessionId}`);
          const sessPid = sessRes.data?.data?.patientId;
          if (sessPid) {
            pidForFetch = sessPid;
          }
        }
      } catch (e) {
        // ignore session lookup failures
      }

      if (!pidForFetch) {
        const userId = localStorage.getItem("userId");
        const userRole = (localStorage.getItem("userRole") || "").toLowerCase();
        if (userId && userRole === "patient") {
          pidForFetch = userId;
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

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      if (prev.includes(id)) return prev.filter((p) => p !== id);
      return [...prev, id];
    });
  };

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

  const openShareForDoc = (doc: DocumentItem) => {
    setSelectedIds([doc.id]);
    setShareDocs([doc]);
    setShareAccessType("view");
    setShareDuration(15);
    setShowShareModal(true);
  };

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
      <PatientLayout>
        <div className="app-ambient">
          <div className="app-glass-card" style={{ textAlign: "center", padding: 40 }}>
            <h3 style={{ fontSize: 18, marginBottom: 8 }}>Sign In Required</h3>
            <p style={{ color: "var(--text-muted)" }}>Please sign in as a patient to view your records.</p>
          </div>
        </div>
      </PatientLayout>
    );
  }

  return (
    <PatientLayout>
      <div className="app-ambient">
        {/* ── Page header ── */}
        <div className="app-header">
          <span className="app-kicker">Records</span>
          <h2 className="app-title">My Records</h2>
          <p className="app-subtitle">All documents linked to your account. Select documents to share via QR.</p>
        </div>

        {/* ── Document list card ── */}
        <section className="app-glass-card">
          {documents.length === 0 ? (
            <div style={{ textAlign: "center", padding: 28 }}>
              <div style={{ fontSize: 48, marginBottom: 14 }}>📋</div>
              <p style={{ color: "var(--text-muted)", fontSize: 15 }}>No records available yet.</p>
              <p style={{ color: "var(--text-muted)", fontSize: 13, marginTop: 6 }}>Upload documents from the Documents page to see them here.</p>
            </div>
          ) : (
            <>
              {/* Toolbar */}
              <div className="records-toolbar">
                <div className="records-toolbar__summary">
                  <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800 }}>Stored Documents</h3>
                  <span className="records-toolbar__hint">
                    Showing {filteredDocuments.length} of {documents.length}
                  </span>
                </div>

                <div className="records-toolbar__controls">
                  <div className="records-type-control">
                    <label htmlFor="type-filter" className="records-filter-label">Type</label>
                    <select
                      id="type-filter"
                      className="records-type-select"
                      value={typeFilter}
                      onChange={(e) => setTypeFilter(e.target.value as DocType | "All")}
                    >
                      {typeOptions.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                  </div>

                  <button className="btn btn-primary records-share-btn" onClick={openShareForSelected} disabled={selectedIds.length === 0}>
                    Share Selected ({selectedIds.length})
                  </button>
                </div>
              </div>

              {filteredDocuments.length === 0 ? (
                <p style={{ color: "var(--text-muted)", textAlign: "center", padding: 20 }}>
                  No records match the selected type.
                </p>
              ) : (
                <div className="scroll-list" style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                  {filteredDocuments.map((doc, index) => {
                    const safeUrl = /^(https?:|data:|blob:)/i.test(doc.url) ? doc.url : `https://${doc.url}`;
                    const checkboxId = `record-select-${doc.id || index}`;
                    const isSelected = selectedIds.includes(doc.id);
                    const metaParts = [
                      doc.uploadedByName ? `Uploaded by ${doc.uploadedByName}` : "Uploaded",
                      doc.createdAt ? new Date(doc.createdAt).toLocaleString() : null,
                      doc.uploadedByRole || null,
                      "Secure cloud document",
                    ].filter(Boolean) as string[];

                    return (
                      <div
                        key={doc.id || index}
                        className="app-doc-item"
                        style={isSelected ? { borderColor: "var(--primary)", background: "var(--primary-light)" } : undefined}
                      >
                        <div style={{ display: "flex", alignItems: "center", gap: 12, flex: 1, minWidth: 0 }}>
                          <input
                            type="checkbox"
                            id={checkboxId}
                            aria-label={`Select document ${index + 1}`}
                            checked={isSelected}
                            onChange={() => toggleSelect(doc.id)}
                            style={{ width: 18, height: 18, accentColor: "var(--primary)" }}
                          />
                          <label htmlFor={checkboxId} style={{ cursor: "pointer", flex: 1 }}>
                            <div className="app-doc-item__title">
                              <strong>Medical Record {index + 1}</strong>
                              <span className={getBadgeClass(doc.type)}>{doc.type}</span>
                            </div>
                            <div className="app-doc-item__meta">{metaParts.join(" • ")}</div>
                          </label>
                        </div>

                        <div className="app-doc-item__actions">
                          <button
                            className="btn btn-secondary"
                            onClick={() =>
                              setActiveDoc({
                                id: doc.id,
                                url: safeUrl,
                                type: doc.type,
                                uploadedByName: doc.uploadedByName,
                                uploadedByRole: doc.uploadedByRole,
                                createdAt: doc.createdAt,
                              })
                            }
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
            </>
          )}
        </section>

        {/* Share modal for multiple docs */}
        {showShareModal && shareDocs && (
          <div className="editor-modal" role="dialog" aria-modal onClick={() => setShowShareModal(false)}>
            <div className="editor-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 520 }}>
              <button aria-label="Close" className="btn btn-secondary" style={{ position: "absolute", right: 12, top: 12 }} onClick={() => setShowShareModal(false)}>✕</button>
              <h3>Share {shareDocs.length} Document{shareDocs.length > 1 ? "s" : ""}</h3>
              <p style={{ color: "var(--text-muted)" }}>{shareDocs.map((d) => d.type).join(", ")}</p>

              <label style={{ fontWeight: 700, fontSize: 13, display: "block", marginTop: 16 }}>Access Type</label>
              <select id="share-access-type" name="share-access-type" className="app-select" value={shareAccessType} onChange={(e) => setShareAccessType(e.target.value as "view" | "write")} style={{ margin: "8px 0 16px" }}>
                <option value="view">View Only</option>
                <option value="write">View + Write</option>
              </select>

              <label style={{ fontWeight: 700, fontSize: 13, display: "block" }}>Duration (minutes)</label>
              <input id="share-duration" name="share-duration" className="app-select" type="number" min={1} value={shareDuration} onChange={(e) => setShareDuration(Number(e.target.value))} style={{ margin: "8px 0 16px" }} />

              <div style={{ display: "flex", gap: 8 }}>
                <button className="btn btn-primary" onClick={generateShare} disabled={generatingShare}>
                  {generatingShare ? "Generating…" : `Generate QR for ${shareDocs.length} file${shareDocs.length > 1 ? "s" : ""}`}
                </button>
                <button className="btn btn-secondary" onClick={() => setShowShareModal(false)}>Cancel</button>
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
    </PatientLayout>
  );
}
