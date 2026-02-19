import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import axios from "axios";
import { saveAuth } from "../../utils/auth";
import ThemeToggle from "../../components/ThemeToggle";

const API = "http://localhost:5000";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSignin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      window.dispatchEvent(new CustomEvent("toast", { detail: { message: "Provide email and password", type: "error" } }));
      return;
    }

    setLoading(true);
    try {
      const guestPatientId = localStorage.getItem("patientId") || undefined;
      const res = await axios.post(`${API}/api/auth/login`, { email, password, guestPatientId });
      const { token, user } = res.data.data;
      saveAuth(token, user);
      window.dispatchEvent(new CustomEvent("toast", { detail: { message: "Logged in", type: "success" } }));
      if ((user.role as string) === "doctor") navigate("/doctor/dashboard");
      else navigate("/patient/dashboard");
    } catch (err: any) {
      window.dispatchEvent(new CustomEvent("toast", { detail: { message: err?.response?.data?.message || "Login failed", type: "error" } }));
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

      {/* Left panel — branding & info */}
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
          <h1 className="auth-panel__title">Welcome back 👋</h1>
          <p className="auth-panel__sub">Sign in to access your secure medical records, share QR codes with doctors, and manage your health data.</p>

          <div className="auth-panel__features">
            <div className="auth-feature">
              <div className="auth-feature__icon">
                <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
              </div>
              <div>
                <strong>Encrypted Storage</strong>
                <span>Military-grade security for prescriptions, lab reports, and scans.</span>
              </div>
            </div>
            <div className="auth-feature">
              <div className="auth-feature__icon auth-feature__icon--teal">
                <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /><path d="M14 14h3v3h-3zM20 14v3h-3M14 20h3M20 17v3" /></svg>
              </div>
              <div>
                <strong>QR-Based Sharing</strong>
                <span>Time-bound access — you control who sees your records and for how long.</span>
              </div>
            </div>
            <div className="auth-feature">
              <div className="auth-feature__icon auth-feature__icon--purple">
                <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
              </div>
              <div>
                <strong>Patient-Controlled</strong>
                <span>Your data, your rules. Revoke access instantly at any time.</span>
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
            <h2>Sign in to HealthKey</h2>
            <p>Enter your credentials to continue</p>
          </div>

          <form onSubmit={handleSignin} className="auth-form">
            <div className="auth-field">
              <label htmlFor="login-email">Email address</label>
              <div className="auth-input-wrap">
                <svg className="auth-input-icon" width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                <input
                  id="login-email"
                  className="auth-input"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                />
              </div>
            </div>

            <div className="auth-field">
              <div className="auth-field__row">
                <label htmlFor="login-pass">Password</label>
                <a href="#" className="auth-field__link" onClick={(e) => { e.preventDefault(); window.dispatchEvent(new CustomEvent("toast", { detail: { message: "Password reset not implemented", type: "error" } })); }}>
                  Forgot password?
                </a>
              </div>
              <div className="auth-input-wrap">
                <svg className="auth-input-icon" width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                <input
                  id="login-pass"
                  className="auth-input"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                />
              </div>
            </div>

            <button className="auth-submit" type="submit" disabled={loading}>
              {loading ? (
                <span className="auth-spinner" />
              ) : (
                <>
                  Sign In
                  <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5-5 5M6 12h12" /></svg>
                </>
              )}
            </button>

            <div className="auth-divider">
              <span>or</span>
            </div>

            <Link to="/signup" className="auth-alt-btn">
              Create a new account
            </Link>

            <p className="auth-legal">
              By signing in you agree to our <a href="#">Terms</a> and <a href="#">Privacy Policy</a>.
            </p>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Login;
