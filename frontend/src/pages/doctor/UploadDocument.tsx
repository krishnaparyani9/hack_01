import { useCallback, useMemo, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";

const API = "http://localhost:5000";

type DocType = "Prescription" | "Lab Report" | "Scan" | "Other";

export default function UploadDocument() {
  const { sessionId } = useParams();
  const navigate = useNavigate();

  const [file, setFile] = useState<File | null>(null);
  const [docType, setDocType] = useState<DocType>("Prescription");
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const viewerName = useMemo(() => localStorage.getItem("userName") || localStorage.getItem("doctorName") || "Doctor", []);

  const formatBytes = (bytes: number) => {
    if (!bytes) return "0 B";
    const units = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    const value = bytes / Math.pow(1024, i);
    return `${value.toFixed(value >= 10 || i === 0 ? 0 : 1)} ${units[i]}`;
  };

  const onFilesSelected = (files: FileList | null) => {
    if (!files || files.length === 0) {
      setFile(null);
      return;
    }
    const first = files[0];
    setFile(first);
    window.dispatchEvent(
      new CustomEvent("toast", {
        detail: { message: `${first.name} ready to upload`, type: "info" },
      })
    );
  };

  const triggerFilePicker = () => fileInputRef.current?.click();

  const handleDragOver = useCallback((evt: React.DragEvent<HTMLDivElement>) => {
    evt.preventDefault();
    evt.stopPropagation();
    setDragActive(true);
  }, []);

  const handleDragLeave = useCallback((evt: React.DragEvent<HTMLDivElement>) => {
    evt.preventDefault();
    evt.stopPropagation();
    setDragActive(false);
  }, []);

  const handleDrop = useCallback((evt: React.DragEvent<HTMLDivElement>) => {
    evt.preventDefault();
    evt.stopPropagation();
    setDragActive(false);
    if (evt.dataTransfer?.files) onFilesSelected(evt.dataTransfer.files);
  }, []);

  const uploadDocument = async () => {
    if (!file || !sessionId) return;

    setLoading(true);
    setProgress(0);

    const formData = new FormData();
    formData.append("file", file);
    formData.append("type", docType);
    formData.append("uploaderName", localStorage.getItem("doctorName") || "Doctor");
    formData.append("uploaderRole", "doctor");

    try {
      const authToken = localStorage.getItem("authToken");
      const opts: any = {
        onUploadProgress: (e: ProgressEvent) => {
          if (e.total) setProgress(Math.round((e.loaded * 100) / e.total));
        },
      };
      if (authToken) opts.headers = { Authorization: `Bearer ${authToken}` };

      await axios.post(`${API}/api/documents/upload/${sessionId}`, formData, opts);

      window.dispatchEvent(new CustomEvent("toast", { detail: { message: "Document uploaded", type: "success" } }));
      // navigate back to session documents view
      navigate(`/doctor/session/${sessionId}`);
    } catch (err: any) {
      window.dispatchEvent(new CustomEvent("toast", { detail: { message: err?.response?.data?.message || "Upload failed", type: "error" } }));
    } finally {
      setLoading(false);
      setProgress(0);
      setFile(null);
      setDocType("Prescription");
    }
  };

  if (!sessionId) return (
    <div className="main" style={{ maxWidth: 900, margin: "0 auto" }}>
      <div className="card">
        <h3>No Session</h3>
        <p>Open a session via QR scan first.</p>
      </div>
    </div>
  );

  return (
    <div className="main" style={{ maxWidth: 1080, margin: "0 auto" }}>
      <div className="upload-shell">
        <header className="upload-hero">
          <div>
            <p className="upload-kicker">Session Tools</p>
            <h2>Medical Documents</h2>
            <p className="upload-subhead">Upload prescriptions, lab reports, or scans directly into the live patient session.</p>
          </div>
          <aside>
            <span className="upload-session-tag">Session ID</span>
            <code>{sessionId}</code>
          </aside>
        </header>

        <div className="upload-columns">
          <div className="card upload-card">
            <section className="upload-section">
              <header>
                <span className="upload-label">Document Type</span>
                <p className="upload-hint">Select a category so the patient can filter easily later.</p>
              </header>
              <select value={docType} onChange={(e) => setDocType(e.target.value as DocType)} className="upload-select">
                <option>Prescription</option>
                <option>Lab Report</option>
                <option>Scan</option>
                <option>Other</option>
              </select>
            </section>

            <section
              className={`upload-dropzone${dragActive ? " upload-dropzone--active" : ""}`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              <input
                ref={fileInputRef}
                type="file"
                className="upload-input"
                onChange={(e) => onFilesSelected(e.target.files)}
                accept="application/pdf,image/*"
              />

              <div className="upload-dropzone__content">
                <div className="upload-icon" aria-hidden>📄</div>
                <h3>{file ? file.name : "Drop a document or browse your files"}</h3>
                <p>{file ? `${formatBytes(file.size)} selected` : "Accepted formats: PDF, JPG, PNG, DICOM (25 MB max)."}</p>
                <div className="upload-actions">
                  <button type="button" className="btn btn-primary" onClick={triggerFilePicker} disabled={loading}>
                    {file ? "Replace file" : "Choose file"}
                  </button>
                  {file && (
                    <button type="button" className="btn" onClick={() => setFile(null)} disabled={loading}>
                      Remove
                    </button>
                  )}
                </div>
              </div>
            </section>

            {file && !loading && (
              <div className="upload-file-details">
                <div>
                  <p className="upload-file-name">{file.name}</p>
                  <span className="upload-file-meta">{formatBytes(file.size)} • {file.type || "Unknown type"}</span>
                </div>
                <button type="button" className="btn" onClick={() => setFile(null)}>
                  Change
                </button>
              </div>
            )}

            {loading && (
              <div className="upload-progress">
                <div className="upload-progress__bar" style={{ width: `${progress}%` }} />
                <span>{progress}%</span>
              </div>
            )}

            <footer className="upload-footer">
              <div className="upload-footer__meta">
                <span className="upload-avatar" aria-hidden>{viewerName.charAt(0)}</span>
                <div>
                  <p className="upload-footer__title">Signed in as {viewerName}</p>
                  <span className="upload-footer__hint">Documents sync instantly across the patient dashboard.</span>
                </div>
              </div>

              <div className="upload-footer__actions">
                <button className="btn" onClick={() => navigate(-1)} disabled={loading}>Back to session</button>
                <button className="btn btn-primary upload-submit" onClick={uploadDocument} disabled={loading || !file}>
                  {loading ? `Uploading… ${progress}%` : "Upload Document"}
                </button>
              </div>
            </footer>
          </div>

          <aside className="upload-side card">
            <h3>Tips for faster uploads</h3>
            <ul>
              <li>Scan multi-page prescriptions into a single PDF where possible.</li>
              <li>Use descriptive file names so patients recognize them instantly.</li>
              <li>Double-check personally identifiable info before sharing.</li>
            </ul>

            <div className="upload-side__status">
              <strong>Encryption</strong>
              <p>All documents are stored securely and are only accessible within this session.</p>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
