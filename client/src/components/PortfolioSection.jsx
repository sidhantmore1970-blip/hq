import React, { useState } from 'react';
import { 
  ExternalLink, Sparkles, Compass, LineChart, Wand2, Layers, 
  Bot, ArrowRight, Video, Globe, Monitor, Smartphone, Gamepad2 
} from 'lucide-react';

const iconMap = {
  'Video Editing': Video,
  'Web Development': Globe,
  'Desktop Apps': Monitor,
  'Mobile Apps': Smartphone,
  'Game Development': Gamepad2
};

export default function PortfolioSection({ portfolio }) {
  const [filter, setFilter] = useState('All');

  const categories = ['All', 'Video Editing', 'Web Development', 'Desktop Apps', 'Mobile Apps', 'Game Development'];

  const filteredItems = filter === 'All' 
    ? portfolio 
    : portfolio.filter(p => p.category === filter);

  return (
    <section id="portfolio" className="section-wrapper" style={{ borderTop: '1px solid var(--border-color)' }}>
      <div className="section-header">
        <span className="section-tag">Curated Case Studies</span>
        <h2 className="section-title">
          Selected <span className="font-serif" style={{ fontSize: '1.15em', color: 'var(--accent)' }}>Shipped</span> Works
        </h2>
        <p className="section-subtitle">
          From viral 4K video edits and high-scale crypto terminals to native utilities and indie games. 
          A look at the products and productions we are proud to have engineered.
        </p>

        {/* Filter Pills */}
        <div className="category-filter-bar" style={{ marginTop: '24px' }}>
          {categories.map(cat => (
            <button
              key={cat}
              className={`category-tab ${filter === cat ? 'active' : ''}`}
              onClick={() => setFilter(cat)}
            >
              <span>{cat}</span>
            </button>
          ))}
        </div>
      </div>

      {/* RBP-Portfolio Style Editorial Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
        gap: '28px'
      }}>
        {filteredItems.map((item, idx) => {
          const Icon = iconMap[item.category] || Sparkles;

          return (
            <article 
              key={item.id} 
              style={{
                borderRadius: '24px',
                border: '1px solid var(--border-color)',
                background: 'var(--bg-card)',
                padding: '16px',
                display: 'flex',
                flexDirection: 'column',
                gap: '16px',
                transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
                position: 'relative'
              }}
              className="glass-panel-hover"
            >
              {/* Header with Icon Pill */}
              <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '4px 6px 0' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{
                    width: '34px',
                    height: '34px',
                    borderRadius: '10px',
                    background: 'var(--bg-surface)',
                    border: '1.5px solid var(--border-color)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'var(--accent)'
                  }}>
                    <Icon size={16} />
                  </span>
                  <span style={{ fontWeight: 600, fontSize: '0.88rem', letterSpacing: '-0.01em' }}>
                    {item.client_name || item.title}
                  </span>
                </div>

                <span className="badge badge-accent" style={{ fontSize: '0.65rem' }}>
                  {item.category}
                </span>
              </header>

              {/* Visual Container */}
              <div style={{
                width: '100%',
                height: '220px',
                borderRadius: '18px',
                overflow: 'hidden',
                position: 'relative',
                background: item.image_gradient || 'linear-gradient(135deg, #1e1b4b, #0f172a)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '24px'
              }}>
                <div style={{ textAlign: 'center', zIndex: 1 }}>
                  <div style={{
                    fontSize: '1.35rem',
                    fontWeight: 800,
                    color: '#fff',
                    marginBottom: '8px',
                    letterSpacing: '-0.02em',
                    textShadow: '0 4px 16px rgba(0,0,0,0.6)'
                  }}>
                    {item.title}
                  </div>
                  {item.metrics && (
                    <div style={{
                      display: 'inline-block',
                      padding: '4px 12px',
                      background: 'rgba(7, 9, 14, 0.75)',
                      backdropFilter: 'blur(8px)',
                      borderRadius: 'var(--radius-full)',
                      fontSize: '0.78rem',
                      fontWeight: 700,
                      color: 'var(--accent)',
                      border: '1px solid rgba(6, 182, 212, 0.3)'
                    }}>
                      ⚡ {item.metrics}
                    </div>
                  )}
                </div>
              </div>

              {/* Narrative Content */}
              <div style={{ padding: '0 6px', display: 'flex', flexDirection: 'column', gap: '8px', flexGrow: 1 }}>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 700, lineHeight: 1.3 }}>
                  {item.title}
                </h3>
                <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', lineHeight: 1.55 }}>
                  {item.summary}
                </p>
              </div>

              {/* Tags & Meta Footer */}
              <div style={{
                padding: '12px 6px 4px',
                borderTop: '1px solid var(--border-color)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '8px'
              }}>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
                  {item.tags?.slice(0, 3).map((tag, i) => (
                    <span key={i} className="tech-tag" style={{ fontSize: '0.7rem' }}>{tag}</span>
                  ))}
                </div>

                {item.demo_link && (
                  <a 
                    href={item.demo_link} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="btn btn-glass btn-sm"
                    style={{ fontSize: '0.75rem', padding: '4px 10px' }}
                  >
                    <span>Inspect</span>
                    <ExternalLink size={12} />
                  </a>
                )}
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
