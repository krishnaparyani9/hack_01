import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import axios from "axios";
import { saveAuth } from "../../utils/auth";

const API = "http://localhost:5000";

const Login = () => {
  const [mode, setMode] = useState<"guest" | "signin">("guest");
  const [role, setRole] = useState<"patient" | "doctor">("patient");
  const [identifier, setIdentifier] = useState("");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const handleGuest = (e: React.FormEvent) => {
    e.preventDefault();

    const patientId = (window.crypto as any)?.randomUUID?.() || `${Date.now()}-${Math.random()}`;
    // Use identifier as a display name if provided; if it looks like an email, store it too
    const value = identifier.trim();
    const patientName = value && !value.includes("@") ? value : "Patient";
    const patientEmail = value && value.includes("@") ? value : "";

    localStorage.setItem("patientId", patientId);
    localStorage.setItem("patientName", patientName);
    if (patientEmail) localStorage.setItem("patientEmail", patientEmail);
    localStorage.removeItem("sessionId");

    navigate("/patient/dashboard");
  };

  const handleSignin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return alert("Provide email and password");

    try {
      const res = await axios.post(`${API}/api/auth/login`, { email, password });
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
    <div style={{ padding: 40, maxWidth: 520, margin: "0 auto" }}>
      <h2>Login</h2>
      <p>Sign in to access your account or continue as guest.</p>

      <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
        <button className={`btn ${mode === "guest" ? "btn-primary" : ""}`} onClick={() => setMode("guest")}>
          Continue as Guest
        </button>
        <button className={`btn ${mode === "signin" ? "btn-primary" : ""}`} onClick={() => setMode("signin")}>
          Sign In
        </button>
      </div>

      {mode === "guest" && (
        <form onSubmit={handleGuest} style={{ marginTop: 20 }}>
          <div style={{ marginBottom: 12 }}>
            <label style={{ marginRight: 8 }}>
              <input type="radio" checked={role === "patient"} onChange={() => setRole("patient")} /> Patient
            </label>
            <label style={{ marginLeft: 12 }}>
              <input type="radio" checked={role === "doctor"} onChange={() => setRole("doctor")} /> Doctor
            </label>
          </div>

          {role === "patient" && (
            <div style={{ marginBottom: 12 }}>
              <input
                placeholder="email or identifier (optional)"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                style={{ width: "100%", padding: 10 }}
              />
            </div>
          )}

          <button className="btn btn-primary" type="submit" style={{ width: "100%" }}>
            Continue
          </button>
        </form>
      )}

      {mode === "signin" && (
        <form onSubmit={handleSignin} style={{ marginTop: 20 }}>
          <div style={{ marginBottom: 12 }}>
            <input placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} style={{ width: "100%", padding: 10 }} />
          </div>

          <div style={{ marginBottom: 12 }}>
            <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} style={{ width: "100%", padding: 10 }} />
          </div>

          <button className="btn btn-primary" type="submit" style={{ width: "100%" }}>Sign In</button>

          <p style={{ marginTop: 12, fontSize: 13 }}>
            Don't have an account? <Link to="/signup">Sign up</Link>
          </p>
        </form>
      )}
    </div>
  );
};

export default Login;
