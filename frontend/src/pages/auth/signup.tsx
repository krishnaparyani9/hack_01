import { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate, Link } from "react-router-dom";
import { saveAuth } from "../../utils/auth";

const API = "http://localhost:5000";

export default function Signup() {
  const [role, setRole] = useState<"patient" | "doctor">("patient");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [darkMode, setDarkMode] = useState<boolean>(() => {
    try { return localStorage.getItem("theme") === "dark"; } catch { return false; }
  });

  useEffect(() => {
    try {
      if (darkMode) document.body.classList.add("dark");
      else document.body.classList.remove("dark");
      localStorage.setItem("theme", darkMode ? "dark" : "light");
    } catch {}
  }, [darkMode]);

  const toggleTheme = () => setDarkMode((v) => !v);

  // Doctor fields
  const [licenseNumber, setLicenseNumber] = useState("");
  const [clinicName, setClinicName] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !password) return window.dispatchEvent(new CustomEvent("toast", { detail: { message: "Please fill all fields", type: "error" } }));

    // client-side validations
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return window.dispatchEvent(new CustomEvent("toast", { detail: { message: "Invalid email format", type: "error" } }));
    }
    if (password.length < 6) {
      return window.dispatchEvent(new CustomEvent("toast", { detail: { message: "Password must be at least 6 characters", type: "error" } }));
    }

    if (role === "doctor") {
      if (!licenseNumber || licenseNumber.trim().length < 3) {
        return window.dispatchEvent(new CustomEvent("toast", { detail: { message: "Please provide a valid license number", type: "error" } }));
      }
    }

    setLoading(true);
    try {
      const payload: any = { name, email, password, role };
      if (role === "doctor") {
        payload.licenseNumber = licenseNumber;
        if (clinicName) payload.clinicName = clinicName;
      }

      const res = await axios.post(`${API}/api/auth/signup`, payload);
      const { token, user } = res.data.data;
      saveAuth(token, user);
      window.dispatchEvent(new CustomEvent("toast", { detail: { message: "Signed up", type: "success" } }));
      if (role === "doctor") navigate("/doctor/dashboard");
      else navigate("/patient/dashboard");
    } catch (err: any) {
      window.dispatchEvent(new CustomEvent("toast", { detail: { message: err?.response?.data?.message || "Signup failed", type: "error" } }));
    } finally { setLoading(false); }
  };

  return (
    <div className="auth-page">
      <div className="auth-bg-icons" aria-hidden>
        <span className="bg-icon icon-syringe" />
        <span className="bg-icon icon-pills" />
        <span className="bg-icon icon-stethoscope" />
      </div>
      <div className="auth-hero">
        <div style={{ maxWidth: 640 }}>
          <h1>Create your HealthVault</h1>
          <p>Securely store and share medical records with doctors. Your data stays private and you control who can view it with time-bound QR sharing.</p>

          <div style={{ display: "grid", gap: 8, marginTop: 18 }}>
            <div className="card" style={{ padding: 12 }}>
              <strong>Keep records safe</strong>
              <div className="auth-small">Easy uploads and secure cloud storage for all medical files.</div>
            </div>

            <div className="card" style={{ padding: 12 }}>
              <strong>Share securely</strong>
              <div className="auth-small">Generate QR tokens to grant short-lived access to doctors.</div>
            </div>
          </div>
        </div>
      </div>

      <div className="auth-card card">
        <button className={`theme-toggle btn-icon auth-theme-toggle ${darkMode ? "dark" : "light"}`} title="Toggle theme" onClick={toggleTheme} aria-pressed={darkMode} aria-label="Toggle theme">
          <svg className="icon-sun" width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
            <path d="M12 4V2M12 22v-2M4 12H2M22 12h-2M4.9 4.9L3.5 3.5M20.5 20.5l-1.4-1.4M4.9 19.1l-1.4 1.4M20.5 3.5l-1.4 1.4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
            <circle cx="12" cy="12" r="3.2" stroke="currentColor" strokeWidth="1.6"/>
          </svg>
          <svg className="icon-moon" width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
            <path d="M21 12.8A9 9 0 1111.2 3 7 7 0 0021 12.8z" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
        <div className="auth-brand">
          <div className="auth-logo">HV</div>
          <div>
            <div style={{ fontWeight: 800 }}>HealthVault</div>
            <div className="auth-small">Create an account to get started</div>
          </div>
        </div>

        <form onSubmit={handleSignup} style={{ marginTop: 12 }} className="editor-form">
          <div style={{ marginBottom: 12 }}>
            <label style={{ marginRight: 8 }}>
              <input type="radio" checked={role === "patient"} onChange={() => setRole("patient")} /> Patient
            </label>
            <label style={{ marginLeft: 12 }}>
              <input type="radio" checked={role === "doctor"} onChange={() => setRole("doctor")} /> Doctor
            </label>
          </div>

          <div style={{ marginBottom: 12 }}>
            <input className="form-input" placeholder="Full name" value={name} onChange={(e) => setName(e.target.value)} />
          </div>

          <div style={{ marginBottom: 12 }}>
            <input className="form-input" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>

          <div style={{ marginBottom: 12 }}>
            <input className="form-input" type="password" placeholder="Password (min 6)" value={password} onChange={(e) => setPassword(e.target.value)} />
          </div>

          {role === "doctor" && (
            <>
              <div style={{ marginBottom: 12 }}>
                <input className="form-input" placeholder="License number" value={licenseNumber} onChange={(e) => setLicenseNumber(e.target.value)} />
              </div>
              <div style={{ marginBottom: 12 }}>
                <input className="form-input" placeholder="Clinic name (optional)" value={clinicName} onChange={(e) => setClinicName(e.target.value)} />
              </div>
            </>
          )}

          <div style={{ display: "flex", gap: 8 }}>
            <button className="btn btn-primary" type="submit" style={{ flex: 1 }} disabled={loading}>{loading ? "Creating…" : "Sign Up"}</button>
            <Link to="/" className="btn btn-outline" style={{ padding: "10px 14px" }}>Cancel</Link>
          </div>

          <p style={{ marginTop: 12, fontSize: 13 }}>
            Already have an account? <Link to="/">Sign in</Link>
          </p>

          <div className="auth-note">By signing up you agree to our <a href="#">Terms</a> and <a href="#">Privacy Policy</a>.</div>
        </form>
      </div>
    </div>
  );
}
