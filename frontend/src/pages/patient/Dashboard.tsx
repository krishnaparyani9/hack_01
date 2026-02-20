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
        color: "blue" as const,
      },
      {
        title: "QR Access",
        description: "Generate secure QR sessions",
        to: "/patient/generate-qr",
        action: "Generate QR",
        icon: "🔐",
        color: "teal" as const,
      },
      {
        title: "Emergency",
        description: "Highlight critical health info",
        to: "/patient/emergency",
        action: "Open",
        icon: "🚨",
        color: "red" as const,
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
      <div className="app-ambient">
        {/* ── Page header ── */}
        <div className="app-header">
          <span className="app-kicker">Care Portal</span>
          <h2 className="app-title">Patient Dashboard</h2>
          <p className="app-subtitle">Track your health records, share access, and keep critical information ready.</p>
        </div>

        {/* ── Stat cards ── */}
        <section className="app-stats">
          <TiltCard className="app-stat-card" tiltMaxDeg={6}>
            <div className="app-stat-card__accent" />
            <div className="app-stat-card__icon">📄</div>
            <h3 style={{ margin: "0 0 6px", fontSize: 15, fontWeight: 700 }}>Total Documents</h3>
            <div className="app-stat-card__value">{docCount}</div>
            <p className="app-stat-card__label">Uploaded records linked to your profile</p>
            <div style={{ marginTop: 16 }}>
              <button className="btn btn-secondary" onClick={() => navigate("/patient/documents")}>Upload document</button>
            </div>
          </TiltCard>

          <TiltCard className="app-stat-card" tiltMaxDeg={6}>
            <div className="app-stat-card__accent app-stat-card__accent--teal" />
            <div className="app-stat-card__icon app-stat-card__icon--teal">🔗</div>
            <h3 style={{ margin: "0 0 6px", fontSize: 15, fontWeight: 700 }}>Sharing Session</h3>
            {activeSession?.sessionId ? (
              <>
                <span className="hk-badge hk-badge--write" style={{ marginBottom: 10 }}>
                  ACTIVE • {(activeSession.accessType || "view").toUpperCase()}
                </span>
                <p className="app-stat-card__label">Session: {activeSession.sessionId}</p>
                <p className="app-stat-card__label">Expires: {activeSession.expiresAt ? new Date(activeSession.expiresAt).toLocaleString() : "—"}</p>
              </>
            ) : (
              <>
                <span className="hk-badge hk-badge--view" style={{ marginBottom: 10 }}>No active session</span>
                <p className="app-stat-card__label">Generate a QR to grant temporary access.</p>
              </>
            )}
            <div style={{ marginTop: 16 }}>
              <button className="btn btn-primary" onClick={() => navigate("/patient/generate-qr")}>Generate QR Session</button>
            </div>
          </TiltCard>

          <TiltCard className="app-stat-card" tiltMaxDeg={6}>
            <div className="app-stat-card__accent app-stat-card__accent--red" />
            <div className="app-stat-card__icon app-stat-card__icon--red">🚨</div>
            <h3 style={{ margin: "0 0 6px", fontSize: 15, fontWeight: 700 }}>Emergency Profile</h3>
            <span className={`app-emergency-badge ${emergencyReady ? "app-emergency-badge--safe" : "app-emergency-badge--warn"}`}>
              {emergencyReady ? "✓ Ready" : "Not Set"}
            </span>
            <p className="app-stat-card__label" style={{ marginTop: 8 }}>Blood group, allergies, meds, and emergency contact</p>
            <div style={{ marginTop: 16, display: "flex", gap: 10, flexWrap: "wrap" }}>
              <button className="btn btn-secondary" onClick={() => navigate("/patient/emergency")}>View</button>
              <button className="btn" onClick={() => window.dispatchEvent(new Event("patient-open-editor"))}>Edit</button>
            </div>
          </TiltCard>
        </section>

        {/* ── Navigation tiles ── */}
        <section className="app-tiles">
          {modules.map((module) => (
            <Link key={module.title} to={module.to} className={`app-tile app-tile--${module.color}`}>
              <span className="app-tile__icon" aria-hidden>{module.icon}</span>
              <h3>{module.title}</h3>
              <p>{module.description}</p>
              <span className="app-tile__cta">{module.action} →</span>
            </Link>
          ))}
        </section>

        {/* ── AI Summary ── */}
        <section className="app-ai-banner">
          <div className="app-ai-banner__inner">
            <div className="app-ai-banner__info">
              <div className="app-ai-banner__icon">✨</div>
              <div>
                <h3 style={{ margin: 0, fontSize: 17, fontWeight: 800 }}>AI Patient Summary</h3>
                <p style={{ color: "var(--text-muted)", margin: "6px 0 0", fontSize: 14, lineHeight: 1.6 }}>
                  Generate a unified overview of all uploaded medical documents in seconds.
                </p>
                {summaryData?.failedCount ? (
                  <p style={{ color: "#b91c1c", marginTop: 12, fontSize: 13 }}>
                    Unable to include {summaryData.failedCount} document{summaryData.failedCount === 1 ? "" : "s"} due to extraction errors.
                  </p>
                ) : null}
                {summaryError && <p style={{ color: "#b91c1c", marginTop: 12, fontSize: 13 }}>{summaryError}</p>}
              </div>
            </div>

            <div className="app-ai-banner__actions">
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
                <div style={{ fontSize: 12, color: "var(--text-muted)", lineHeight: 1.5 }}>
                  Updated {new Date(summaryData.generatedAt).toLocaleString()} • {summaryData.documentCount}/{summaryData.totalDocumentCount} documents included
                </div>
              )}
            </div>
          </div>
        </section>

        {/* ── Session management ── */}
        <div className="app-session-bar">
          <span style={{ fontSize: 13, fontWeight: 700, color: "var(--text-muted)", letterSpacing: "0.04em", textTransform: "uppercase" }}>
            QR Session Management
          </span>
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
      </div>
    </PatientLayout>
  );
};

export default Dashboard;
