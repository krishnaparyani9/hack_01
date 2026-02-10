
export default function Footer() {
  return (
    <footer className="site-footer" role="contentinfo">
      <div className="container" style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12}}>
        <div style={{fontSize: 13, color: 'var(--text-muted)'}}>© {new Date().getFullYear()} HealthKey</div>
        <nav aria-label="Footer links">

          
          <a href="#" className="nav-link">Privacy</a>
        </nav>
      </div>
    </footer>
  );
}
