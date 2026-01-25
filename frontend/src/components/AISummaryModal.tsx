type Props = {
  onClose: () => void;
};

const AISummaryModal = ({ onClose }: Props) => {
  return (
    <div style={overlayStyle}>
      <div style={modalStyle}>
        <h3>AI Medical Summary</h3>

        <ul>
          <li>Hemoglobin level slightly below normal range</li>
          <li>Cholesterol levels elevated</li>
          <li>No immediate critical risk detected</li>
        </ul>

        <p style={{ marginTop: "12px", fontSize: "14px", color: "#555" }}>
          ⚠️ This summary is AI-generated and intended only for assistance.
        </p>

        <button style={buttonStyle} onClick={onClose}>
          Close
        </button>
      </div>
    </div>
  );
};

const overlayStyle: React.CSSProperties = {
  position: "fixed",
  top: 0,
  left: 0,
  width: "100%",
  height: "100%",
  backgroundColor: "rgba(0,0,0,0.4)",
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
};

const modalStyle: React.CSSProperties = {
  background: "#fff",
  padding: "20px",
  borderRadius: "8px",
  width: "400px",
};

const buttonStyle: React.CSSProperties = {
  marginTop: "16px",
  padding: "8px 14px",
  cursor: "pointer",
};

export default AISummaryModal;
