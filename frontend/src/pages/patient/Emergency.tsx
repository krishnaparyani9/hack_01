import PatientLayout from "../../components/PatientLayout";

const Emergency = () => {
  return (
    <PatientLayout>
      <h2 style={{ color: "#b00020" }}>Emergency Mode</h2>
      <p style={{ marginBottom: "16px", color: "#555" }}>
        Only critical health information is shown here for emergency situations.
      </p>

      <div style={cardStyle}>
        <h3>Critical Information</h3>

        <div style={rowStyle}>
          <strong>Blood Group:</strong>
          <span>O+</span>
        </div>

        <div style={rowStyle}>
          <strong>Allergies:</strong>
          <span>Penicillin</span>
        </div>

        <div style={rowStyle}>
          <strong>Current Medications:</strong>
          <span>Insulin</span>
        </div>

        <div style={rowStyle}>
          <strong>Chronic Conditions:</strong>
          <span>Diabetes</span>
        </div>

        <div style={rowStyle}>
          <strong>Emergency Contact:</strong>
          <span>+91 9XXXXXXXXX</span>
        </div>
      </div>

      <p style={{ marginTop: "20px", fontSize: "14px", color: "#777" }}>
        ⚠️ This information is accessible only in emergency mode and does not
        expose full medical records.
      </p>
    </PatientLayout>
  );
};

const cardStyle: React.CSSProperties = {
  maxWidth: "500px",
  padding: "20px",
  border: "1px solid #ddd",
  borderRadius: "8px",
  backgroundColor: "#fff5f5",
};

const rowStyle: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  marginBottom: "10px",
};

export default Emergency;
