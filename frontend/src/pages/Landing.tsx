import { Link } from "react-router-dom";
import Header from "../components/Header";
import Footer from "../components/Footer";
import TiltCard from "../components/TiltCard";

/* ────────── inline SVG icons ────────── */
const IconShield = () => (
  <svg width="28" height="28" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.6}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
  </svg>
);
const IconQr = () => (
  <svg width="28" height="28" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.6}>
    <rect x="3" y="3" width="7" height="7" rx="1" />
    <rect x="14" y="3" width="7" height="7" rx="1" />
    <rect x="3" y="14" width="7" height="7" rx="1" />
    <path d="M14 14h3v3h-3zM20 14v3h-3M14 20h3M20 17v3" />
  </svg>
);
const IconBrain = () => (
  <svg width="28" height="28" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.6}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 2a7 7 0 0 0-4.6 12.3A4.98 4.98 0 0 0 7 18v2h10v-2a4.98 4.98 0 0 0-.4-3.7A7 7 0 0 0 12 2zM9 22h6" />
  </svg>
);
const IconClock = () => (
  <svg width="28" height="28" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.6}>
    <circle cx="12" cy="12" r="10" />
    <path strokeLinecap="round" d="M12 6v6l4 2" />
  </svg>
);
const IconHeart = () => (
  <svg width="28" height="28" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.6}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 1 0-7.78 7.78L12 21.23l8.84-8.84a5.5 5.5 0 0 0 0-7.78z" />
  </svg>
);
const IconFile = () => (
  <svg width="28" height="28" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.6}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6z" />
    <path d="M14 2v6h6M16 13H8M16 17H8M10 9H8" />
  </svg>
);

/* ────────── wave separator ────────── */
const WaveSeparator = ({ flip = false, color = "var(--lp-wave-fill)" }: { flip?: boolean; color?: string }) => (
  <div className={`lp-wave${flip ? " lp-wave--flip" : ""}`} aria-hidden>
    <svg viewBox="0 0 1440 100" preserveAspectRatio="none" className="lp-wave__svg">
      <path d="M0,48 C360,100 720,0 1080,48 C1260,80 1380,64 1440,48 L1440,100 L0,100Z" fill={color} />
    </svg>
  </div>
);

