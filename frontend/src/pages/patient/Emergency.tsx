import PatientLayout from "../../components/PatientLayout";
import { useEffect, useMemo, useState } from "react";
import axios from "axios";

const API = "http://localhost:5000";

const Emergency = () => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = () => {
      const patientId = localStorage.getItem("patientId");
      if (!patientId) {
        setLoading(false);
        setData(null);
        return;
      }

      setLoading(true);
      axios
        .get(`${API}/api/patients/${patientId}`)
        .then((res) => setData(res.data && res.data.data ? res.data.data : null))
        .catch(() => setData(null))
        .finally(() => setLoading(false));
    };

    fetch();

    const onUpdate = () => fetch();
    window.addEventListener("patient-updated", onUpdate);
    return () => window.removeEventListener("patient-updated", onUpdate);
  }, []);

  const emergency = data?.emergency;

  const status = loading
    ? { label: "Updating", tone: "neutral" as const }
    : emergency
    ? { label: "Ready", tone: "safe" as const }
    : { label: "Not Set", tone: "warn" as const };

  const rows = useMemo(
    () => [
      { label: "Blood Group", value: emergency?.bloodGroup || "—", icon: "🩸" },
      { label: "Allergies", value: (emergency?.allergies || []).join(", ") || "—", icon: "⚠️" },
      { label: "Current Medications", value: (emergency?.medications || []).join(", ") || "—", icon: "💊" },
      { label: "Chronic Conditions", value: (emergency?.chronicConditions || []).join(", ") || "—", icon: "🫀" },
      { label: "Emergency Contact", value: emergency?.emergencyContact || "—", icon: "📞" },
    ],
    [emergency]
  );

  return (
    <PatientLayout>
      <div className="app-ambient">
        {/* ── Header ── */}
        <div className="app-header">
          <span className="app-kicker">Emergency</span>
          <h2 className="app-title">Emergency Profile</h2>
          <p className="app-subtitle">Critical details for urgent situations. Keep this accurate and easy to read.</p>

          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 18 }}>
            <span className={`app-emergency-badge app-emergency-badge--${status.tone}`}>
              <span style={{ width: 8, height: 8, borderRadius: "50%", background: "currentColor" }} />
              {status.label}
            </span>
            <button className="btn btn-secondary" onClick={() => window.print()} style={{ fontSize: 13, padding: "8px 16px" }}>
              🖨️ Print
            </button>
            <button className="btn btn-primary" onClick={() => window.dispatchEvent(new Event("patient-open-editor"))} style={{ fontSize: 13, padding: "8px 16px" }}>
              ✏️ Edit Profile
            </button>
          </div>
        </div>

        {/* ── Content ── */}
        <section className="app-glass-card">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, flexWrap: "wrap", marginBottom: 18 }}>
            <h3 style={{ margin: 0, fontSize: 17, fontWeight: 800 }}>Critical Information</h3>
          </div>

          {loading ? (
            <div style={{ textAlign: "center", padding: 28 }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>⏳</div>
              <p style={{ color: "var(--text-muted)", fontSize: 14 }}>Fetching the latest emergency details…</p>
            </div>
          ) : !emergency ? (
            <div style={{ textAlign: "center", padding: 32 }}>
              <div style={{ fontSize: 48, marginBottom: 12 }}>🏥</div>
              <p style={{ fontWeight: 700, fontSize: 16, marginBottom: 6 }}>No emergency profile yet</p>
              <p style={{ color: "var(--text-muted)", fontSize: 13, maxWidth: 420, margin: "0 auto" }}>
                Add blood group, allergies, medications, chronic conditions, and an emergency contact. This data is shown for quick access and can be printed.
              </p>
              <button
                className="btn btn-primary"
                style={{ marginTop: 18, padding: "10px 24px" }}
                onClick={() => window.dispatchEvent(new Event("patient-open-editor"))}
              >
                Set Up Emergency Profile
              </button>
            </div>
          ) : (
            <div className="app-emergency-grid">
              {rows.map(({ label, value, icon }, idx) => (
                <div key={label} className="app-emergency-item" style={{ animationDelay: `${idx * 0.06}s` }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                    <span style={{ fontSize: 20 }}>{icon}</span>
                    <div className="app-emergency-item__label">{label}</div>
                  </div>
                  <div className="app-emergency-item__value">{value || "—"}</div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </PatientLayout>
  );
};

export default Emergency;
