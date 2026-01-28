import { useEffect } from "react";
import { QRCodeCanvas } from "qrcode.react";

type Props = {
  token: string;
  onClose: () => void;
};

export default function QrModal({ token, onClose }: Props) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };

    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "auto";
    };
  }, [onClose]);

  const copyToken = async () => {
    try {
      await navigator.clipboard.writeText(token);
      window.dispatchEvent(new CustomEvent("toast", { detail: { message: "QR token copied", type: "success" } }));
    } catch {
      window.dispatchEvent(new CustomEvent("toast", { detail: { message: "Copy failed", type: "error" } }));
    }
  };

  return (
    <div className="editor-modal" role="dialog" aria-modal onClick={onClose}>
      <div className="editor-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 420, textAlign: "center" }}>
        <button
          aria-label="Close"
          className="btn btn-secondary"
          style={{ position: "absolute", right: 12, top: 12 }}
          onClick={onClose}
        >
          ✕
        </button>

        <h3 style={{ marginTop: 8 }}>Patient QR Code</h3>
        <p style={{ color: "var(--text-muted)" }}>Scan this QR to grant temporary access</p>

        <div style={{ margin: "18px 0" }}>
          <QRCodeCanvas value={token} size={220} bgColor="#ffffff" fgColor="#0f172a" level="H" />
        </div>

        <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
          <button className="btn btn-secondary" onClick={copyToken}>Copy Token</button>
          <button className="btn btn-primary" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
}
