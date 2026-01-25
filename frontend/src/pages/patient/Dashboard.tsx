import PatientLayout from "../../components/PatientLayout";
import { Link } from "react-router-dom";

const Dashboard = () => {
  return (
    <PatientLayout>
      <h2>Patient Dashboard</h2>
      <p style={{ color: "var(--text-muted)", marginBottom: "24px" }}>
        Overview of your health data and access control.
      </p>

      <div className="card-grid">
        <div className="card">
          <h3>📁 Records</h3>
          <p>Manage your medical documents</p>
          <Link to="/patient/records">View Records →</Link>
        </div>

        <div className="card">
          <h3>🔐 QR Access</h3>
          <p>Share records securely</p>
          <Link to="/patient/generate-qr">Generate QR →</Link>
        </div>

        <div className="card">
          <h3>🚨 Emergency</h3>
          <p>Critical health information</p>
          <Link to="/patient/emergency">Open →</Link>
        </div>
      </div>
    </PatientLayout>
  );
};

export default Dashboard;
