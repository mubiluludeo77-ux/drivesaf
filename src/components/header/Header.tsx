import ThemeToggle from '@/components/header/ThemeToggle';

export default function Header() {
  return (
    <header className="site-header">
      <div className="site-header-inner">
        <a href="#" className="site-brand">
          <span className="site-brand-mark">DS</span>
          <span>DriveSAF</span>
        </a>
        <span className="site-zone">Ottawa–Gatineau</span>
        <div className="site-controls">
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
