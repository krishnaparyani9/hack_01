import { useState } from "react";
import axios from "axios";
import { useNavigate, Link } from "react-router-dom";
import { saveAuth } from "../../utils/auth";

const API = "http://localhost:5000";

export default function Signup() {
  const [role, setRole] = useState<"patient" | "doctor">("patient");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
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

    setLoading(true);
    try {
      const res = await axios.post(`${API}/api/auth/signup`, { name, email, password, role });
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
    <div style={{ padding: 44, maxWidth: 520, margin: "0 auto" }}>
      <div className="card">
        <h2>Sign Up</h2>
        <p style={{ color: "var(--text-muted)" }}>Create an account to keep records and share securely.</p>

        <form onSubmit={handleSignup} style={{ marginTop: 20 }} className="editor-form">
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

          <div style={{ display: "flex", gap: 8 }}>
            <button className="btn btn-primary" type="submit" style={{ flex: 1 }} disabled={loading}>{loading ? "Creating…" : "Sign Up"}</button>
            <Link to="/" className="btn btn-outline" style={{ padding: "10px 14px" }}>Cancel</Link>
          </div>

          <p style={{ marginTop: 12, fontSize: 13 }}>
            Already have an account? <Link to="/">Sign in</Link>
          </p>
        </form>
      </div>
    </div>
  );
}
