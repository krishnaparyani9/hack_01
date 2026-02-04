import PatientLayout from "../../components/PatientLayout";
import { Link } from "react-router-dom";
import { useMemo } from "react";

const API = "http://localhost:5000";

const Dashboard = () => {
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

  return (
    <PatientLayout>
      <section className="dashboard-hero">
        <p className="dashboard-kicker">Care Portal</p>
        <h2>Patient Dashboard</h2>
        <p className="dashboard-subhead">Track your health records, share access, and keep critical information ready.</p>
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
