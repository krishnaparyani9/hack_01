import { useState } from "react";
import PatientLayout from "../../components/PatientLayout";
import AISummaryModal from "../../components/AISummaryModal";

const Records = () => {
  const [showSummary, setShowSummary] = useState(false);

  return (
    <PatientLayout>
      <h2>My Health Records</h2>
      <p style={{ color: "var(--text-muted)", marginBottom: "24px" }}>
        Your medical documents stored securely.
      </p>

      <div className="card">
        <h4>🧪 Blood Test Report</h4>
        <p>Date: 12 Aug 2025</p>

        <div style={{ marginTop: "12px" }}>
          <button className="btn btn-primary" style={{ marginRight: "8px" }}>
            View Record
          </button>
          <button
            className="btn"
            style={{ background: "var(--primary-light)" }}
            onClick={() => setShowSummary(true)}
          >
            AI Summary
          </button>
        </div>
      </div>

      {showSummary && (
        <AISummaryModal onClose={() => setShowSummary(false)} />
      )}
    </PatientLayout>
  );
};

export default Records;
