import { Link } from "react-router-dom";
import ThemeToggle from "./ThemeToggle";

export default function Header() {
  return (
    <header className="lp-header" role="banner">
      <div className="container lp-header__inner">
        <Link to="/" className="lp-header__brand">
          {/* Logo mark */}
          <span className="lp-header__mark">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2l-8 4v6c0 5.5 3.4 10.7 8 12 4.6-1.3 8-6.5 8-12V6l-8-4z" />
              <path d="M9 12l2 2 4-4" />
            </svg>
          </span>
          <span className="lp-header__wordmark">HealthKey</span>
        </Link>

        <nav aria-label="Main navigation" className="lp-header__nav">
          <ThemeToggle ariaLabel="Toggle dark mode" />
          <Link to="/login" className="lp-header__link">Sign in</Link>
          <Link to="/signup" className="lp-header__cta">Get Started</Link>
        </nav>
      </div>
    </header>
  );
}
