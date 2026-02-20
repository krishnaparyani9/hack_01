import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import AISummaryModal from "../../components/AISummaryModal";
import PatientLayout from "../../components/PatientLayout";
import TiltCard from "../../components/TiltCard";

const API = "http://localhost:5000";

type PatientSummaryState = {
  summary: string;
  documentCount: number;
  totalDocumentCount: number;
  generatedAt?: string;
  failedCount?: number;
};

const Dashboard = () => {
  const navigate = useNavigate();
  const [isGeneratingSummary, setIsGeneratingSummary] = useState(false);
  const [summaryError, setSummaryError] = useState<string | null>(null);
  const [summaryData, setSummaryData] = useState<PatientSummaryState | null>(null);
  const [showSummaryModal, setShowSummaryModal] = useState(false);

  const [docCount, setDocCount] = useState<number>(0);
  const [activeSession, setActiveSession] = useState<null | { sessionId: string; expiresAt?: number; accessType?: "view" | "write" }>(null);
  const [emergencyReady, setEmergencyReady] = useState<boolean>(false);

  const modules = useMemo(
    () => [
      {
        title: "Records",
        description: "Manage your medical documents",
        to: "/patient/records",
        action: "View Records",
        icon: "🗂️",
      },
      {
        title: "QR Access",
        description: "Generate secure QR sessions",
        to: "/patient/generate-qr",
        action: "Generate QR",
        icon: "🔐",
      },
      {
        title: "Emergency",
        description: "Highlight critical health info",
        to: "/patient/emergency",
        action: "Open",
        icon: "🚨",
      },
    ],
    []
  );

  useEffect(() => {
    let mounted = true;

    const load = async () => {
      const patientId = localStorage.getItem("patientId") || localStorage.getItem("userId") || "";
      if (!patientId) return;

      try {
        const docsRes = await axios.get(`${API}/api/documents/patient/${patientId}`);
        if (mounted) setDocCount((docsRes.data?.data || []).length);
      } catch {
        if (mounted) setDocCount(0);
      }

      try {
        const sid = localStorage.getItem("sessionId");
        if (!sid) {
          if (mounted) setActiveSession(null);
        } else {
          const sessRes = await axios.get(`${API}/api/session/${sid}`);
          const data = sessRes.data?.data;
          if (data?.sessionId) {
            if (mounted) setActiveSession({ sessionId: data.sessionId, expiresAt: data.expiresAt, accessType: data.accessType });
          } else {
            if (mounted) setActiveSession(null);
          }
        }
      } catch {
        if (mounted) setActiveSession(null);
      }

      try {
        const pRes = await axios.get(`${API}/api/patients/${patientId}`);
        const emergency = pRes.data?.data?.emergency;
        const ready = !!(emergency && (emergency.bloodGroup || (emergency.allergies && emergency.allergies.length) || (emergency.medications && emergency.medications.length) || (emergency.chronicConditions && emergency.chronicConditions.length) || emergency.emergencyContact));
        if (mounted) setEmergencyReady(ready);
      } catch {
        if (mounted) setEmergencyReady(false);
      }
    };

    load();
    return () => {
      mounted = false;
    };
  }, []);

  const handleGenerateSummary = async () => {
    const token = localStorage.getItem("authToken");
    if (!token) {
      window.dispatchEvent(new CustomEvent("toast", { detail: { message: "Sign in to generate a summary", type: "error" } }));
      return;
    }

    const patientId = localStorage.getItem("patientId") || localStorage.getItem("userId");
    if (!patientId) {
      window.dispatchEvent(new CustomEvent("toast", { detail: { message: "No patient selected", type: "error" } }));
      return;
    }

    setIsGeneratingSummary(true);
    setSummaryError(null);

    try {
      const response = await axios.post(
        `${API}/api/documents/patient/${patientId}/summary`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      const data = response.data?.data;
      const summarizedCount = typeof data?.summarizedCount === "number" ? data.summarizedCount : data?.documentCount ?? 0;
      const totalDocumentCount = typeof data?.documentCount === "number" ? data.documentCount : summarizedCount;
      const failedCount = Array.isArray(data?.failedDocumentIds) ? data.failedDocumentIds.length : 0;

      setSummaryData({
        summary: data?.summary || "",
        documentCount: summarizedCount,
        totalDocumentCount,
        generatedAt: data?.generatedAt,
        failedCount,
      });

      setShowSummaryModal(true);
      window.dispatchEvent(new CustomEvent("toast", { detail: { message: "AI summary ready", type: "success" } }));
    } catch (error: unknown) {
      console.error("Failed to generate patient summary:", error);
      const message = axios.isAxiosError(error) ? error.response?.data?.message : null;
      const fallback = message || "Failed to generate summary";
      setSummaryError(fallback);
      window.dispatchEvent(new CustomEvent("toast", { detail: { message: fallback, type: "error" } }));
    } finally {
      setIsGeneratingSummary(false);
    }
  };

  return (
    <PatientLayout>
      <section className="dashboard-hero">
        <p className="dashboard-kicker">Care Portal</p>
        <h2>Patient Dashboard</h2>
        <p className="dashboard-subhead">Track your health records, share access, and keep critical information ready.</p>
      </section>

      <section style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 16 }}>
        <TiltCard className="card" tiltMaxDeg={6}>
          <h3 style={{ marginBottom: 8 }}>Total Documents</h3>
          <div style={{ fontSize: 34, fontWeight: 900, lineHeight: 1 }}>{docCount}</div>
          <div className="muted">Uploaded records linked to your profile</div>
          <div style={{ marginTop: 14 }}>
            <button className="btn btn-secondary" onClick={() => navigate("/patient/documents")}>Upload document</button>
          </div>
        </TiltCard>

        <TiltCard className="card" tiltMaxDeg={6}>
          <h3 style={{ marginBottom: 8 }}>Sharing Session</h3>
          {activeSession?.sessionId ? (
            <>
              <div className="hk-badge hk-badge--write" style={{ marginBottom: 10 }}>
                ACTIVE • {(activeSession.accessType || "view").toUpperCase()}
              </div>
              <div className="muted">Session ID: {activeSession.sessionId}</div>
              <div className="muted">Expires: {activeSession.expiresAt ? new Date(activeSession.expiresAt).toLocaleString() : "—"}</div>
            </>
          ) : (
            <>
              <div className="hk-badge hk-badge--view" style={{ marginBottom: 10 }}>No active session</div>
              <div className="muted">Generate a QR to grant temporary access.</div>
            </>
          )}
          <div style={{ marginTop: 14 }}>
            <button className="btn btn-primary" onClick={() => navigate("/patient/generate-qr")}>Generate QR Session</button>
          </div>
        </TiltCard>

        <TiltCard className="card" tiltMaxDeg={6}>
          <h3 style={{ marginBottom: 8 }}>Emergency Profile</h3>
          <div className={`hk-badge ${emergencyReady ? "hk-badge--write" : "hk-badge--view"}`} style={{ marginBottom: 10 }}>
            {emergencyReady ? "READY" : "NOT SET"}
          </div>
          <div className="muted">Blood group, allergies, meds, and emergency contact</div>
          <div style={{ marginTop: 14, display: "flex", gap: 10, flexWrap: "wrap" }}>
            <button className="btn btn-secondary" onClick={() => navigate("/patient/emergency")}>View</button>
            <button className="btn" onClick={() => window.dispatchEvent(new Event("patient-open-editor"))}>Edit</button>
          </div>
        </TiltCard>
      </section>

      <section className="dashboard-tiles">
        {modules.map((module) => (
          <Link key={module.title} to={module.to} className="dashboard-tile">
            <span className="dashboard-tile__icon" aria-hidden>
              {module.icon}
            </span>
            <h3>{module.title}</h3>
            <p>{module.description}</p>
            <span className="dashboard-tile__cta">{module.action} →</span>
          </Link>
        ))}
      </section>

      <section className="dashboard-summary" style={{ marginTop: 28 }}>
        <div
          className="card"
          style={{
            background: "linear-gradient(135deg, rgba(37, 99, 235, 0.12), rgba(56, 189, 248, 0.08))",
            border: "1px solid rgba(37, 99, 235, 0.18)",
            boxShadow: "0 18px 45px rgba(15, 23, 42, 0.12)",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 18, flexWrap: "wrap" }}>
            <div style={{ flex: "1 1 320px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ fontSize: 28 }}>✨</span>
                <div>
                  <h3 style={{ margin: 0 }}>AI Patient Summary</h3>
                  <p style={{ color: "var(--text-muted)", margin: "6px 0 0" }}>
                    Generate a unified overview of all uploaded medical documents in seconds.
                  </p>
                </div>
              </div>

              {summaryData?.failedCount ? (
                <p style={{ color: "#b91c1c", marginTop: 14, fontSize: 13 }}>
                  Unable to include {summaryData.failedCount} document{summaryData.failedCount === 1 ? "" : "s"} due to extraction errors.
                </p>
              ) : null}

              {summaryError && (
                <p style={{ color: "#b91c1c", marginTop: 14, fontSize: 13 }}>{summaryError}</p>
              )}
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 10, minWidth: 220 }}>
              <button
                className="btn btn-primary"
                style={{ padding: "12px 18px", fontWeight: 600 }}
                onClick={handleGenerateSummary}
                disabled={isGeneratingSummary}
              >
                {isGeneratingSummary ? "Generating summary…" : "Generate Summary"}
              </button>

              {summaryData && (
                <button
                  className="btn btn-secondary"
                  style={{ padding: "12px 18px", fontWeight: 600 }}
                  onClick={() => setShowSummaryModal(true)}
                >
                  View Full Summary
                </button>
              )}

              {summaryData?.generatedAt && (
                <div style={{ marginTop: 4, fontSize: 12, color: "var(--text-muted)", lineHeight: 1.5 }}>
                  Updated {new Date(summaryData.generatedAt).toLocaleString()} • {summaryData.documentCount}/{summaryData.totalDocumentCount} documents included
                </div>
              )}
            </div>
          </div>
        </div>
      </section>
      {/* END SESSION */}
      <div style={{ marginTop: 18 }}>
        <div style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: 8 }}>
          Manage active QR session
        </div>
        <button
          className="btn btn-secondary"
          onClick={async () => {
            const sid = localStorage.getItem("sessionId");
            if (!sid) {
              window.dispatchEvent(new CustomEvent("toast", { detail: { message: "No active session", type: "error" } }));
              return;
            }

            try {
              const token = localStorage.getItem("authToken");
              await fetch(`${API}/api/session/${sid}`, {
                method: "DELETE",
                headers: token ? { Authorization: `Bearer ${token}` } : undefined,
              });
            } catch (e) {
              // ignore
            }

            localStorage.removeItem("sessionId");
            window.dispatchEvent(new CustomEvent("toast", { detail: { message: "Session ended", type: "success" } }));
            window.location.reload();
          }}
        >
          End Active Session
        </button>
      </div>

      {showSummaryModal && summaryData && (
        <AISummaryModal
          summary={summaryData.summary}
          documentCount={summaryData.documentCount}
          generatedAt={summaryData.generatedAt}
          onClose={() => setShowSummaryModal(false)}
        />
      )}
    </PatientLayout>
  );
};

export default Dashboard;
