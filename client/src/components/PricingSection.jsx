import React, { useState } from 'react';
import { Check, Zap, Shield, Clock, RefreshCw, CreditCard, QrCode, Smartphone } from 'lucide-react';

export default function PricingSection({ services, onSelectPlan, currencySymbol = '₹' }) {
  const [selectedServiceId, setSelectedServiceId] = useState(services[0]?.id || 'srv-video-editing');

  const currentService = services.find(s => s.id === selectedServiceId) || services[0];
  const plans = currentService?.plans || [];

  return (
    <section id="pricing" className="section-wrapper" style={{ borderTop: '1px solid var(--border-color)' }}>
      <div className="section-header">
        <span className="section-tag">Clear & Predictable</span>
        <h2 className="section-title">Transparent Service Plans</h2>
        <p className="section-subtitle">
          No hidden fees. Select any plan to initiate your commission with instant checkout 
          via Razorpay, PhonePe, or Paytm.
        </p>

        {/* Service Switcher Tabs for Pricing */}
        <div className="category-filter-bar" style={{ marginTop: '24px' }}>
          {services.map(s => (
            <button
              key={s.id}
              className={`category-tab ${selectedServiceId === s.id ? 'active' : ''}`}
              onClick={() => setSelectedServiceId(s.id)}
            >
              <span>{s.category}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Pricing Cards Grid */}
      <div className="pricing-matrix-grid">
        {plans.map(plan => {
          const isPopular = plan.is_popular === 1;
          return (
            <div key={plan.id} className={`pricing-card ${isPopular ? 'popular' : ''}`}>
              {isPopular && (
                <div className="pricing-popular-badge">
                  Most Popular
                </div>
              )}

              <div className="pricing-service-label">{currentService.title}</div>
              <h3 className="pricing-title">{plan.name}</h3>

              <div className="pricing-price-container">
                <span className="pricing-amount">{currencySymbol}{Number(plan.price).toLocaleString()}</span>
                <span className="pricing-cycle">/ {plan.billing_cycle}</span>
              </div>

              <div className="pricing-meta">
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Clock size={15} style={{ color: 'var(--accent)' }} />
                  <span>{plan.delivery_days} Days Delivery</span>
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <RefreshCw size={15} style={{ color: 'var(--accent)' }} />
                  <span>{plan.revisions}</span>
                </span>
              </div>

              <ul className="pricing-features-list">
                {plan.features?.map((feature, idx) => (
                  <li key={idx} className="pricing-feature-row">
                    <Check size={16} style={{ color: 'var(--accent)', flexShrink: 0, marginTop: '2px' }} />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>

              <button 
                className={`btn ${isPopular ? 'btn-accent' : 'btn-primary'}`}
                style={{ width: '100%', marginTop: 'auto' }}
                onClick={() => onSelectPlan(currentService, plan)}
              >
                <Zap size={16} />
                <span>Book This Plan</span>
              </button>
            </div>
          );
        })}
      </div>

      {/* Payment Security & Gateways Banner */}
      <div id="gateways" className="supported-gateways-bar">
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
          <Shield size={16} style={{ color: 'var(--accent)' }} />
          <span>Supported Instant Gateways:</span>
        </div>
        <div className="gateway-chip rzp">
          <CreditCard size={15} />
          <span>Razorpay (UPI / Cards / Netbanking)</span>
        </div>
        <div className="gateway-chip ppe">
          <QrCode size={15} />
          <span>PhonePe (QR & UPI Intent)</span>
        </div>
        <div className="gateway-chip ptm">
          <Smartphone size={15} />
          <span>Paytm (Wallet & Payments Bank)</span>
        </div>
      </div>
    </section>
  );
}
