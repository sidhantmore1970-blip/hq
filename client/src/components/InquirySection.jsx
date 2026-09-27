import React, { useState } from 'react';
import { Send, CheckCircle2, MessageSquare, Mail, Phone, Clock, DollarSign } from 'lucide-react';

export default function InquirySection({ services }) {
  const [clientName, setClientName] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [serviceId, setServiceId] = useState(services[0]?.id || '');
  const [budgetRange, setBudgetRange] = useState('₹25,000 - ₹50,000');
  const [timeline, setTimeline] = useState('2 - 4 Weeks');
  const [message, setMessage] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMsg('');

    try {
      const res = await fetch('/api/inquiries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          client_name: clientName,
          client_email: clientEmail,
          client_phone: clientPhone,
          service_id: serviceId,
          budget_range: budgetRange,
          timeline: timeline,
          message: message
        })
      });

      const data = await res.json();
      if (!data.success) {
        throw new Error(data.error || 'Failed to submit inquiry');
      }

      setSubmitted(true);
      setIsSubmitting(false);
    } catch (err) {
      setErrorMsg(err.message);
      setIsSubmitting(false);
    }
  };

  return (
    <section id="contact" className="section-wrapper" style={{ borderTop: '1px solid var(--border-color)' }}>
      <div className="section-header">
        <span className="section-tag">Direct Collaboration</span>
        <h2 className="section-title">Commission a Custom Project</h2>
        <p className="section-subtitle">
          Have an unconventional requirement or need a dedicated sprint retainer? 
          Tell us about your roadmap and we will prepare a tailored proposal.
        </p>
      </div>

      <div className="inquiry-grid">
        {/* Info Column */}
        <div className="inquiry-info-box">
          <h3 style={{ fontSize: '1.4rem', fontWeight: 800, marginBottom: '16px' }}>
            Why Clients Partner With <span className="text-cyan">HQTechHUB</span>
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', marginTop: '24px' }}>
            <div style={{ display: 'flex', gap: '14px' }}>
              <div style={{ width: 40, height: 40, borderRadius: 10, background: 'rgba(79, 70, 229, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary-light)', flexShrink: 0 }}>
                <Clock size={20} />
              </div>
              <div>
                <div style={{ fontWeight: 700, marginBottom: '4px' }}>Rapid Turnaround & Milestones</div>
                <div style={{ fontSize: '0.88rem', color: 'var(--text-secondary)' }}>
                  Clear daily async updates, staging previews, and milestone deliveries with zero guesswork.
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '14px' }}>
              <div style={{ width: 40, height: 40, borderRadius: 10, background: 'rgba(6, 182, 212, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent)', flexShrink: 0 }}>
                <DollarSign size={20} />
              </div>
              <div>
                <div style={{ fontWeight: 700, marginBottom: '4px' }}>Transparent Escrow & Flexible Billing</div>
                <div style={{ fontSize: '0.88rem', color: 'var(--text-secondary)' }}>
                  Pay securely via Razorpay, PhonePe, or Paytm with milestone releases and invoicing.
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '14px' }}>
              <div style={{ width: 40, height: 40, borderRadius: 10, background: 'rgba(16, 185, 129, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--success)', flexShrink: 0 }}>
                <CheckCircle2 size={20} />
              </div>
              <div>
                <div style={{ fontWeight: 700, marginBottom: '4px' }}>100% IP & Source Ownership</div>
                <div style={{ fontSize: '0.88rem', color: 'var(--text-secondary)' }}>
                  All master files, Premiere project assets, GitHub repositories, and binaries belong strictly to you.
                </div>
              </div>
            </div>
          </div>

          <div style={{ marginTop: '36px', paddingTop: '24px', borderTop: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.88rem', color: 'var(--text-secondary)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Mail size={16} style={{ color: 'var(--accent)' }} />
              <span>founder@hqtech.dev</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Phone size={16} style={{ color: 'var(--accent)' }} />
              <span>+91 98765 43210 (WhatsApp Available)</span>
            </div>
          </div>
        </div>

        {/* Form Column */}
        <div className="inquiry-form-card">
          {submitted ? (
            <div style={{ textAlign: 'center', padding: '30px 10px' }}>
              <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'rgba(16, 185, 129, 0.15)', color: 'var(--success)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                <CheckCircle2 size={32} />
              </div>
              <h3 style={{ fontSize: '1.4rem', fontWeight: 800, marginBottom: '8px' }}>Inquiry Received!</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.92rem', marginBottom: '20px' }}>
                Thank you for reaching out. We will review your project brief and get back with a scope and schedule within 24 hours.
              </p>
              <button className="btn btn-glass" onClick={() => setSubmitted(false)}>
                Submit Another Request
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '20px' }}>Project Inquiry Form</h3>

              {errorMsg && (
                <div style={{ padding: '10px', background: 'rgba(239, 68, 68, 0.08)', border: '1px solid rgba(239, 68, 68, 0.25)', borderRadius: 'var(--radius-sm)', color: '#dc2626', fontSize: '0.85rem', marginBottom: '14px' }}>
                  {errorMsg}
                </div>
              )}

              <div className="form-group">
                <label className="form-label">Full Name *</label>
                <input 
                  type="text" 
                  required 
                  placeholder="Your Name"
                  value={clientName}
                  onChange={e => setClientName(e.target.value)}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
                <div className="form-group">
                  <label className="form-label">Email Address *</label>
                  <input 
                    type="email" 
                    required 
                    placeholder="you@company.com"
                    value={clientEmail}
                    onChange={e => setClientEmail(e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Phone / WhatsApp</label>
                  <input 
                    type="tel" 
                    placeholder="+91 98765 43210"
                    value={clientPhone}
                    onChange={e => setClientPhone(e.target.value)}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
                <div className="form-group">
                  <label className="form-label">Target Service</label>
                  <select value={serviceId} onChange={e => setServiceId(e.target.value)}>
                    {services.map(s => (
                      <option key={s.id} value={s.id}>{s.category}</option>
                    ))}
                    <option value="custom">Other / Multi-disciplinary</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Estimated Budget</label>
                  <select value={budgetRange} onChange={e => setBudgetRange(e.target.value)}>
                    <option value="₹10,000 - ₹25,000">₹10,000 - ₹25,000</option>
                    <option value="₹25,000 - ₹50,000">₹25,000 - ₹50,000</option>
                    <option value="₹50,000 - ₹1,00,000">₹50,000 - ₹1,00,000</option>
                    <option value="₹1,00,000+">₹1,00,000+ (Enterprise)</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Project Scope & Deliverables *</label>
                <textarea 
                  rows={4} 
                  required
                  placeholder="Describe your vision, target audience, technical specifications, and key features..."
                  value={message}
                  onChange={e => setMessage(e.target.value)}
                />
              </div>

              <button 
                type="submit" 
                className="btn btn-primary"
                style={{ width: '100%' }}
                disabled={isSubmitting}
              >
                <Send size={16} />
                <span>{isSubmitting ? 'Transmitting Scope...' : 'Submit Project Inquiry'}</span>
              </button>
            </form>
          )}
        </div>
      </div>
    </section>
  );
}
