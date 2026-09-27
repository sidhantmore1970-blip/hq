import React from 'react';
import { 
  ArrowRight, Zap, Video, Globe, Monitor, Smartphone, 
  Gamepad2, ShieldCheck
} from 'lucide-react';

export default function Hero({ onExploreServices, onSelectCategory, activeCategory }) {
  const categories = [
    { id: 'All', label: 'All Services', icon: Zap },
    { id: 'Video Editing', label: 'Video Editing', icon: Video },
    { id: 'Web Development', label: 'Web Dev', icon: Globe },
    { id: 'Desktop Apps', label: 'Desktop Apps', icon: Monitor },
    { id: 'Mobile Apps', label: 'Mobile Apps', icon: Smartphone },
    { id: 'Game Development', label: 'Indie Games', icon: Gamepad2 }
  ];

  return (
    <section className="hero-section">
      {/* Availability pill */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '28px' }}>
        <div className="hero-pill">
          <span
            className="pulse-glow"
            style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--success)', display: 'inline-block' }}
          />
          <span>AVAILABLE FOR NEW COMMISSIONS &amp; SPRINT RETAINERS</span>
        </div>
      </div>

      <h1 className="hero-title">
        Engineering <span className="font-serif" style={{ fontSize: '1.12em', color: 'var(--primary)' }}>Cinematic</span> Realities &amp; <br />
        <span className="text-gradient">Scalable Software</span> Systems.
      </h1>

      <p className="hero-description">
        A multi-disciplinary studio crafting viral 4K video productions, full-stack web applications,
        native desktop suites, mobile apps, and interactive 3D indie games.
      </p>

      <div className="hero-ctas">
        <button
          className="btn btn-primary btn-lg"
          onClick={onExploreServices}
        >
          <span>Explore Services &amp; Pricing</span>
          <ArrowRight size={18} />
        </button>
        <a
          href="#pricing"
          className="btn btn-outline btn-lg"
        >
          <span>View Pricing Plans</span>
        </a>
      </div>

      {/* Category Pills Bar */}
      <div className="category-filter-bar">
        {categories.map(cat => {
          const Icon = cat.icon;
          const isActive = activeCategory === cat.id;
          return (
            <button
              key={cat.id}
              className={`category-tab ${isActive ? 'active' : ''}`}
              onClick={() => onSelectCategory(cat.id)}
            >
              <Icon size={15} />
              <span>{cat.label}</span>
            </button>
          );
        })}
      </div>

      {/* Trust & Performance Metrics Grid */}
      <div className="hero-stats-grid">
        <div className="stat-card">
          <div className="stat-card-value text-indigo">5 Core Fields</div>
          <div className="stat-card-label">Video Editing, Web, Desktop, Mobile &amp; Games</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-value text-cyan">Triple Gateways</div>
          <div className="stat-card-label">Razorpay, PhonePe &amp; Paytm Transaction Ready</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-value text-indigo">Direct Founder</div>
          <div className="stat-card-label">Dedicated sprints with zero agency bloat</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-value text-cyan">Full Deliverables</div>
          <div className="stat-card-label">4K project files, source repos &amp; production builds</div>
        </div>
      </div>
    </section>
  );
}
