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

  const status = loading ? { label: "Updating", tone: "neutral" } : emergency
    ? { label: "Ready", tone: "safe" }
    : { label: "Not Set", tone: "warn" };

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
      <div className="emergency-hero">
        <div className="emergency-hero__badge">Emergency Mode</div>
        <h2>Critical Response Snapshot</h2>
        
      </div>

      <div className="emergency-card">
        <div className="emergency-card__header">
          <h3>Critical Information</h3>
          <span className={`emergency-card__status emergency-card__status--${status.tone}`}>
            {status.label}
          </span>
        </div>

        {loading ? (
          <div className="emergency-card__state">Fetching the latest emergency details…</div>
        ) : !emergency ? (
          <div className="emergency-card__state">
            No emergency profile yet. Use Edit Profile to add critical contacts and health notes.
          </div>
        ) : (
          <dl className="emergency-list">
            {rows.map(({ label, value }) => (
              <div key={label} className="emergency-list__row">
                <dt>{label}</dt>
                <dd>{value || "—"}</dd>
              </div>
            ))}
          </dl>
        )}
      </div>

      <div className="emergency-footnote">
        <span aria-hidden>⚠️</span>
        <p>This view reveals limited data for emergency personnel only and never includes full medical records.</p>
      </div>
    </PatientLayout>
  );
};

export default Emergency;
