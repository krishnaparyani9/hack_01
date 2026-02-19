import { useState } from "react";
import axios from "axios";
import { useNavigate, Link } from "react-router-dom";
import { saveAuth } from "../../utils/auth";
import ThemeToggle from "../../components/ThemeToggle";

const API = "http://localhost:5000";

export default function Signup() {
  const [role, setRole] = useState<"patient" | "doctor">("patient");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [licenseNumber, setLicenseNumber] = useState("");
  const [clinicName, setClinicName] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !password) {
      window.dispatchEvent(new CustomEvent("toast", { detail: { message: "Please fill all fields", type: "error" } }));
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      window.dispatchEvent(new CustomEvent("toast", { detail: { message: "Invalid email format", type: "error" } }));
      return;
    }
    if (password.length < 6) {
      window.dispatchEvent(new CustomEvent("toast", { detail: { message: "Password must be at least 6 characters", type: "error" } }));
      return;
    }
    if (role === "doctor" && (!licenseNumber || licenseNumber.trim().length < 3)) {
      window.dispatchEvent(new CustomEvent("toast", { detail: { message: "Please provide a valid license number", type: "error" } }));
      return;
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
      window.dispatchEvent(new CustomEvent("toast", { detail: { message: "Account created!", type: "success" } }));
      if (role === "doctor") navigate("/doctor/dashboard");
      else navigate("/patient/dashboard");
    } catch (err: any) {
      window.dispatchEvent(new CustomEvent("toast", { detail: { message: err?.response?.data?.message || "Signup failed", type: "error" } }));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-shell">
      {/* Ambient background */}
      <div className="auth-shell__bg" aria-hidden>
        <span className="auth-orb auth-orb--1" />
        <span className="auth-orb auth-orb--2" />
        <span className="auth-orb auth-orb--3" />
      </div>

      {/* Left panel — branding */}
      <div className="auth-panel">
        <Link to="/" className="auth-panel__brand">
          <span className="auth-panel__mark">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2l-8 4v6c0 5.5 3.4 10.7 8 12 4.6-1.3 8-6.5 8-12V6l-8-4z" />
              <path d="M9 12l2 2 4-4" />
            </svg>
          </span>
          <span className="auth-panel__wordmark">HealthKey</span>
        </Link>

        <div className="auth-panel__content">
          <h1 className="auth-panel__title">Join HealthKey ✨</h1>
          <p className="auth-panel__sub">Create an account to securely store, organize, and share your medical records with healthcare providers.</p>

          <div className="auth-panel__features">
            <div className="auth-feature">
              <div className="auth-feature__icon">
                <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
              </div>
              <div>
                <strong>Upload Anything</strong>
                <span>Prescriptions, lab reports, imaging — all organized in one place.</span>
              </div>
            </div>
            <div className="auth-feature">
              <div className="auth-feature__icon auth-feature__icon--teal">
                <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              </div>
              <div>
                <strong>Time-Limited Access</strong>
                <span>Sessions auto-expire. No lingering permissions, no forgotten access.</span>
              </div>
            </div>
            <div className="auth-feature">
              <div className="auth-feature__icon auth-feature__icon--purple">
                <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>
              </div>
              <div>
                <strong>Emergency Ready</strong>
                <span>Keep critical health info accessible for first responders.</span>
              </div>
            </div>
          </div>
        </div>

        <div className="auth-panel__footer">
          <span>© {new Date().getFullYear()} HealthKey</span>
          <a href="#">Privacy</a>
          <a href="#">Terms</a>
        </div>
      </div>

      {/* Right panel — form */}
      <div className="auth-form-wrap">
        <div className="auth-form-card">
          <div className="auth-form-card__top">
            <ThemeToggle ariaLabel="Toggle dark mode" />
          </div>

          <div className="auth-form-card__header">
            <div className="auth-form-card__logo">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2l-8 4v6c0 5.5 3.4 10.7 8 12 4.6-1.3 8-6.5 8-12V6l-8-4z" />
                <path d="M9 12l2 2 4-4" />
              </svg>
            </div>
            <h2>Create your account</h2>
            <p>Get started in less than 30 seconds</p>
          </div>

          <form onSubmit={handleSignup} className="auth-form">
            {/* Role toggle */}
            <div className="auth-role-toggle">
              <button
                type="button"
                className={`auth-role-toggle__btn${role === "patient" ? " active" : ""}`}
                onClick={() => setRole("patient")}
              >
                <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                Patient
              </button>
              <button
                type="button"
                className={`auth-role-toggle__btn${role === "doctor" ? " active" : ""}`}
                onClick={() => setRole("doctor")}
              >
                <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                Doctor
              </button>
            </div>

            <div className="auth-field">
              <label htmlFor="signup-name">Full name</label>
              <div className="auth-input-wrap">
                <svg className="auth-input-icon" width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                <input id="signup-name" className="auth-input" placeholder="John Doe" value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" />
              </div>
            </div>

            <div className="auth-field">
              <label htmlFor="signup-email">Email address</label>
              <div className="auth-input-wrap">
                <svg className="auth-input-icon" width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                <input id="signup-email" className="auth-input" type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" />
              </div>
            </div>

            <div className="auth-field">
              <label htmlFor="signup-pass">Password</label>
              <div className="auth-input-wrap">
                <svg className="auth-input-icon" width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                <input id="signup-pass" className="auth-input" type="password" placeholder="Min. 6 characters" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="new-password" />
              </div>
            </div>

            {role === "doctor" && (
              <>
                <div className="auth-field">
                  <label htmlFor="signup-license">License number</label>
                  <div className="auth-input-wrap">
                    <svg className="auth-input-icon" width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2" /></svg>
                    <input id="signup-license" className="auth-input" placeholder="e.g. MCI-12345" value={licenseNumber} onChange={(e) => setLicenseNumber(e.target.value)} />
                  </div>
                </div>
                <div className="auth-field">
                  <label htmlFor="signup-clinic">Clinic name <span className="auth-optional">(optional)</span></label>
                  <div className="auth-input-wrap">
                    <svg className="auth-input-icon" width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
                    <input id="signup-clinic" className="auth-input" placeholder="City Hospital" value={clinicName} onChange={(e) => setClinicName(e.target.value)} />
                  </div>
                </div>
              </>
            )}

            <button className="auth-submit" type="submit" disabled={loading}>
              {loading ? (
                <span className="auth-spinner" />
              ) : (
                <>
                  Create Account
                  <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5-5 5M6 12h12" /></svg>
                </>
              )}
            </button>

            <div className="auth-divider">
              <span>or</span>
            </div>

            <Link to="/login" className="auth-alt-btn">
              Already have an account? Sign in
            </Link>

            <p className="auth-legal">
              By signing up you agree to our <a href="#">Terms</a> and <a href="#">Privacy Policy</a>.
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
