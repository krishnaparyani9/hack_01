import { Link } from "react-router-dom";
import ThemeToggle from "./ThemeToggle";

export default function Header() {
  return (
    <header className="site-header" role="banner">
      <div className="container" style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12}}>
        <Link to="/" className="brand">
          <span className="logo">HealthKey</span>
        </Link>

        <nav aria-label="Main navigation" style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <ThemeToggle ariaLabel="Toggle dark mode" />
          <Link to="/login" className="nav-link">Sign in</Link>
          <Link to="/signup" className="nav-link nav-cta">Sign up</Link>
        </nav>
      </div>
    </header>
  );
}