/* ────────── 3D hero illustration ────────── */
const HeroIllustration = () => (
  <div className="lp-illo" aria-hidden>
    <svg viewBox="0 0 480 420" fill="none" xmlns="http://www.w3.org/2000/svg" className="lp-illo__svg">
      {/* floating dashboard card */}
      <g className="lp-illo__float-1">
        <rect x="60" y="80" width="200" height="140" rx="18" fill="url(#lp-c1)" stroke="rgba(43,124,255,0.22)" strokeWidth="1.5" />
        <rect x="80" y="105" width="90" height="10" rx="5" fill="rgba(43,124,255,0.22)" />
        <rect x="80" y="125" width="60" height="10" rx="5" fill="rgba(20,184,166,0.28)" />
        <rect x="80" y="160" width="14" height="40" rx="4" fill="rgba(43,124,255,0.32)" />
        <rect x="100" y="148" width="14" height="52" rx="4" fill="rgba(20,184,166,0.38)" />
        <rect x="120" y="155" width="14" height="45" rx="4" fill="rgba(43,124,255,0.25)" />
        <rect x="140" y="140" width="14" height="60" rx="4" fill="rgba(20,184,166,0.42)" />
        <rect x="160" y="165" width="14" height="35" rx="4" fill="rgba(43,124,255,0.22)" />
        <circle cx="220" cy="120" r="18" fill="rgba(43,124,255,0.15)" stroke="rgba(43,124,255,0.3)" strokeWidth="1.5" />
        <circle cx="220" cy="115" r="6" fill="rgba(43,124,255,0.35)" />
        <path d="M210 130 a10 8 0 0 0 20 0" fill="rgba(43,124,255,0.22)" />
      </g>
      {/* floating QR card */}
      <g className="lp-illo__float-2">
        <rect x="240" y="180" width="160" height="160" rx="20" fill="url(#lp-c2)" stroke="rgba(20,184,166,0.22)" strokeWidth="1.5" />
        <rect x="270" y="210" width="100" height="100" rx="8" fill="rgba(255,255,255,0.65)" />
        <g fill="rgba(15,23,42,0.72)">
          <rect x="280" y="220" width="20" height="20" rx="3" />
          <rect x="310" y="220" width="10" height="10" rx="2" />
          <rect x="330" y="220" width="20" height="20" rx="3" />
          <rect x="280" y="250" width="10" height="10" rx="2" />
          <rect x="300" y="250" width="10" height="10" rx="2" />
          <rect x="330" y="250" width="20" height="20" rx="3" />
          <rect x="280" y="270" width="20" height="20" rx="3" />
          <rect x="310" y="270" width="10" height="10" rx="2" />
          <rect x="330" y="280" width="10" height="10" rx="2" />
        </g>
        <rect x="268" y="256" width="104" height="3" rx="1.5" fill="rgba(20,184,166,0.55)" className="lp-illo__scanline" />
      </g>
      {/* heart-rate card */}
      <g className="lp-illo__float-3">
        <rect x="100" y="250" width="150" height="90" rx="16" fill="url(#lp-c3)" stroke="rgba(239,68,68,0.16)" strokeWidth="1.5" />
        <circle cx="132" cy="280" r="14" fill="rgba(239,68,68,0.14)" />
        <path d="M126 280l3 -4 3 6 3 -8 3 10 3 -4 3 2" stroke="rgba(239,68,68,0.6)" strokeWidth="1.8" fill="none" strokeLinecap="round" />
        <rect x="160" y="274" width="58" height="8" rx="4" fill="rgba(239,68,68,0.14)" />
        <rect x="160" y="290" width="38" height="8" rx="4" fill="rgba(239,68,68,0.09)" />
        <text x="168" y="320" fontSize="10" fill="rgba(239,68,68,0.5)" fontFamily="Inter,sans-serif" fontWeight="700">72 BPM</text>
      </g>
      {/* shield */}
      <g className="lp-illo__float-4">
        <circle cx="380" cy="100" r="36" fill="url(#lp-sh)" stroke="rgba(43,124,255,0.16)" strokeWidth="1.5" />
        <path d="M380 78 l-16 8 v14 c0 10 16 18 16 18 s16-8 16-18 V86 z" fill="rgba(43,124,255,0.22)" stroke="rgba(43,124,255,0.38)" strokeWidth="1.2" />
        <path d="M373 98 l4 4 8-8" stroke="rgba(43,124,255,0.65)" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      </g>
      {/* plus signs */}
      <g opacity="0.14" className="lp-illo__float-5">
        <path d="M50 40h12M56 34v12" stroke="rgba(43,124,255,0.9)" strokeWidth="2.5" strokeLinecap="round" />
        <path d="M420 300h12M426 294v12" stroke="rgba(20,184,166,0.9)" strokeWidth="2.5" strokeLinecap="round" />
        <path d="M320 50h10M325 45v10" stroke="rgba(139,92,246,0.9)" strokeWidth="2" strokeLinecap="round" />
      </g>
      <defs>
        <linearGradient id="lp-c1" x1="60" y1="80" x2="260" y2="220" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="rgba(255,255,255,0.94)" /><stop offset="100%" stopColor="rgba(234,242,255,0.88)" />
        </linearGradient>
        <linearGradient id="lp-c2" x1="240" y1="180" x2="400" y2="340" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="rgba(236,254,250,0.92)" /><stop offset="100%" stopColor="rgba(209,250,229,0.72)" />
        </linearGradient>
        <linearGradient id="lp-c3" x1="100" y1="250" x2="250" y2="340" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="rgba(255,241,242,0.92)" /><stop offset="100%" stopColor="rgba(254,226,226,0.72)" />
        </linearGradient>
        <radialGradient id="lp-sh" cx="380" cy="100" r="36" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="rgba(234,242,255,0.92)" /><stop offset="100%" stopColor="rgba(219,234,254,0.62)" />
        </radialGradient>
      </defs>
    </svg>
  </div>
);

