import { Link } from "react-router-dom";

export default function Footer() {
  return (
    <footer className="lp-footer" role="contentinfo">
      <div className="container lp-footer__inner">
        <div className="lp-footer__left">
          <Link to="/" className="lp-footer__brand">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: "var(--primary)" }}>
              <path d="M12 2l-8 4v6c0 5.5 3.4 10.7 8 12 4.6-1.3 8-6.5 8-12V6l-8-4z" />
              <path d="M9 12l2 2 4-4" />
            </svg>
            <span>HealthKey</span>
          </Link>
          <span className="lp-footer__copy">© {new Date().getFullYear()} HealthKey. All rights reserved.</span>
        </div>
        <nav aria-label="Footer links" className="lp-footer__links">
          <a href="#">Privacy</a>
          <a href="#">Terms</a>
          <a href="#">Contact</a>
        </nav>
      </div>
    </footer>
  );
}
