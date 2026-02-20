import PatientLayout from "../../components/PatientLayout";
import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import TiltCard from "../../components/TiltCard";

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
      { label: "Blood Group", value: emergency?.bloodGroup || "—" },
      { label: "Allergies", value: (emergency?.allergies || []).join(", ") || "—" },
      {
        label: "Current Medications",
        value: (emergency?.medications || []).join(", ") || "—",
      },
      {
        label: "Chronic Conditions",
        value: (emergency?.chronicConditions || []).join(", ") || "—",
      },
      { label: "Emergency Contact", value: emergency?.emergencyContact || "—" },
    ],
    [emergency]
  );

  return (
    <PatientLayout>
      <div className="page-header">
        <div>
          <div className="page-title">Emergency Profile</div>
          <div className="muted">Critical details for urgent situations. Keep this accurate and easy to read.</div>
        </div>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <button className="btn btn-secondary" onClick={() => window.print()}>Print</button>
          <button className="btn btn-primary" onClick={() => window.dispatchEvent(new Event("patient-open-editor"))}>Edit Profile</button>
        </div>
      </div>

      <TiltCard className="card" tiltMaxDeg={5}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
          <h3 style={{ margin: 0 }}>Critical Information</h3>
          <span className={`hk-badge ${status.tone === "safe" ? "hk-badge--write" : "hk-badge--view"}`}>{status.label}</span>
        </div>

        {loading ? (
          <div className="muted" style={{ marginTop: 12 }}>Fetching the latest emergency details…</div>
        ) : !emergency ? (
          <div style={{ marginTop: 14 }}>
            <div className="muted">No emergency profile yet.</div>
            <div className="card" style={{ marginTop: 14, background: "var(--surface-2)", border: "1px solid var(--border)" }}>
              <p className="muted" style={{ margin: 0 }}>
                Add blood group, allergies, medications, chronic conditions, and an emergency contact. This is shown for quick access and can be printed.
              </p>
            </div>
          </div>
        ) : (
          <div style={{ marginTop: 16, display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 12 }}>
            {rows.map(({ label, value }) => (
              <div key={label} className="card" style={{ background: "var(--surface-2)", border: "1px solid var(--border)" }}>
                <div style={{ fontSize: 12, fontWeight: 900, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--text-muted)" }}>{label}</div>
                <div style={{ marginTop: 10, fontSize: 16, fontWeight: 800 }}>{value || "—"}</div>
              </div>
            ))}
          </div>
        )}
      </TiltCard>
    </PatientLayout>
  );
};

export default Emergency;
