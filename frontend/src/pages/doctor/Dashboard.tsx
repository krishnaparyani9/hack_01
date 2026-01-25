import { Link, useNavigate } from "react-router-dom";

const DoctorDashboard = () => {
  const navigate = useNavigate();

  const hasActiveSession = true; // mock (later from backend)

  return (
    <div
      className="main"
      style={{
        maxWidth: "680px",
        margin: "0 auto",
      }}
    >
      <h2>Doctor Workspace</h2>
      <p style={{ color: "var(--text-muted)", marginBottom: "36px" }}>
        Secure, session-based access to patient records.
      </p>

      {/* ACTIVE SESSION */}
      {hasActiveSession && (
        <div
          className="card"
          style={{
            marginBottom: "36px",
            borderLeft: "5px solid var(--primary)",
          }}
        >
          {/* Header */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "16px",
            }}
          >
            <h3>Active Consultation</h3>

            <span
              style={{
                padding: "4px 10px",
                borderRadius: "999px",
                fontSize: "12px",
                fontWeight: 600,
                backgroundColor: "#ecfeff",
                color: "#0f766e",
              }}
            >
              ACTIVE
            </span>
          </div>

          {/* Details */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              rowGap: "10px",
              columnGap: "20px",
              marginBottom: "20px",
            }}
          >
            <p><strong>Patient:</strong> Anonymous</p>
            <p><strong>Access:</strong> View + Write</p>
            <p><strong>Started:</strong> Just now</p>
            <p><strong>Time Left:</strong> ~14 min</p>
          </div>

          {/* Action */}
          <Link to="/doctor/session">
            <button
              className="btn btn-primary"
              style={{ width: "100%" }}
            >
              Continue Consultation
            </button>
          </Link>
        </div>
      )}

      {/* SCAN QR */}
      <div
        className="card"
        style={{
          textAlign: "center",
          padding: "32px 24px",
        }}
      >
        <h3>Start New Consultation</h3>
        <p
          style={{
            color: "var(--text-muted)",
            margin: "12px 0 20px",
          }}
        >
          Scan the patient’s QR code to request temporary access.
        </p>

        <button
          className="btn"
          style={{
            padding: "12px 32px",
            backgroundColor: "var(--primary-light)",
            color: "var(--primary)",
            fontWeight: 600,
          }}
          onClick={() => navigate("/doctor/scan")}
        >
          Scan Patient QR
        </button>
      </div>

      {/* RECENT */}
      <div
        style={{
          marginTop: "40px",
          fontSize: "13px",
          color: "var(--text-muted)",
        }}
      >
        <p style={{ marginBottom: "8px" }}>
          <strong>Recent Sessions</strong>
        </p>
        <ul>
          <li>View Only • Completed</li>
          <li>View + Write • Expired</li>
        </ul>
      </div>
    </div>
  );
};

export default DoctorDashboard;
