import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";

const API = "http://localhost:5000";

type Props = {
  url: string;
  onClose: () => void;
  title?: string;
  uploadedByName?: string;
  uploadedByRole?: string;
  createdAt?: string;
};

const isPdfUrl = (u: string) => {
  if (!u) return false;
  if (u.startsWith("data:application/pdf")) return true;
  return !!u.match(/\.pdf(\?|#|$)/i);
};

const isImageUrl = (u: string) => {
  if (!u) return false;
  if (u.startsWith("data:image")) return true;
  return !!u.match(/\.(jpg|jpeg|png|gif)(\?|#|$)/i);
};

type LoadState = "loading" | "ready" | "error";

const getInitialLoadState = (url: string): LoadState => {
  if (isImageUrl(url) || url.startsWith("data:")) return "ready";
  if (isPdfUrl(url) && /^https?:/i.test(url)) return "loading"; // needs proxy fetch
  return "ready"; // plain URL — iframe loads itself
};

export default function DocumentModal({ url, onClose, title, uploadedByName, uploadedByRole, createdAt }: Props) {
  const elRef = useRef<HTMLDivElement | null>(null);
  // Stable ref so portal effect never needs onClose as a dep — prevents
  // re-mounting the portal (and reloading the PDF iframe) on every render.
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [loadState, setLoadState] = useState<LoadState>(() => getInitialLoadState(url));

  const isRemotePdf = useMemo(() => isPdfUrl(url) && /^https?:/i.test(url), [url]);
  const proxyUrl = useMemo(
    () => isRemotePdf ? `${API}/api/documents/proxy?url=${encodeURIComponent(url)}` : url,
    [url, isRemotePdf]
  );
  const gdocsUrl = useMemo(
    () => `https://docs.google.com/viewer?url=${encodeURIComponent(url)}&embedded=true`,
    [url]
  );

  if (!elRef.current) {
    elRef.current = document.createElement("div");
  }

  // Portal mount / keyboard handler — empty dep array so this only runs
  // on mount/unmount and never tears down the portal due to a new onClose ref.
  useEffect(() => {
    const el = elRef.current!;
    document.body.appendChild(el);
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onCloseRef.current(); };
    document.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
      if (el.parentNode) el.parentNode.removeChild(el);
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Only runs for remote PDFs — fetch via proxy → blob URL
  useEffect(() => {
    if (!isRemotePdf) return;

    let cancelled = false;
    let revokeObj: string | null = null;

    setLoadState("loading");
    setBlobUrl(null);

    fetch(proxyUrl)
      .then(async (r) => {
        if (!r.ok) throw new Error(`proxy ${r.status}`);
        const blob = await r.blob();
        const objUrl = URL.createObjectURL(new Blob([blob], { type: "application/pdf" }));
        revokeObj = objUrl;
        if (!cancelled) {
          setBlobUrl(objUrl);
          setLoadState("ready");
        }
      })
      .catch((err) => {
        console.warn("DocumentModal: proxy failed, falling back to Google Docs viewer:", err);
        if (!cancelled) setLoadState("error");
      });

    return () => {
      cancelled = true;
      if (revokeObj) URL.revokeObjectURL(revokeObj);
    };
  }, [isRemotePdf, proxyUrl]);

  // Download handler
  const downloadFile = async () => {
    try {
      if (url.startsWith("data:")) {
        const match = url.match(/^data:([^;]+);base64,(.*)$/);
        if (!match) throw new Error("Invalid data URL");
        const mime = match[1];
        const bytes = Uint8Array.from(atob(match[2]), (c) => c.charCodeAt(0));
        const blob = new Blob([bytes], { type: mime });
        const extMap: Record<string, string> = { "image/png": "png", "image/jpeg": "jpg", "application/pdf": "pdf" };
        const obj = URL.createObjectURL(blob);
        const a = Object.assign(document.createElement("a"), { href: obj, download: `document.${extMap[mime] || "bin"}` });
        document.body.appendChild(a); a.click(); a.remove();
        URL.revokeObjectURL(obj);
      } else {
        const r = await fetch(proxyUrl);
        if (!r.ok) throw new Error("fetch failed");
        const blob = await r.blob();
        const obj = URL.createObjectURL(blob);
        const fileName = url.split("/").pop() || "document";
        const a = Object.assign(document.createElement("a"), { href: obj, download: fileName });
        document.body.appendChild(a); a.click(); a.remove();
        URL.revokeObjectURL(obj);
      }
      window.dispatchEvent(new CustomEvent("toast", { detail: { message: "Download started", type: "success" } }));
    } catch {
      window.dispatchEvent(new CustomEvent("toast", { detail: { message: "Download failed", type: "error" } }));
    }
  };

  // Stable iframe src — only changes when we have a real blob or fall back
  const iframeSrc = useMemo(() => {
    if (isImageUrl(url)) return null;
    if (url.startsWith("data:")) return url;
    if (isRemotePdf) {
      if (blobUrl) return blobUrl;
      if (loadState === "error") return gdocsUrl;
      return null;
    }
    return url;
  }, [url, isRemotePdf, blobUrl, loadState, gdocsUrl]);

  const modal = (
    <div className="editor-modal" role="dialog" aria-modal onClick={onClose}>
      <div
        className="editor-card"
        onClick={(e) => e.stopPropagation()}
        style={{ width: "100%", maxWidth: 920, height: "85vh", padding: 0, display: "flex", flexDirection: "column", overflow: "hidden" }}
      >
        {/* Header bar */}
        <div style={{
          display: "flex", justifyContent: "space-between", alignItems: "center",
          padding: "12px 16px", borderBottom: "1px solid var(--border)", flexShrink: 0
        }}>
          <div>
            <h3 style={{ margin: 0, fontSize: 15, fontWeight: 800 }}>{title || "Document"}</h3>
            <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 3 }}>
              {uploadedByName ? `Uploaded by ${uploadedByName}${uploadedByRole ? ` · ${uploadedByRole}` : ""}` : "Uploaded"}
              {createdAt && <span style={{ marginLeft: 6 }}>· {new Date(createdAt).toLocaleString()}</span>}
            </div>
          </div>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <a href={url} target="_blank" rel="noopener noreferrer" className="btn btn-secondary" style={{ fontSize: 13 }}>
              Open ↗
            </a>
            <button onClick={downloadFile} className="btn btn-primary" style={{ fontSize: 13 }}>Download</button>
            <button aria-label="Close" className="btn btn-secondary" onClick={onClose} style={{ fontSize: 13 }}>✕</button>
          </div>
        </div>

        {/* Viewer area */}
        <div style={{ flex: 1, position: "relative", background: "var(--card-bg)", overflow: "hidden" }}>
          {/* Loading spinner — only shown while proxy fetch is in-flight */}
          {loadState === "loading" && (
            <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 12, color: "var(--text-muted)", zIndex: 1 }}>
              <div style={{ width: 36, height: 36, border: "3px solid var(--border)", borderTopColor: "var(--accent)", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
              <span style={{ fontSize: 14 }}>Loading document…</span>
            </div>
          )}

          {/* Error state */}
          {loadState === "error" && !iframeSrc && (
            <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 12, color: "var(--text-muted)", padding: 24, textAlign: "center" }}>
              <span style={{ fontSize: 40 }}>📄</span>
              <p style={{ margin: 0, fontWeight: 600 }}>Preview unavailable</p>
              <p style={{ margin: 0, fontSize: 13 }}>Use "Open ↗" to view this document in a new tab.</p>
            </div>
          )}

          {/* Image viewer */}
          {isImageUrl(url) && (
            <img src={url} alt="document" style={{ width: "100%", height: "100%", objectFit: "contain", display: "block" }} />
          )}

          {/* PDF / iframe viewer — kept mounted, hidden while loading to avoid remount flicker */}
          {iframeSrc && (
            <iframe
              src={iframeSrc}
              title={title || "document"}
              style={{ width: "100%", height: "100%", border: "none", opacity: loadState === "loading" ? 0 : 1, transition: "opacity 0.2s ease" }}
            />
          )}
        </div>
      </div>
    </div>
  );

  return createPortal(modal, elRef.current);
}

