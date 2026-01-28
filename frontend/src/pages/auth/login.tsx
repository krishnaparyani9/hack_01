import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom"; 
import axios from "axios";
import { saveAuth } from "../../utils/auth";

const API = "http://localhost:5000";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

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


  const handleSignin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return alert("Provide email and password");

    try {
      const guestPatientId = localStorage.getItem("patientId") || undefined;
      const res = await axios.post(`${API}/api/auth/login`, { email, password, guestPatientId });
      const { token, user } = res.data.data;
      saveAuth(token, user);
      window.dispatchEvent(new CustomEvent("toast", { detail: { message: "Logged in", type: "success" } }));

      if ((user.role as string) === "doctor") navigate("/doctor/dashboard");
      else navigate("/patient/dashboard");
    } catch (err: any) {
      alert(err?.response?.data?.message || "Login failed");
    }
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
          <h1>Welcome back 👋</h1>
          <p>HealthVault helps you securely store, share, and control access to medical records. Sign in to access your records, share QR codes with doctors, and manage emergency info.</p>

          <div style={{ display: "grid", gap: 8, marginTop: 18 }}>
            <div className="card" style={{ padding: 12 }}>
              <strong>Secure storage</strong>
              <div className="auth-small">Encrypted cloud storage for prescriptions, lab reports, and scans.</div>
            </div>

            <div className="card" style={{ padding: 12 }}>
              <strong>Patient-controlled access</strong>
              <div className="auth-small">Generate time-bound QR codes to safely share records with doctors.</div>
            </div>
          </div>

          <p className="auth-note">If you are a doctor, sign in with your doctor account. For patient accounts, your records follow your account.</p>
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
            <div className="auth-small">Welcome back — sign in to continue</div>
          </div>
        </div>

        <form onSubmit={handleSignin} style={{ marginTop: 6 }}>
          <div style={{ marginBottom: 12 }}>
            <input className="form-input" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>

          <div style={{ marginBottom: 12 }}>
            <input className="form-input" type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} />
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <div className="auth-small">Forgot your password? <a href="#" onClick={(e) => { e.preventDefault(); window.dispatchEvent(new CustomEvent('toast', { detail: { message: 'Password reset not implemented', type: 'error' } })); }}>Reset</a></div>
            <div className="auth-small">Need an account? <Link to="/signup">Create one</Link></div>
          </div>

          <div className="auth-actions">
            <button className="btn btn-primary" type="submit" style={{ flex: 1 }}>Sign In</button>
          </div>

          <div style={{ marginTop: 12 }} className="auth-small">By signing in you agree to our <a href="#">Terms</a> and <a href="#">Privacy Policy</a>.</div>
        </form>
      </div>
    </div>
  );
};

export default Login;
