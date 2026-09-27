import React, { useState } from 'react';
import { Terminal, Menu, X, Sparkles } from 'lucide-react';

export default function Navbar({ settings }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const scrollTo = (id) => {
    setMobileMenuOpen(false);
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <nav className="site-navbar">
      <div className="nav-brand" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
        <div className="brand-icon">
          <Terminal size={20} />
        </div>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span className="brand-name">HQTech<span className="text-cyan">HUB</span></span>
            <span className="brand-badge">STUDIO</span>
          </div>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Creative &amp; Engineering</div>
        </div>
      </div>

      <div className="nav-links">
        <span className="nav-item" onClick={() => scrollTo('services')}>Services</span>
        <span className="nav-item" onClick={() => scrollTo('pricing')}>Plans &amp; Pricing</span>
        <span className="nav-item" onClick={() => scrollTo('portfolio')}>Portfolio</span>
        <span className="nav-item" onClick={() => scrollTo('gateways')}>Payments</span>
        <span className="nav-item" onClick={() => scrollTo('contact')}>Hire Us</span>
      </div>

      <div className="nav-actions">
        <button
          className="btn btn-primary btn-sm"
          onClick={() => scrollTo('contact')}
        >
          <Sparkles size={14} />
          <span>Get a Quote</span>
        </button>

        <button
          className="mobile-menu-btn"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label="Toggle mobile menu"
        >
          {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* Mobile Nav Dropdown */}
      {mobileMenuOpen && (
        <div style={{
          position: 'absolute',
          top: '100%',
          left: 0,
          right: 0,
          background: '#ffffff',
          borderBottom: '1.5px solid var(--border-color)',
          borderTop: '1px solid var(--border-subtle)',
          padding: '16px',
          display: 'flex',
          flexDirection: 'column',
          gap: '4px',
          zIndex: 99,
          boxShadow: '0 8px 24px rgba(0,0,0,0.08)'
        }}>
          <span className="nav-item" onClick={() => scrollTo('services')}>Services</span>
          <span className="nav-item" onClick={() => scrollTo('pricing')}>Plans &amp; Pricing</span>
          <span className="nav-item" onClick={() => scrollTo('portfolio')}>Portfolio</span>
          <span className="nav-item" onClick={() => scrollTo('gateways')}>Payment Gateways</span>
          <span className="nav-item" onClick={() => scrollTo('contact')}>Hire Us</span>
          <div style={{ height: '1px', background: 'var(--border-color)', margin: '8px 0' }} />
          <button
            className="btn btn-primary btn-sm"
            style={{ width: '100%', justifyContent: 'center' }}
            onClick={() => scrollTo('contact')}
          >
            <Sparkles size={14} />
            Get a Quote
          </button>
        </div>
      )}
    </nav>
  );
}
