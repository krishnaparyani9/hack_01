import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";

type Props = {
  url: string;
  onClose: () => void;
  title?: string;
  uploadedByName?: string;
  uploadedByRole?: string;
  createdAt?: string;
};

const isImage = (u: string) => {
  if (!u) return false;
  if (u.startsWith("data:image")) return true;
  return !!u.match(/\.(jpg|jpeg|png|gif)$/i);
};

export default function DocumentModal({ url, onClose, title, uploadedByName, uploadedByRole, createdAt }: Props) {
  const elRef = useRef<HTMLDivElement | null>(null);
  if (!elRef.current) {
    elRef.current = document.createElement("div");
  }

  useEffect(() => {
    const el = elRef.current!;
    document.body.appendChild(el);

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };

    document.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
      if (el.parentNode) el.parentNode.removeChild(el);
    };
  }, [onClose]);

  const downloadFile = async () => {
    try {
      if (url.startsWith("data:")) {
        // data:[<mediatype>][;base64],<data>
        const match = url.match(/^data:([^;]+);base64,(.*)$/);
        if (!match) throw new Error("Invalid data URL");
        const mime = match[1];
        const b64 = match[2];
        const bytes = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
        const blob = new Blob([bytes], { type: mime });
        // derive extension
        const extMap: Record<string,string> = { "image/png":"png", "image/jpeg":"jpg", "image/jpg":"jpg", "application/pdf":"pdf" };
        const ext = extMap[mime] || "bin";
        const fileName = `document.${ext}`;
        const blobUrl = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = blobUrl;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(blobUrl);
        window.dispatchEvent(new CustomEvent("toast", { detail: { message: "Download started", type: "success" } }));
      } else {
        const res = await fetch(url);
        const blob = await res.blob();
        const fileName = url.split("/").pop() || "document";
        const blobUrl = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = blobUrl;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(blobUrl);
        window.dispatchEvent(new CustomEvent("toast", { detail: { message: "Download started", type: "success" } }));
      }
    } catch (err) {
      window.dispatchEvent(new CustomEvent("toast", { detail: { message: "Download failed", type: "error" } }));
    }
  };

  const modal = (
    <div className="editor-modal" role="dialog" aria-modal onClick={onClose}>
      <div className="editor-card" onClick={(e) => e.stopPropagation()} style={{ width: "100%", maxWidth: "900px", height: "80vh", padding: 12 }}>
        <button
          aria-label="Close"
          className="btn btn-secondary"
          style={{ position: "absolute", right: 12, top: 12 }}
          onClick={onClose}
        >
          ✕
        </button>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "6px 10px 12px" }}>
          <div>
            <h3 style={{ margin: 0 }}>{title || "Document Preview"}</h3>
            <div style={{ fontSize: 13, color: "var(--text-muted)", marginTop: 6 }}>
              {uploadedByName ? `Uploaded by ${uploadedByName}${uploadedByRole ? ` • ${uploadedByRole}` : ""}` : "Uploaded"}
              {createdAt && <span style={{ marginLeft: 8 }}>• {new Date(createdAt).toLocaleString()}</span>}
            </div>
          </div>

          <div style={{ display: "flex", gap: 8 }}>
            <a href={url} target="_blank" rel="noopener noreferrer" className="btn btn-secondary">Open in new tab</a>
            <button onClick={downloadFile} className="btn btn-primary">Download</button>
          </div>
        </div>

        <div style={{ height: "calc(100% - 66px)", borderRadius: 8, overflow: "hidden", background: "var(--card-bg)" }}>
          {isImage(url) ? (
            <img src={url} alt="document" style={{ width: "100%", height: "100%", objectFit: "contain", display: "block" }} />
          ) : (
            <iframe src={url} title={title || "doc"} style={{ width: "100%", height: "100%", border: "none" }} />
          )}
        </div>
      </div>
    </div>
  );

  return createPortal(modal, elRef.current);
}