export default function Landing() {
  return (
    <div className="landing-page">
      <Header />

      {/* ━━━━━━━━ HERO ━━━━━━━━ */}
      <section className="lp-hero">
        <div className="lp-hero__orbs" aria-hidden>
          <span className="lp-orb lp-orb--1" />
          <span className="lp-orb lp-orb--2" />
          <span className="lp-orb lp-orb--3" />
        </div>

        <div className="lp-hero__inner container">
          <div className="lp-hero__text">
            <span className="lp-kicker">Secure · Patient-Controlled · Time-Limited</span>
            <h1 className="lp-hero__h1">
              Your Medical Records,<br />
              <span className="lp-gradient-text">Always in Your Control.</span>
            </h1>
            <p className="lp-hero__sub">
              HealthKey lets patients store medical documents and share temporary, session-based access
              with clinicians through secure QR codes — with a clear audit trail and strict time limits.
            </p>
            <div className="lp-hero__ctas">
              <Link to="/signup" className="lp-btn lp-btn--primary">
                Get Started Free
                <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5-5 5M6 12h12" /></svg>
              </Link>
              <Link to="/login" className="lp-btn lp-btn--outline">
                Sign In
              </Link>
            </div>
            <div className="lp-hero__trust">
              <span className="lp-trust-item">🔒 End-to-end secure</span>
              <span className="lp-trust-item">⏱ Time-limited sessions</span>
              <span className="lp-trust-item">🩺 HIPAA-conscious</span>
            </div>
          </div>

          <HeroIllustration />
        </div>
      </section>

      {/* ━━━━━━━━ WAVE + STATS ━━━━━━━━ */}
      <WaveSeparator color="var(--lp-stats-bg, #f0f7ff)" />

      <section className="lp-stats">
        <div className="container lp-stats__row">
          {[
            { num: "256-bit", label: "AES Encryption" },
            { num: "100%", label: "Patient-Owned Data" },
            { num: "< 5 sec", label: "QR Session Setup" },
            { num: "24/7", label: "Emergency Access" },
          ].map((s) => (
            <div className="lp-stat" key={s.label}>
              <span className="lp-stat__num">{s.num}</span>
              <span className="lp-stat__label">{s.label}</span>
            </div>
          ))}
        </div>
      </section>

      <WaveSeparator flip color="var(--lp-stats-bg, #f0f7ff)" />

      {/* ━━━━━━━━ HOW IT WORKS ━━━━━━━━ */}
      <section className="lp-section" id="how">
        <div className="container">
          <span className="lp-section__kicker">How It Works</span>
          <h2 className="lp-section__title">Three Simple Steps to Secure Sharing</h2>
          <p className="lp-section__sub">
            HealthKey is built around session-based sharing. You decide what&apos;s shared, for how long, and whether uploads are allowed.
          </p>

          <div className="lp-steps">
            {[
              { n: "01", title: "Upload Your Records", desc: "Prescriptions, lab reports, and scans — securely stored as patient-owned documents.", icon: "📄" },
              { n: "02", title: "Generate a QR Session", desc: "Pick access mode (view-only or view + upload), set a duration, and share specific docs.", icon: "📱" },
              { n: "03", title: "Clinician Consults", desc: "Doctor scans the QR, reviews shared documents, and can upload visit notes if permitted.", icon: "🩺" },
            ].map((s) => (
              <TiltCard key={s.n} className="lp-step-card" tiltMaxDeg={6}>
                <span className="lp-step-card__icon">{s.icon}</span>
                <span className="lp-step-card__num">{s.n}</span>
                <h3 className="lp-step-card__title">{s.title}</h3>
                <p className="lp-step-card__desc">{s.desc}</p>
              </TiltCard>
            ))}
          </div>
        </div>
      </section>

      {/* ━━━━━━━━ FEATURES ━━━━━━━━ */}
      <section className="lp-section lp-section--alt" id="features">
        <div className="container">
          <span className="lp-section__kicker">Features</span>
          <h2 className="lp-section__title">Everything You Need for Secure Health Records</h2>

          <div className="lp-features">
            {[
              { icon: <IconQr />, title: "QR-Based Sharing", desc: "Generate a session QR with view-only or view + upload permissions. Set a strict timer — no permanent access." },
              { icon: <IconBrain />, title: "AI Document Summaries", desc: "Get structured, intelligent summaries of your medical records. Derived only from what's present in the documents." },
              { icon: <IconShield />, title: "Granular Access Control", desc: "Share specific documents — not everything. Revoke access anytime before the session expires." },
              { icon: <IconClock />, title: "Time-Limited Sessions", desc: "Every session has a countdown. Once it expires, all access is automatically terminated." },
              { icon: <IconHeart />, title: "Emergency Profile", desc: "Keep critical health information visible, mobile-friendly, and printable for emergency responders." },
              { icon: <IconFile />, title: "Selective Sharing", desc: "Choose exactly which documents to include in each session — full control over what clinicians see." },
            ].map((f) => (
              <TiltCard key={f.title} className="lp-feature-card" tiltMaxDeg={5}>
                <div className="lp-feature-card__icon">{f.icon}</div>
                <h3 className="lp-feature-card__title">{f.title}</h3>
                <p className="lp-feature-card__desc">{f.desc}</p>
              </TiltCard>
            ))}
          </div>
        </div>
      </section>

      {/* ━━━━━━━━ PATIENT + CLINICIAN ━━━━━━━━ */}
      <section className="lp-section" id="who">
        <div className="container">
          <span className="lp-section__kicker">Built For</span>
          <h2 className="lp-section__title">Patients &amp; Clinicians, Together</h2>

          <div className="lp-duo">
            <TiltCard className="lp-duo__card lp-duo__card--patient" tiltMaxDeg={4}>
              <div className="lp-duo__badge">For Patients</div>
              <h3>Full ownership of your records</h3>
              <ul>
                <li>Upload &amp; organize medical documents</li>
                <li>Create emergency health profiles</li>
                <li>Share access through secure QR sessions</li>
                <li>Revoke access at any time</li>
                <li>AI-powered document summaries</li>
              </ul>
              <Link to="/signup" className="lp-btn lp-btn--primary lp-btn--sm">Get Started</Link>
            </TiltCard>

            <TiltCard className="lp-duo__card lp-duo__card--doctor" tiltMaxDeg={4}>
              <div className="lp-duo__badge lp-duo__badge--teal">For Clinicians</div>
              <h3>Instant, scoped access to records</h3>
              <ul>
                <li>Scan QR to open a time-bound session</li>
                <li>View shared records &amp; AI summaries</li>
                <li>Upload visit documents when permitted</li>
                <li>No registration required for sessions</li>
                <li>Clear audit trail for every action</li>
              </ul>
              <Link to="/login" className="lp-btn lp-btn--outline lp-btn--sm">Sign In</Link>
            </TiltCard>
          </div>
        </div>
      </section>

      {/* ━━━━━━━━ FINAL CTA ━━━━━━━━ */}
      <section className="lp-cta-banner">
        <div className="lp-cta-banner__orbs" aria-hidden>
          <span className="lp-orb lp-orb--1" />
          <span className="lp-orb lp-orb--2" />
        </div>
        <div className="container lp-cta-banner__inner">
          <h2>Ready to take control of your medical records?</h2>
          <p>Join HealthKey today — it&apos;s free, secure, and takes less than 30 seconds.</p>
          <div className="lp-hero__ctas" style={{ justifyContent: "center" }}>
            <Link to="/signup" className="lp-btn lp-btn--primary lp-btn--lg">
              Create Free Account
              <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5-5 5M6 12h12" /></svg>
            </Link>
            <Link to="/login" className="lp-btn lp-btn--glass">Sign In</Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
