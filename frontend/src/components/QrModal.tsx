import { useEffect } from "react";
import { QRCodeCanvas, QRCodeSVG } from "qrcode.react";

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

  const downloadImage = (format: "png" | "jpg" | "svg") => {
    try {
      if (format === "svg") {
        const svgEl = document.getElementById("qr-svg") as SVGSVGElement | null;
        if (!svgEl) throw new Error("SVG not ready");
        const svgData = new XMLSerializer().serializeToString(svgEl);
        const blob = new Blob([svgData], { type: "image/svg+xml;charset=utf-8" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `healthvault-qr-${Date.now()}.svg`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
        window.dispatchEvent(new CustomEvent("toast", { detail: { message: "Downloaded SVG", type: "success" } }));
        return;
      }

      const canvas = document.getElementById("qr-canvas") as HTMLCanvasElement | null;
      if (!canvas) throw new Error("Canvas not ready");
      const mime = format === "jpg" ? "image/jpeg" : "image/png";
      const dataUrl = canvas.toDataURL(mime);
      const a = document.createElement("a");
      a.href = dataUrl;
      a.download = `healthvault-qr-${Date.now()}.${format}`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.dispatchEvent(new CustomEvent("toast", { detail: { message: `Downloaded ${format.toUpperCase()}`, type: "success" } }));
    } catch (e) {
      window.dispatchEvent(new CustomEvent("toast", { detail: { message: "Download failed", type: "error" } }));
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
          {/* visible canvas with stable id for PNG/JPG export */}
          <QRCodeCanvas id="qr-canvas" value={token} size={220} bgColor="#ffffff" fgColor="#0f172a" level="H" />
          {/* hidden SVG (same token) used for SVG export */}
          <div style={{ position: "absolute", left: -9999, top: -9999, width: 0, height: 0, overflow: "hidden" }} aria-hidden>
            <QRCodeSVG id="qr-svg" value={token} size={220} level="H" />
          </div>
        </div>

        <div style={{ display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap" }}>
          <button className="btn btn-secondary" onClick={copyToken}>Copy Token</button>

          {/* Download buttons */}
          <button className="btn btn-ghost" onClick={() => downloadImage("png")}>Download PNG</button>
          <button className="btn btn-ghost" onClick={() => downloadImage("jpg")}>Download JPG</button>
          <button className="btn btn-ghost" onClick={() => downloadImage("svg")}>Download SVG</button>

          <button className="btn btn-primary" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
}
