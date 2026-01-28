import { useEffect, useState } from "react";
import axios from "axios";
import DocumentModal from "../../components/DocumentModal";

const API = "http://localhost:5000";

type DocType = "Prescription" | "Lab Report" | "Scan" | "Other";

type DocumentItem = { id: string; url: string; type: DocType; uploadedByName?: string; uploadedByRole?: string; createdAt?: string };

export default function Records() {
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [activeDoc, setActiveDoc] = useState<DocumentItem | null>(null);
  const patientId = localStorage.getItem("patientId");

  useEffect(() => {
    if (patientId) fetchDocuments();

    const onVisibility = () => {
      if (document.visibilityState === "visible") fetchDocuments();
    };

    const onFocus = () => fetchDocuments();

    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("focus", onFocus);

    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("focus", onFocus);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [patientId]);

  const fetchDocuments = async () => {
    if (!patientId) return;
    const res = await axios.get(`${API}/api/documents/patient/${patientId}`);
    setDocuments(res.data.data || []);
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
      <p style={{ color: "var(--text-muted)", marginBottom: "24px" }}>
        All documents linked to your current session.
      </p>

      <div className="card">
        {documents.length === 0 ? (
          <p style={{ color: "var(--text-muted)" }}>
            No records available yet.
          </p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
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
