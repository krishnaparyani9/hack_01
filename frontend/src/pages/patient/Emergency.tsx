import PatientLayout from "../../components/PatientLayout";
import { useEffect, useState } from "react";
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

  return (
    <PatientLayout>
      <h2 style={{ color: "#b00020" }}>Emergency Mode</h2>
      <p style={{ marginBottom: "16px", color: "#555" }}>
        Only critical health information is shown here for emergency situations.
      </p>

      <div className="emergency-card">
        <h3>Critical Information</h3>

        {loading ? (
          <div>Loading…</div>
        ) : !data || !data.emergency ? (
          <div>No emergency details set. Click Edit in the sidebar to add.</div>
        ) : (
          <>
            <div style={rowStyle}>
              <strong>Blood Group:</strong>
              <span>{data.emergency.bloodGroup || "—"}</span>
            </div>

            <div style={rowStyle}>
              <strong>Allergies:</strong>
              <span>{(data.emergency.allergies || []).join(", ") || "—"}</span>
            </div>

            <div style={rowStyle}>
              <strong>Current Medications:</strong>
              <span>{(data.emergency.medications || []).join(", ") || "—"}</span>
            </div>

            <div style={rowStyle}>
              <strong>Chronic Conditions:</strong>
              <span>{(data.emergency.chronicConditions || []).join(", ") || "—"}</span>
            </div>

            <div style={rowStyle}>
              <strong>Emergency Contact:</strong>
              <span>{data.emergency.emergencyContact || "—"}</span>
            </div>
          </>
        )}
      </div>

      <p style={{ marginTop: "20px", fontSize: "14px", color: "#777" }}>
        ⚠️ This information is accessible only in emergency mode and does not
        expose full medical records.
      </p>
    </PatientLayout>
  );
};

const rowStyle: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  marginBottom: "10px",
};

export default Emergency;
