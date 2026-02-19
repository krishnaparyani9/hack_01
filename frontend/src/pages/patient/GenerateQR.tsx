import { useMemo, useState, useEffect } from "react";
import axios from "axios";
import QrModal from "../../components/QrModal";
import TiltCard from "../../components/TiltCard";

const API = "http://localhost:5000";

export default function GenerateQR() {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [accessType, setAccessType] = useState<"view" | "write">("view");
  const [duration, setDuration] = useState(15);
  const [qrToken, setQrToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showQrModal, setShowQrModal] = useState(false);
  const [activeSession, setActiveSession] = useState<{ sessionId: string; expiresAt: number; accessType: "view" | "write" } | null>(null);
  const [timeLeft, setTimeLeft] = useState<number>(0);

  const [patientId, setPatientId] = useState<string>(() => localStorage.getItem("patientId") || localStorage.getItem("userId") || "");
  const [documents, setDocuments] = useState<Array<{ id: string; type?: string; createdAt?: string }>>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const typeCounts = useMemo(() => {
    const map: Record<string, number> = {};
    for (const d of documents) {
      const k = (d.type || "Other").toString();
      map[k] = (map[k] || 0) + 1;
    }
    return map;
  }, [documents]);

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const selectAll = () => setSelectedIds(documents.map((d) => d.id));
  const clearAll = () => setSelectedIds([]);

  const fetchDocs = async (pid: string) => {
    try {
      const res = await axios.get(`${API}/api/documents/patient/${pid}`);
      const list = (res.data?.data || []).map((d: any) => ({ id: d.id, type: d.type, createdAt: d.createdAt }));
      setDocuments(list);
      // keep selection stable; only auto-select when nothing chosen yet
      setSelectedIds((prev) => (prev.length ? prev : list.slice(0, 6).map((x: any) => x.id)));
    } catch {
      setDocuments([]);
    }
  };

  const generateQR = async () => {
    try {
      setLoading(true);

      // Prevent generating while an active session exists
      if (activeSession && activeSession.expiresAt > Date.now()) {
        window.dispatchEvent(new CustomEvent("toast", { detail: { message: "An active session already exists — wait until it expires", type: "error" } }));
        return;
      }

      const userId = localStorage.getItem("userId") || localStorage.getItem("patientId");
      const userRoleRaw = localStorage.getItem("userRole");
      const authToken = localStorage.getItem("authToken");

      const isSignedInPatient = (userRoleRaw || "").toLowerCase() === "patient" && !!authToken;

      if (!userId) {
        window.dispatchEvent(new CustomEvent("toast", { detail: { message: "Please sign in as a patient to generate a QR", type: "error" } }));
        return;
      }

      const patientId = userId as string;
      // Persist a stable patientId so the patient UI and sessions align.
      // Do not overwrite an existing `patientId` unless the signed-in user
      // is actually a patient (prevents accidentally setting the id to a
      // non-patient user when role/state is inconsistent).
      try {
        const storedPid = localStorage.getItem("patientId");
        const isSignedInPatient = (userRoleRaw || "").toLowerCase() === "patient" && !!authToken;
        if (!storedPid || isSignedInPatient) {
          localStorage.setItem("patientId", patientId);
        }
      } catch {}
      // If the user is signed in as a patient, call the authenticated create
      // endpoint. Otherwise (no auth token but a stored patientId) fall back
      // to the anon endpoint so patients who previously persisted a patientId
      // can generate a QR without re-signing in.
      const sharedDocIds = selectedIds.length ? selectedIds : undefined;

      let res;
      try {
        if (isSignedInPatient) {
          res = await axios.post(
            `${API}/api/session/create`,
            { accessType, durationMinutes: duration, patientId, sharedDocIds },
            { headers: { Authorization: `Bearer ${authToken}` } }
          );
        } else {
          // fallback anonymous creation using persisted patientId
          res = await axios.post(`${API}/api/session/create-anon`, { accessType, durationMinutes: duration, patientId, sharedDocIds });
        }
      } catch (err: any) {
        // If server reports an active session, show a clearer message
        if (err?.response?.status === 409) {
          window.dispatchEvent(new CustomEvent("toast", { detail: { message: "An active session already exists — wait until it expires", type: "error" } }));
          return;
        }
        throw err;
      }

      const { token, sessionId } = res.data.data;

      // 🔑 VERY IMPORTANT (used by Documents upload)
      localStorage.setItem("sessionId", sessionId);

      // mark active session locally
      try {
        const exp = res.data.data.expiresAt as number | undefined;
        if (exp) {
          setActiveSession({ sessionId, expiresAt: exp, accessType });
          setTimeLeft(Math.max(0, exp - Date.now()));
        }
      } catch {}

      setQrToken(token);
      setShowQrModal(true);
      setStep(3);
    } catch (err) {
      alert("Failed to generate QR");
    } finally {
      setLoading(false);
    }
  };

  // Check for an existing session on mount and subscribe to countdown
  useEffect(() => {
    let mounted = true;
    let tid: number | undefined;

    const syncSession = async () => {
      const stored = localStorage.getItem("sessionId");
      if (!stored) return;
      try {
        const res = await axios.get(`${API}/api/session/${stored}`);
        const data = res.data?.data;
        if (data && data.expiresAt && Date.now() < data.expiresAt) {
          if (!mounted) return;
          setActiveSession({ sessionId: data.sessionId, expiresAt: data.expiresAt, accessType: data.accessType });
          setTimeLeft(Math.max(0, data.expiresAt - Date.now()));

          tid = window.setInterval(() => {
            const left = Math.max(0, data.expiresAt - Date.now());
            setTimeLeft(left);
            if (left <= 0) {
              setActiveSession(null);
              localStorage.removeItem("sessionId");
              if (tid) window.clearInterval(tid);
            }
          }, 1000) as unknown as number;
        } else {
          // expired or missing
          localStorage.removeItem("sessionId");
          // clear any shown QR token because session is not valid
          setQrToken(null);
        }
      } catch (e) {
        // ignore failures — session may be gone
        localStorage.removeItem("sessionId");
        setQrToken(null);
      }
    };

    syncSession();

    return () => {
      mounted = false;
      if (tid) window.clearInterval(tid);
    };
  }, []);

  // load documents for selection (based on persistent patientId)
  useEffect(() => {
    const pid = patientId || localStorage.getItem("patientId") || localStorage.getItem("userId") || "";
    if (!pid) return;
    setPatientId(pid);
    fetchDocs(pid);
  }, []);

  // keep countdown in sync for newly created sessions
  useEffect(() => {
    if (!activeSession) {
      setTimeLeft(0);
      return;
    }

    const id = window.setInterval(() => {
      const left = Math.max(0, activeSession.expiresAt - Date.now());
      setTimeLeft(left);
      if (left <= 0) {
        setActiveSession(null);
        localStorage.removeItem("sessionId");
        window.clearInterval(id);
      }
    }, 1000) as unknown as number;

    return () => window.clearInterval(id);
  }, [activeSession]);

  const formatTime = (ms: number) => {
    if (!ms || ms <= 0) return "Expired";
    const s = Math.floor(ms / 1000);
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}m ${String(sec).padStart(2, "0")}s`;
  };

  return (
    <div className="main" style={{ maxWidth: 860, margin: "0 auto" }}>
      <div className="page-header">
        <div>
          <div className="page-title">Generate QR Session</div>
          <div className="muted">Choose what to share, set access type, and generate a time-limited QR for clinician access.</div>
        </div>
        {activeSession && (
          <div className="hk-badge hk-badge--write">
            ACTIVE • {activeSession.accessType.toUpperCase()} • {formatTime(timeLeft)}
          </div>
        )}
      </div>

      <div className="hk-stepper" aria-label="QR session steps">
        <span className={`hk-stepper__pill ${step === 1 ? "active" : ""}`}>1. Select documents</span>
        <span className={`hk-stepper__pill ${step === 2 ? "active" : ""}`}>2. Access & duration</span>
        <span className={`hk-stepper__pill ${step === 3 ? "active" : ""}`}>3. QR & countdown</span>
      </div>

      {step === 1 && (
        <TiltCard className="card" tiltMaxDeg={6}>
          <h3>Select documents to share</h3>
          <p className="muted">Select specific documents, or leave empty to share all available records for the session.</p>

          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 10 }}>
            <button className="btn btn-secondary" onClick={selectAll} disabled={!documents.length}>Select all</button>
            <button className="btn" onClick={clearAll} disabled={!selectedIds.length}>Clear</button>
            <div className="muted" style={{ margin: 0 }}>
              Selected: <strong>{selectedIds.length}</strong> / {documents.length}
            </div>
          </div>

          {documents.length > 0 ? (
            <div className="card" style={{ marginTop: 16, background: "var(--surface-2)", border: "1px solid var(--border)" }}>
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                {Object.entries(typeCounts).map(([t, n]) => (
                  <span key={t} className="doc-badge">{t} • {n}</span>
                ))}
              </div>

              <div className="scroll-list" style={{ marginTop: 12 }}>
                {documents.map((d, idx) => {
                  const checked = selectedIds.includes(d.id);
                  const label = `${d.type || "Other"} • ${d.createdAt ? new Date(d.createdAt).toLocaleString() : ""}`;
                  return (
                    <div key={d.id || idx} className={`records-row ${checked ? "records-row--selected" : ""}`} style={{ alignItems: "flex-start" }}>
                      <div className="records-row__left">
                        <input type="checkbox" checked={checked} onChange={() => toggleSelect(d.id)} />
                        <div>
                          <div style={{ fontWeight: 800 }}>{d.type || "Document"}</div>
                          <div className="records-meta">{label}</div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="card" style={{ marginTop: 16 }}>
              <p className="muted">No documents found yet. Upload documents first, or create a session anyway and upload during a write-enabled consult.</p>
            </div>
          )}

          <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 18, gap: 10, flexWrap: "wrap" }}>
            <button className="btn btn-primary" onClick={() => setStep(2)}>Continue</button>
          </div>
        </TiltCard>
      )}

      {step === 2 && (
        <TiltCard className="card" tiltMaxDeg={6}>
          <h3>Access & duration</h3>
          <p className="muted">Choose whether clinicians can only view, or also upload new documents during the consultation.</p>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginTop: 16 }}>
            <div>
              <label><strong>Access Type</strong></label>
              <select
                value={accessType}
                onChange={(e) => setAccessType(e.target.value as "view" | "write")}
                style={{ width: "100%", marginTop: 8, padding: 12, borderRadius: 12, border: "1px solid var(--border)", background: "var(--surface-2)" }}
              >
                <option value="view">View Only</option>
                <option value="write">View + Upload</option>
              </select>
              <div style={{ marginTop: 10 }}>
                <span className={`hk-badge ${accessType === "write" ? "hk-badge--write" : "hk-badge--view"}`}>
                  {accessType === "write" ? "WRITE ENABLED" : "VIEW ONLY"}
                </span>
              </div>
            </div>

            <div>
              <label><strong>Duration (minutes)</strong></label>
              <input
                type="number"
                min={1}
                value={duration}
                onChange={(e) => setDuration(Number(e.target.value))}
                style={{ width: "100%", marginTop: 8, padding: 12, borderRadius: 12, border: "1px solid var(--border)", background: "var(--surface-2)" }}
              />
              <div className="muted" style={{ marginTop: 10 }}>
                Tip: 10–20 minutes is typical for a short consult.
              </div>
            </div>
          </div>

          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 18, gap: 10, flexWrap: "wrap" }}>
            <button className="btn" onClick={() => setStep(1)}>Back</button>
            <button
              className="btn btn-primary"
              onClick={generateQR}
              disabled={loading || !!(activeSession && activeSession.expiresAt > Date.now())}
            >
              {loading ? "Generating…" : "Generate QR"}
            </button>
          </div>
        </TiltCard>
      )}

      {step === 3 && (
        <TiltCard className="card" tiltMaxDeg={6}>
          <h3>QR & countdown</h3>
          <p className="muted">Keep this QR visible while the clinician scans it. You can end the session anytime.</p>

          {activeSession ? (
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center", marginTop: 10 }}>
              <span className={`hk-badge ${activeSession.accessType === "write" ? "hk-badge--write" : "hk-badge--view"}`}>
                {activeSession.accessType.toUpperCase()}
              </span>
              <span className="hk-badge">Expires in: {formatTime(timeLeft)}</span>
              <span className="hk-badge">Sharing: {selectedIds.length ? `${selectedIds.length} selected` : "All records"}</span>
            </div>
          ) : null}

          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 16 }}>
            <button className="btn btn-secondary" onClick={() => setShowQrModal(true)} disabled={!qrToken}>Open QR</button>
            <button className="btn" onClick={() => setStep(2)}>Adjust settings</button>
          </div>

          {showQrModal && qrToken && <QrModal token={qrToken} onClose={() => setShowQrModal(false)} />}
        </TiltCard>
      )}
    </div>
  );
}
