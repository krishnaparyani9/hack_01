import { useEffect, useState } from "react";
import axios from "axios";
import DocumentModal from "../../components/DocumentModal";

const API = "http://localhost:5000";

type DocType = "Prescription" | "Lab Report" | "Scan" | "Other";

type DocumentItem = { id: string; url: string; type: DocType; uploadedByName?: string; uploadedByRole?: string; createdAt?: string };

export default function Records() {
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [activeDoc, setActiveDoc] = useState<DocumentItem | null>(null);
  const [patientId, setPatientId] = useState<string>(() => localStorage.getItem("patientId") || "");

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
      <p style={{ color: "var(--text-muted)", marginBottom: "16px", fontSize: 12 }}>
        Viewing patientId: {patientId || "(none)"}
      </p>

      <div className="card">
        {documents.length === 0 ? (
          <p style={{ color: "var(--text-muted)" }}>
            No records available yet.
          </p>
        ) : (
          <div className="scroll-list" style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
            {documents.map((doc, index) => {
              const safeUrl = doc.url.startsWith("http") ? doc.url : `https://${doc.url}`;

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
                  <div>
                    <strong>Medical Record {index + 1}</strong>
                    <p style={{ fontSize: "12px", color: "var(--text-muted)" }}>
                      {doc.type} • {doc.uploadedByName ? `Uploaded by ${doc.uploadedByName}` : "Uploaded"} {doc.createdAt ? `• ${new Date(doc.createdAt).toLocaleString()}` : ""} • Secure cloud document
                    </p>
                  </div>

                  <div style={{ display: "flex", gap: 8 }}>
                    <button
                      className="btn btn-secondary"
                      onClick={() => setActiveDoc({ id: doc.id, url: safeUrl, type: doc.type, uploadedByName: doc.uploadedByName, uploadedByRole: doc.uploadedByRole, createdAt: doc.createdAt })}
                    >
                      View
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
          title={`Record — ${activeDoc.type}`}
          uploadedByName={activeDoc.uploadedByName}
          uploadedByRole={activeDoc.uploadedByRole}
          createdAt={activeDoc.createdAt}
          onClose={() => setActiveDoc(null)}
        />
      )}
    </div>
  );
}
