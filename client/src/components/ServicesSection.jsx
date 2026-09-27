import React from 'react';
import { 
  Video, Globe, Monitor, Smartphone, Gamepad2, Code, CheckCircle, 
  ArrowRight, Sparkles, Layers, Clock, RefreshCw 
} from 'lucide-react';

const iconMap = {
  Video: Video,
  Globe: Globe,
  Monitor: Monitor,
  Smartphone: Smartphone,
  Gamepad2: Gamepad2,
  Code: Code
};

export default function ServicesSection({ services, onSelectPlan, currencySymbol = '₹' }) {
  return (
    <section id="services" className="section-wrapper">
      <div className="section-header">
        <span className="section-tag">Core Disciplines</span>
        <h2 className="section-title">Specialized Freelance Services</h2>
        <p className="section-subtitle">
          Engineered for creators, founders, and enterprises. Choose a service or inspect 
          dedicated plans with transparent deliverables.
        </p>
      </div>

      <div className="services-grid">
        {services.map(service => {
          const IconComponent = iconMap[service.icon] || Code;
          return (
            <div key={service.id} className="service-card">
              <div className="service-card-header">
                <div className="service-card-icon">
                  <IconComponent size={24} />
                </div>
                {service.badge && (
                  <span className={`badge ${service.badge === 'Bestseller' ? 'badge-accent' : 'badge-primary'}`}>
                    {service.badge}
                  </span>
                )}
              </div>

              <h3 className="service-card-title">{service.title}</h3>
              <p className="service-card-desc">{service.short_desc}</p>

              {/* Tech Stack Pills */}
              <div style={{ marginBottom: '8px', fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>
                Tech & Tools
              </div>
              <div className="service-tech-tags">
                {service.tech_stack?.map((tech, idx) => (
                  <span key={idx} className="tech-tag">{tech}</span>
                ))}
              </div>

              {/* Key Deliverables */}
              <div className="service-deliverables">
                <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--accent)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Layers size={14} />
                  <span>Standard Deliverables:</span>
                </div>
                {service.deliverables?.slice(0, 3).map((item, idx) => (
                  <div key={idx} className="deliverable-item">
                    <CheckCircle size={14} className="deliverable-check" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>

              {/* Plans Section */}
              <div className="plans-toggle-container">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                    Available Plans ({service.plans?.length || 0})
                  </span>
                  <span style={{ fontSize: '0.8rem', color: 'var(--accent)' }}>
                    Starts from {currencySymbol}{Number(service.starting_price).toLocaleString()}
                  </span>
                </div>

                {service.plans?.map(plan => (
                  <div 
                    key={plan.id} 
                    className="plan-item-preview"
                    onClick={() => onSelectPlan(service, plan)}
                    role="button"
                    tabIndex={0}
                  >
                    <div>
                      <div className="plan-item-name">
                        <span>{plan.name}</span>
                        {plan.is_popular === 1 && (
                          <span className="badge badge-accent" style={{ fontSize: '0.65rem', padding: '1px 5px' }}>
                            Top Pick
                          </span>
                        )}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', display: 'flex', gap: '10px', marginTop: '2px' }}>
                        <span><Clock size={11} style={{ verticalAlign: 'middle', marginRight: '3px' }} />{plan.delivery_days}d delivery</span>
                        <span><RefreshCw size={11} style={{ verticalAlign: 'middle', marginRight: '3px' }} />{plan.revisions}</span>
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div className="plan-item-price">{currencySymbol}{Number(plan.price).toLocaleString()}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--primary-light)', fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '4px' }}>
                        <span>Order</span>
                        <ArrowRight size={12} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
