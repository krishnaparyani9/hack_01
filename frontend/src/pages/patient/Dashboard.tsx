import PatientLayout from "../../components/PatientLayout";
import { Link } from "react-router-dom";

const API = "http://localhost:5000";

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
    </PatientLayout>
  );
};

export default Dashboard;
