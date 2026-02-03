import { Link } from "react-router-dom";
import Header from "../components/Header";
import Footer from "../components/Footer";

export default function Landing() {
  return (
    <div>
      <Header />

      <main className="auth-page" style={{ minHeight: '72vh' }}>
        <div className="auth-bg-icons" aria-hidden>
          <span className="bg-icon icon-syringe" />
          <span className="bg-icon icon-pills" />
          <span className="bg-icon icon-stethoscope" />
        </div>

        <div className="landing-grid">
          <div className="auth-hero landing-hero">
            <div style={{ maxWidth: 720 }}>
              <h1>HealthVault — Secure medical records, shared simply.</h1>
              <p style={{ color: 'var(--text-muted)', marginTop: 12, fontSize: 16 }}>
                Control your medical documents, share access temporarily with clinicians,
                and keep critical emergency details available when it matters most.
              </p>

              <div style={{ marginTop: 20, display: 'flex', gap: 12, alignItems: 'center' }}>
                <Link to="/signup">
                  <button className="btn btn-primary" style={{ padding: '12px 20px' }}>Get Started</button>
                </Link>
                <Link to="/login">
                  <button className="btn btn-outline" style={{ padding: '10px 14px' }}>Sign In</button>
                </Link>
              </div>
            </div>
          </div>

          <aside className="auth-card" style={{ padding: 36, alignSelf: 'start' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18 }}>
              <div>
                <h3 style={{ marginBottom: 8 }}>For Patients</h3>
                <p className="muted">Upload and organize documents, generate secure QR access, and manage emergency info.</p>
              </div>

              <div>
                <h3 style={{ marginBottom: 8 }}>For Clinicians</h3>
                <p className="muted">Start temporary consultation sessions, request access, and upload encounter documents safely.</p>
              </div>
            </div>

            <hr style={{ margin: '18px 0', border: 'none', borderTop: '1px solid var(--border)' }} />

            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 12 }}>
              <div className="card feature-card" style={{ padding: 14 }}>
                <h4>Privacy-first</h4>
                <p className="muted">Patient-owned data with explicit, time-limited sharing.</p>
              </div>

              

              <div className="card feature-card" style={{ padding: 14 }}>
                <h4>Emergency Ready</h4>
                <p className="muted">Store critical health details for quick access in urgent situations.</p>
              </div>
            </div>
          </aside>
        </div>
      </main>

      <Footer />
    </div>
  );
}
